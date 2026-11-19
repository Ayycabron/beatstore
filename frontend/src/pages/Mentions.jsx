export default function Mentions({ cfg }) {
  const site = cfg?.site || {}
  return (
    <main className="section">
      <div className="wrap prose">
        <h2 style={{ fontFamily: 'var(--display)', fontSize: 44, fontWeight: 400, letterSpacing: 1.5 }}>Mentions légales & confidentialité</h2>

        <h2>Éditeur du site</h2>
        <p>Ce site est édité par {site.producerName}, producteur de musique indépendant. Pour toute question, utilise le formulaire d'une prod ou réponds à l'un de mes e-mails.</p>

        <h2>Les prods</h2>
        <p>Toutes les prods sont des créations originales protégées par le droit d'auteur. L'écoute sur ce site ne donne aucun droit d'utilisation. Toute utilisation (publication, streaming, clip, concert, vidéo) nécessite une licence signée et payée.</p>

        <h2>Vente des licences</h2>
        <p>Il n'y a pas de paiement sur ce site. Après ta demande, tu reçois les offres par e-mail. La vente est conclue quand le contrat de licence est signé et le prix payé. Le contrat signé fait foi pour tout ce qui concerne les droits accordés.</p>
        <p>Les fichiers étant des contenus numériques livrés immédiatement à ta demande, tu renonces à ton droit de rétractation une fois la livraison commencée (article L.221-28, 13° du Code de la consommation).</p>

        <h2>Tes données</h2>
        <ul>
          <li><b>Ce que je collecte :</b> ton e-mail, et si tu les donnes, ton prénom, ton nom d'artiste, ton projet et ton message.</li>
          <li><b>Pourquoi :</b> t'envoyer la prod demandée et les offres de licence qui vont avec (base légale : ton consentement, puis l'exécution du contrat si tu achètes).</li>
          <li><b>Qui y a accès :</b> moi seulement. Les données sont stockées chez mon hébergeur et mon prestataire d'e-mail, jamais revendues.</li>
          <li><b>Combien de temps :</b> 3 ans après notre dernier échange, puis suppression.</li>
          <li><b>Tes droits :</b> accès, rectification, suppression, opposition. Réponds simplement à un de mes e-mails. Tu peux aussi saisir la CNIL (cnil.fr).</li>
        </ul>
        <p>Ce site n'utilise ni cookie publicitaire ni outil de suivi.</p>
      </div>
    </main>
  )
}
