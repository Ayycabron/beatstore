const express = require('express');
const cors = require('cors');
const { getBeatsFromDropbox, dropbox, invalidateCache, BEATS_DIR } = require('./dropbox');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// GET /api/beats — liste enrichie
// ---------------------------------------------------------------------------
app.get('/api/beats', async (req, res) => {
  try {
    const beats = await getBeatsFromDropbox();
    res.json(beats);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lors de la récupération des beats.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/beats/refresh — invalide le cache et recharge
// ---------------------------------------------------------------------------
app.post('/api/beats/refresh', async (req, res) => {
  try {
    invalidateCache();
    const beats = await getBeatsFromDropbox();
    res.json({ refreshed: true, count: beats.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lors du refresh.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/beats/file/:name — lien temporaire Dropbox pour le mp3
// ---------------------------------------------------------------------------
app.get('/api/beats/file/:name', async (req, res) => {
  const fileName = req.params.name;
  try {
    const beats = await getBeatsFromDropbox();
    const beat = beats.find((b) => b.name === fileName);
    if (!beat) return res.status(404).send('Beat not found');

    const tempLink = await dropbox.filesGetTemporaryLink({ path: beat.path_lower });
    return res.redirect(tempLink.result.link);
  } catch (e) {
    console.error(e);
    return res.status(500).send('Erreur Dropbox ou autorisations manquantes');
  }
});

// ---------------------------------------------------------------------------
// GET /api/beats/cover/:name — lien temporaire Dropbox pour la cover
// ---------------------------------------------------------------------------
app.get('/api/beats/cover/:name', async (req, res) => {
  const coverName = req.params.name;
  try {
    const tempLink = await dropbox.filesGetTemporaryLink({ path: `${BEATS_DIR}/${coverName}` });
    return res.redirect(tempLink.result.link);
  } catch (e) {
    console.error(e);
    return res.status(500).send('Erreur Dropbox ou autorisations manquantes');
  }
});

// ---------------------------------------------------------------------------
// Racine
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.send('API Beatstore backend est opérationnelle !');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
