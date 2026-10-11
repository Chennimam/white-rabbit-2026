import { MAX_MESSAGE_LENGTH, MAX_REQUEST_MESSAGES, MAX_REQUEST_CONTENT } from "./types";
import type { ChatMessage, ChatRequest } from "./types";

// UI knows only this adapter. Credentials and instructions exist only in Pages Functions.
export async function sendMessage(messages: ChatMessage[]): Promise<string> {
  const recent: ChatRequest["messages"] = [];
  let length = 0;
  for (const message of [...messages].reverse()) {
    if (message.role === "system" || message.id === "welcome") continue;
    if (!message.content.trim() || message.content.length > MAX_MESSAGE_LENGTH) throw new Error("invalid_request");
    if (recent.length === MAX_REQUEST_MESSAGES || length + message.content.length > MAX_REQUEST_CONTENT) break;
    recent.unshift({ role: message.role, content: message.content });
    length += message.content.length;
  }
  if (recent.at(-1)?.role !== "user") throw new Error("invalid_request");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28_000);
  try {
    const response = await fetch("/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
      signal: controller.signal, body: JSON.stringify({ messages: recent }),
    });
    if (!response.ok) throw new Error("temporarily_unavailable");
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("reply" in result) || typeof result.reply !== "string"
      || !result.reply.trim() || result.reply.length > MAX_MESSAGE_LENGTH) throw new Error("temporarily_unavailable");
    return result.reply.trim();
  } catch { throw new Error("temporarily_unavailable"); }
  finally { clearTimeout(timer); }
}
