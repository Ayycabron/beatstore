import { useEffect } from 'react'
import { player, usePlayer, useProgress } from '../player/store.js'
import { fmtTime } from '../lib/format.js'
import Cover from './Cover.jsx'
import Waveform from './Waveform.jsx'
import { Play, Pause, Next, Prev, Volume, Download } from './Icons.jsx'
import styles from './PlayerDock.module.css'

function Time() {
  const time = usePlayer((s) => s.time)
  return <span className={`mono ${styles.time}`}>{fmtTime(time)}</span>
}

export default function PlayerDock({ onRequest }) {
  const beat = usePlayer((s) => s.current)
  const playing = usePlayer((s) => s.playing)
  const loading = usePlayer((s) => s.loading)
  const duration = usePlayer((s) => s.duration)
  const volume = usePlayer((s) => s.volume)
  const progress = useProgress(beat?.slug)

  useEffect(() => {
    document.documentElement.style.setProperty('--dock-space', beat ? '112px' : '0px')
  }, [beat])

  if (!beat) return null

  return (
    <div className={`${styles.dock} no-print`} role="region" aria-label="Lecteur">
      <div className={styles.panel}>
        <div className={styles.track}>
          <Cover beat={beat} size={48} radius={10} className={styles.cover} />
          <div className={styles.info}>
            <b>{beat.title}</b>
            <span className="mono">{[beat.bpm && `${beat.bpm} BPM`, beat.key, ...beat.tags].filter(Boolean).join(' · ')}</span>
          </div>
        </div>

        <div className={styles.controls}>
          <button className={styles.icon} onClick={() => player.prev()} aria-label="Précédente"><Prev size={16} /></button>
          <button className={`${styles.play} ${loading ? styles.loading : ''}`} onClick={() => player.toggle()} aria-label={playing ? 'Pause' : 'Lecture'}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button className={styles.icon} onClick={() => player.next()} aria-label="Suivante"><Next size={16} /></button>
        </div>

        <div className={styles.timeline}>
          <Time />
          <Waveform key={beat.slug} slug={beat.slug} progress={progress} onSeek={(r) => player.seekRatio(r)} height={36} bars={120} gap={0.4} active />
          <span className={`mono ${styles.time}`}>{fmtTime(duration)}</span>
        </div>

        <div className={styles.end}>
          <div className={styles.volume}>
            <button className={styles.icon} onClick={() => player.setVolume(volume > 0 ? 0 : 0.9)} aria-label={volume > 0 ? 'Couper le son' : 'Remettre le son'}>
              <Volume size={16} muted={volume === 0} />
            </button>
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => player.setVolume(Number(e.target.value))} aria-label="Volume" style={{ '--v': `${volume * 100}%` }} />
          </div>
          <button className="btn btn-sm" onClick={() => onRequest(beat)}>
            <Download size={15} /> <span className={styles.ctaLabel}>Recevoir</span>
          </button>
        </div>

        <div className={styles.mobileBar} aria-hidden="true"><i style={{ transform: `scaleX(${progress})` }} /></div>
      </div>
    </div>
  )
}
