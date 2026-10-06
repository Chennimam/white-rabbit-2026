import Image from 'next/image';
import { CTA, DatesList, DownLink } from './Shared';
import { Reveal } from './Reveal';
export function Hero() {
 return <><header className="header shell"><a className="wordmark" href="#top" aria-label="На главную">МАРИЯ УХАНОВА<span>ПРОСТРАНСТВО СИМВОЛОВ</span></a><nav aria-label="Основная навигация"><a href="#doors">12 дверей</a><a href="#maria">Ведущая</a><a className="nav-join" href="#participation">Участвовать <span aria-hidden="true">↗</span></a></nav></header>
 <section className="hero shell" id="top" aria-labelledby="hero-title"><Reveal className="hero-copy"><p className="eyebrow hero-kicker">На пороге нового года</p><h1 id="hero-title">За Белым<br /><em>Кроликом</em></h1><p className="hero-subtitle">12 дверей в Новый год</p><div className="hero-rule" /><p className="format">Новогодняя онлайн-мистерия</p><DatesList /><CTA /><DownLink /></Reveal><Reveal className="hero-art" delay={0.15}><span className="plate-label" aria-hidden="true">ТАБЛ. I · НАЧАЛО ПУТИ</span><Image src="/images/hero-rabbit.webp" alt="Белый Кролик перед приоткрытой старинной дверью — гравюрная иллюстрация" width={1024} height={1536} priority sizes="(max-width: 680px) 100vw, 48vw" /><span className="art-caption" aria-hidden="true">Любопытство — тоже ключ.</span></Reveal></section></>;
}
