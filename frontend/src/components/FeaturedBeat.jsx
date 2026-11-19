import { player, useIsPlaying, useProgress, usePlayer } from '../player/store.js'
import { fmtTime } from '../lib/format.js'
import { usePeaks } from '../player/peaks.js'
import Cover from './Cover.jsx'
import Waveform from './Waveform.jsx'
import Equalizer from './Equalizer.jsx'
import { Play, Pause, Download } from './Icons.jsx'
import styles from './FeaturedBeat.module.css'

/** Grande carte « dernière prod » du hero. */
export default function FeaturedBeat({ beat, onRequest }) {
  const playing = useIsPlaying(beat.slug)
  const progress = useProgress(beat.slug)
  const current = usePlayer((s) => s.current?.slug === beat.slug)
  const duration = usePeaks(beat.slug)?.duration || beat.duration
  const time = usePlayer((s) => (s.current?.slug === beat.slug ? s.time : 0))

  return (
    <article className={styles.card}>
      <div className={styles.art}>
        <Cover beat={beat} radius={18} className={styles.cover} />
        <div className={styles.glow} aria-hidden="true"><Cover beat={beat} radius={18} /></div>
        <button className={styles.play} onClick={() => player.play(beat)} aria-label={playing ? 'Pause' : `Écouter ${beat.title}`}>
          {playing ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <span className={styles.badge}>{playing ? <><Equalizer /> En lecture</> : beat.featured ? 'Nouvelle prod' : 'Dernière prod'}</span>
      </div>
      <div className={styles.body}>
        <div className={styles.head}>
          <div style={{ minWidth: 0 }}>
            <h3>{beat.title}</h3>
            <span className="mono muted">{[beat.bpm && `${beat.bpm} BPM`, beat.key, ...beat.tags].filter(Boolean).join(' · ')}</span>
          </div>
          <button className="btn btn-sm" onClick={() => onRequest(beat)}><Download size={15} /> Recevoir</button>
        </div>
        <Waveform slug={beat.slug} progress={progress} onSeek={(r) => player.play(beat, r)} height={44} bars={72} gap={0.45} active={current} />
        <div className={`mono ${styles.times}`}><span>{fmtTime(time)}</span><span>{duration ? fmtTime(duration) : ''}</span></div>
      </div>
    </article>
  )
}
