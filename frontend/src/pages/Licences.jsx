import { useMemo, useState } from 'react'
import { marked } from 'marked'
import LicenseCards from '../components/LicenseCards.jsx'
import Reveal from '../components/Reveal.jsx'
import { Plus } from '../components/Icons.jsx'
import { renderContract, rightsRows } from '../../../shared/contract.js'
import styles from './Licences.module.css'

export default function Licences({ cfg }) {
  const lic = cfg?.licenses
  const site = cfg?.site
  const [open, setOpen] = useState(null)
  const docs = useMemo(
    () => (lic && site ? Object.fromEntries(lic.licenses.map((l) => [l.id, marked.parse(renderContract(l, {}, site))])) : {}),
    [lic, site],
  )
  if (!lic) return <main className="container" style={{ minHeight: '60vh' }} />

  const standard = lic.licenses.filter((l) => !l.sync)
  const rows = rightsRows(standard[0]).map(([label], i) => [label, standard.map((l) => rightsRows(l)[i][1])])
  const cell = (v) => (v === 'Oui' ? <span className={styles.yes}>Oui</span> : v === 'Non' ? <span className={styles.no}>—</span> : v)

  return (
    <main className="container">
      <section className={styles.intro}>
        <Reveal as="span" className="eyebrow">Licences</Reveal>
        <Reveal as="h1" delay={80} className={`display ${styles.h1}`}>Une licence,<br />un contrat clair.</Reveal>
        <Reveal as="p" delay={160} className={styles.lead}>
          Tu écoutes, tu reçois la prod, puis tu choisis la licence qui colle à ce que tu vas en faire. Chaque licence est un vrai contrat à ton nom. {lic.note}
        </Reveal>
      </section>

      <LicenseCards licenses={lic} showPrices={site?.showPricesOnSite} />

      <section className={styles.block}>
        <Reveal as="h2" className={`display ${styles.h2}`}>Comparatif</Reveal>
        <Reveal className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col"><span className="visually-hidden">Droit</span></th>
                {standard.map((l) => (
                  <th scope="col" key={l.id} className={l.id === 'premium' ? styles.hl : ''}>
                    {l.name}
                    {site?.showPricesOnSite && <span className={styles.thPrice}>{l.priceLabel}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><th scope="row">Fichiers</th>{standard.map((l) => <td key={l.id} className={l.id === 'premium' ? styles.hl : ''}>{l.limits.stems ? 'WAV + pistes' : 'WAV'}</td>)}</tr>
              {rows.map(([label, vals]) => (
                <tr key={label}><th scope="row">{label}</th>{vals.map((v, i) => <td key={i} className={standard[i].id === 'premium' ? styles.hl : ''}>{cell(v)}</td>)}</tr>
              ))}
              <tr><th scope="row">Durée</th>{standard.map((l) => <td key={l.id} className={l.id === 'premium' ? styles.hl : ''}>{l.durationYears ? `${l.durationYears} ans` : 'Durée légale'}</td>)}</tr>
            </tbody>
          </table>
        </Reveal>
        <p className={styles.note}>
          Crédit obligatoire : « {site?.creditLine} ». Le producteur reste déclaré compositeur à la SACEM sur toutes les licences, exclusivité comprise.
        </p>
      </section>

      <section className={styles.block}>
        <Reveal as="h2" className={`display ${styles.h2}`}>Les contrats</Reveal>
        <p className={styles.sub}>Le texte exact que tu signes, pour chaque licence.</p>
        <div className={styles.accordion}>
          {lic.licenses.map((l) => {
            const isOpen = open === l.id
            return (
              <div key={l.id} className={`${styles.item} ${isOpen ? styles.open : ''}`}>
                <button className={styles.summary} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : l.id)}>
                  <span>Contrat « {l.name} »</span>
                  <span className={styles.plus}><Plus size={16} /></span>
                </button>
                <div className={styles.panel}>
                  <div className={styles.panelInner}>
                    <div className="doc" dangerouslySetInnerHTML={{ __html: docs[l.id] }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
