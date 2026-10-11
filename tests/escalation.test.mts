import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { createEscalationHandler, type EscalationEnv } from "../functions/api/escalate";
import { allowEscalation, type RateDatabase } from "../functions/_lib/escalationRateLimit";
import { escalate } from "../lib/chat/escalation";

const databases: DatabaseSync[] = [];
afterEach(() => { for (const db of databases.splice(0)) db.close(); });
function database(): RateDatabase {
  const db = new DatabaseSync(":memory:"); databases.push(db);
  db.exec(readFileSync(new URL("../migrations/escalation-limits.sql", import.meta.url), "utf8"));
  return { prepare(sql: string) {
    let values: (string | number)[] = [];
    const result = { bind(...args: (string | number)[]) { values = args; return result; },
      async first<T>() { return (db.prepare(sql).get(...values) ?? null) as T | null; },
      async run() { return db.prepare(sql).run(...values); } };
    return result;
  } };
}
const origin = "https://white-rabbit-2026.pages.dev";
const body = { question: "Можно перенести дату?", context: "Выбрана дата 24 декабря", contact: "", consent: true };
function request(value: unknown = body, extra: Record<string, string> = {}) {
  return new Request(origin + "/api/escalate", { method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.1", ...extra },
    body: JSON.stringify(value) });
}
function env(): EscalationEnv { return { ALLOWED_ORIGINS: origin,
  TELEGRAM_BOT_TOKEN: "test-bot-token", TELEGRAM_CHAT_ID: "test-owner-chat", ESCALATION_RATE_DB: database() }; }
const never: typeof fetch = async () => { assert.fail("Telegram must not be called"); };

test("missing, false and nonboolean consent never calls Telegram; client also blocks", async () => {
  for (const consent of [undefined, false, "true"]) {
    const response = await createEscalationHandler(never)({ request: request({ ...body, consent }), env: env() });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "consent_required" });
  }
  await assert.rejects(escalate({ ...body, consent: false } as never), /consent_required/);
});
test("success uses server recipient only, sends minimal plain text and returns only ok", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async (url, init) => {
    calls++;
    assert.equal(url, "https://api.telegram.org/bottest-bot-token/sendMessage");
    const sent = JSON.parse(init!.body as string);
    assert.equal(sent.chat_id, "test-owner-chat");
    assert.equal(sent.parse_mode, undefined);
    assert.ok(sent.text.includes(body.question));
    assert.ok(sent.text.includes(body.context));
    assert.ok(sent.text.includes("@visitor"));
    assert.ok(!sent.text.includes("FULL_HISTORY"));
    assert.ok(sent.text.length <= 4096);
    return Response.json({ ok: true, result: { chat: { id: "test-owner-chat" } } });
  };
  const response = await createEscalationHandler(fetcher)({ request: request({ ...body,
    chat_id: "attacker", bot_token: "attacker", messages: ["FULL_HISTORY"], contact: "@visitor" }), env: env() });
  assert.deepEqual(await response.json(), { ok: true }); assert.equal(calls, 1);
});
test("long question/context, phone contact and invalid JSON types are rejected", async () => {
  for (const invalid of [{ ...body, question: "x".repeat(2501) }, { ...body, context: "x".repeat(1001) },
    { ...body, question: " " }, { ...body, context: null }, { ...body, contact: "+1234567890" },
    { ...body, contact: "@abc\nhello" }, []]) {
    assert.equal((await createEscalationHandler(never)({ request: request(invalid), env: env() })).status, 400);
  }
});
test("body limits apply without Content-Length and invalid JSON/content-type is rejected", async () => {
  for (const req of [request({ ...body, padding: "x".repeat(24001) }),
    request(body, { "Content-Length": "24001" }), request(body, { "Content-Type": "text/plain" }),
    new Request(origin + "/api/escalate", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: "{" })]) {
    assert.equal((await createEscalationHandler(never)({ request: req, env: env() })).status, 400);
  }
});
test("POST only and exact origin/endpoint allowlist", async () => {
  assert.equal((await createEscalationHandler(never)({ request: new Request(origin + "/api/escalate"), env: env() })).status, 405);
  for (const Origin of ["", "null", origin + ".evil.test"]) {
    assert.equal((await createEscalationHandler(never)({ request: request(body, { Origin }), env: env() })).status, 403);
  }
  assert.equal((await createEscalationHandler(never)({ request: request(), env: { ...env(), ALLOWED_ORIGINS: "*" } })).status, 403);
});
test("missing rate DB/secrets or rate DB outage fail closed", async () => {
  for (const key of ["ESCALATION_RATE_DB", "TELEGRAM_CHAT_ID", "TELEGRAM_BOT_TOKEN"] as const) {
    const config = env(); delete config[key];
    assert.equal((await createEscalationHandler(never)({ request: request(), env: config })).status, 503);
  }
  const config = env();
  config.ESCALATION_RATE_DB = { prepare() { throw new Error("down"); } };
  assert.equal((await createEscalationHandler(never)({ request: request(), env: config })).status, 503);
});
test("distributed counter permits three attempts per IP window then endpoint returns 429", async () => {
  const config = env();
  let calls = 0;
  const handler = createEscalationHandler(async () => { calls++; return Response.json({ ok: true }); });
  for (let n = 0; n < 4; n++) {
    assert.equal((await handler({ request: request(), env: config })).status, n < 3 ? 200 : 429);
  }
  assert.equal(calls, 3);
});
test("SQL counters work across adapters, expire, store no raw IP and apply global cap", async () => {
  const db = database();
  const time = 1_800_000;
  for (let i = 0; i < 20; i++) assert.equal(await allowEscalation(db, "192.0.2." + i, "salt", time), true);
  assert.equal(await allowEscalation(db, "192.0.2.99", "salt", time), false);
  assert.equal(await allowEscalation(db, "192.0.2.99", "salt", time + 601_000), true);
  const raw = databases.at(-1)!.prepare("SELECT * FROM escalation_limits").all();
  assert.ok(!JSON.stringify(raw).includes("192.0.2"));
  assert.ok(raw.every((r) => Number(r.expires_at) >= (time + 601_000) / 1000));
});
test("Telegram failures, malformed result and timeout have safe responses", async () => {
  for (const fetcher of [
    async () => new Response("test-bot-token test-owner-chat", { status: 500 }),
    async () => Response.json({ ok: false, description: "test-bot-token" }),
    async () => new Response("{"),
    async () => { throw new Error("test-bot-token"); },
    async (_url: unknown, init: RequestInit | undefined) => new Promise<Response>((_resolve, reject) => {
      init!.signal!.addEventListener("abort", () => reject(new Error("timeout")));
    }),
  ]) {
    const response = await createEscalationHandler(fetcher as typeof fetch, 5)({ request: request(), env: env() });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "temporarily_unavailable" });
  }
});
