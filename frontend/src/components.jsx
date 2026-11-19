import { useEffect, useRef, useState } from 'react'
import { api, fmtTime, fmtNum, Link, usePath } from './lib.jsx'

export const PlayIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" /></svg>
)
export const PauseIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx="1.2" /><rect x="14" y="4" width="5" height="16" rx="1.2" /></svg>
)

// ---------------------------------------------------------------------------
export function Header({ site }) {
  const path = usePath()
  return (
    <header className="topbar">
      <div className="wrap">
        <Link to="/" className="logo">{site?.brand || 'BEATSTORE'}</Link>
        <nav className="nav">
          <Link to="/#prods" className={path === '/' ? 'active' : ''}>Prods</Link>
          <Link to="/licences" className={path === '/licences' ? 'active' : ''}>Licences</Link>
          <Link to="/#contact" className="hide-sm">Contact</Link>
        </nav>
      </div>
    </header>
  )
}

export function Footer({ site }) {
  return (
    <footer className="foot">
      <div className="wrap">
        <span>© {new Date().getFullYear()} {site?.producerName}. Toutes les prods sont protégées.</span>
        <span>
          <Link to="/licences">Licences</Link> · <Link to="/mentions">Mentions légales & confidentialité</Link>
        </span>
      </div>
    </footer>
  )
}

// ---------------------------------------------------------------------------
export function Cover({ beat }) {
  const [broken, setBroken] = useState(false)
  if (beat.cover && !broken) return <img src={beat.cover} alt="" loading="lazy" onError={() => setBroken(true)} draggable="false" />
  return <span className="ph">{beat.title.slice(0, 1)}</span>
}

export function BeatList({ beats, current, playing, onPlay, onRequest, showPrices, minPrice }) {
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const tags = [...new Set(beats.flatMap((b) => b.tags))].sort()
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const list = beats
    .filter((b) => !tag || b.tags.includes(tag))
    .filter((b) => words.every((w) => [b.title, b.key, String(b.bpm || ''), ...b.tags].join(' ').toLowerCase().includes(w)))
    .sort((a, b) => Number(b.featured) - Number(a.featured))

  return (
    <>
      <div className="filters">
        <input className="search" placeholder="Chercher un titre, un BPM, une tonalité…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher" />
        {tags.length > 1 && (
          <>
            <button className={`chip ${!tag ? 'on' : ''}`} onClick={() => setTag('')}>Tout</button>
            {tags.map((t) => (
              <button key={t} className={`chip ${tag === t ? 'on' : ''}`} onClick={() => setTag(tag === t ? '' : t)}>{t}</button>
            ))}
          </>
        )}
      </div>
      <div className="beats">
        {list.map((b) => {
          const isCur = current?.slug === b.slug
          return (
            <div key={b.slug} className={`beat ${isCur ? 'current' : ''}`}>
              <button className="cover" onClick={() => onPlay(b)} aria-label={isCur && playing ? `Pause ${b.title}` : `Écouter ${b.title}`}>
                <Cover beat={b} />
                <span className="ov">{isCur && playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}</span>
              </button>
              <div style={{ minWidth: 0, cursor: 'pointer' }} onClick={() => onPlay(b)}>
                <div className="title">{b.title} {b.featured && <span className="badge" style={{ marginLeft: 6 }}>Nouveau</span>}</div>
                <div className="meta">
                  {b.bpm && <span>{b.bpm} BPM</span>}
                  {b.key && <span>{b.key}</span>}
                  {b.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
              <div className="actions">
                {showPrices && minPrice && <span className="price">dès {minPrice} €</span>}
                <button className="btn" onClick={() => onRequest(b)}>
                  <span className="long">Recevoir la prod</span>
                  <span className="short">Recevoir</span>
                </button>
              </div>
            </div>
          )
        })}
        {!list.length && <div className="empty">{beats.length ? 'Aucune prod ne correspond.' : 'Les prods arrivent très bientôt.'}</div>}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
export function Player({ beat, playing, time, duration, onToggle, onSeek, onRequest }) {
  const seekRef = useRef(null)
  if (!beat) return null
  const pct = duration ? (time / duration) * 100 : 0
  const seek = (e) => {
    const r = seekRef.current.getBoundingClientRect()
    onSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration)
  }
  return (
    <div className="player" onContextMenu={(e) => e.preventDefault()}>
      <div className="wrap">
        {beat.cover ? <img className="cov" src={beat.cover} alt="" draggable="false" /> : <div className="cov" />}
        <div className="info">
          <b>{beat.title}</b>
          <small>{[beat.bpm && `${beat.bpm} BPM`, beat.key].filter(Boolean).join(' · ')}</small>
        </div>
        <button className="icon-btn" onClick={onToggle} aria-label={playing ? 'Pause' : 'Lecture'}>
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className="bar">
          <span className="t">{fmtTime(time)}</span>
          <div className="seek" ref={seekRef} onClick={seek} role="slider" aria-label="Position" aria-valuemin={0} aria-valuemax={Math.round(duration) || 0} aria-valuenow={Math.round(time)}>
            <div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div>
          </div>
          <span className="t">{fmtTime(duration)}</span>
        </div>
        <button className="btn" onClick={() => onRequest(beat)}>Recevoir</button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
export function RequestModal({ beat, usages, site, onClose }) {
  const [form, setForm] = useState({ email: '', name: '', artist: '', usage: '', message: '', consent: false, website: '' })
  const [state, setState] = useState({ sending: false, error: '', done: null })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e) => {
    e.preventDefault()
    setState({ sending: true, error: '', done: null })
    try {
      const res = await api('/api/requests', { method: 'POST', body: { ...form, beat: beat.slug } })
      setState({ sending: false, error: '', done: res })
    } catch (err) {
      setState({ sending: false, error: err.message, done: null })
    }
  }

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="req-title">
        <button className="close" onClick={onClose} aria-label="Fermer">×</button>
        {state.done ? (
          <div className="success">
            <div className="big">📩</div>
            <h3>C'est envoyé</h3>
            <p style={{ color: 'var(--muted)' }}>
              {state.done.autoSent
                ? <>Le lien de « {beat.title} » vient de partir sur <b>{form.email}</b>. Les licences suivent.</>
                : <>Tu reçois « {beat.title} » par WeTransfer sur <b>{form.email}</b> sous {site?.replyDelay || '24 h'}, puis les options de licence.</>}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Pense à regarder dans tes spams.</p>
            <button className="btn ghost" onClick={onClose}>Continuer à écouter</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h3 id="req-title">Recevoir « {beat.title} »</h3>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14 }}>Laisse ton e-mail : je t'envoie la prod par WeTransfer, puis les licences pour la sortir.</p>
            <div className="field">
              <label htmlFor="f-email">E-mail *</label>
              <input id="f-email" className="input" type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="toi@exemple.com" />
            </div>
            <div className="row2">
              <div className="field">
                <label htmlFor="f-name">Prénom</label>
                <input id="f-name" className="input" autoComplete="given-name" value={form.name} onChange={set('name')} />
              </div>
              <div className="field">
                <label htmlFor="f-artist">Nom d'artiste</label>
                <input id="f-artist" className="input" value={form.artist} onChange={set('artist')} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="f-usage">C'est pour quoi ?</label>
              <select id="f-usage" className="input" value={form.usage} onChange={set('usage')}>
                <option value="">Choisir (facultatif)</option>
                {Object.entries(usages || {}).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-msg">Un mot ? (facultatif)</label>
              <textarea id="f-msg" className="input" rows={2} value={form.message} onChange={set('message')} maxLength={1000} />
            </div>
            <div className="hp" aria-hidden="true">
              <label>Ne pas remplir <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label>
            </div>
            <label className="check">
              <input type="checkbox" checked={form.consent} onChange={set('consent')} required />
              <span>J'accepte que mon e-mail serve à m'envoyer cette prod et les offres de licence qui vont avec. <Link to="/mentions">Confidentialité</Link></span>
            </label>
            {state.error && <div className="error">{state.error}</div>}
            <button className="btn" type="submit" disabled={state.sending} style={{ width: '100%', marginTop: 18, padding: '13px 16px' }}>
              {state.sending ? 'Envoi…' : 'Recevoir la prod'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
export function licenseBullets(l) {
  const x = l.limits
  if (l.sync) {
    return [
      ['Pub, film, YouTube, podcast, jeu', true],
      ['Prix selon la diffusion et la durée', true],
      ['Fichier WAV', true],
      ['Chanson avec voix sur la prod', false],
    ]
  }
  return [
    [x.streams === null ? 'Streams illimités' : `${fmtNum(x.streams)} streams`, true],
    [x.videos === null ? 'Clips illimités' : `${x.videos} clip${x.videos > 1 ? 's' : ''} vidéo`, true],
    [x.sales === null ? 'Ventes illimitées' : `${fmtNum(x.sales)} ventes (CD, vinyle, téléchargement)`, true],
    ['Concerts et showcases', x.live],
    ['Radio et TV', x.radio],
    ['Pistes séparées (stems)', x.stems],
    ...(l.exclusive ? [['Synchro et Content ID', true], ['Prod retirée du catalogue', true]] : []),
  ]
}

export function LicenseCards({ licenses, showPrices, exclusivePrice }) {
  return (
    <div className="lic-grid">
      {licenses.licenses.map((l) => (
        <div key={l.id} className={`lic ${l.id === 'premium' ? 'hl' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
            <h3>{l.name}</h3>
            {l.id === 'premium' && <span className="badge">Le plus pris</span>}
          </div>
          {showPrices && l.priceLabel && <div className="p">{l.exclusive && exclusivePrice ? `${exclusivePrice} €` : l.priceLabel}</div>}
          <p className="pitch">{l.pitch}</p>
          <ul>
            {licenseBullets(l).map(([label, ok]) => <li key={label} className={ok ? '' : 'no'}>{label}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}
