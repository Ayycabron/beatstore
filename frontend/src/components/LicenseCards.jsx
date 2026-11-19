import { fmtCompact } from '../lib/format.js'
import Reveal from './Reveal.jsx'
import { Check, Minus } from './Icons.jsx'
import styles from './LicenseCards.module.css'

export function licenseFeatures(l) {
  const x = l.limits
  if (l.sync) {
    return [
      ['Pub, film, YouTube, podcast, jeu', true],
      ['Prix selon diffusion et durée', true],
      ['Fichier WAV', true],
      ['Chanson avec voix sur la prod', false],
    ]
  }
  const n = (v, unit) => (v === null ? `${unit[0].toUpperCase()}${unit.slice(1)} illimités` : `${fmtCompact(v)} ${unit}`)
  return [
    [n(x.streams, 'streams'), true],
    [x.videos === null ? 'Clips illimités' : `${x.videos} clip${x.videos > 1 ? 's' : ''} vidéo`, true],
    [x.sales === null ? 'Ventes illimitées' : `${fmtCompact(x.sales)} ventes physiques`, true],
    ['Radio & TV', x.radio],
    ['Pistes séparées (stems)', x.stems],
    ...(l.exclusive ? [['Synchro & Content ID', true], ['Retirée du catalogue', true]] : []),
  ]
}

function splitPrice(label) {
  // « 300 à 500 € » → ['300–500', '€'] ; « Dès 150 € » → ['150', '€', 'dès']
  const m = label?.match(/^(dès\s+)?([\d\s]+(?:à\s+[\d\s]+)?)\s*(€)?$/i)
  if (!m) return [label, '', '']
  return [m[2].replace(/\s*à\s*/, '–').trim(), m[3] || '', m[1] ? 'dès' : '']
}

export default function LicenseCards({ licenses, showPrices = true, featured = 'premium' }) {
  return (
    <div className={styles.grid}>
      {licenses.licenses.map((l, i) => {
        const [amount, currency, prefix] = splitPrice(l.priceLabel)
        const cls = [styles.card, l.id === featured && styles.featured, l.exclusive && styles.exclusive].filter(Boolean).join(' ')
        return (
          <Reveal key={l.id} className={cls} delay={i * 60}>
            <div className={styles.top}>
              <h3>{l.name}</h3>
              {l.id === featured && <span className="pill">Le plus pris</span>}
              {l.exclusive && <span className="pill pill-soft">1 seul acheteur</span>}
            </div>
            {showPrices && l.priceLabel && (
              <div className={styles.price}>
                {prefix && <small>{prefix}</small>}
                <span>{amount}</span>
                <small>{currency}</small>
              </div>
            )}
            <p className={styles.pitch}>{l.pitch}</p>
            <ul className={styles.features}>
              {licenseFeatures(l).map(([label, ok]) => (
                <li key={label} className={ok ? '' : styles.off}>
                  <span className={styles.tick}>{ok ? <Check size={12} /> : <Minus size={12} />}</span>
                  {label}
                </li>
              ))}
            </ul>
          </Reveal>
        )
      })}
    </div>
  )
}
