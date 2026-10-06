import Script from "next/script";
import { pricing } from "@/data/pricing";
import { Reveal } from "./Reveal";
import { SectionLabel, CTA } from "./Shared";

export function Pricing() {
  return (
    <section
      className="pricing-section section"
      id="participation"
      aria-labelledby="pricing-title"
    >
      <div className="shell">
        <Reveal className="center-heading">
          <SectionLabel number="VI">Выберите свой путь</SectionLabel>
          <h2 id="pricing-title">
            Два способа <em>войти</em>
          </h2>
        </Reveal>
        <div className="pricing-grid">
          {pricing.map((plan, index) => (
            <Reveal key={plan.id} className={`price-card price-${plan.id}`}>
              <span className="plan-number" aria-hidden="true">
                {index === 0 ? "I" : "II"}
              </span>
              <h3>{plan.title}</h3>
              <p className="plan-description">{plan.description}</p>
              <div className="plan-features">
                {plan.preface && <p>{plan.preface}</p>}
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
              <div className="price-bottom">
                <p className="price">
                  {new Intl.NumberFormat("ru-RU").format(plan.price)}{" "}
                  <span>{plan.currency}</span>
                </p>
                <CTA href="#order">{plan.cta}</CTA>
                <p className="order-next-step">
                  Далее — выбрать тариф в форме, заполнить данные и перейти к оплате.
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="order-panel" id="order" aria-labelledby="order-title">
          <SectionLabel number="VII">Ваш билет в мистерию</SectionLabel>
          <h2 id="order-title">Оформление <em>участия</em></h2>
          <p className="order-intro">
            Выберите «Путешественник» или «Исследователь» в форме ниже,
            заполните свои данные и перейдите к оплате.
          </p>
          <p className="order-status" id="order-status" role="status">Загружаем форму оформления участия…</p>
          <div id="getcourse-order" className="getcourse-order" />
          <p className="order-fallback">
            Форма не появилась? <a href="https://tarotroad.getcourse.ru/pl/lite/widget/widget?id=1665193" target="_blank" rel="noopener noreferrer">Откройте её в отдельной вкладке ↗</a>
          </p>
          <noscript>Для оформления участия включите JavaScript в браузере.</noscript>
        </div>
        <Script src="/getcourse-init.js" strategy="afterInteractive" />
      </div>
    </section>
  );
}
