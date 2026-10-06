import { EditorialImage } from "./EditorialImage";
import { Reveal } from "./Reveal";
import { CTA, DatesList } from "./Shared";
export function Dates() {
  return (
    <section
      className="dates-section section shell"
      aria-labelledby="dates-title"
    >
      <div className="dates-layout">
      <Reveal className="dates-art">
        <EditorialImage
          name="alice-threshold"
          alt="Алиса с ключом останавливается у старинного порога и смотрит на путь за дверью"
          width={960}
          height={1440}
        />
      </Reveal>
      <Reveal className="dates-copy">
        <span className="tiny-star" aria-hidden="true">
          ✧
        </span>
        <h2 id="dates-title">
          Пойти ли
          <br />
          <em>за Белым Кроликом?</em>
        </h2>
        <DatesList atmospheric />
        <CTA href="#order" className="dates-cta">Пойти</CTA>
        <p className="online">
          <span aria-hidden="true" />
          Онлайн
        </p>
      </Reveal>
      </div>
    </section>
  );
}
