import Reveal from '../components/Reveal.jsx'
import styles from './Mentions.module.css'

export default function Mentions({ cfg }) {
  const site = cfg?.site || {}
  return (
    <main className="container">
      <div className={styles.page}>
        <Reveal as="span" className="eyebrow">Infos</Reveal>
        <Reveal as="h1" delay={80} className={`display ${styles.h1}`}>Mentions & confidentialité</Reveal>

        <section>
          <h2>Éditeur du site</h2>
          <p>Ce site est édité par {site.producerName}, producteur de musique indépendant. Pour toute question, utilise le formulaire d'une prod ou réponds à l'un de mes e-mails.</p>
        </section>
        <section>
          <h2>Les prods</h2>
          <p>Toutes les prods sont des créations originales protégées par le droit d'auteur. L'écoute sur ce site ne donne aucun droit d'utilisation. Toute utilisation (publication, streaming, clip, concert, vidéo) nécessite une licence signée et payée.</p>
        </section>
        <section>
          <h2>Vente des licences</h2>
          <p>Il n'y a pas de paiement sur ce site. Après ta demande, tu reçois les offres par e-mail. La vente est conclue quand le contrat de licence est signé et le prix payé. Le contrat signé fait foi pour tout ce qui concerne les droits accordés.</p>
          <p>Les fichiers étant des contenus numériques livrés immédiatement à ta demande, tu renonces à ton droit de rétractation une fois la livraison commencée (article L.221-28, 13° du Code de la consommation).</p>
        </section>
        <section>
          <h2>Tes données</h2>
          <dl className={styles.facts}>
            <dt>Ce que je collecte</dt><dd>Ton e-mail, et si tu les donnes : ton prénom, ton nom d'artiste, ton projet et ton message.</dd>
            <dt>Pourquoi</dt><dd>T'envoyer la prod demandée et les offres de licence qui vont avec (base légale : ton consentement, puis l'exécution du contrat si tu achètes).</dd>
            <dt>Qui y a accès</dt><dd>Moi seulement. Les données sont stockées chez mon hébergeur et mon prestataire d'e-mail, jamais revendues.</dd>
            <dt>Combien de temps</dt><dd>3 ans après notre dernier échange, puis suppression.</dd>
            <dt>Tes droits</dt><dd>Accès, rectification, suppression, opposition : réponds simplement à un de mes e-mails. Tu peux aussi saisir la CNIL (cnil.fr).</dd>
          </dl>
          <p>Ce site n'utilise ni cookie publicitaire ni outil de suivi.</p>
        </section>
      </div>
    </main>
  )
}
