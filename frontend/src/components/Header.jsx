import { Link, usePath } from '../lib/router.jsx'
import { useScrolled } from '../lib/hooks.js'
import styles from './Header.module.css'

export default function Header({ site }) {
  const path = usePath()
  const scrolled = useScrolled()
  const nav = [
    ['/#catalogue', 'Prods', path === '/'],
    ['/licences', 'Licences', path === '/licences'],
  ]
  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''} no-print`}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo} aria-label="Accueil">
          <span className={styles.mark} aria-hidden="true" />
          {site?.brand || 'BEATSTORE'}
        </Link>
        <nav className={styles.nav} aria-label="Navigation principale">
          {nav.map(([to, label, active]) => (
            <Link key={to} to={to} className={styles.link} aria-current={active ? 'page' : undefined}>{label}</Link>
          ))}
          <Link to="/#catalogue" className={`btn btn-sm ${styles.cta}`}>Écouter</Link>
        </nav>
      </div>
    </header>
  )
}
