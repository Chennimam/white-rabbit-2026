"use client";

import { useEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { useChat } from "@/lib/chat/useChat";
import { ChatWindow } from "./ChatWindow";
import "./chat.css";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const chat = useChat();
  useEffect(() => {
    const button = trigger.current;
    if (!button || open) return;
    let frame = 0;
    const position = () => {
      frame = 0;
      button.style.visibility = "visible";
      if (!window.matchMedia("(max-width: 680px)").matches) {
        button.style.removeProperty("--chat-lift");
        return;
      }
      // Move the launcher away from visible landing CTAs and the payment iframe.
      const obstacles = [...document.querySelectorAll("main .button, main button, #getcourse-order iframe")]
        .map((element) => element.getBoundingClientRect()).filter((rect) => rect.height > 0);
      button.style.setProperty("--chat-lift", "0px");
      const rect = button.getBoundingClientRect();
      let lift = 0;
      while (rect.top - lift >= 12) {
        if (!obstacles.some((other) => rect.left < other.right + 8 && rect.right > other.left - 8
          && rect.top - lift < other.bottom + 8 && rect.bottom - lift > other.top - 8)) break;
        lift += 72;
      }
      // If a full-screen payment form leaves no space, let that form take priority.
      button.style.visibility = rect.top - lift < 12 ? "hidden" : "visible";
      button.style.setProperty("--chat-lift", `${lift}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(position); };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    position();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
    };
  }, [open]);
  return (
    <div className="chat-widget">
      <button ref={trigger} className="chat-launcher" type="button" aria-label="Открыть чат «Проводник»"
        aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? "guide-dialog" : undefined}
        onClick={() => setOpen(true)}><KeyRound size={26} strokeWidth={1.5} aria-hidden="true" /></button>
      {open && <ChatWindow chat={chat} onClose={() => setOpen(false)} />}
    </div>
  );
}
