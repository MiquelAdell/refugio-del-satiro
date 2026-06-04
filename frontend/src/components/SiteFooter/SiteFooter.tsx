import styles from "./SiteFooter.module.css";

const SOCIAL_LINKS = [
  {
    label: "WhatsApp",
    href: "https://chat.whatsapp.com/LjAN8Lhau4aCnWKA3dMkmM",
    icon: "/_assets/501dc643ea6ad499.png",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/refugiosatiro/",
    icon: "/_assets/b7f7ca0038930b06.png",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/refugiosatiro",
    icon: "/_assets/14a7b249cc94736c.png",
  },
  {
    label: "Discord",
    href: "https://discord.gg/XAQ8TvtS3y",
    icon: "/_assets/21d3b854d033ae2d.png",
  },
] as const;

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <ul className={styles.socialList} aria-label="Redes sociales">
          {SOCIAL_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                aria-label={link.label}
                rel="noopener noreferrer"
                target="_blank"
                className={styles.socialLink}
              >
                <img
                  src={link.icon}
                  alt={link.label}
                  width={32}
                  height={32}
                  className={styles.socialIcon}
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
