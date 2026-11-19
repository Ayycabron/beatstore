import { useState } from 'react'
import { api } from '../../lib/api.js'
import Cover from '../../components/Cover.jsx'
import { STATUS, fmtDate } from './shared.js'
import s from './admin.module.css'

const historyLabel = (h) =>
  h.action === 'link_sent' ? `lien envoyé${h.auto ? ' (auto)' : ''}` : h.action === 'offers_sent' ? 'licences envoyées' : `→ ${STATUS[h.action.replace('status:', '')] || h.action}`

export default function RequestCard({ r, token, usages, beat, autoLink, onChange, onContract }) {
  const [url, setUrl] = useState('')
  const [reuse, setReuse] = useState('0')
  const [offersOpen, setOffersOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [excl, setExcl] = useState(beat?.exclusivePrice || '')
  const [busy, setBusy] = useState('')
  const [feedback, setFeedback] = useState(null)

  const act = async (key, path, body) => {
    setBusy(key); setFeedback(null)
    try {
      await api(`/api/admin/requests/${r.id}/${path}`, { method: 'POST', token, body })
      setFeedback({ ok: true, text: 'Envoyé' })
      if (key === 'link') setUrl('')
      if (key === 'offers') setOffersOpen(false)
      onChange()
    } catch (e) {
      setFeedback({ ok: false, text: e.message })
    } finally {
      setBusy('')
    }
  }
  const liveLink = autoLink && new Date(autoLink.expiresAt) > new Date() ? autoLink : null

  return (
    <article className={`${s.card} ${r.status === 'new' ? s.isNew : ''}`}>
      <div className={s.reqHead}>
        {beat ? <Cover beat={beat} size={44} radius={8} /> : <div className={s.coverPh} />}
        <div className={s.reqTitle}>
          <div className={s.reqLine}>
            <b>{r.beatTitle}</b>
            <span className={`${s.status} ${s[r.status]}`}>{STATUS[r.status]}</span>
          </div>
          <div className={s.meta}>
            <a href={`mailto:${r.email}?subject=${encodeURIComponent(r.beatTitle)}`}>{r.email}</a>
            {(r.name || r.artist) && <> · {[r.name, r.artist && `« ${r.artist} »`].filter(Boolean).join(' ')}</>}
            {usages?.[r.usage] && <> · {usages[r.usage]}</>}
          </div>
        </div>
        <time className={s.date} dateTime={r.createdAt}>{fmtDate(r.createdAt)}</time>
      </div>

      {r.message && <p className={s.msg}>{r.message}</p>}

      <div className={s.step}>
        <span className={s.stepLabel}>1 · Lien</span>
        <div className={s.inline}>
          <input className="input" placeholder="Colle le lien WeTransfer…" value={url} onChange={(e) => setUrl(e.target.value)} />
          <select className="input" value={reuse} onChange={(e) => setReuse(e.target.value)} title="Envoyer aussi ce lien automatiquement aux prochaines demandes pour cette prod">
            <option value="0">Cette demande</option>
            <option value="3">+ auto 3 jours</option>
            <option value="7">+ auto 7 jours</option>
          </select>
          <button className="btn btn-sm" disabled={!url || !!busy} onClick={() => act('link', 'send-link', { url, reuseDays: Number(reuse) })}>
            {busy === 'link' ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>
        {liveLink && !url && <button className={s.linkBtn} onClick={() => setUrl(liveLink.url)}>Utiliser le lien auto actif de cette prod</button>}
      </div>

      <div className={s.step}>
        <span className={s.stepLabel}>2 · Licences</span>
        <div className={s.inline}>
          <button className="btn btn-soft btn-sm" onClick={() => setOffersOpen(!offersOpen)}>{offersOpen ? 'Annuler' : 'Envoyer les licences…'}</button>
          <button className="btn btn-soft btn-sm" onClick={onContract}>Générer le contrat</button>
          <select className={`input ${s.statusSelect}`} value={r.status} onChange={(e) => act('status', 'status', { status: e.target.value })} aria-label="Statut">
            {Object.entries(STATUS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          {feedback && <small className={feedback.ok ? s.ok : s.err}>{feedback.ok ? '✓ ' : ''}{feedback.text}</small>}
        </div>
        {offersOpen && (
          <div className={s.offers}>
            <div>
              <label className="label">Prix de l'exclu (€)</label>
              <input className="input" type="number" min="300" max="2000" value={excl} onChange={(e) => setExcl(e.target.value)} />
            </div>
            <div>
              <label className="label">Message perso en intro (facultatif)</label>
              <textarea className="input" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Si « ${r.beatTitle} » te plaît, voici comment l'utiliser pour de vrai…`} />
            </div>
            <button className="btn btn-sm" disabled={!!busy} onClick={() => act('offers', 'send-offers', { message, exclusivePrice: Number(excl) || null })}>
              {busy === 'offers' ? 'Envoi…' : 'Envoyer la grille'}
            </button>
          </div>
        )}
      </div>

      {r.history?.length > 0 && (
        <ol className={s.history}>
          {r.history.map((h, i) => <li key={i}><time>{fmtDate(h.at)}</time> {historyLabel(h)}</li>)}
        </ol>
      )}
    </article>
  )
}
