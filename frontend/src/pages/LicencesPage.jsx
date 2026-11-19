import { useMemo } from 'react'
import { marked } from 'marked'
import { LicenseCards } from '../components.jsx'
import { renderContract, rightsRows } from '../../../shared/contract.js'

export default function LicencesPage({ cfg }) {
  const lic = cfg?.licenses
  const site = cfg?.site || {}
  const docs = useMemo(
    () => (lic ? Object.fromEntries(lic.licenses.map((l) => [l.id, marked.parse(renderContract(l, {}, site))])) : {}),
    [lic, site],
  )
  if (!lic) return <main className="section"><div className="wrap">Chargement…</div></main>
  const standard = lic.licenses.filter((l) => !l.sync)
  const rows = rightsRows(standard[0]).map(([label], i) => [label, standard.map((l) => rightsRows(l)[i][1])])

  return (
    <main className="section">
      <div className="wrap">
        <h2>Licences</h2>
        <p className="sub" style={{ maxWidth: 640 }}>
          Tu écoutes, tu reçois la prod, puis tu choisis la licence qui correspond à ce que tu vas en faire.
          Chaque licence est un vrai contrat à ton nom. {lic.note}
        </p>

        <div style={{ marginTop: 24 }}>
          <LicenseCards licenses={lic} showPrices={site.showPricesOnSite} />
        </div>

        <h2 style={{ fontSize: 32, marginTop: 48 }}>Comparatif</h2>
        <div className="table-scroll" style={{ marginTop: 14 }}>
          <table className="cmp">
            <thead>
              <tr>
                <th></th>
                {standard.map((l) => <th key={l.id}>{l.name}{site.showPricesOnSite && l.priceLabel ? <><br /><span style={{ color: 'var(--accent-text)' }}>{l.priceLabel}</span></> : null}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr><th>Fichiers</th>{standard.map((l) => <td key={l.id}>{l.limits.stems ? 'WAV + pistes' : 'WAV'}</td>)}</tr>
              {rows.map(([label, vals]) => (
                <tr key={label}><th>{label}</th>{vals.map((val, i) => <td key={i}>{val}</td>)}</tr>
              ))}
              <tr><th>Durée</th>{standard.map((l) => <td key={l.id}>{l.durationYears ? `${l.durationYears} ans` : 'Durée légale des droits'}</td>)}</tr>
              <tr><th>Exclusivité</th>{standard.map((l) => <td key={l.id}>{l.exclusive ? 'Oui' : 'Non'}</td>)}</tr>
            </tbody>
          </table>
        </div>
        <p className="note">
          Tu dépasses un plafond ? Tu passes à la licence du dessus en payant seulement la différence.
          Crédit obligatoire : « {site.creditLine} ». Le producteur reste déclaré compositeur à la SACEM sur toutes les licences.
        </p>

        <h2 style={{ fontSize: 32, marginTop: 48 }}>Les contrats</h2>
        <p className="sub">Le texte exact que tu signes, pour chaque licence.</p>
        {lic.licenses.map((l) => (
          <details key={l.id} className="contract">
            <summary>Contrat « {l.name} »</summary>
            <div className="doc" dangerouslySetInnerHTML={{ __html: docs[l.id] }} />
          </details>
        ))}
      </div>
    </main>
  )
}
