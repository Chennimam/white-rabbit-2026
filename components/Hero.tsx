import { CTA, DatesList, DownLink, Thread } from "./Shared";
import { Reveal } from "./Reveal";
import { EditorialImage } from "./EditorialImage";

export function Hero() {
  return (
    <>
      <header className="header shell">
        <a className="wordmark" href="#top" aria-label="На главную">
          МАРИЯ УХАНОВА<span>ПРОСТРАНСТВО СИМВОЛОВ</span>
        </a>
        <nav aria-label="Основная навигация">
          <a href="#doors">12 дверей</a>
          <a href="#maria">Ведущая</a>
          <a className="nav-join" href="#participation">
            Участвовать <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-layout shell">
          <Reveal className="hero-heading">
            <p className="eyebrow hero-kicker">На пороге нового года</p>
            <h1 id="hero-title">
              За Белым
              <br />
              <em>Кроликом</em>
            </h1>
            <p className="hero-subtitle">12 дверей в Новый год</p>
          </Reveal>
          <Reveal className="hero-art" delay={0.12}>
            <span className="plate-label" aria-hidden="true">
              ТАБЛ. I · НАЧАЛО ПУТИ
            </span>
            <EditorialImage
              name="hero-rabbit-alice"
              alt="Алиса следует за Белым Кроликом к старинному проходу — викторианская книжная гравюра"
              width={1440}
              height={960}
              priority
            />
            <span className="art-caption" aria-hidden="true">
              Любопытство — тоже ключ.
            </span>
          </Reveal>
          <Reveal className="hero-details" delay={0.1}>
            <div className="hero-ticket">
              <p className="format">Новогодняя онлайн-мистерия</p>
              <DatesList />
            </div>
            <CTA />
            <DownLink />
          </Reveal>
        </div>
        <Thread className="hero-thread" />
      </section>
    </>
  );
}
