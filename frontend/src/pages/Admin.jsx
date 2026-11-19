import { useCallback, useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import { api } from '../lib.jsx'
import { renderContract } from '../../../shared/contract.js'

const STATUS = {
  new: 'Nouvelle',
  link_sent: 'Lien envoyé',
  offers_sent: 'Licences envoyées',
  sold: 'Vendu',
  closed: 'Classé',
}

const store = {
  get: (k, d = '') => { try { return sessionStorage.getItem(k) ?? localStorage.getItem(k) ?? d } catch { return d } },
  setSession: (k, v) => { try { sessionStorage.setItem(k, v) } catch {} },
  setLocal: (k, v) => { try { localStorage.setItem(k, v) } catch {} },
  del: (k) => { try { sessionStorage.removeItem(k) } catch {} },
}

const fmtDate = (iso) => new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function Admin({ cfg }) {
  const [token, setToken] = useState(store.get('bs_admin'))
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [status, setStatus] = useState(null)
  const [data, setData] = useState({ requests: [], links: {} })
  const [beats, setBeats] = useState([])
  const [tab, setTab] = useState('requests')
  const [filter, setFilter] = useState('open')
  const [prefill, setPrefill] = useState(null)

  const load = useCallback(async (t = token) => {
    if (!t) return
    try {
      const [s, d, b] = await Promise.all([
        api('/api/admin/status', { token: t }),
        api('/api/admin/requests', { token: t }),
        api('/api/admin/beats', { token: t }),
      ])
      setStatus(s); setData(d); setBeats(b); setErr('')
    } catch (e) {
      if (e.status === 401) { store.del('bs_admin'); setToken('') }
      setErr(e.message)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  if (!token) {
    return (
      <main className="admin">
        <div className="wrap" style={{ maxWidth: 420 }}>
          <h1>Admin</h1>
          <form onSubmit={(e) => { e.preventDefault(); store.setSession('bs_admin', pwd); setToken(pwd) }}>
            <div className="field">
              <label htmlFor="pwd">Mot de passe</label>
              <input id="pwd" className="input" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoFocus />
            </div>
            {err && <div className="error">{err}</div>}
            <button className="btn" style={{ marginTop: 14 }}>Entrer</button>
          </form>
        </div>
      </main>
    )
  }

  const reqs = data.requests.filter((r) => (filter === 'open' ? !['sold', 'closed'].includes(r.status) : filter === 'all' ? true : r.status === filter))
  const counts = data.requests.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {})

  return (
    <main className="admin">
      <div className="wrap">
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1>Admin</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost sm" onClick={() => load()}>Rafraîchir</button>
            <button className="btn ghost sm" onClick={() => { store.del('bs_admin'); setToken('') }}>Déconnexion</button>
          </div>
        </div>

        {status && (
          <div className="no-print">
            {!status.mailReady && <div className="alert">SMTP non configuré : les e-mails ne partent pas (ils s'affichent dans les logs du serveur).</div>}
            {!status.producerEmail && <div className="alert">PRODUCER_EMAIL non défini : tu ne reçois pas les notifications de demande.</div>}
            {status.storageBackend === 'local' && <div className="alert">Les demandes sont stockées sur le disque du serveur. Sur un hébergeur gratuit elles peuvent disparaître à chaque redéploiement : configure Dropbox pour les garder.</div>}
          </div>
        )}
        {err && <div className="error no-print">{err}</div>}

        <div className="tabs no-print">
          <button className={`chip ${tab === 'requests' ? 'on' : ''}`} onClick={() => setTab('requests')}>Demandes ({(counts.new || 0)} nouvelles)</button>
          <button className={`chip ${tab === 'contract' ? 'on' : ''}`} onClick={() => setTab('contract')}>Générer un contrat</button>
          <button className={`chip ${tab === 'links' ? 'on' : ''}`} onClick={() => setTab('links')}>Liens auto ({Object.keys(data.links).length})</button>
        </div>

        {tab === 'requests' && (
          <>
            <div className="filters">
              {[['open', 'À traiter'], ['new', 'Nouvelles'], ['link_sent', 'Lien envoyé'], ['offers_sent', 'Licences envoyées'], ['sold', 'Vendues'], ['all', 'Tout']].map(([k, label]) => (
                <button key={k} className={`chip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{label}</button>
              ))}
            </div>
            {reqs.map((r) => (
              <RequestCard
                key={r.id}
                r={r}
                token={token}
                cfg={cfg}
                beat={beats.find((b) => b.slug === r.beat)}
                autoLink={data.links[r.beat]}
                onChange={() => load()}
                onContract={() => { setPrefill(r); setTab('contract') }}
              />
            ))}
            {!reqs.length && <div className="empty">Rien ici pour l'instant.</div>}
          </>
        )}

        {tab === 'contract' && <ContractGen cfg={cfg} status={status} beats={beats} prefill={prefill} />}

        {tab === 'links' && (
          <div>
            <p className="sub" style={{ marginBottom: 14 }}>
              Quand tu envoies un lien WeTransfer en cochant « réutiliser », les demandes suivantes pour la même prod le reçoivent automatiquement jusqu'à la date indiquée.
            </p>
            {Object.entries(data.links).map(([slug, l]) => (
              <div key={slug} className="req" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <b>{beats.find((b) => b.slug === slug)?.title || slug}</b>
                  <div className="who">{l.url}<br />jusqu'au {fmtDate(l.expiresAt)} {new Date(l.expiresAt) < new Date() && <span className="st closed">expiré</span>}</div>
                </div>
                <button className="btn danger sm" onClick={async () => { await api(`/api/admin/links/${slug}`, { method: 'DELETE', token }); load() }}>Supprimer</button>
              </div>
            ))}
            {!Object.keys(data.links).length && <div className="empty">Aucun lien réutilisable.</div>}
          </div>
        )}
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
function RequestCard({ r, token, cfg, beat, autoLink, onChange, onContract }) {
  const [url, setUrl] = useState('')
  const [reuse, setReuse] = useState('0')
  const [showOffers, setShowOffers] = useState(false)
  const [message, setMessage] = useState('')
  const [excl, setExcl] = useState(beat?.exclusivePrice || '')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  const act = async (key, path, body) => {
    setBusy(key); setMsg('')
    try {
      await api(`/api/admin/requests/${r.id}/${path}`, { method: 'POST', token, body })
      setMsg('✓ Fait')
      onChange()
    } catch (e) {
      setMsg(e.message)
    } finally {
      setBusy('')
    }
  }
  const usage = cfg?.usages?.[r.usage]

  return (
    <div className="req">
      <div className="req-head">
        <div>
          <b>{r.beatTitle}</b> <span className={`st ${r.status}`}>{STATUS[r.status]}</span>
        </div>
        <small style={{ color: 'var(--muted)' }}>{fmtDate(r.createdAt)}</small>
      </div>
      <div className="who">
        <a href={`mailto:${r.email}?subject=${encodeURIComponent(r.beatTitle)}`}>{r.email}</a>
        {(r.name || r.artist) && <> · {[r.name, r.artist && `« ${r.artist} »`].filter(Boolean).join(' ')}</>}
        {usage && <> · {usage}</>}
      </div>
      {r.message && <div className="msg">{r.message}</div>}

      <div className="acts">
        <input className="input" placeholder="Colle le lien WeTransfer…" value={url} onChange={(e) => setUrl(e.target.value)} />
        <select className="input" value={reuse} onChange={(e) => setReuse(e.target.value)} title="Envoyer automatiquement ce lien aux prochaines demandes pour cette prod">
          <option value="0">Pour cette demande</option>
          <option value="3">+ réutiliser 3 jours</option>
          <option value="7">+ réutiliser 7 jours</option>
        </select>
        <button className="btn sm" disabled={!url || busy} onClick={() => act('link', 'send-link', { url, reuseDays: Number(reuse) })}>
          {busy === 'link' ? 'Envoi…' : 'Envoyer le lien'}
        </button>
      </div>
      {autoLink && new Date(autoLink.expiresAt) > new Date() && !url && (
        <div className="hist">Lien réutilisable actif pour cette prod : <button className="btn ghost sm" onClick={() => setUrl(autoLink.url)}>l'utiliser</button></div>
      )}

      <div className="acts">
        <button className="btn ghost sm" onClick={() => setShowOffers(!showOffers)}>Envoyer les licences…</button>
        <button className="btn ghost sm" onClick={onContract}>Générer le contrat</button>
        <select
          className="input"
          value={r.status}
          onChange={(e) => act('status', 'status', { status: e.target.value })}
          aria-label="Statut"
        >
          {Object.entries(STATUS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        {msg && <small style={{ color: msg.startsWith('✓') ? 'var(--ok)' : 'var(--danger)' }}>{msg}</small>}
      </div>

      {showOffers && (
        <div style={{ marginTop: 10 }}>
          <div className="row2">
            <div className="field" style={{ marginTop: 0 }}>
              <label>Prix de l'exclu pour cette prod (€)</label>
              <input className="input" type="number" min="300" max="2000" value={excl} onChange={(e) => setExcl(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Message perso en intro (facultatif)</label>
            <textarea className="input" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Si « ${r.beatTitle} » te plaît, voici comment l'utiliser pour de vrai…`} />
          </div>
          <button className="btn sm" style={{ marginTop: 10 }} disabled={!!busy} onClick={() => act('offers', 'send-offers', { message, exclusivePrice: Number(excl) || null })}>
            {busy === 'offers' ? 'Envoi…' : 'Envoyer la grille des licences'}
          </button>
        </div>
      )}

      {r.history?.length > 0 && (
        <div className="hist">
          {r.history.map((h, i) => (
            <span key={i}>{i > 0 && ' · '}{fmtDate(h.at)} {h.action === 'link_sent' ? `lien envoyé${h.auto ? ' (auto)' : ''}` : h.action === 'offers_sent' ? 'licences envoyées' : h.action.replace('status:', '→ ')}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
function ContractGen({ cfg, status, beats, prefill }) {
  const lic = cfg?.licenses?.licenses || []
  const site = status?.site || cfg?.site || {}
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const [id, setId] = useState('wav')
  const [f, setF] = useState(() => ({
    beat: '',
    date: today,
    paymentMethod: status?.paymentInfo || '',
    producerEmail: store.get('bs_producerEmail'),
    producerAddress: store.get('bs_producerAddress', site.legal?.address || ''),
    city: store.get('bs_city', site.legal?.city || ''),
    licenseeName: '', licenseeArtist: '', licenseeAddress: '', licenseeEmail: '',
    price: '', priorLicenses: '0', masterRoyalty: '0',
    syncProject: '', syncMedia: '', syncTerritory: 'Monde entier', syncDuration: '',
  }))
  const license = lic.find((l) => l.id === id) || lic[0]

  useEffect(() => {
    if (!prefill) return
    setF((x) => ({ ...x, beat: prefill.beatTitle, licenseeEmail: prefill.email, licenseeArtist: prefill.artist || '', licenseeName: prefill.name || '' }))
    if (prefill.usage === 'exclu') setId('exclusive')
    if (prefill.usage === 'sync') setId('sync')
  }, [prefill])

  const set = (k) => (e) => {
    const val = e.target.value
    setF((x) => ({ ...x, [k]: val }))
    if (['producerEmail', 'producerAddress', 'city'].includes(k)) store.setLocal(`bs_${k}`, val)
  }

  const beat = beats.find((b) => b.title === f.beat)
  const defaultPrice = license?.exclusive ? beat?.exclusivePrice || license.price : license?.price
  const fields = { ...f, price: f.price || defaultPrice }
  const md = useMemo(() => (license ? renderContract(license, fields, site) : ''), [license, JSON.stringify(fields), site])
  const html = useMemo(() => marked.parse(md), [md])
  if (!license) return null

  const input = (k, label, props = {}) => (
    <div className="field">
      <label>{label}</label>
      <input className="input" value={f[k]} onChange={set(k)} {...props} />
    </div>
  )

  return (
    <div className="gen">
      <div className="form no-print">
        <div className="field" style={{ marginTop: 0 }}>
          <label>Licence</label>
          <select className="input" value={id} onChange={(e) => { setId(e.target.value); setF((x) => ({ ...x, price: '' })) }}>
            {lic.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.priceLabel}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Prod</label>
          <input className="input" list="beat-titles" value={f.beat} onChange={set('beat')} />
          <datalist id="beat-titles">{beats.map((b) => <option key={b.slug} value={b.title} />)}</datalist>
        </div>
        {input('price', `Prix (€), par défaut ${defaultPrice}`, { type: 'number', placeholder: String(defaultPrice) })}
        {input('paymentMethod', 'Moyen de paiement')}
        {input('date', 'Date')}
        <h4 style={{ margin: '18px 0 0' }}>Acheteur</h4>
        {input('licenseeName', 'Nom et prénom (ou société)')}
        {input('licenseeArtist', 'Nom d\'artiste')}
        {input('licenseeAddress', 'Adresse')}
        {input('licenseeEmail', 'E-mail')}
        {license.exclusive && (
          <>
            <h4 style={{ margin: '18px 0 0' }}>Exclusivité</h4>
            {input('priorLicenses', 'Licences déjà vendues sur cette prod', { type: 'number', min: 0 })}
            {input('masterRoyalty', 'Royalties sur le master (%)', { type: 'number', min: 0, max: 50 })}
          </>
        )}
        {license.sync && (
          <>
            <h4 style={{ margin: '18px 0 0' }}>Projet</h4>
            {input('syncProject', 'Description (ex : pub Instagram pour la marque X, 30 s)')}
            {input('syncMedia', 'Médias (ex : Instagram, TikTok, YouTube)')}
            {input('syncTerritory', 'Territoire')}
            {input('syncDuration', 'Durée (ex : 1 an, ou illimitée)')}
          </>
        )}
        <h4 style={{ margin: '18px 0 0' }}>Toi (mémorisé sur cet appareil)</h4>
        {input('producerEmail', 'Ton e-mail')}
        {input('producerAddress', 'Ton adresse')}
        {input('city', 'Ville de signature')}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => window.print()}>Imprimer / PDF</button>
          <button className="btn ghost" onClick={() => navigator.clipboard?.writeText(md)}>Copier le texte</button>
        </div>
        <p className="hist">« Imprimer » puis « Enregistrer en PDF », et envoie-le à signer (Yousign, Docusign, ou signature à la main).</p>
      </div>
      <div className="paper doc" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
