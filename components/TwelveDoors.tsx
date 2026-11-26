"use client";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { doors, type DoorStudy } from "@/data/doors";
import { Reveal } from "./Reveal";
import { Thread } from "./Shared";

function DoorArtwork({ door }: { door: DoorStudy }) {
  return <span className="portal-art" role="img" aria-label={door.alt}>
    <Image src={door.image} alt="" fill sizes="(max-width: 680px) 36vw, 140px" />
    <span className={`door-effects ${door.id.replace("portal-", "fx-")}`} aria-hidden="true"
      style={{ "--door-image": `url("${door.image}")` } as CSSProperties}>
      <span className="effect-surface" />
      <span className="effect-light" />
      <span className="effect-detail"><i /><i /></span>
      <span className="effect-particles">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</span>
    </span>
  </span>;
}

export function TwelveDoors() {
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const awakened = hovered ?? focused ?? active;
  return <section className="doors-section section" id="doors" aria-labelledby="doors-title">
    <div className="shell">
      <div className="section-heading">
        <Reveal><p className="eyebrow">По ту сторону привычных координат</p>
          <h2 id="doors-title">Каждая дверь — портал в совершенно иной мир.</h2></Reveal>
        <div className="doors-intro"><p className="gallery-subtitle"><em>Прикоснись к двери. Возможно, ей есть о чём тебя спросить…</em></p>
          <p className="gallery-instruction">Наведи курсор, коснись изображения или выбери дверь с клавиатуры</p>
        </div>
      </div>
      <svg className="door-effect-filters" aria-hidden="true" focusable="false" width="0" height="0">
        <defs>
          <filter id="door-mirror-ripple" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.08" numOctaves="1" seed="4" result="wave" />
            <feDisplacementMap in="SourceGraphic" in2="wave" scale="11" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="door-water-ripple" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.13" numOctaves="1" seed="8" result="wave" />
            <feDisplacementMap in="SourceGraphic" in2="wave" scale="8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div className="portal-grid">
        {doors.map((door) => <div className="portal-pair" key={door.id}>
          <div className="portal-cell portal-light"><button type="button"
          className={`portal-card ${awakened === door.id ? "is-awake" : ""}`}
          aria-label={`Исследовать дверь: ${door.alt}`}
          aria-pressed={active === door.id} aria-describedby={`${door.id}-question`}
          onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(door.id); }}
          onPointerLeave={() => setHovered(null)}
          onPointerDown={(event) => { setHovered(event.pointerType === "mouse" ? door.id : null); setFocused(null); }}
          onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) { setHovered(null); setFocused(door.id); } }}
          onBlur={() => setFocused(null)}
          onClick={() => setActive(active === door.id ? null : door.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") { setHovered(null); setFocused(door.id); }
            if (event.key === "Escape") { setActive(null); setHovered(null); setFocused(null); }
          }}>
          <DoorArtwork door={door} />
        </button></div>
          <div className="portal-cell portal-dark"><span className={`portal-question ${awakened === door.id ? "is-visible" : ""}`}
            id={`${door.id}-question`} aria-hidden={awakened !== door.id}>{door.question}</span></div>
        </div>)}
      </div>
      <p className="gallery-authorship">Авторские парадоксы, вдохновлённые произведениями Льюиса Кэрролла</p>
    </div><Thread />
  </section>;
}
