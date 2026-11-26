"use client";
import { useEffect, useState } from "react";
import { siteConfig } from "@/data/siteConfig";
import { pricing } from "@/data/pricing";
import { getRegistrationMode, getVerifiedForm, type RegistrationMode } from "@/data/getcourse";
import { useParticipationSelection } from "./ParticipationSelection";
import { GetCourseForm } from "./GetCourseForm";

export function Registration() {
  const [mode, setMode] = useState<RegistrationMode>(siteConfig.checkoutEnabled ? "live" : "closed");
  useEffect(() => setMode(getRegistrationMode(siteConfig.checkoutEnabled, window.location.hostname)), []);
  const { planId, setPlanId } = useParticipationSelection();
  const selectedPlan = pricing.find(item => item.id === planId);
  const form = getVerifiedForm(planId, mode !== "closed");
  return <div className="order-panel" id="order" aria-labelledby="order-title">
    <div className="order-heading">
      <p className="eyebrow">Ваше участие</p>
      <h2 id="order-title">Выбрать <em>свою дату</em></h2>
      <p className="order-intro">Одна встреча на выбор. Четыре часа онлайн, без записи.</p>
    </div>
    <fieldset className="date-picker plan-picker"><legend>Формат участия</legend>
      {pricing.map(plan => <label key={plan.id} className={planId === plan.id ? "is-selected" : ""}>
        <input type="radio" name="participation-plan" value={plan.id} checked={planId === plan.id} onChange={() => setPlanId(plan.id)} />
        <span>{plan.title}<span className="registration-hours">{new Intl.NumberFormat("ru-RU").format(plan.price)} ₽</span></span>
      </label>)}
    </fieldset>
    <div className="registration-schedule">{siteConfig.dates.map(item => <p key={item.iso}><time dateTime={item.iso}>{item.label}</time> — {item.time} МСК</p>)}</div>
    <p className="schedule-note">Все часы указаны по московскому времени (МСК, UTC+3).</p>
    <p className="selection-status" role="status">{selectedPlan ? `${selectedPlan.title} — ${new Intl.NumberFormat("ru-RU").format(selectedPlan.price)} ₽. ` : "Выбери формат участия. "}{form ? "Выбери одну дату в форме GetCourse ниже." : "Участие в одну из двух дат."}</p>
    {form ? <GetCourseForm key={planId} form={form} mode={mode} /> : mode !== "closed" && !planId ? <div className="checkout-paused">
      <p>Выбери формат участия, чтобы открыть форму GetCourse.</p>
      <p>Дата участия выбирается в форме регистрации.</p>
    </div> : <div className="checkout-paused">
      <p>Оформление участия откроется после проверки формы регистрации.</p>
      <p>Сейчас выбор формата и даты остаётся на этой странице и не бронирует место.</p>
    </div>}
  </div>;
}
