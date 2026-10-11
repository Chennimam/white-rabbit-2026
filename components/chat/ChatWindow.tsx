import { useEffect, useRef } from "react";
import { KeyRound, X } from "lucide-react";
import type { useChat } from "@/lib/chat/useChat";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";

export function ChatWindow({ chat, onClose }: { chat: ReturnType<typeof useChat>; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    // Avoid opening the phone keyboard until the visitor chooses to type.
    (window.matchMedia("(max-width: 680px)").matches ? closeButton.current : input.current)?.focus();
    const viewport = window.visualViewport;
    const resize = () => {
      element.dataset.compact = String((viewport?.height ?? window.innerHeight) < 460);
      element.style.setProperty("--chat-vv-height", `${viewport?.height ?? window.innerHeight}px`);
      element.style.setProperty("--chat-vv-top", `${viewport?.offsetTop ?? 0}px`);
    };
    resize();
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", resize);
    window.addEventListener("resize", resize);
    return () => {
      viewport?.removeEventListener("resize", resize);
      viewport?.removeEventListener("scroll", resize);
      window.removeEventListener("resize", resize);
      element.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);
  const waiting = chat.status === "sending" || chat.status === "typing";
  return (
    <dialog ref={dialog} className="chat-window" id="guide-dialog" aria-labelledby="guide-title"
      aria-describedby="guide-description" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <header className="chat-header">
        <KeyRound size={22} aria-hidden="true" />
        <div><h2 id="guide-title">Проводник</h2><p id="guide-description">Демо-чат · ИИ ещё не подключён</p></div>
        <button ref={closeButton} type="button" onClick={onClose} aria-label="Закрыть чат"><X aria-hidden="true" /></button>
      </header>
      <ChatMessageList messages={chat.messages} status={chat.status} />
      {chat.status === "error" && <div className="chat-error" role="alert">
        <p>Не удалось получить ответ. Попробуйте ещё раз.</p>
        <button type="button" onClick={chat.retry}>Повторить</button>
      </div>}
      {chat.storageUnavailable && <p className="chat-storage-note" role="status">История доступна до перезагрузки: браузер не разрешил её сохранить.</p>}
      <ChatInput value={chat.draft} onChange={chat.setDraft} onSend={chat.send}
        disabled={!chat.ready || waiting} inputRef={input} />
      <p className="chat-privacy">{chat.storageUnavailable ? "Сообщения остаются только в этой вкладке." : "История хранится только в этом браузере."}</p>
    </dialog>
  );
}
