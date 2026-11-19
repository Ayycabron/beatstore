import { memo, useEffect, useMemo, useState } from 'react'
import { player, useIsCurrent, useIsPlaying, usePlayer, useProgress } from '../player/store.js'
import { fmtTime } from '../lib/format.js'
import { usePeaks } from '../player/peaks.js'
import Cover from './Cover.jsx'
import Waveform from './Waveform.jsx'
import Equalizer from './Equalizer.jsx'
import { Play, Pause, Search, Download } from './Icons.jsx'
import styles from './Tracklist.module.css'

const SORTS = {
  recent: ['Récentes', (a, b) => Number(b.featured) - Number(a.featured)],
  bpmAsc: ['BPM ↑', (a, b) => (a.bpm || 0) - (b.bpm || 0)],
  bpmDesc: ['BPM ↓', (a, b) => (b.bpm || 0) - (a.bpm || 0)],
  title: ['A → Z', (a, b) => a.title.localeCompare(b.title)],
}

export default function Tracklist({ beats, onRequest }) {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [sort, setSort] = useState('recent')

  const tags = useMemo(() => {
    const counts = new Map()
    beats.forEach((b) => b.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)))
    return [...counts].sort((a, b) => b[1] - a[1])
  }, [beats])

  const list = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return beats
      .filter((b) => !tag || b.tags.includes(tag))
      .filter((b) => words.every((w) => [b.title, b.key, b.bpm, ...b.tags].join(' ').toLowerCase().includes(w)))
      .sort(SORTS[sort][1])
  }, [beats, query, tag, sort])

  // « Suivant » dans le lecteur suit l'ordre affiché
  useEffect(() => player.setQueue(list), [list])

  return (
    <div>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={16} />
          <span className="visually-hidden">Rechercher</span>
          <input type="search" placeholder="Titre, BPM, tonalité…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className={styles.chips} role="group" aria-label="Filtrer par style">
          <button className="chip" aria-pressed={!tag} onClick={() => setTag('')}>Tout <span className="count">{beats.length}</span></button>
          {tags.map(([t, n]) => (
            <button key={t} className="chip" aria-pressed={tag === t} onClick={() => setTag(tag === t ? '' : t)}>
              {t} <span className="count">{n}</span>
            </button>
          ))}
        </div>
        <select className={`input ${styles.sort}`} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Trier">
          {Object.entries(SORTS).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </div>

      <div className={styles.head} aria-hidden="true">
        <span>#</span><span /><span>Titre</span><span /><span>BPM</span><span>Ton.</span><span>Durée</span><span />
      </div>
      <ol className={styles.list}>
        {list.map((b, i) => <Row key={b.slug} beat={b} index={i} onRequest={onRequest} />)}
      </ol>
      {!list.length && (
        <div className={styles.empty}>
          {beats.length ? <>Rien pour « {query || tag} ». <button className="btn btn-ghost btn-sm" onClick={() => { setQuery(''); setTag('') }}>Tout afficher</button></> : 'Les prods arrivent très bientôt.'}
        </div>
      )}
    </div>
  )
}

const Row = memo(function Row({ beat, index, onRequest }) {
  const current = useIsCurrent(beat.slug)
  const playing = useIsPlaying(beat.slug)
  const progress = useProgress(beat.slug)
  const peaks = usePeaks(beat.slug, !beat.duration)
  const live = usePlayer((s) => (current ? s.duration : 0))
  const duration = live || beat.duration || peaks?.duration

  return (
    <li className={`${styles.row} ${current ? styles.current : ''}`} onClick={() => player.play(beat)}>
      <span className={styles.index}>
        {current && playing ? <Equalizer /> : <span className={styles.num}>{String(index + 1).padStart(2, '0')}</span>}
        <span className={styles.hoverIcon}>{current && playing ? <Pause size={14} /> : <Play size={14} />}</span>
      </span>
      <button className={styles.coverBtn} aria-label={current && playing ? `Mettre ${beat.title} en pause` : `Écouter ${beat.title}`} onClick={(e) => { e.stopPropagation(); player.play(beat) }}>
        <Cover beat={beat} size={52} radius={10}>
          <span className={styles.coverOverlay}>{current && playing ? <Pause size={18} /> : <Play size={18} />}</span>
        </Cover>
      </button>
      <div className={styles.titleCell}>
        <div className={styles.title}>
          {beat.title}
          {beat.featured && <span className="pill">New</span>}
        </div>
        <div className={styles.tags}>
          {beat.tags.map((t) => <span key={t}>{t}</span>)}
          <span className={styles.mobileMeta}>{[beat.bpm && `${beat.bpm} BPM`, beat.key].filter(Boolean).join(' · ')}</span>
        </div>
      </div>
      <div className={styles.waveCell}>
        <Waveform slug={beat.slug} progress={progress} active={current} onSeek={(r) => player.play(beat, r)} height={34} bars={90} />
      </div>
      <span className={`mono ${styles.meta}`}>{beat.bpm || '–'}</span>
      <span className={`mono ${styles.meta}`}>{beat.key || '–'}</span>
      <span className={`mono ${styles.meta}`}>{duration ? fmtTime(duration) : '–'}</span>
      <span className={styles.action}>
        <button className={`btn btn-sm ${styles.get}`} onClick={(e) => { e.stopPropagation(); onRequest(beat) }}>
          <Download size={15} /><span className={styles.getLabel}>Recevoir</span>
        </button>
      </span>
    </li>
  )
})
