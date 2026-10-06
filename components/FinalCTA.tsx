import { Reveal } from "./Reveal";
import { CTA, DatesList, Thread } from "./Shared";
import { EditorialImage } from "./EditorialImage";

export function FinalCTA() {
  return (
    <section className="final-section section" aria-labelledby="final-title">
      <Thread />
      <div className="shell final-grid">
        <Reveal className="final-copy">
          <h2 id="final-title">
            Иногда достаточно
            <br />
            <em>открыть одну дверь</em>
          </h2>
          <div className="prose">
            <p>
              Иногда кажется, что для изменений требуется совершенно новая
              жизнь.
            </p>
            <p>Но иногда всё начинается гораздо тише.</p>
            <p>
              С нового вопроса.
              <br />С неожиданного образа.
              <br />С маленького решения.
              <br />С двери, которую раньше мы не замечали.
            </p>
            <p>И с готовности посмотреть, что находится по ту сторону.</p>
          </div>
          <div className="final-invite">
            <p className="final-name">
              За Белым Кроликом.
              <br />
              <em>12 дверей в Новый год.</em>
            </p>
            <p className="format">Новогодняя онлайн-мистерия</p>
            <DatesList atmospheric />
            <p className="online">Онлайн</p>
            <CTA />
          </div>
        </Reveal>
        <Reveal className="final-art">
          <EditorialImage
            name="final-door"
            alt="Приоткрытая старинная дверь, за которой виден тёплый свет"
            width={1000}
            height={1500}
          />
          <span aria-hidden="true">ПО ТУ СТОРОНУ — ВОЗМОЖНОСТЬ</span>
        </Reveal>
      </div>
    </section>
  );
}
