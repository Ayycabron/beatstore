# 🎵 BEATSTORE THÉO HAMEL — Guide de déploiement complet

## Architecture du système

```
Dropbox /beatstore/new/        ← tu glisses tes MP3 ici
        ↓ (Make surveille toutes les 15 min)
Make Scenario
        ├── Génère le lien direct Dropbox
        ├── Parse le nom du fichier (BPM, Key, Tag, Prix)
        ├── Appelle le webhook Netlify → met à jour beats.json sur GitHub
        ├── Envoie l'email à ta liste Mailchimp
        └── Archive le MP3 dans /beatstore/published/

GitHub (repo public)           ← contient le code du site + beats.json
        ↓ (push automatique)
Netlify                        ← héberge le site, redéploie à chaque commit
        ↓
beats-theohamel.com            ← site en ligne, catalogue mis à jour
```

---

## ÉTAPE 1 — Créer le repo GitHub

1. Va sur github.com → New repository
2. Nom : `beatstore`
3. Public (requis pour Netlify gratuit)
4. Upload tous les fichiers du dossier `public/` et `netlify/`
5. Structure finale attendue :
   ```
   beatstore/
   ├── public/
   │   ├── index.html       ← le site principal
   │   ├── cgv.html         ← page CGV/CGU
   │   └── beats.json       ← catalogue des beats
   ├── netlify/
   │   └── functions/
   │       └── add-beat.js  ← webhook serverless
   └── netlify.toml         ← config Netlify
   ```
6. Note ton **Personal Access Token GitHub** :
   - Settings → Developer settings → Personal access tokens → Generate new token
   - Scope requis : `repo` (lecture + écriture)
   - Garde ce token précieusement

---

## ÉTAPE 2 — Déployer sur Netlify

1. Va sur netlify.com → "Add new site" → "Import from GitHub"
2. Sélectionne ton repo `beatstore`
3. Build settings :
   - Build command : *(vide)*
   - Publish directory : `public`
4. Deploy !
5. Dans Netlify → Site settings → Custom domain → Ajoute `beats-theohamel.com`
6. Netlify te donne les DNS à configurer chez ton registrar (OVH, Gandi, etc.)

### Variables d'environnement Netlify (obligatoires)
Dans Netlify → Site settings → Environment variables, ajoute :

| Variable              | Valeur                          |
|-----------------------|---------------------------------|
| `GITHUB_TOKEN`        | Ton Personal Access Token GitHub|
| `GITHUB_OWNER`        | Ton nom d'utilisateur GitHub    |
| `GITHUB_REPO`         | `beatstore`                     |
| `MAKE_WEBHOOK_SECRET` | Un mot de passe fort que tu inventes (ex: `th_secret_2024_xK9p`) |

---

## ÉTAPE 3 — Configurer Make

### Connexions à créer dans Make d'abord :
- **Dropbox** : Make → Connections → Add → Dropbox → Autoriser
- **Mailchimp** : Make → Connections → Add → Mailchimp → Autoriser (ou Gmail si pas Mailchimp)

### Importer le blueprint :
1. Make → Scenarios → Create a new scenario
2. ⋯ (trois points) → Import Blueprint
3. Upload le fichier `scripts/make_blueprint.json`
4. Remplace les valeurs suivantes dans chaque module :

**Module 1 (Dropbox Watch)** :
- Folder : `/beatstore/new` ← crée ce dossier dans ta Dropbox

**Module 7 (HTTP Webhook)** :
- URL : `https://beats-theohamel.com/api/add-beat`
- Header `x-make-secret` : même valeur que `MAKE_WEBHOOK_SECRET` dans Netlify

**Module 9 (Mailchimp)** :
- list_id : ton ID de liste Mailchimp (Audience → Settings → Audience name and defaults)

### Convention de nommage des fichiers MP3 :
```
NOM DU BEAT_BPMbpm_KEY_TAG_PRIX.mp3

Exemples :
MIDNIGHT DRIP_140bpm_Am_TRAP_30.mp3
GOLDEN ERA_95bpm_Gm_HIPHOP_30.mp3
CHROME VISION_142bpm_Em_TRAP_35.mp3
```
- Si TAG ou PRIX sont absents → valeurs par défaut : TRAP et 30€
- Les espaces dans le nom du beat sont autorisés

---

## ÉTAPE 4 — Tester le pipeline

1. Crée un fichier test : `TEST BEAT_120bpm_Cm_TRAP_30.mp3`
2. Glisse-le dans `/beatstore/new/` dans ta Dropbox
3. Dans Make → Lance le scénario manuellement (▷ Run once)
4. Vérifie :
   - [ ] Le beat apparaît dans `beats.json` sur GitHub
   - [ ] Netlify redéploie (onglet Deploys)
   - [ ] Le beat apparaît sur le site
   - [ ] L'email a été envoyé à la liste
   - [ ] Le MP3 a été déplacé dans `/beatstore/published/`

---

## ÉTAPE 5 — Ajouter la case CGV au formulaire d'achat

Dans `index.html`, avant le bouton PayPal, ajoute dans `.modal-form` :
```html
<div style="display:flex;align-items:flex-start;gap:10px">
  <input type="checkbox" id="cgvCheck" style="margin-top:3px;accent-color:#7C3AED">
  <label for="cgvCheck" style="font-size:.7rem;color:var(--muted);line-height:1.6">
    J'accepte les <a href="cgv.html" target="_blank" style="color:var(--v2)">CGV/CGU</a>
    et je renonce à mon droit de rétractation après livraison des fichiers.
  </label>
</div>
```
Et dans le JS, avant le `window.open(ppUrl)` :
```javascript
if (!document.getElementById('cgvCheck').checked) {
  alert('Merci d\'accepter les CGV/CGU pour continuer.');
  return;
}
```

---

## Coûts mensuels estimés

| Service    | Plan           | Coût      |
|------------|----------------|-----------|
| Netlify    | Free           | 0€/mois   |
| GitHub     | Free           | 0€/mois   |
| Make       | Free (1000 ops)| 0€/mois   |
| Mailchimp  | Free (500 sub) | 0€/mois   |
| Dropbox    | Basic (2Go)    | 0€/mois   |
| **TOTAL**  |                | **0€/mois**|

Si ta liste dépasse 500 abonnés → Mailchimp Essentials : ~13€/mois.
Alternative gratuite : Brevo (ex-Sendinblue), 300 emails/jour gratuit.

---

## En cas de problème

- **Le beat n'apparaît pas** → Vérifie les variables d'env Netlify + logs de la function (Netlify → Functions → add-beat → logs)
- **Make échoue** → Ouvre le scénario, clique sur le module en erreur, lis le message
- **Le lien Dropbox ne joue pas** → Vérifie que le lien commence bien par `dl.dropboxusercontent.com` et non `www.dropbox.com`
- **Doublon de beats** → Le webhook vérifie l'ID (basé sur le nom), un même fichier ne peut pas être ajouté deux fois
