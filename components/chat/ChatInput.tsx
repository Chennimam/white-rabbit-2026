import type { RefObject } from "react";
import { Send } from "lucide-react";
import { MAX_MESSAGE_LENGTH } from "@/lib/chat/types";

export function ChatInput({ value, onChange, onSend, disabled, inputRef }: {
  value: string; onChange: (value: string) => void; onSend: () => void;
  disabled: boolean; inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <form className="chat-input" onSubmit={(event) => { event.preventDefault(); onSend(); }}>
      <label htmlFor="guide-message" className="chat-sr-only">Ваше сообщение</label>
      <textarea id="guide-message" ref={inputRef} rows={2} value={value}
        placeholder="Ваш вопрос…" maxLength={MAX_MESSAGE_LENGTH}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (!disabled) onSend();
          }
        }} aria-describedby="guide-input-help" />
      <button type="submit" aria-label="Отправить сообщение" disabled={disabled || !value.trim()}>
        <Send size={20} aria-hidden="true" />
      </button>
      <span id="guide-input-help" className="chat-input-help">Enter — отправить · Shift + Enter — новая строка</span>
    </form>
  );
}
