# Beatstore : vitrine de prods

Un site simple : on **écoute** les prods (pas de téléchargement), on laisse son **e-mail** pour recevoir une prod, tu reçois la demande, le client reçoit un **lien WeTransfer**, puis tu lui envoies **les licences** en un clic.

## Le circuit

1. Le visiteur écoute le catalogue (lecteur sans bouton de téléchargement, fichier servi en streaming).
2. Il clique « Recevoir la prod », laisse son e-mail (+ nom d'artiste et projet, facultatif).
3. **Toi** : tu reçois un e-mail avec sa demande. **Lui** : il reçoit un accusé de réception.
4. Sur `/admin`, tu colles le lien WeTransfer → il part au client.
   Option « réutiliser 3/7 jours » : les demandes suivantes pour la même prod reçoivent ce lien **automatiquement** tant qu'il est valide.
5. Bouton « Envoyer les licences » → le client reçoit la grille des prix (prix de l'exclu réglable par prod).
6. Il choisit → « Générer le contrat » pré-rempli → Imprimer / PDF → signature → paiement → tu envoies le WAV.

## Les licences

Tout est en WAV, aucun MP3 vendu. Prix et plafonds dans `config/licenses.json` (le site, les e-mails et les contrats suivent automatiquement).

| Licence | Prix | Streams | Clips | Ventes | Radio | Stems |
|---|---|---|---|---|---|---|
| WAV Standard | 50 € | 100 000 | 1 | 2 000 | non | non |
| WAV Premium | 90 € | 500 000 | 3 | 10 000 | oui | non |
| Trackout | 150 € | 1 000 000 | illimités | 50 000 | oui | oui |
| Illimitée | 250 € | illimités | illimités | illimitées | oui | oui |
| Exclusivité | 300 à 500 € | tout illimité + synchro + Content ID, prod retirée | | | | |
| Synchro & contenus | dès 150 € (devis) | pub, film, YouTube, podcast, jeu (sans voix) | | | | |

Contrats vierges : `contrats/*.md` et `contrats/pdf/*.pdf` (régénérer avec `npm run contrats` après une modif des licences). Le texte complet est aussi visible publiquement sur `/licences`.

> ⚠️ Ces contrats sont une base solide (CPI L.131-3, SACEM, droit moral, rétractation), mais ce ne sont pas des documents rédigés par un avocat. Fais-les relire une fois si tu commences à vendre des exclus.

## Ajouter une prod

Nommage : `TITRE_140bpm_Am_TRAP.mp3` (+ `TITRE_140bpm_Am_TRAP.jpg` pour la cover).
Dépose un **MP3 d'écoute avec ton tag vocal** : c'est ce qui protège vraiment, car tout son lu dans un navigateur peut être enregistré.

- **Avec Dropbox** (recommandé en ligne) : dans le dossier `DROPBOX_BEATS_DIR` (par défaut `/beatstore/prods`). Apparaît sur le site en 1 minute.
- **Sans Dropbox** (local) : dans le dossier `beats/`.

Réglages par prod dans `config/beats.json` : prix de l'exclu, `sold: true` pour la retirer après une exclu, `featured: true` pour la mettre en avant.

## Lancer en local

```bash
cp .env.example .env      # puis remplis au moins ADMIN_PASSWORD
npm install
npm run build             # compile le site
npm start                 # http://localhost:3000  (admin : /admin)
```

Sans SMTP, les e-mails s'affichent dans le terminal au lieu de partir.

## Mettre en ligne (gratuit, ~15 min)

1. **E-mails** (Gmail) : active la validation en 2 étapes, puis crée un mot de passe d'application (Compte Google → Sécurité → Mots de passe des applications). Ça donne `SMTP_USER` / `SMTP_PASS`.
2. **Dropbox** : crée une app sur dropbox.com/developers/apps (Scoped access ; permissions `files.metadata.read`, `files.content.read`, `files.content.write`). Mets la clé et le secret dans `.env`, lance `npm run dropbox-token`, récupère `DROPBOX_REFRESH_TOKEN`.
   Dropbox sert aussi à **stocker les demandes** (`/beatstore/data/db.json`), sinon elles sont perdues à chaque redéploiement sur un hébergeur gratuit.
3. **Render** : render.com → New → Blueprint → choisis ce repo (le fichier `render.yaml` est prêt). Remplis les variables, dont `SITE_URL` (l'adresse du site) et `ADMIN_PASSWORD`.
4. Domaine perso : Render → Settings → Custom Domain.

Le plan gratuit de Render met le site en veille après 15 min sans visite (premier chargement ~30 s). Pour l'éviter : plan Starter (~7 $/mois).

## À personnaliser

- `config/site.json` : nom, accroche, crédit (« Prod. Théo Hamel »), Instagram, adresse et SIRET pour les contrats, mention TVA (laisse « TVA non applicable, art. 293 B du CGI » seulement si tu es en micro-entreprise en franchise de TVA).
- `PAYMENT_INFO` dans `.env` : comment on te paie (affiché dans l'e-mail des licences).

## Structure

```
server/       API Express (prods, streaming, demandes, admin, e-mails)
shared/       générateur de contrats (utilisé par le site et par npm run contrats)
frontend/     site React (vitrine, /licences, /mentions, /admin)
config/       site.json, licenses.json, beats.json
contrats/     contrats vierges en Markdown et PDF
archive/      anciennes versions (Netlify v1, Express v1)
```
