import { socialLinks } from "@/data/socialLinks";

export function Footer() {
  const metaLinks = socialLinks.filter((link) =>
    ["Instagram", "Facebook"].includes(link.label),
  );
  const otherLinks = socialLinks.filter((link) => !metaLinks.includes(link));
  const renderLink = (link: (typeof socialLinks)[number]) => (
    <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
      {link.label} ↗
    </a>
  );

  return (
    <footer className="footer shell">
      <div className="footer-row">
        <p className="footer-name">Мария Уханова</p>
        <div className="footer-socials" aria-label="Социальные сети и сайт">
          <div className="social-links">{otherLinks.map(renderLink)}</div>
          <div className="meta-socials">
            <div className="social-links">{metaLinks.map(renderLink)}</div>
            <p className="social-disclaimer">
              Instagram и Facebook принадлежат компании Meta Platforms Inc., деятельность которой признана экстремистской и запрещена на территории Российской Федерации.
            </p>
          </div>
        </div>
      </div>
      <div className="footer-service">
        <a className="credits-link" href="/image-credits.html" target="_blank" rel="noopener noreferrer">
          Источники изображений
        </a>
      </div>
    </footer>
  );
}
