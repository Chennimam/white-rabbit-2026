"use client";
import Image from "next/image";
import { useState } from "react";
import { thirteenthDoor } from "@/data/thirteenthDoor";
import { PlanCTA } from "./ParticipationSelection";

export function ThirteenthDoor() {
  const [illuminated, setIlluminated] = useState(false);
  const [hovered, setHovered] = useState(false);
  const awake = hovered || illuminated;
  return <section id="thirteenth-door" className="thirteenth-section" aria-labelledby="thirteenth-title">
    <div className="shell thirteenth-layout">
      <div className="thirteenth-image-column">
        <button type="button" className={`thirteenth-visual ${awake ? "is-illuminated" : ""}`}
          aria-label="Тринадцатая дверь — проявить свет и вопрос" aria-pressed={illuminated}
          aria-describedby="thirteenth-question" onClick={() => setIlluminated(!illuminated)}
          onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
          onPointerLeave={() => setHovered(false)}
          onKeyDown={(event) => { if (event.key === "Escape") { setIlluminated(false); setHovered(false); } }}>
          <Image src="/images/thirteenth-door.webp" alt="Одинокая открытая дверь в бескрайнем звёздном пространстве; от проёма тянется световая дорожка"
            width={1086} height={1448} sizes="(max-width: 900px) 100vw, 55vw" />
          <span className="thirteenth-glow" aria-hidden="true" />
          <span className="thirteenth-stars" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</span>
          <span id="thirteenth-question" className={`thirteenth-revealed-question ${awake ? "is-revealed" : ""}`}>
            {thirteenthDoor.question}
          </span>
        </button>
      </div>
      <div className="thirteenth-copy">
        <p className="eyebrow">Для участников формата «Исследователь»</p>
        <h3 id="thirteenth-title">{thirteenthDoor.title}</h3>
        <p className="thirteenth-subtitle"><em>{thirteenthDoor.subtitle}</em></p>
        <div className="thirteenth-prose">{thirteenthDoor.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        <div className="thirteenth-meeting"><p>{thirteenthDoor.meeting}</p><p>{thirteenthDoor.timing}</p></div>
        <p className="thirteenth-included">{thirteenthDoor.included}</p>
        <PlanCTA planId="explorer" href="#order">{thirteenthDoor.cta}</PlanCTA>
      </div>
    </div>
  </section>;
}
