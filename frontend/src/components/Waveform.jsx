import { memo, useMemo, useRef, useState } from 'react'
import { useInView } from '../lib/hooks.js'
import { usePeaks } from '../player/peaks.js'
import styles from './Waveform.module.css'

function resample(peaks, bars) {
  if (!peaks?.length) return null
  const out = []
  const step = peaks.length / bars
  for (let i = 0; i < bars; i++) {
    let m = 0
    for (let j = Math.floor(i * step); j < Math.max(Math.floor((i + 1) * step), Math.floor(i * step) + 1); j++) m = Math.max(m, peaks[j] || 0)
    out.push(m)
  }
  return out
}

const Bars = memo(function Bars({ values, gap }) {
  const w = 1 / values.length
  return values.map((v, i) => {
    const h = Math.max(0.06, v)
    return <rect key={i} x={i * w + (w * gap) / 2} width={w * (1 - gap)} y={(1 - h) / 2} height={h} rx={w * 0.3} />
  })
})

/**
 * Waveform réelle (calculée par le serveur), avec progression et seek au clic.
 * progress : 0 → 1. onSeek(ratio) rend la waveform cliquable.
 */
export default function Waveform({ slug, progress = 0, onSeek, bars = 96, gap = 0.35, height = 40, active = false, className = '' }) {
  const [ref, inView] = useInView()
  const data = usePeaks(slug, inView)
  const values = useMemo(() => resample(data?.peaks, bars), [data, bars])
  const [hover, setHover] = useState(null)
  const box = useRef(null)

  const ratioAt = (e) => {
    const r = box.current.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
  }

  return (
    <div
      ref={(el) => { ref.current = el; box.current = el }}
      className={`${styles.wave} ${active ? styles.active : ''} ${onSeek ? styles.interactive : ''} ${className}`}
      style={{ height }}
      onPointerMove={onSeek ? (e) => setHover(ratioAt(e)) : undefined}
      onPointerLeave={onSeek ? () => setHover(null) : undefined}
      onClick={onSeek ? (e) => { e.stopPropagation(); onSeek(ratioAt(e)) } : undefined}
      role={onSeek ? 'slider' : undefined}
      aria-label={onSeek ? 'Position de lecture' : undefined}
      aria-valuemin={onSeek ? 0 : undefined}
      aria-valuemax={onSeek ? 100 : undefined}
      aria-valuenow={onSeek ? Math.round(progress * 100) : undefined}
      tabIndex={onSeek ? -1 : undefined}
    >
      {values ? (
        <svg viewBox="0 0 1 1" preserveAspectRatio="none" className={styles.svg}>
          <defs>
            <clipPath id={`p-${slug}-${bars}`}><rect width={progress} height="1" /></clipPath>
            {hover !== null && <clipPath id={`h-${slug}-${bars}`}><rect width={hover} height="1" /></clipPath>}
          </defs>
          <g className={styles.base}><Bars values={values} gap={gap} /></g>
          {hover !== null && <g className={styles.hover} clipPath={`url(#h-${slug}-${bars})`}><Bars values={values} gap={gap} /></g>}
          <g className={styles.played} clipPath={`url(#p-${slug}-${bars})`}><Bars values={values} gap={gap} /></g>
        </svg>
      ) : (
        <div className={styles.skeleton} />
      )}
    </div>
  )
}
