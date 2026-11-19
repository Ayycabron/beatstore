import { useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import { renderContract } from '../../../../shared/contract.js'
import { storage } from './shared.js'
import s from './admin.module.css'

const REMEMBERED = ['producerEmail', 'producerAddress', 'city']

export default function ContractGen({ cfg, status, beats, prefill }) {
  const licenses = cfg?.licenses?.licenses || []
  const site = status?.site || cfg?.site || {}
  const [id, setId] = useState('wav')
  const [copied, setCopied] = useState(false)
  const [f, setF] = useState(() => ({
    beat: '',
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    paymentMethod: status?.paymentInfo || '',
    producerEmail: storage.get('bs_producerEmail'),
    producerAddress: storage.get('bs_producerAddress', site.legal?.address || ''),
    city: storage.get('bs_city', site.legal?.city || ''),
    licenseeName: '', licenseeArtist: '', licenseeAddress: '', licenseeEmail: '',
    price: '', priorLicenses: '0', masterRoyalty: '0',
    syncProject: '', syncMedia: '', syncTerritory: 'Monde entier', syncDuration: '',
  }))
  const license = licenses.find((l) => l.id === id) || licenses[0]

  useEffect(() => {
    if (!prefill) return
    setF((x) => ({ ...x, beat: prefill.beatTitle, licenseeEmail: prefill.email, licenseeArtist: prefill.artist || '', licenseeName: prefill.name || '' }))
    if (prefill.usage === 'exclu') setId('exclusive')
    if (prefill.usage === 'sync') setId('sync')
  }, [prefill])

  useEffect(() => {
    if (status?.paymentInfo) setF((x) => (x.paymentMethod ? x : { ...x, paymentMethod: status.paymentInfo }))
  }, [status])

  const update = (k) => (e) => {
    const v = e.target.value
    setF((x) => ({ ...x, [k]: v }))
    if (REMEMBERED.includes(k)) storage.local(`bs_${k}`, v)
  }

  const beat = beats.find((b) => b.title === f.beat)
  const defaultPrice = license?.exclusive ? beat?.exclusivePrice || license.price : license?.price
  const fields = useMemo(() => ({ ...f, price: f.price || defaultPrice }), [f, defaultPrice])
  const md = useMemo(() => (license ? renderContract(license, fields, site) : ''), [license, fields, site])
  const html = useMemo(() => marked.parse(md), [md])
  if (!license) return null

  const field = (k, label, props = {}) => (
    <div>
      <label className="label" htmlFor={`cg-${k}`}>{label}</label>
      <input id={`cg-${k}`} className="input" value={f[k]} onChange={update(k)} {...props} />
    </div>
  )

  return (
    <div className={s.gen}>
      <aside className={`${s.genForm} no-print`}>
        <div>
          <label className="label" htmlFor="cg-license">Licence</label>
          <select id="cg-license" className="input" value={id} onChange={(e) => { setId(e.target.value); setF((x) => ({ ...x, price: '' })) }}>
            {licenses.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.priceLabel}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="cg-beat">Prod</label>
          <input id="cg-beat" className="input" list="cg-beats" value={f.beat} onChange={update('beat')} />
          <datalist id="cg-beats">{beats.map((b) => <option key={b.slug} value={b.title} />)}</datalist>
        </div>
        <div className={s.two}>
          {field('price', 'Prix (€)', { type: 'number', placeholder: String(defaultPrice) })}
          {field('date', 'Date')}
        </div>
        {field('paymentMethod', 'Moyen de paiement')}

        <h3 className={s.genTitle}>Acheteur</h3>
        {field('licenseeName', 'Nom et prénom (ou société)')}
        {field('licenseeArtist', 'Nom d\'artiste')}
        {field('licenseeAddress', 'Adresse')}
        {field('licenseeEmail', 'E-mail', { type: 'email' })}

        {license.exclusive && (
          <>
            <h3 className={s.genTitle}>Exclusivité</h3>
            <div className={s.two}>
              {field('priorLicenses', 'Licences déjà vendues', { type: 'number', min: 0 })}
              {field('masterRoyalty', 'Royalties master (%)', { type: 'number', min: 0, max: 50 })}
            </div>
          </>
        )}
        {license.sync && (
          <>
            <h3 className={s.genTitle}>Projet</h3>
            {field('syncProject', 'Description', { placeholder: 'Pub Instagram pour la marque X, 30 s' })}
            {field('syncMedia', 'Médias', { placeholder: 'Instagram, TikTok, YouTube' })}
            <div className={s.two}>
              {field('syncTerritory', 'Territoire')}
              {field('syncDuration', 'Durée', { placeholder: '1 an' })}
            </div>
          </>
        )}

        <h3 className={s.genTitle}>Toi <small>(mémorisé sur cet appareil)</small></h3>
        {field('producerEmail', 'Ton e-mail', { type: 'email' })}
        {field('producerAddress', 'Ton adresse')}
        {field('city', 'Ville de signature')}

        <div className={s.genActions}>
          <button className="btn" onClick={() => window.print()}>Imprimer / PDF</button>
          <button className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(md).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })}>
            {copied ? 'Copié ✓' : 'Copier le texte'}
          </button>
        </div>
        <p className={s.meta}>« Imprimer » puis « Enregistrer en PDF », puis envoie-le à signer (Yousign, Docusign ou à la main).</p>
      </aside>
      <div className={`${s.paper} doc`} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
