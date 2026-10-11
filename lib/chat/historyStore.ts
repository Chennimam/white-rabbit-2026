import { MAX_HISTORY_MESSAGES, MAX_MESSAGE_LENGTH } from "./types";
import type { ChatHistoryStore, ChatMessage } from "./types";

export const HISTORY_KEY = "white-rabbit:chat:session:v2";

export function parseHistory(raw: string | null): ChatMessage[] {
  if (!raw || raw.length > 2_000_000) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const ids = new Set<string>();
    return value.filter((item): item is ChatMessage => {
      if (!item || typeof item !== "object") return false;
      const message = item as Partial<ChatMessage>;
      if (typeof message.id !== "string" || !message.id || message.id.length > 100 || ids.has(message.id)
        || (message.role !== "user" && message.role !== "assistant")
        || typeof message.content !== "string" || !message.content.trim() || message.content.length > MAX_MESSAGE_LENGTH
        || typeof message.createdAt !== "number" || !Number.isFinite(message.createdAt) || message.createdAt < 0) return false;
      ids.add(message.id);
      return true;
    }).slice(-MAX_HISTORY_MESSAGES);
  } catch {
    return [];
  }
}

// Browser-only access occurs inside methods, never at module initialization.
// Swap this adapter for a session/database implementation without changing UI.
export const sessionHistoryStore: ChatHistoryStore = {
  async load() {
    // Remove only the legacy demo history; never migrate it into a new session.
    try { window.localStorage.removeItem("white-rabbit:chat:v1"); } catch { /* Storage may be disabled. */ }
    return parseHistory(window.sessionStorage.getItem(HISTORY_KEY));
  },
  async save(messages) {
    window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.filter((m) => m.role !== "system").slice(-MAX_HISTORY_MESSAGES)));
  },
};
