import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import { Link } from '../lib/router.jsx'
import Cover from './Cover.jsx'
import { Close, Check, Plus, Mail } from './Icons.jsx'
import styles from './RequestSheet.module.css'

const EMPTY = { email: '', name: '', artist: '', usage: '', message: '', consent: false, website: '' }

/** Fenêtre « Recevoir la prod » (<dialog> natif : focus piégé, Échap pour fermer). */
export default function RequestSheet({ beat, usages, site, onClose }) {
  const ref = useRef(null)
  const [form, setForm] = useState(EMPTY)
  const [showMsg, setShowMsg] = useState(false)
  const [status, setStatus] = useState({ sending: false, error: '', done: null })

  useEffect(() => {
    const d = ref.current
    d.showModal()
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = '' }
  }, [])

  const close = () => {
    const d = ref.current
    d.classList.add(styles.closing)
    setTimeout(onClose, 220)
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setStatus({ sending: true, error: '', done: null })
    try {
      const res = await api('/api/requests', { method: 'POST', body: { ...form, beat: beat.slug } })
      setStatus({ sending: false, error: '', done: res })
    } catch (err) {
      setStatus({ sending: false, error: err.message, done: null })
    }
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="req-title"
      onCancel={(e) => { e.preventDefault(); close() }}
      onClick={(e) => e.target === ref.current && close()}
    >
      <div className={styles.sheet}>
        <span className={styles.grabber} aria-hidden="true" />
        <button className={styles.close} onClick={close} aria-label="Fermer"><Close size={18} /></button>

        <div className={styles.beat}>
          <Cover beat={beat} size={64} radius={12} />
          <div>
            <span className="eyebrow">Recevoir la prod</span>
            <h2 id="req-title" className={styles.title}>{beat.title}</h2>
            <span className="mono muted">{[beat.bpm && `${beat.bpm} BPM`, beat.key, ...beat.tags].filter(Boolean).join(' · ')}</span>
          </div>
        </div>

        {status.done ? (
          <div className={styles.done}>
            <div className={styles.checkmark}><Check size={30} /></div>
            <h3>C'est parti.</h3>
            <p className="muted">
              {status.done.autoSent
                ? <>Le lien de téléchargement vient d'arriver sur <b>{form.email}</b>. Les licences suivent.</>
                : <>Tu reçois la prod par WeTransfer sur <b>{form.email}</b> sous {site?.replyDelay || '24 h'}, puis les licences.</>}
            </p>
            <p className={styles.small}>Rien reçu ? Regarde dans tes spams.</p>
            <button className="btn btn-soft" onClick={close}>Continuer à écouter</button>
          </div>
        ) : (
          <form onSubmit={submit} className={styles.form} noValidate={false}>
            <p className={styles.lead}>Laisse ton e-mail : je t'envoie la prod par WeTransfer, puis les licences pour la sortir.</p>

            <div className={styles.emailField}>
              <Mail size={18} />
              <input
                className="input"
                type="email"
                required
                autoFocus
                autoComplete="email"
                inputMode="email"
                placeholder="ton@email.com"
                aria-label="E-mail"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>

            <div className={styles.row2}>
              <div>
                <label className="label" htmlFor="rq-name">Prénom</label>
                <input id="rq-name" className="input" autoComplete="given-name" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="rq-artist">Nom d'artiste</label>
                <input id="rq-artist" className="input" value={form.artist} onChange={(e) => set('artist', e.target.value)} />
              </div>
            </div>

            <fieldset className={styles.usage}>
              <legend className="label">C'est pour quoi ?</legend>
              <div className={styles.usageChips}>
                {Object.entries(usages || {}).map(([k, label]) => (
                  <button type="button" key={k} className="chip" aria-pressed={form.usage === k} onClick={() => set('usage', form.usage === k ? '' : k)}>
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            {showMsg ? (
              <div>
                <label className="label" htmlFor="rq-msg">Ton message</label>
                <textarea id="rq-msg" className="input" rows={3} maxLength={1000} autoFocus value={form.message} onChange={(e) => set('message', e.target.value)} />
              </div>
            ) : (
              <button type="button" className={styles.addMsg} onClick={() => setShowMsg(true)}><Plus size={14} /> Ajouter un message</button>
            )}

            <div className={styles.hp} aria-hidden="true">
              <label>Ne pas remplir <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} /></label>
            </div>

            <label className={styles.consent}>
              <input type="checkbox" required checked={form.consent} onChange={(e) => set('consent', e.target.checked)} />
              <span>J'accepte que mon e-mail serve à m'envoyer cette prod et les offres de licence. <Link to="/mentions" onClick={close}>Confidentialité</Link></span>
            </label>

            {status.error && <div className={styles.error} role="alert">{status.error}</div>}

            <button className="btn btn-lg btn-block" type="submit" disabled={status.sending}>
              {status.sending ? 'Envoi…' : 'Recevoir la prod'}
            </button>
          </form>
        )}
      </div>
    </dialog>
  )
}
