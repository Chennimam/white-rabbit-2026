import { Reveal } from "./Reveal";
import { DatesList } from "./Shared";
export function Dates() {
  return (
    <section
      className="dates-section section shell"
      aria-labelledby="dates-title"
    >
      <Reveal>
        <span className="tiny-star" aria-hidden="true">
          ✧
        </span>
        <h2 id="dates-title">
          Пойти ли
          <br />
          <em>за Белым Кроликом?</em>
        </h2>
        <DatesList atmospheric />
        <p className="online">
          <span aria-hidden="true" />
          Онлайн
        </p>
      </Reveal>
    </section>
  );
}
