import { useRef, useState } from "react";
import { escalate, ESCALATION_FAILURE, MAX_CONTEXT, MAX_QUESTION } from "@/lib/chat/escalation";

export function ChatEscalation({ question }: { question: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(question);
  const [context, setContext] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const busy = useRef(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!consent || busy.current || status === "sent" || !text.trim() || text.length > MAX_QUESTION) return;
    busy.current = true;
    setStatus("sending");
    try {
      await escalate({ question: text.trim(), context: context.trim(), contact: contact.trim(), consent: true });
      setStatus("sent");
    } catch { setStatus("error"); }
    finally { busy.current = false; }
  }
  if (status === "sent") return <div className="chat-escalation" role="status">Вопрос передан Марии.{!contact && " Для личного ответа напишите ей в Telegram: @Mariucha."}</div>;
  if (!open) return <div className="chat-escalation"><button type="button" onClick={() => setOpen(true)}>Передать Марии</button></div>;
  return <form className="chat-escalation" onSubmit={submit} aria-label="Передать вопрос Марии">
    <p>Ваш вопрос будет передан Марии через Telegram. Проверьте текст перед отправкой.</p>
    <label>Вопрос<textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_QUESTION}
      required disabled={status === "sending"} rows={3} /></label>
    {text.length > MAX_QUESTION && <p role="alert">Сократите вопрос до {MAX_QUESTION} символов.</p>}
    <label>Краткий контекст (необязательно)<textarea value={context} onChange={(e) => setContext(e.target.value)}
      maxLength={MAX_CONTEXT} disabled={status === "sending"} rows={2} placeholder="Только детали, которые важно передать Марии" /></label>
    <label>Если хотите, чтобы Мария могла ответить вам лично, оставьте ваш Telegram username.
      <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="@username"
        maxLength={33} pattern="@[a-zA-Z][a-zA-Z0-9_]{4,31}" disabled={status === "sending"} autoComplete="off" /></label>
    <label className="chat-escalation-consent"><input type="checkbox" checked={consent}
      onChange={(e) => setConsent(e.target.checked)} disabled={status === "sending"} />
      Подтверждаю передачу указанных данных Марии через Telegram.</label>
    <button type="submit" disabled={!consent || status === "sending" || !text.trim() || text.length > MAX_QUESTION}>
      {status === "sending" ? "Передаём…" : "Подтвердить и отправить"}</button>
    <button type="button" disabled={status === "sending"} onClick={() => { setOpen(false); setConsent(false); }}>Отмена</button>
    {status === "error" && <p role="alert">{ESCALATION_FAILURE}</p>}
  </form>;
}
