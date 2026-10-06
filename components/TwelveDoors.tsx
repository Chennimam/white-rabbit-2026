"use client";
import Image from "next/image";
import { useState } from "react";
import { months } from "@/data/siteConfig";
import doorCredits from "@/public/image-credits.json";
import { Reveal } from "./Reveal";
import { SectionLabel, Thread } from "./Shared";

function Door({ index }: { index: number }) {
  const [lit, setLit] = useState(false);
  const number = String(index + 1).padStart(2, "0");
  return (
    <button
      className={`month-door door-position-${index % 3} ${lit ? "is-lit" : ""}`}
      aria-label={`${months[index]} — ${lit ? "приглушить" : "подсветить"} дверь`}
      aria-pressed={lit}
      onClick={() => setLit(!lit)}
    >
      <span className="door-photo">
        <Image
          src={`/images/doors/door-${number}.webp`}
          alt={`${doorCredits[index].alt} — ${months[index]}`}
          width={600}
          height={850}
          sizes="(max-width: 680px) 45vw, (max-width: 1000px) 40vw, 28vw"
        />
        <span className="door-light" aria-hidden="true" />
      </span>
      <span className="month-caption">
        <span className="month-number">{number}</span>
        <span>{months[index]}</span>
        <span className="month-mark" aria-hidden="true">
          ✧
        </span>
      </span>
    </button>
  );
}

export function TwelveDoors() {
  return (
    <section
      className="doors-section section"
      id="doors"
      aria-labelledby="doors-title"
    >
      <div className="shell">
        <div className="section-heading">
          <Reveal>
            <SectionLabel number="III">Коллекция возможностей</SectionLabel>
            <h2 id="doors-title">
              Двенадцать дверей.
              <br />
              <em>Ваш новый год.</em>
            </h2>
          </Reveal>
          <p className="doors-intro">
            За каждой из них — отдельное пространство будущего месяца: образ,
            символ, задача, ресурс, возможность, вопрос или неожиданная встреча.
          </p>
        </div>
        <div className="door-grid">
          {months.map((month, i) => (
            <Door key={month} index={i} />
          ))}
        </div>
        <Reveal className="doors-closing">
          <p>Мы не будем пытаться предсказать год.</p>
          <p className="lead">
            Мы попробуем его
            <br />
            <em>вообразить, почувствовать и сконструировать.</em>
          </p>
          <p>
            Создавая собственную карту года — не как набор обязательств,
            <br className="desktop-break" /> а как живое пространство
            возможностей.
          </p>
        </Reveal>
      </div>
      <Thread />
    </section>
  );
}
