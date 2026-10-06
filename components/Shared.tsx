import { ArrowDown, ArrowUpRight } from "lucide-react";
export function DatesList({ className = "", atmospheric = false }: { className?: string; atmospheric?: boolean }) {
  return (
    <p className={`dates-list ${className}`}>
      {atmospheric && <span>Двери открываются дважды. </span>}
      <span>Выберите свою дату: <time dateTime="2026-12-20">20 декабря</time> или <time dateTime="2026-12-24">24 декабря</time>{atmospheric ? "." : ""}</span>
    </p>
  );
}
export function CTA({
  children = "Пойти за Белым Кроликом",
  href = "#participation",
  className = "",
}: {
  children?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <a className={`button ${className}`} href={href}>
      {children}
      <ArrowUpRight size={17} strokeWidth={1.3} aria-hidden="true" />
    </a>
  );
}
export function SectionLabel({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <p className="eyebrow section-label">
      <span>{number}</span>
      <i aria-hidden="true" />
      {children}
    </p>
  );
}
export function Thread({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`thread ${className}`}
      viewBox="0 0 1200 150"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M-30 65 C130 180 230 -50 410 75 S700 130 720 73 C735 23 660 25 685 83 S1020 155 1240 12" />
    </svg>
  );
}
export function DownLink() {
  return (
    <a className="down-link" href="#story">
      <ArrowDown size={16} strokeWidth={1.2} aria-hidden="true" />
      <span>Вслед за любопытством</span>
    </a>
  );
}
