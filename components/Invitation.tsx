import { Reveal } from "./Reveal";
import { SectionLabel, Thread } from "./Shared";
import { EditorialImage } from "./EditorialImage";

export function Invitation() {
  return <section className="invitation section shell" aria-labelledby="invitation-title">
    <Reveal className="key-plate">
      <div className="key-mount" aria-hidden="true"><EditorialImage name="antique-key" width={750} height={1125} /></div>
      <span aria-hidden="true">CLAVIS · КЛЮЧ К ПЕРЕМЕНАМ</span>
    </Reveal>
    <Reveal className="invitation-copy">
      <SectionLabel number="II">Приглашение</SectionLabel>
      <h2 id="invitation-title">Я приглашаю вас в иное измерение, где возможно даже невозможное, если только вы готовы…</h2>
      <div className="prose">
        <ul className="invitation-possibilities">
          <li>Оставить в старом году то, что действительно завершилось. Ведь, чтобы пройти через некоторые двери, необходимо что-то оставить снаружи.</li>
          <li>Оказаться в пространстве «между», где прежние смыслы уже теряют свою силу, а новые ещё не обрели форму.</li>
          <li>Ненадолго расстаться с привычной логикой и позволить воображению вести вас туда, где вы ещё никогда не были.</li>
          <li>Найти свои ключи, собрать уникальные артефакты, разгадать загадки и расшифровать подсказки.</li>
          <li>Обнаружить удивительные ингредиенты, с помощью которых можно обновить разные пространства своей жизни и преобразить то, что уже в ней происходит.</li>
        </ul>
        <p className="invitation-last">И, конечно, открыть двенадцать таинственных дверей.</p>
        <p>Что скрывается за ними?</p>
        <p><em>Было бы странно рассказывать об этом до начала путешествия…</em></p>
      </div>
    </Reveal><Thread />
  </section>;
}
