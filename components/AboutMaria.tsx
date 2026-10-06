import Image from "next/image";
import { Reveal } from "./Reveal";
import { SectionLabel } from "./Shared";

export function AboutMaria() {
  return (
    <section
      className="about-section section"
      id="maria"
      aria-labelledby="maria-title"
    >
      <div className="shell about-grid">
        <Reveal className="portrait-composition">
          <div className="portrait-frame">
            <Image
              src="/images/maria-ukhanova.jpg"
              alt="Мария Уханова на фоне горного озера"
              width={1080}
              height={1920}
              sizes="(max-width: 680px) 86vw, 40vw"
              className="maria-portrait"
            />
            <span className="portrait-caption">МАРИЯ УХАНОВА</span>
          </div>
          <span className="portrait-side" aria-hidden="true">
            ИСКУССТВО ВИДЕТЬ СИМВОЛЫ
          </span>
        </Reveal>
        <Reveal className="about-copy">
          <SectionLabel number="V">Ведущая мистерии</SectionLabel>
          <h2 id="maria-title">
            Мария
            <br />
            <em>Уханова</em>
          </h2>
          <p className="about-lead">
            Аналитический психолог, психотерапевт, преподаватель и исследователь
            архетипов, символов и мифологических сюжетов.
          </p>
          <div className="prose">
            <p>
              Более двадцати лет я работаю с архетипами, Таро, мифологией,
              алхимической символикой и глубинной психологией.
            </p>
            <p>
              В своих программах я соединяю психологическую работу, активное
              воображение, игровые практики, медитации, ритуалы перехода и
              работу с символом.
            </p>
            <p>
              Мне особенно интересны те пространства, где человек не получает
              готовый ответ, а начинает слышать собственный.
            </p>
            <p>
              Где символ становится не украшением, а способом увидеть то, что
              раньше оставалось незаметным.
            </p>
            <p>
              И где даже маленькая дверь может оказаться входом в совершенно
              новую реальность.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
