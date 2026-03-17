// netlify/functions/add-beat.js
// Fonction serverless Netlify — appelée par Make quand un MP3 arrive dans Dropbox
// Elle met à jour beats.json via l'API Netlify Blobs (ou GitHub selon config)

const crypto = require('crypto');

exports.handler = async (event) => {
  // Sécurité : vérifie le secret Make
  const sig = event.headers['x-make-secret'];
  if (sig !== process.env.MAKE_WEBHOOK_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // Payload attendu depuis Make :
  // {
  //   "name": "MIDNIGHT DRIP",       ← nom du fichier sans extension (Make l'extrait)
  //   "bpm": 140,                     ← extrait du nom de fichier : "MIDNIGHT DRIP_140bpm_Am.mp3"
  //   "key": "Am",
  //   "tag": "TRAP",
  //   "price": 30,
  //   "duration": "2:34",
  //   "dropbox_url": "https://dl.dropboxusercontent.com/..."
  //   "waveform": [8,12,16,...]        ← généré par Make via script Python (voir make_waveform.py)
  // }

  const { name, bpm, key, tag, price, duration, dropbox_url, waveform } = payload;

  if (!name || !dropbox_url) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing name or dropbox_url' }) };
  }

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const newBeat = {
    id,
    name: name.toUpperCase(),
    bpm: parseInt(bpm) || 130,
    key: key || 'Am',
    tag: (tag || 'TRAP').toUpperCase(),
    price: parseInt(price) || 30,
    duration: duration || '3:00',
    file: dropbox_url,
    waveform: waveform || Array.from({ length: 26 }, () => Math.floor(Math.random() * 16) + 4),
    published_at: new Date().toISOString(),
    active: true,
  };

  // Mise à jour du fichier beats.json via l'API GitHub (recommandé pour Netlify statique)
  // Remplace GITHUB_TOKEN, GITHUB_REPO, GITHUB_OWNER par tes vraies valeurs dans les env vars Netlify
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER; // ex: "theohamel"
  const GITHUB_REPO  = process.env.GITHUB_REPO;  // ex: "beatstore"
  const FILE_PATH    = 'public/beats.json';

  // 1. Récupère le fichier actuel
  const getResp = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } }
  );
  const getJson = await getResp.json();
  const currentContent = JSON.parse(Buffer.from(getJson.content, 'base64').toString('utf-8'));

  // 2. Vérifie si le beat existe déjà (évite les doublons)
  const exists = currentContent.beats.find(b => b.id === id);
  if (exists) {
    return { statusCode: 200, body: JSON.stringify({ message: 'Beat already exists', id }) };
  }

  // 3. Ajoute le nouveau beat
  currentContent.beats.unshift(newBeat); // en tête de liste = plus récent en premier
  currentContent.last_updated = new Date().toISOString();

  // 4. Push le fichier mis à jour
  const updatedContent = Buffer.from(JSON.stringify(currentContent, null, 2)).toString('base64');
  const pushResp = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `[AUTO] Ajout du beat: ${newBeat.name}`,
        content: updatedContent,
        sha: getJson.sha,
      }),
    }
  );

  if (!pushResp.ok) {
    const err = await pushResp.json();
    return { statusCode: 500, body: JSON.stringify({ error: 'GitHub push failed', details: err }) };
  }

  // 5. Netlify redéploie automatiquement dès que GitHub reçoit le commit (webhook Netlify configuré)
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, beat: newBeat }),
  };
};
