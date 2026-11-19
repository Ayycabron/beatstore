// Générateur de contrats de licence.
// Utilisé par le site (page /admin/contrat) ET par scripts/build-contracts.js (PDF vierges).
// Il ne dépend de rien : il renvoie du Markdown.

const BLANK = '____________________';

const fmtNumber = (n) => new Intl.NumberFormat('fr-FR').format(n).replace(/ /g, ' ');

export function limitLabel(value, unit = '') {
  if (value === null || value === undefined) return 'Illimité';
  if (value === true) return 'Oui';
  if (value === false || value === 0) return 'Non';
  return unit ? `${fmtNumber(value)} ${unit}` : fmtNumber(value);
}

// Lignes du tableau des droits, utilisées sur le site et dans les contrats.
export function rightsRows(license) {
  const l = license.limits;
  if (license.sync) {
    return [
      ['Utilisation', 'Synchronisation de la Prod (sans voix) avec le Projet décrit à l\'article 3'],
      ['Diffusion du Projet', 'Sur les médias listés à l\'article 3'],
      ['Création d\'une chanson avec la Prod', 'Non'],
      ['Distribution de la Prod seule', 'Non'],
      ['Content ID / identification automatique', 'Non'],
    ];
  }
  return [
    ['Streams audio (toutes plateformes cumulées)', limitLabel(l.streams)],
    ['Clips vidéo', limitLabel(l.videos)],
    ['Vues vidéo cumulées', limitLabel(l.videoViews)],
    ['Ventes physiques et téléchargements payants', limitLabel(l.sales, 'exemplaires')],
    ['Diffusion radio / TV', limitLabel(l.radio)],
    ['Concerts et showcases, y compris payants', limitLabel(l.live)],
    ['Pistes séparées (stems)', limitLabel(l.stems)],
    ['Synchronisation (pub, film, série, jeu vidéo)', limitLabel(l.sync)],
    ['Content ID sur le Morceau', limitLabel(l.contentId)],
  ];
}

function table(rows) {
  return ['| Droit | Ce que la licence autorise |', '|---|---|', ...rows.map(([a, b]) => `| ${a} | ${b} |`)].join('\n');
}

const v = (x) => (x !== undefined && x !== null && String(x).trim() !== '' ? String(x).trim() : BLANK);

/**
 * @param {object} license  entrée de config/licenses.json
 * @param {object} f        champs à remplir (tous optionnels, blancs sinon)
 * @param {object} site     config/site.json
 */
export function renderContract(license, f = {}, site = {}) {
  const legal = site.legal || {};
  const exclusive = !!license.exclusive;
  const sync = !!license.sync;
  const producerArtist = v(f.producerArtist || site.producerName);
  const credit = f.creditLine || site.creditLine || `Prod. ${producerArtist}`;
  const price = f.price || (license.priceMax ? '' : license.price);
  const priceText = price ? `${price} €` : `${BLANK} €`;
  const vat = legal.vatMention ? ` (${legal.vatMention})` : '';
  const files = license.files.map((x) => `- ${x}`).join('\n');
  const years = license.durationYears;

  const title = exclusive
    ? 'CONTRAT DE CESSION EXCLUSIVE DE DROITS D\'EXPLOITATION'
    : sync
      ? 'CONTRAT DE LICENCE DE SYNCHRONISATION'
      : 'CONTRAT DE LICENCE NON EXCLUSIVE D\'EXPLOITATION';

  const out = [];
  const p = (s = '') => out.push(s);

  p(`# ${title}`);
  p(`## Licence « ${license.name} » : prod « ${v(f.beat)} »`);
  p();
  p('**Entre les soussignés :**');
  p();
  p(`**${v(f.producerName || legal.legalName)}**, producteur et compositeur de musique, dont le nom d\'artiste est « ${producerArtist} », demeurant ${v(f.producerAddress || legal.address)}, joignable à l\'adresse e-mail ${v(f.producerEmail)}${(f.producerSiret || legal.siret) ? `, immatriculé sous le numéro SIRET ${f.producerSiret || legal.siret}` : ''},`);
  p();
  p('ci-après « **le Producteur** »,');
  p();
  p('**Et**');
  p();
  p(`**${v(f.licenseeName)}**, dont le nom d\'artiste ou la raison sociale est « ${v(f.licenseeArtist)} », demeurant ${v(f.licenseeAddress)}, joignable à l\'adresse e-mail ${v(f.licenseeEmail)},`);
  p();
  p('ci-après « **le Licencié** ».');
  p();
  p('> Si le Licencié est mineur, le contrat est également signé par son représentant légal, qui s\'engage pour lui.');
  p();

  // ---------------------------------------------------------------------------
  p('## Préambule');
  p();
  p(`Le Producteur a composé, arrangé et enregistré une œuvre musicale instrumentale originale intitulée « **${v(f.beat)}** » (ci-après « **la Prod** »). Il est à la fois l\'auteur de la composition et le producteur de l\'enregistrement instrumental.`);
  p();
  if (sync) {
    p('Le Licencié souhaite utiliser la Prod, sans y ajouter de voix chantée ou rappée, en synchronisation avec des images ou au sein d\'un contenu audio ou audiovisuel (ci-après « **le Projet** »).');
  } else {
    p('Le Licencié souhaite utiliser la Prod pour créer un nouvel enregistrement comprenant sa propre interprétation (voix, paroles, mélodies) (ci-après « **le Morceau** »), puis exploiter ce Morceau dans les conditions du présent contrat.');
  }
  p();
  p('Les parties ont donc convenu de ce qui suit.');
  p();

  // ---------------------------------------------------------------------------
  p('## Article 1 : Objet');
  p();
  if (exclusive) {
    p('Le Producteur cède au Licencié, **à titre exclusif**, les droits d\'exploitation de la Prod décrits à l\'article 3, dans le cadre de la création et de l\'exploitation du Morceau, aux conditions du présent contrat.');
  } else if (sync) {
    p('Le Producteur concède au Licencié, **à titre non exclusif**, le droit de synchroniser la Prod avec le Projet décrit à l\'article 3 et d\'exploiter ce Projet, aux conditions du présent contrat.');
  } else {
    p('Le Producteur concède au Licencié, **à titre non exclusif**, personnel et non transférable, les droits d\'exploitation de la Prod décrits à l\'article 3, dans le cadre de la création et de l\'exploitation du Morceau, aux conditions du présent contrat.');
  }
  p();

  // ---------------------------------------------------------------------------
  p('## Article 2 : Fichiers livrés');
  p();
  p('Après réception du paiement complet, le Producteur fournit au Licencié, par lien de téléchargement :');
  p();
  p(files);
  p();
  p('Aucun fichier MP3 n\'est fourni pour une exploitation. Le fichier reçu avant l\'achat pour l\'écoute (par WeTransfer ou autrement) ne peut en aucun cas être exploité tant que la licence n\'est pas payée.');
  p();

  // ---------------------------------------------------------------------------
  p('## Article 3 : Droits concédés');
  p();
  p('Conformément à l\'article L.131-3 du Code de la propriété intellectuelle, les droits concédés sont les suivants :');
  p();
  if (sync) {
    p('- **Droit de reproduction** : fixer la Prod sur la bande-son du Projet et la reproduire sur tout support nécessaire à sa diffusion ;');
    p('- **Droit de représentation** : communiquer le Projet au public sur les médias listés ci-dessous ;');
    p('- **Droit d\'adaptation** : couper, monter, boucler ou modifier le volume de la Prod pour l\'adapter aux images, sans en dénaturer le caractère.');
    p();
    p(`- **Description du Projet** : ${v(f.syncProject)}`);
    p(`- **Médias de diffusion** : ${v(f.syncMedia)}`);
    p(`- **Territoire** : ${v(f.syncTerritory || 'Monde entier')}`);
    p(`- **Durée d\'exploitation** : ${v(f.syncDuration)}`);
    p();
  } else {
    p('- **Droit de reproduction** : enregistrer le Morceau sur la Prod, le fixer et le reproduire sur tout support (fichiers numériques, CD, vinyle, etc.) ;');
    p('- **Droit de représentation** : communiquer le Morceau au public par tout moyen (plateformes de streaming, téléchargement, réseaux sociaux, sites vidéo, radio et télévision si autorisés ci-dessous, concerts) ;');
    p('- **Droit d\'adaptation** : ajouter voix, paroles et mélodies à la Prod, la mixer, la masteriser, la raccourcir ou la structurer pour les besoins du Morceau, sans en dénaturer le caractère.');
    p();
  }
  p('Ces droits s\'exercent dans les limites suivantes :');
  p();
  p(table(rightsRows(license)));
  p();
  if (!sync && !exclusive) {
    p('Un « stream » désigne une écoute comptabilisée par une plateforme (Spotify, Apple Music, Deezer, YouTube Music, etc.). Une « vue vidéo » désigne une vue comptabilisée par une plateforme vidéo (YouTube, TikTok, Instagram, etc.). Les compteurs s\'additionnent sur toutes les plateformes. Les vidéos courtes non officielles (stories, extraits promotionnels de moins de 60 secondes) ne comptent pas comme des clips.');
    p();
  }
  p('Tout droit qui n\'est pas expressément concédé ici reste la propriété du Producteur.');
  p();

  // ---------------------------------------------------------------------------
  p('## Article 4 : Durée et territoire');
  p();
  if (exclusive) {
    p('La présente cession est consentie pour le **monde entier** et pour **toute la durée de protection légale** des droits d\'auteur et des droits voisins, renouvellements et prolongations compris.');
  } else if (sync) {
    p('La licence prend effet au paiement complet. Le territoire et la durée sont ceux indiqués à l\'article 3.');
  } else {
    p(`La licence est consentie pour le **monde entier**, pour une durée de **${years} ans** à compter de la date de signature, ou jusqu\'à ce qu\'un des plafonds de l\'article 3 soit atteint si cela arrive avant.`);
    p();
    p('À la fin de la licence, le Licencié ne peut plus distribuer de nouvelle version, de nouveau clip ou de nouveau support du Morceau. Les versions déjà mises en ligne avant cette date peuvent rester disponibles, dans la limite des plafonds.');
  }
  p();

  // ---------------------------------------------------------------------------
  p('## Article 5 : Prix et paiement');
  p();
  p(`En contrepartie des droits concédés, le Licencié verse au Producteur la somme forfaitaire de **${priceText}**${vat}, payable en une fois par ${v(f.paymentMethod)} avant toute livraison.`);
  p();
  p('Cette somme ne remplace pas la rémunération du Producteur au titre de ses droits d\'auteur gérés par la SACEM (article 7), qui reste proportionnelle aux recettes d\'exploitation, conformément à l\'article L.131-4 du Code de la propriété intellectuelle.');
  p();
  if (exclusive) {
    const pts = f.masterRoyalty !== undefined && f.masterRoyalty !== '' ? `${f.masterRoyalty} %` : `${BLANK} %`;
    p(`En plus du prix, le Licencié verse au Producteur **${pts}** des recettes nettes encaissées sur l\'exploitation du Morceau (streaming, téléchargements, ventes physiques, synchronisation). Si ce taux est de 0 %, aucune redevance supplémentaire n\'est due. Les redevances éventuelles sont réglées une fois par an, avec un relevé des recettes, au plus tard le 31 mars de l\'année suivante.`);
    p();
  }
  p('La licence ne prend effet qu\'à réception du paiement complet. Tant que le paiement n\'est pas complet, aucune exploitation n\'est autorisée.');
  p();

  // ---------------------------------------------------------------------------
  if (!exclusive && !sync) {
    p('## Article 6 : Dépassement des plafonds');
    p();
    p('Si le Morceau approche d\'un des plafonds de l\'article 3, le Licencié doit acheter une licence supérieure (ou l\'exclusivité, si la Prod est encore disponible). Il ne paie alors que la différence entre le prix de la nouvelle licence et le prix déjà payé.');
    p();
    p('Le Licencié dispose de **30 jours** après le dépassement pour régulariser. Passé ce délai, l\'exploitation au-delà du plafond est une contrefaçon et le Producteur peut faire retirer le Morceau des plateformes.');
    p();
  } else {
    p('## Article 6 : Étendue');
    p();
    p(exclusive
      ? 'Aucun plafond ne limite l\'exploitation du Morceau, sous réserve des droits conservés par le Producteur (articles 7, 8 et 13) et des licences déjà concédées (article 10).'
      : 'Toute utilisation de la Prod en dehors du Projet, des médias, du territoire ou de la durée indiqués à l\'article 3 nécessite une nouvelle licence.');
    p();
  }

  // ---------------------------------------------------------------------------
  p('## Article 7 : Droits d\'auteur et SACEM');
  p();
  p('Le Producteur reste l\'auteur de la composition musicale de la Prod. Le présent contrat ne cède **aucune part d\'édition** ni aucun droit d\'auteur au Licencié.');
  p();
  if (sync) {
    p('Le Licencié s\'engage à fournir les informations nécessaires (cue sheet, relevé de diffusion) pour que le Producteur perçoive ses droits auprès de la SACEM ou de tout organisme de gestion collective compétent.');
  } else {
    p(`Si le Morceau est déclaré à la SACEM (ou à tout organisme équivalent), le Producteur y est déclaré comme **compositeur** de la musique. Le Licencié est déclaré comme auteur de ses paroles, et comme co-compositeur pour les mélodies qu\'il a créées. Les parts sont réparties selon les règles de l\'organisme. Le Licencié s\'engage à transmettre au Producteur les informations de déclaration et à ne pas déclarer le Morceau sans lui.`);
    p();
    p('Les droits d\'auteur perçus par le Producteur au titre de la composition lui restent entièrement acquis.');
  }
  p();

  // ---------------------------------------------------------------------------
  p('## Article 8 : Crédits');
  p();
  p(`Le Licencié s\'engage à créditer le Producteur sous la mention « **${credit}** » dans le titre ou la description du Morceau (ou du Projet), sur les plateformes de streaming lorsque le distributeur le permet, dans les descriptions de vidéos et dans les publications de promotion.`);
  p();

  // ---------------------------------------------------------------------------
  p('## Article 9 : Ce qui est interdit');
  p();
  p('Il est interdit au Licencié :');
  p();
  p('- de revendre, louer, céder ou sous-licencier la Prod ou la licence à un tiers ;');
  p('- d\'exploiter la Prod seule, sans sa propre interprétation (sauf licence Synchro) ;');
  p('- de se présenter comme le compositeur ou le producteur de la Prod ;');
  if (!license.limits.contentId) {
    p('- d\'enregistrer la Prod ou le Morceau dans un système d\'identification automatique (YouTube Content ID, Audible Magic, etc.), ce qui bloquerait les autres licenciés et le Producteur ;');
  }
  if (!license.limits.sync && !sync) {
    p('- d\'utiliser le Morceau en synchronisation (publicité, film, série, jeu vidéo) sans licence spécifique ;');
  }
  p('- d\'utiliser la Prod pour entraîner, alimenter ou tester un système d\'intelligence artificielle ;');
  p('- d\'utiliser la Prod dans un contenu illicite, diffamatoire, ou incitant à la haine ou à la violence.');
  p();

  // ---------------------------------------------------------------------------
  p(exclusive ? '## Article 10 : Exclusivité' : '## Article 10 : Non-exclusivité');
  p();
  if (exclusive) {
    const prior = f.priorLicenses !== undefined && f.priorLicenses !== '' ? f.priorLicenses : BLANK;
    p('À compter du paiement complet, le Producteur s\'engage à :');
    p();
    p('- retirer la Prod de son site et de toutes ses boutiques en ligne dans un délai de **72 heures** ;');
    p('- ne plus concéder aucune nouvelle licence sur la Prod, à qui que ce soit.');
    p();
    p(`Le Producteur déclare qu\'avant la signature, **${prior}** licence(s) non exclusive(s) ont été concédée(s) sur la Prod. Ces licences restent valables jusqu\'à leur terme, dans leurs propres limites, et le Licencié ne peut pas s\'y opposer. Le Licencié peut toutefois enregistrer le Morceau dans un système Content ID ; il s\'engage dans ce cas à libérer sans délai les réclamations visant ces licenciés antérieurs.`);
    p();
    p('Le Producteur peut citer le Morceau parmi ses références professionnelles (portfolio, réseaux sociaux).');
  } else {
    p('La licence n\'est pas exclusive. Le Producteur reste libre de concéder d\'autres licences sur la Prod, à d\'autres personnes, et de la céder en exclusivité. Une exclusivité ultérieure ne remet pas en cause la présente licence, qui reste valable jusqu\'à son terme.');
  }
  p();

  // ---------------------------------------------------------------------------
  p('## Article 11 : Garanties');
  p();
  p('Le Producteur garantit qu\'il est l\'auteur de la Prod, qu\'elle est originale et qu\'elle ne contient aucun extrait (sample) d\'une œuvre protégée dont il n\'aurait pas obtenu les droits. Si la Prod contient un sample dont les droits n\'ont pas été libérés, il en informe le Licencié par écrit avant la signature.');
  p();
  p(sync
    ? 'Le Licencié garantit qu\'il détient les droits sur les autres éléments du Projet (images, voix off, autres musiques) et garantit le Producteur contre toute réclamation à ce titre.'
    : 'Le Licencié garantit que les paroles, mélodies et enregistrements qu\'il ajoute à la Prod sont originaux ou autorisés, et garantit le Producteur contre toute réclamation à ce titre.');
  p();

  // ---------------------------------------------------------------------------
  p('## Article 12 : Résiliation');
  p();
  p('Si l\'une des parties ne respecte pas une obligation essentielle du contrat (paiement, plafonds, crédits, interdictions de l\'article 9), l\'autre partie peut la mettre en demeure par e-mail ou par lettre recommandée. Sans régularisation dans un délai de **15 jours**, le contrat est résilié de plein droit.');
  p();
  p('En cas de résiliation aux torts du Licencié, celui-ci doit cesser toute exploitation de la Prod et retirer le Morceau des plateformes. Les sommes déjà payées restent acquises au Producteur.');
  p();

  // ---------------------------------------------------------------------------
  p('## Article 13 : Droit moral');
  p();
  p('Le droit moral du Producteur sur la Prod (droit au nom, droit au respect de l\'œuvre) est inaliénable et lui reste acquis. Le Producteur accepte les adaptations prévues à l\'article 3. Toute modification qui dénaturerait la Prod nécessite son accord écrit.');
  p();

  // ---------------------------------------------------------------------------
  p('## Article 14 : Droit de rétractation');
  p();
  p('Le Licencié demande expressément la livraison immédiate des fichiers après paiement. Conformément à l\'article L.221-28, 13° du Code de la consommation, il reconnaît renoncer à son droit de rétractation dès que la livraison a commencé.');
  p();

  // ---------------------------------------------------------------------------
  p('## Article 15 : Droit applicable et litiges');
  p();
  p('Le présent contrat est soumis au droit français. En cas de désaccord, les parties cherchent d\'abord une solution amiable. À défaut, le litige est porté devant les tribunaux compétents du ressort du domicile du Producteur, sauf règle impérative contraire applicable au consommateur.');
  p();

  // ---------------------------------------------------------------------------
  p('---');
  p();
  p(`Fait à ${v(f.city || legal.city)}, le ${v(f.date)}, en deux exemplaires originaux (une signature électronique vaut original).`);
  p();
  p('| Le Producteur | Le Licencié |');
  p('|---|---|');
  p(`| ${v(f.producerName || legal.legalName)} | ${v(f.licenseeName)} |`);
  p('| Mention « Lu et approuvé » et signature | Mention « Lu et approuvé » et signature |');
  p('| <br><br><br><br> | <br><br><br><br> |');
  p();
  return out.join('\n');
}
