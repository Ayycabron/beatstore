import { BeatList, LicenseCards } from '../components.jsx'
import { Link } from '../lib.jsx'

export default function Home({ cfg, beats, current, playing, onPlay, onRequest }) {
  const site = cfg?.site || {}
  const lic = cfg?.licenses
  const showPrices = site.showPricesOnSite && lic
  const minPrice = lic ? Math.min(...lic.licenses.filter((l) => l.price).map((l) => l.price)) : null
  const [first, ...rest] = (site.brand || 'THÉO HAMEL').split(' ')

  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <h1>{first} <span>{rest.join(' ')}</span></h1>
          <p className="lead">{site.tagline}</p>
          <div className="steps">
            <div className="step"><span className="n">1</span><div><b>Écoute</b><small>Tout le catalogue, en entier, sans compte.</small></div></div>
            <div className="step"><span className="n">2</span><div><b>Laisse ton e-mail</b><small>Tu reçois la prod par WeTransfer.</small></div></div>
            <div className="step"><span className="n">3</span><div><b>Choisis ta licence</b><small>Je t'envoie les options, WAV dès {minPrice || 50} €.</small></div></div>
          </div>
        </div>
      </section>

      <section className="section" id="prods">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>Les prods</h2>
              <p className="sub">{beats ? `${beats.length} prod${beats.length > 1 ? 's' : ''} dispo` : 'Chargement…'}</p>
            </div>
          </div>
          {beats && (
            <BeatList beats={beats} current={current} playing={playing} onPlay={onPlay} onRequest={onRequest} showPrices={showPrices} minPrice={minPrice} />
          )}
        </div>
      </section>

      {lic && (
        <section className="section" id="licences">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2>Licences</h2>
                <p className="sub">Pas de MP3, pas de 50 versions : du WAV et un contrat clair à ton nom.</p>
              </div>
              <Link to="/licences" className="btn ghost">Tout le détail</Link>
            </div>
            <LicenseCards licenses={lic} showPrices={showPrices} />
          </div>
        </section>
      )}

      <section className="section" id="contact">
        <div className="wrap">
          <h2>Une exclu, une prod sur mesure ?</h2>
          <p className="sub" style={{ maxWidth: 560 }}>
            Choisis la prod qui te parle et coche « Intéressé par l'exclu » dans le formulaire : on en parle directement par e-mail.
            {site.instagram && <> Ou écris-moi sur <a href={site.instagram} target="_blank" rel="noreferrer">Instagram</a>.</>}
          </p>
        </div>
      </section>
    </main>
  )
}
