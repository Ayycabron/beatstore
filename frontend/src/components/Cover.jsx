import { useState } from 'react'
import { hueOf } from '../lib/format.js'
import styles from './Cover.module.css'

/** Cover de la prod, ou dégradé généré à partir du titre s'il n'y en a pas. */
export default function Cover({ beat, size, radius, className = '', children }) {
  const [broken, setBroken] = useState(false)
  const hue = hueOf(beat.slug)
  const style = {
    width: size,
    height: size,
    borderRadius: radius,
    '--h1': hue,
    '--h2': (hue + 50) % 360,
  }
  return (
    <div className={`${styles.cover} ${className}`} style={style}>
      {beat.cover && !broken ? (
        <img src={beat.cover} alt="" loading="lazy" decoding="async" draggable="false" onError={() => setBroken(true)} />
      ) : (
        <div className={styles.generated}><span>{beat.title.slice(0, 2)}</span></div>
      )}
      {children}
    </div>
  )
}
