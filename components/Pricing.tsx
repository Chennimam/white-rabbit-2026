import { pricing } from "@/data/pricing";
import { Reveal } from "./Reveal";
import { ParticipationSelection, PlanCTA } from "./ParticipationSelection";
import { Registration } from "./Registration";
import { ThirteenthDoor } from "./ThirteenthDoor";
export function Pricing() {
  return <ParticipationSelection><section className="pricing-section section" id="participation" aria-labelledby="pricing-title">
    <div className="shell">
      <Reveal className="center-heading"><p className="eyebrow">Выберите свой путь</p>
        <h2 id="pricing-title">Два способа <em>войти</em></h2></Reveal>
      <div className="pricing-grid">
        {pricing.map((plan) => <Reveal key={plan.id} className={`price-card price-${plan.id}`}>
          <h3>{plan.title}</h3><p className="plan-description">{plan.description}</p>
          <div className="plan-features">
            {plan.preface && <p>{plan.preface}</p>}
            <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          </div>
          {plan.scarcityNote && <p className="scarcity-note">{plan.scarcityNote}</p>}
          <div className="price-bottom"><p className="price">{new Intl.NumberFormat("ru-RU").format(plan.price)} <span>{plan.currency}</span></p>
            <PlanCTA planId={plan.id} href={plan.id === "explorer" ? "#thirteenth-door" : "#order"}>{plan.cta}</PlanCTA><p className="order-next-step">Живое участие. Без записи.</p>
          </div>
        </Reveal>)}
      </div>
    </div>
    <ThirteenthDoor />
    <div className="shell"><Registration /></div>
  </section></ParticipationSelection>;
}
