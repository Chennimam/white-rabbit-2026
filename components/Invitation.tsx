import { Reveal } from "./Reveal";
import { SectionLabel, Thread } from "./Shared";
import { EditorialImage } from "./EditorialImage";

export function Invitation() {
  return (
    <section
      className="invitation section shell"
      aria-labelledby="invitation-title"
    >
      <Reveal className="key-plate">
        <div className="key-mount" aria-hidden="true">
          <EditorialImage name="antique-key" width={750} height={1125} />
        </div>
        <span aria-hidden="true">CLAVIS · КЛЮЧ К ПЕРЕМЕНАМ</span>
      </Reveal>
      <Reveal className="invitation-copy">
        <SectionLabel number="II">Приглашение</SectionLabel>
        <h2 id="invitation-title">
          Я приглашаю вас
          <br />
          <em>пройти этот путь вместе.</em>
        </h2>
        <div className="prose">
          <p>Оставить в старом году то, что действительно завершилось.</p>
          <p>
            Увидеть привычки, сценарии и внутренние запреты, которые незаметно
            удерживают нас на месте.
          </p>
          <p>Найти свои ключи, собрать уникальные артефакты и подсказки.</p>
          <p>
            Обнаружить ингредиенты, которые помогут обновить разные пространства
            жизни и те процессы, которые уже происходят в ней.
          </p>
        </div>
        <p className="invitation-last">
          Открыть 12 дверей
          <br />
          нового года.
        </p>
      </Reveal>
      <Thread />
    </section>
  );
}
