import { useEffect, useRef } from "react";
import type { ChatMessage, ChatStatus } from "@/lib/chat/types";

export function ChatMessageList({ messages, status }: { messages: ChatMessage[]; status: ChatStatus }) {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = list.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, status]);
  return (
    <div ref={list} className="chat-messages" role="log" aria-label="История переписки"
      aria-live="polite" aria-relevant="additions text" tabIndex={0}>
      {messages.filter((item) => item.role !== "system").map((item) => (
        <div key={item.id} className={`chat-message chat-message-${item.role}`}>
          <span className="chat-speaker">{item.role === "user" ? "Вы" : "Проводник"}</span>
          <p>{item.content}</p>
        </div>
      ))}
      {(status === "sending" || status === "typing") && (
        <div className="chat-waiting" role="status">
          <span className="chat-dots" aria-hidden="true"><i /><i /><i /></span>
          {status === "sending" ? "Отправляем…" : "Проводник печатает…"}
        </div>
      )}
    </div>
  );
}
