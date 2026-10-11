import { GUIDE_INSTRUCTIONS } from "../_lib/guide";

export interface Env {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  ALLOWED_ORIGINS?: string;
  AI_CHAT_ENABLED?: string;
  // Optional distributed adapter; deployment must supply an actual binding.
  CHAT_RATE_LIMITER?: { limit(input: { key: string }): Promise<{ success: boolean }> };
}
type Message = { role: "user" | "assistant"; content: string };
const MAX_BODY_BYTES = 128_000;
const MAX_MESSAGES = 20;
const MAX_CONTENT = 4000;
const MAX_TOTAL = 20_000;

function validMessages(value: unknown): value is { messages: Message[] } {
  if (!value || typeof value !== "object" || !("messages" in value)) return false;
  const messages = value.messages;
  if (!Array.isArray(messages) || !messages.length || messages.length > MAX_MESSAGES) return false;
  let total = 0;
  for (const message of messages) {
    if (!message || typeof message !== "object" || !["user", "assistant"].includes(message.role)
      || typeof message.content !== "string" || !message.content.trim() || message.content.length > MAX_CONTENT) return false;
    total += message.content.length;
  }
  return total <= MAX_TOTAL && messages.at(-1).role === "user";
}

async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("Content-Length")) > MAX_BODY_BYTES) throw new Error("body");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("body");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) { await reader.cancel(); throw new Error("body"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
}

function extractReply(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const response = value as { status?: unknown; output?: unknown };
  if (response.status !== "completed" || !Array.isArray(response.output)) return null;
  const texts: string[] = [];
  for (const item of response.output) {
    if (item?.type !== "message" || item.role !== "assistant" || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part?.type === "output_text" && typeof part.text === "string") texts.push(part.text);
    }
  }
  const reply = texts.join("\n").trim();
  return reply && reply.length <= MAX_CONTENT ? reply : null;
}

// Dependencies are injected only by tests; Cloudflare calls onRequest below.
export function createChatHandler(fetcher: typeof fetch = fetch, timeoutMs = 25_000) {
  return async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
    const origin = request.headers.get("Origin");
    const origins = (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter((s) => {
      try { const url = new URL(s); return url.origin === s && ["https:", "http:"].includes(url.protocol); }
      catch { return false; }
    });
    const allowed = !!origin && origins.includes(origin) && origins.includes(new URL(request.url).origin);
    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", Vary: "Origin",
      "X-Content-Type-Options": "nosniff",
    };
    if (allowed) headers["Access-Control-Allow-Origin"] = origin;
    const json = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (!allowed) return json({ error: "forbidden" }, 403);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...headers,
        "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
    }
    if (request.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }),
      { status: 405, headers: { ...headers, Allow: "POST, OPTIONS" } });
    if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json")
      return json({ error: "invalid_request" }, 400);
    let body: unknown;
    try { body = await readBody(request); } catch { return json({ error: "invalid_request" }, 400); }
    if (!validMessages(body)) return json({ error: "invalid_request" }, 400);
    if (env.AI_CHAT_ENABLED !== "true" || !env.OPENAI_API_KEY)
      return json({ error: "temporarily_unavailable" }, 503);
    try {
      if (env.CHAT_RATE_LIMITER) {
        const ip = request.headers.get("CF-Connecting-IP");
        if (!ip) return json({ error: "temporarily_unavailable" }, 503);
        const { success } = await env.CHAT_RATE_LIMITER.limit({ key: ip });
        if (!success) return json({ error: "rate_limited" }, 429);
      }
    } catch { return json({ error: "temporarily_unavailable" }, 503); }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher("https://api.openai.com/v1/responses", {
        method: "POST", signal: controller.signal,
        headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
          instructions: GUIDE_INSTRUCTIONS,
          input: body.messages.map(({ role, content }) => ({ role, content })),
          store: false, max_output_tokens: 800,
        }),
      });
      if (!response.ok) return json({ error: response.status === 429 ? "rate_limited" : "temporarily_unavailable" },
        response.status === 429 ? 429 : 503);
      const reply = extractReply(await response.json());
      if (!reply || reply.includes(env.OPENAI_API_KEY)) return json({ error: "temporarily_unavailable" }, 503);
      return json({ reply });
    } catch { return json({ error: "temporarily_unavailable" }, 503); }
    finally { clearTimeout(timeout); }
  };
}
export const onRequest = createChatHandler();
