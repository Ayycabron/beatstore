import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api.js'
import RequestCard from './RequestCard.jsx'
import ContractGen from './ContractGen.jsx'
import { STATUS, fmtDate, storage } from './shared.js'
import s from './admin.module.css'

const FILTERS = [['open', 'À traiter'], ['new', STATUS.new], ['link_sent', STATUS.link_sent], ['offers_sent', STATUS.offers_sent], ['sold', 'Vendues'], ['all', 'Tout']]

export default function Admin({ cfg }) {
  const [token, setToken] = useState(storage.get('bs_admin'))
  const [status, setStatus] = useState(null)
  const [data, setData] = useState({ requests: [], links: {} })
  const [beats, setBeats] = useState([])
  const [error, setError] = useState('')
  const [tab, setTab] = useState('requests')
  const [filter, setFilter] = useState('open')
  const [prefill, setPrefill] = useState(null)

  const logout = () => { storage.session('bs_admin', null); setToken('') }

  const load = useCallback(async () => {
    if (!token) return
    try {
      const [st, d, b] = await Promise.all([
        api('/api/admin/status', { token }),
        api('/api/admin/requests', { token }),
        api('/api/admin/beats', { token }),
      ])
      setStatus(st); setData(d); setBeats(b); setError('')
    } catch (e) {
      if (e.status === 401) logout()
      setError(e.message)
    }
  }, [token])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!token) return
    const id = setInterval(load, 60_000) // nouvelles demandes sans recharger
    return () => clearInterval(id)
  }, [token, load])

  if (!token) return <Login error={error} onLogin={(pwd) => { storage.session('bs_admin', pwd); setToken(pwd) }} />

  const counts = data.requests.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {})
  const visible = data.requests.filter((r) => (filter === 'open' ? !['sold', 'closed'].includes(r.status) : filter === 'all' || r.status === filter))
  const sold = counts.sold || 0

  return (
    <main className={`container ${s.admin}`}>
      <header className={`${s.head} no-print`}>
        <div>
          <span className="eyebrow">Espace producteur</span>
          <h1 className="display">Admin</h1>
        </div>
        <div className={s.headActions}>
          <button className="btn btn-ghost btn-sm" onClick={load}>Rafraîchir</button>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <div className={`${s.kpis} no-print`}>
        <div><span>Nouvelles</span><b>{counts.new || 0}</b></div>
        <div><span>En cours</span><b>{(counts.link_sent || 0) + (counts.offers_sent || 0)}</b></div>
        <div><span>Vendues</span><b>{sold}</b></div>
        <div><span>Prods en ligne</span><b>{beats.filter((b) => !b.sold).length}</b></div>
      </div>

      {status && (
        <div className="no-print">
          {!status.mailReady && <div className={s.alert}>SMTP non configuré : les e-mails ne partent pas (ils s'affichent dans les logs du serveur).</div>}
          {!status.producerEmail && <div className={s.alert}>PRODUCER_EMAIL non défini : tu ne reçois pas les notifications de demande.</div>}
          {status.storageBackend === 'local' && <div className={s.alert}>Demandes stockées sur le disque du serveur : sur un hébergeur gratuit elles peuvent disparaître au redéploiement. Configure Dropbox pour les garder.</div>}
        </div>
      )}
      {error && <div className={`${s.alert} ${s.alertError}`}>{error}</div>}

      <div className={`${s.tabs} no-print`} role="tablist">
        {[['requests', `Demandes`, counts.new], ['contract', 'Contrat', null], ['links', 'Liens auto', Object.keys(data.links).length]].map(([k, label, n]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={s.tab} onClick={() => setTab(k)}>
            {label}{n ? <span className={s.badge}>{n}</span> : null}
          </button>
        ))}
      </div>

      {tab === 'requests' && (
        <>
          <div className={`${s.filters} no-print`}>
            {FILTERS.map(([k, label]) => <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>)}
          </div>
          <div className={s.list}>
            {visible.map((r) => (
              <RequestCard
                key={r.id}
                r={r}
                token={token}
                usages={cfg?.usages}
                beat={beats.find((b) => b.slug === r.beat)}
                autoLink={data.links[r.beat]}
                onChange={load}
                onContract={() => { setPrefill(r); setTab('contract') }}
              />
            ))}
            {!visible.length && <div className={s.empty}>Rien à traiter. Les nouvelles demandes apparaissent ici.</div>}
          </div>
        </>
      )}

      {tab === 'contract' && <ContractGen cfg={cfg} status={status} beats={beats} prefill={prefill} />}

      {tab === 'links' && (
        <div className={s.list}>
          <p className="muted" style={{ margin: '0 0 8px' }}>
            En envoyant un lien avec « réutiliser », les demandes suivantes pour la même prod le reçoivent automatiquement jusqu'à la date indiquée.
          </p>
          {Object.entries(data.links).map(([slug, l]) => {
            const expired = new Date(l.expiresAt) < new Date()
            return (
              <div key={slug} className={s.card} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <b>{beats.find((b) => b.slug === slug)?.title || slug}</b>
                  <div className={s.meta}>{l.url}</div>
                  <div className={s.meta}>{expired ? 'Expiré le' : 'Jusqu\'au'} {fmtDate(l.expiresAt)}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={async () => { await api(`/api/admin/links/${slug}`, { method: 'DELETE', token }); load() }}>Supprimer</button>
              </div>
            )
          })}
          {!Object.keys(data.links).length && <div className={s.empty}>Aucun lien réutilisable.</div>}
        </div>
      )}
    </main>
  )
}

function Login({ onLogin, error }) {
  const [pwd, setPwd] = useState('')
  return (
    <main className={`container ${s.login}`}>
      <form className={s.loginCard} onSubmit={(e) => { e.preventDefault(); onLogin(pwd) }}>
        <span className="eyebrow">Espace producteur</span>
        <h1 className="display">Admin</h1>
        <label className="label" htmlFor="pwd">Mot de passe</label>
        <input id="pwd" className="input" type="password" autoComplete="current-password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoFocus />
        {error && <div className={`${s.alert} ${s.alertError}`}>{error}</div>}
        <button className="btn btn-block" disabled={!pwd}>Entrer</button>
      </form>
    </main>
  )
}
