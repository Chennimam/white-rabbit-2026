import { socialLinks } from "@/data/socialLinks";
export function Footer() {
  return (
    <footer className="footer shell">
      <div className="footer-row">
        <a className="footer-name" href="#maria">
          Мария Уханова
        </a>
        <div className="social-links" aria-label="Социальные сети и сайт">
          {socialLinks.map((link) =>
            link.url ? (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label} ↗
              </a>
            ) : (
              <span className="social-placeholder" key={link.label}>
                {link.label}
                <small>скоро</small>
              </span>
            ),
          )}
        </div>
      </div>
      <a className="credits-link" href="/image-credits.html">
        Источники изображений
      </a>
    </footer>
  );
}
