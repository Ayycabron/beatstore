// Mini base de données JSON : { requests: [], links: {} }
// Stockée dans Dropbox si configuré (persistant même sur un hébergeur gratuit), sinon dans data/db.json.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { config, storageBackend } from './config.js';
import { dropbox } from './dropbox.js';

let db = null;
let queue = Promise.resolve();

async function load() {
  if (db) return db;
  try {
    if (storageBackend === 'dropbox') {
      const res = await dropbox.filesDownload({ path: config.dropbox.dataPath });
      const buf = res.result.fileBinary;
      db = JSON.parse(Buffer.isBuffer(buf) ? buf.toString('utf8') : new TextDecoder().decode(buf));
    } else {
      db = JSON.parse(await readFile(config.localDataPath, 'utf8'));
    }
  } catch (err) {
    const notFound = err?.code === 'ENOENT' || err?.status === 409;
    if (!notFound) console.error('[store] lecture impossible, base vide utilisée :', err?.message || err);
    db = {};
  }
  db.requests ||= [];
  db.links ||= {};
  return db;
}

async function persist() {
  const body = JSON.stringify(db, null, 2);
  if (storageBackend === 'dropbox') {
    await dropbox.filesUpload({ path: config.dropbox.dataPath, contents: body, mode: { '.tag': 'overwrite' }, mute: true });
  } else {
    await mkdir(path.dirname(config.localDataPath), { recursive: true });
    await writeFile(config.localDataPath, body);
  }
}

export async function read() {
  return load();
}

// Les écritures passent dans une file pour ne jamais se chevaucher.
export function update(mutator) {
  const run = queue.then(async () => {
    await load();
    const result = await mutator(db);
    await persist();
    return result;
  });
  queue = run.catch(() => {});
  return run;
}
