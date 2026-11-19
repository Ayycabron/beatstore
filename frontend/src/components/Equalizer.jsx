import styles from './Equalizer.module.css'

/** Petites barres animées « en lecture ». */
export default function Equalizer({ paused = false, className = '' }) {
  return (
    <span className={`${styles.eq} ${paused ? styles.paused : ''} ${className}`} aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  )
}
