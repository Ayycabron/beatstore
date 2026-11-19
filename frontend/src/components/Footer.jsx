import { Link } from '../lib/router.jsx'
import styles from './Footer.module.css'

export default function Footer({ site }) {
  return (
    <footer className={`${styles.footer} no-print`}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.top}>
          <nav className={styles.links} aria-label="Liens de pied de page">
            <Link to="/#catalogue">Prods</Link>
            <Link to="/licences">Licences</Link>
            <Link to="/mentions">Mentions & confidentialité</Link>
            {site?.instagram && <a href={site.instagram} target="_blank" rel="noreferrer">Instagram</a>}
            {site?.youtube && <a href={site.youtube} target="_blank" rel="noreferrer">YouTube</a>}
          </nav>
          <span className="mono muted">© {new Date().getFullYear()} {site?.producerName}</span>
        </div>
        <div className={`display ${styles.wordmark}`} aria-hidden="true">{site?.brand}</div>
      </div>
    </footer>
  )
}
