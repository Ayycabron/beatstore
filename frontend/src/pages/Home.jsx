import { Link } from '../lib/router.jsx'
import FeaturedBeat from '../components/FeaturedBeat.jsx'
import Tracklist from '../components/Tracklist.jsx'
import LicenseCards from '../components/LicenseCards.jsx'
import Marquee from '../components/Marquee.jsx'
import Reveal from '../components/Reveal.jsx'
import { Arrow, ArrowDown } from '../components/Icons.jsx'
import styles from './Home.module.css'

export default function Home({ cfg, beats, onRequest }) {
  const site = cfg?.site || {}
  const lic = cfg?.licenses
  const prices = lic?.licenses.filter((l) => l.price && !l.sync) || []
  const minPrice = prices.length ? Math.min(...prices.map((l) => l.price)) : 50
  const exclu = lic?.licenses.find((l) => l.exclusive)
  const featured = beats?.find((b) => b.featured) || beats?.[0]
  const words = (site.brand || '').split(' ')

  const steps = [
    ['Écoute', 'Tout le catalogue, en entier, sans compte ni inscription.'],
    ['Laisse ton e-mail', 'Tu reçois la prod par WeTransfer pour écrire dessus.'],
    ['Choisis ta licence', `Je t'envoie les options. WAV dès ${minPrice} €, contrat à ton nom.`],
  ]

  return (
    <main>
      {/* ------------------------------------------------------------ Hero */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroText}>
            <Reveal as="span" className="eyebrow">Beatmaker · {beats ? `${beats.length} prods dispo` : 'Catalogue'}</Reveal>
            <h1 className={`display ${styles.title}`}>
              {words.map((w, i) => (
                <Reveal as="span" key={w} delay={80 + i * 90} className={styles.word}>{w}</Reveal>
              ))}
            </h1>
            <Reveal as="p" delay={260} className={styles.lead}>{site.tagline}</Reveal>
            <Reveal delay={340} className={styles.ctas}>
              <Link to="/#catalogue" className="btn btn-lg">Écouter les prods <ArrowDown size={16} /></Link>
              <Link to="/licences" className="btn btn-lg btn-ghost">Les licences</Link>
            </Reveal>
            <Reveal as="dl" delay={420} className={styles.stats}>
              <div><dt>WAV</dt><dd>dès {minPrice} €</dd></div>
              {exclu && <div><dt>Exclu</dt><dd>{exclu.priceLabel.replace(' à ', '–')}</dd></div>}
              <div><dt>Réponse</dt><dd>sous {site.replyDelay || '24 h'}</dd></div>
            </Reveal>
          </div>
          <Reveal delay={200} className={styles.heroCard}>
            {featured ? <FeaturedBeat beat={featured} onRequest={onRequest} /> : <div className={styles.cardSkeleton} />}
          </Reveal>
        </div>
      </section>

      <Marquee items={[`WAV dès ${minPrice} €`, 'Pas de MP3', 'Contrat à ton nom', exclu ? `Exclu ${exclu.priceLabel.replace(' à ', '–')}` : 'Exclus dispo', 'Prod reçue par WeTransfer', 'Pistes séparées dispo']} />

      {/* ----------------------------------------------------------- Étapes */}
      <section className={`container ${styles.section}`}>
        <ol className={styles.steps}>
          {steps.map(([t, d], i) => (
            <Reveal as="li" key={t} delay={i * 90} className={styles.step}>
              <span className={styles.stepNum}>0{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* -------------------------------------------------------- Catalogue */}
      <section id="catalogue" className={`container ${styles.section}`}>
        <Reveal className={styles.sectionHead}>
          <div>
            <span className="eyebrow">Catalogue</span>
            <h2 className={`display ${styles.h2}`}>Les prods</h2>
          </div>
          <p className={styles.headNote}>Clique sur une waveform pour sauter dans la prod. <kbd>Espace</kbd> lecture/pause.</p>
        </Reveal>
        {beats ? <Tracklist beats={beats} onRequest={onRequest} /> : <div className={styles.listSkeleton} />}
      </section>

      {/* --------------------------------------------------------- Licences */}
      {lic && (
        <section id="licences" className={`container ${styles.section}`}>
          <Reveal className={styles.sectionHead}>
            <div>
              <span className="eyebrow">Licences</span>
              <h2 className={`display ${styles.h2}`}>Simple. En WAV.</h2>
            </div>
            <Link to="/licences" className="btn btn-ghost">Comparer en détail <Arrow size={16} /></Link>
          </Reveal>
          <LicenseCards licenses={lic} showPrices={site.showPricesOnSite} />
          <p className={styles.note}>{lic.note} Tu dépasses un plafond ? Tu passes à la licence du dessus en payant la différence.</p>
        </section>
      )}

      {/* -------------------------------------------------------------- CTA */}
      <section className={`container ${styles.section}`}>
        <Reveal className={styles.cta}>
          <h2 className="display">Une exclu<br />en tête&nbsp;?</h2>
          <div>
            <p>Choisis la prod qui te parle et coche « Intéressé par l'exclu » dans le formulaire. On en parle directement par e-mail.</p>
            <Link to="/#catalogue" className="btn btn-lg">Choisir une prod <Arrow size={16} /></Link>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
