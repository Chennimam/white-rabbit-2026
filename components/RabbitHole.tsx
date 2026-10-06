import { Reveal } from "./Reveal";
import { SectionLabel } from "./Shared";
import { EditorialImage } from "./EditorialImage";

export function RabbitHole() {
  return (
    <section className="rabbit-hole section" aria-labelledby="hole-title">
      <div className="passage-image" aria-hidden="true">
        <EditorialImage name="final-door" width={1000} height={1500} />
      </div>
      <div className="shell hole-grid">
        <Reveal className="hole-copy">
          <SectionLabel number="IV">По ту сторону привычного</SectionLabel>
          <h2 id="hole-title">
            Это будет путешествие
            <br />в кроличью нору —<br />
            <em>за Белым Кроликом.</em>
          </h2>
          <div className="prose">
            <p>
              Игровые практики, медитации, работа с символами и воображением,
              маленькие ритуалы перехода, встречи с внутренними фигурами и
              создание собственных артефактов.
            </p>
            <p className="hole-accent">
              Новогодняя мистерия между старым и новым.
            </p>
            <p>
              Между тем, что уже произошло,
              <br />и тем, что пока существует только как возможность.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
