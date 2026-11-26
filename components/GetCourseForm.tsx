"use client";
import Script from "next/script";
import { useEffect, useRef } from "react";
import type { GetCourseForm as FormConfig, RegistrationMode } from "@/data/getcourse";

declare global {
  interface Window {
    mountWhiteRabbitGetCourse?: (mount: HTMLElement, status: HTMLElement | null) => (() => void) | undefined;
  }
}
export function GetCourseForm({ form, mode }: { form: FormConfig; mode: RegistrationMode }) {
  const mount = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const stop = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => stop.current?.(), []);
  return <div className="order-form">
    {mode === "preview" && <p className="widget-preview-note">Локальная проверка: форма GetCourse настоящая. Не нажимайте «Открыть дверь» до согласованного теста — эта кнопка создаёт заказ.</p>}
    <p ref={status} role="status">Загружаем форму оформления участия…</p>
    <div ref={mount} id="getcourse-order" className="getcourse-order" data-checkout-enabled="true"
      data-registration-mode={mode} data-widget-id={form.widgetId} data-script-element-id={form.scriptElementId} />
    <Script src="/getcourse-init.js" strategy="afterInteractive" onReady={() => {
      stop.current?.();
      if (mount.current) stop.current = window.mountWhiteRabbitGetCourse?.(mount.current, status.current);
    }} />
    <p className="order-fallback"><a href={`https://tarotroad.getcourse.ru/pl/lite/widget/widget?id=${form.widgetId}`} target="_blank" rel="noopener noreferrer">Открыть форму GetCourse в отдельной вкладке</a></p>
  </div>;
}
