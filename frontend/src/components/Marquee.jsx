import styles from './Marquee.module.css'

export default function Marquee({ items }) {
  const row = items.flatMap((t, i) => [<span key={`t${i}`}>{t}</span>, <span key={`s${i}`} className={styles.sep} aria-hidden="true">✦</span>])
  return (
    <div className={styles.marquee} aria-label={items.join(', ')}>
      <div className={styles.track} aria-hidden="true">
        <div className={styles.group}>{row}</div>
        <div className={styles.group}>{row}</div>
      </div>
    </div>
  )
}
