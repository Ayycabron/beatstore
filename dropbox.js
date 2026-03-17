const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');
require('dotenv').config();

const dropbox = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
  fetch,
});

// ---------------------------------------------------------------------------
// Cache mémoire (TTL 60s)
// ---------------------------------------------------------------------------
let _cache = null;
let _cacheAt = 0;
const CACHE_TTL_MS = 60 * 1000;

function invalidateCache() {
  _cache = null;
  _cacheAt = 0;
}

// ---------------------------------------------------------------------------
// Parser de nom de fichier mp3
// Format nominal : TITRE_140bpm_Am_TRAP_30.mp3
// Segments manquants tolérés.
// ---------------------------------------------------------------------------
function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseBeatFilename(filename) {
  const base = filename.replace(/\.mp3$/i, '');
  const parts = base.split('_').map((p) => p.trim()).filter(Boolean);

  const title = parts[0] || base;

  // BPM : accepte "140bpm", "140BPM", "140"
  const bpmRaw = parts[1] || '';
  const bpmMatch = bpmRaw.match(/(\d{2,3})/);
  const bpm = bpmMatch ? Number(bpmMatch[1]) : null;

  // Key  : ex "Am", "Em", "Dm"
  const key = parts[2] || null;

  // Tag / genre : ex "TRAP", "DRILL"
  const tagRaw = parts[3] || null;
  const tag = tagRaw ? tagRaw.toLowerCase() : null;

  // Prix : ex "30" → défaut 30 €
  const price = parts[4] ? (safeNumber(parts[4]) ?? 30) : 30;

  // Slug SEO basé sur le titre
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return {
    title,
    slug,
    bpm,
    key,
    price,
    tags: tag ? [tag] : [],
    duration: null,
  };
}

// ---------------------------------------------------------------------------
// Récupération des beats depuis Dropbox avec pagination
// ---------------------------------------------------------------------------
async function getBeatsFromDropbox() {
  const now = Date.now();
  if (_cache && now - _cacheAt < CACHE_TTL_MS) {
    return _cache;
  }

  const beatsDir = process.env.DROPBOX_BEATS_DIR || '/NEW';
  let entries = [];

  try {
    // Première page
    let res = await dropbox.filesListFolder({ path: beatsDir });
    entries = entries.concat(res.result.entries || []);

    // Pagination
    while (res.result.has_more) {
      res = await dropbox.filesListFolderContinue({ cursor: res.result.cursor });
      entries = entries.concat(res.result.entries || []);
    }
  } catch (e) {
    console.error('Erreur Dropbox filesListFolder :', e);
    return _cache || [];
  }

  // Filtrer les mp3
  const mp3Files = entries.filter((f) => f['.tag'] === 'file' && f.name.toLowerCase().endsWith('.mp3'));

  const beats = mp3Files.map((beatFile) => {
    const meta = parseBeatFilename(beatFile.name);

    // Cherche une cover : même base de nom + image
    const baseName = beatFile.name.replace(/\.mp3$/i, '');
    const coverFile = entries.find((f) => {
      if (f['.tag'] !== 'file') return false;
      const n = f.name.toLowerCase();
      return (
        (n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.png')) &&
        f.name.toLowerCase().startsWith(baseName.toLowerCase())
      );
    });

    return {
      name: beatFile.name,
      path_lower: beatFile.path_lower,
      cover: coverFile ? coverFile.name : null,

      title: meta.title,
      slug: meta.slug,
      bpm: meta.bpm,
      key: meta.key,
      price: meta.price,
      tags: meta.tags,
      duration: meta.duration,

      mp3Url: `/api/beats/file/${encodeURIComponent(beatFile.name)}`,
      coverUrl: coverFile
        ? `/api/beats/cover/${encodeURIComponent(coverFile.name)}`
        : null,
    };
  });

  _cache = beats;
  _cacheAt = now;
  return beats;
}

module.exports = { getBeatsFromDropbox, dropbox, parseBeatFilename, invalidateCache, BEATS_DIR: process.env.DROPBOX_BEATS_DIR || '/NEW' };
