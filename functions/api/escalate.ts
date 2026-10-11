import { allowEscalation, type RateDatabase } from "../_lib/escalationRateLimit";
import { MAX_CONTEXT, MAX_QUESTION } from "../../lib/chat/escalation";

export interface EscalationEnv {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  ALLOWED_ORIGINS?: string;
  ESCALATION_RATE_DB?: RateDatabase;
}
async function readJson(request: Request): Promise<unknown> {
  const max = 24_000;
  if (Number(request.headers.get("Content-Length")) > max) throw new Error("body");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("body");
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) { await reader.cancel(); throw new Error("body"); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
export function createEscalationHandler(fetcher: typeof fetch = fetch, timeoutMs = 10_000) {
  return async ({ request, env }: { request: Request; env: EscalationEnv }): Promise<Response> => {
    const headers: Record<string, string> = { "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", Vary: "Origin" };
    const json = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    const origin = request.headers.get("Origin");
    const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter((s) => {
      try { return new URL(s).origin === s && /^https?:/.test(s); } catch { return false; }
    });
    if (!origin || !allowed.includes(origin) || !allowed.includes(new URL(request.url).origin))
      return json({ error: "forbidden" }, 403);
    headers["Access-Control-Allow-Origin"] = origin;
    if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json")
      return json({ error: "invalid_request" }, 400);
    let body: unknown;
    try { body = await readJson(request); } catch { return json({ error: "invalid_request" }, 400); }
    if (!body || typeof body !== "object") return json({ error: "invalid_request" }, 400);
    const { question, context, contact, consent } = body as Record<string, unknown>;
    if (consent !== true) return json({ error: "consent_required" }, 400);
    if (typeof question !== "string" || !question.trim() || question.length > MAX_QUESTION
      || typeof context !== "string" || context.length > MAX_CONTEXT
      || typeof contact !== "string" || (contact !== "" && !/^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(contact)))
      return json({ error: "invalid_request" }, 400);
    const ip = request.headers.get("CF-Connecting-IP");
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID || !env.ESCALATION_RATE_DB || !ip)
      return json({ error: "temporarily_unavailable" }, 503);
    try {
      if (!await allowEscalation(env.ESCALATION_RATE_DB, ip, env.TELEGRAM_BOT_TOKEN))
        return json({ error: "rate_limited" }, 429);
    } catch { return json({ error: "temporarily_unavailable" }, 503); }
    const text = `🐇 Новый вопрос с сайта\n\nВопрос:\n${question.trim()}\n\nКонтекст:\n${context.trim() || "Не указан"}\n\nКонтакт:\n${contact || "Не указан"}\n\nИсточник:\nЗа Белым Кроликом — 12 дверей в Новый год`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, link_preview_options: { is_disabled: true } }),
      });
      if (!response.ok || (await response.json())?.ok !== true) return json({ error: "temporarily_unavailable" }, 503);
      return json({ ok: true });
    } catch { return json({ error: "temporarily_unavailable" }, 503); }
    finally { clearTimeout(timer); }
  };
}
export const onRequest = createEscalationHandler();
