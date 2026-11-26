import { Reveal } from "./Reveal";
export function HereAndNow() {
  return <section className="present-section section" aria-labelledby="present-title">
    <Reveal className="shell present-layout">
      <div><p className="eyebrow">Живая встреча · 4 часа · без записи</p><h2 id="present-title">Здесь <em>и сейчас</em></h2></div>
      <div className="prose">
        <p className="lead">У каждого путешествия есть своё время.</p>
        <p>Двери нашей мистерии откроются дважды — 20 и 24 декабря. Ты можешь выбрать любую из этих дат.</p>
        <p>Но запись мистерии мы делать не будем.</p>
        <p>Это живое путешествие, сотканное из встреч, случайностей, образов, открытий и твоего собственного присутствия. Его невозможно поставить на паузу, перемотать или отложить на потом.</p>
        <p className="lead">Некоторые двери открываются только в настоящем.</p>
        <p>И через них нужно пройти лично.</p>
      </div>
    </Reveal>
  </section>;
}
