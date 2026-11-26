import { Reveal } from "./Reveal";
import { SectionLabel } from "./Shared";
import { EditorialImage } from "./EditorialImage";

export function RabbitHole() {
  return <section className="rabbit-hole section" aria-labelledby="hole-title">
    <div className="passage-image" aria-hidden="true"><EditorialImage name="final-door" width={1000} height={1500} /></div>
    <div className="shell hole-grid"><Reveal className="hole-copy">
      <SectionLabel number="IV">По ту сторону привычного</SectionLabel>
      <h2 id="hole-title">Это будет сном наяву, прыжком в Кроличью Нору и встречей с тем, что невозможно предсказать.</h2>
      <div className="prose">
        <p>Игровые практики, медитации, работа с символами и воображением, метафорические карты, загадки, парадоксы и создание собственных артефактов.</p>
        <p className="hole-accent"><em>Предрождественская мистерия — путешествие в пространстве «между».</em></p>
        <p>Между старым и новым.</p>
        <p>Между тем, что уже произошло, и тем, что пока существует только как возможность.</p>
        <p>Между привычным представлением о себе и той неизвестностью, которой мы ещё только можем стать.</p>
      </div>
    </Reveal></div>
  </section>;
}
