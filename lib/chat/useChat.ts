"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendMessage } from "./chatClient";
import { sessionHistoryStore } from "./historyStore";
import { MAX_HISTORY_MESSAGES, MAX_MESSAGE_LENGTH } from "./types";
import type { ChatHistoryStore, ChatMessage, ChatStatus, ChatTransport } from "./types";

const greeting: ChatMessage = {
  id: "welcome", role: "assistant", content: "Привет, чем я могу тебе помочь?", createdAt: 0,
};
function message(role: "user" | "assistant", content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content, createdAt: Date.now() };
}

export function useChat(transport: ChatTransport = sendMessage, store: ChatHistoryStore = sessionHistoryStore) {
  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(false);
  const pending = useRef<ChatMessage[] | null>(null);
  const saveQueue = useRef(Promise.resolve());

  useEffect(() => {
    mounted.current = true;
    let active = true;
    (async () => {
      try {
        const saved = await store.load();
        if (active && saved.length) setMessages(saved);
      } catch {
        if (active) setStorageUnavailable(true);
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => { active = false; mounted.current = false; };
  }, [store]);

  useEffect(() => {
    if (!ready) return;
    // Ordered writes also support future asynchronous session/database adapters.
    saveQueue.current = saveQueue.current.then(() => store.save(messages)).catch(() => {
      if (mounted.current) setStorageUnavailable(true);
    });
  }, [messages, ready, store]);

  const request = useCallback(async (history: ChatMessage[]) => {
    if (busy.current || !ready) return;
    busy.current = true;
    pending.current = history;
    setStatus("sending");
    const typingTimer = setTimeout(() => {
      if (mounted.current) setStatus("typing");
    }, 150);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const reply = await Promise.race([
        transport(history),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error("Chat timeout")), 30_000); }),
      ]);
      if (typeof reply !== "string" || !reply.trim() || reply.length > MAX_MESSAGE_LENGTH) throw new Error("Invalid reply");
      if (mounted.current) {
        setMessages([...history, message("assistant", reply)].slice(-MAX_HISTORY_MESSAGES));
        setStatus("idle");
        pending.current = null;
      }
    } catch {
      if (mounted.current) setStatus("error");
    } finally {
      clearTimeout(typingTimer);
      clearTimeout(timeout);
      busy.current = false;
    }
  }, [ready, transport]);

  const send = () => {
    const content = draft.trim();
    if (!ready || busy.current || !content || content.length > MAX_MESSAGE_LENGTH) return;
    const history = [...messages, message("user", content)].slice(-MAX_HISTORY_MESSAGES);
    setMessages(history);
    setDraft("");
    void request(history);
  };
  const retry = () => { if (pending.current) void request(pending.current); };
  return { messages, status, draft, setDraft, ready, storageUnavailable, send, retry };
}
