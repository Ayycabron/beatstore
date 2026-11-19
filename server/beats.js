import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { config, beatsSource, beatOverrides, licenses } from './config.js';
import { dropbox, temporaryLink } from './dropbox.js';

const AUDIO = /\.(mp3|m4a|ogg)$/i;
const IMAGE = /\.(jpe?g|png|webp)$/i;

export const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Convention : TITRE_140bpm_Am_TRAP.mp3  (tout après le titre est optionnel, dans n'importe quel ordre)
export function parseBeatFilename(filename) {
  const base = filename.replace(/\.[^.]+$/, '');
  const [rawTitle, ...rest] = base.split('_').map((p) => p.trim()).filter(Boolean);
  const title = (rawTitle || base).toUpperCase();
  let bpm = null;
  let key = null;
  const tags = [];
  for (const part of rest) {
    const bpmMatch = part.match(/^(\d{2,3})\s*bpm$/i) || (!bpm && part.match(/^(\d{2,3})$/));
    if (bpmMatch && Number(bpmMatch[1]) >= 50 && Number(bpmMatch[1]) <= 220) {
      bpm = Number(bpmMatch[1]);
    } else if (/^[A-G](#|b)?(m|min|maj)?$/i.test(part)) {
      key = part.charAt(0).toUpperCase() + part.slice(1);
    } else if (/^\d+(€|eur)?$/i.test(part)) {
      // ancien segment "prix" (ex: _30) : ignoré, les prix sont dans config/licenses.json
    } else {
      tags.push(part.toUpperCase().replace(/^HIPHOP$/, 'HIP-HOP'));
    }
  }
  return { title, slug: slugify(title), bpm, key, tags };
}

async function listEntries() {
  if (beatsSource === 'dropbox') {
    let res = await dropbox.filesListFolder({ path: config.dropbox.beatsDir });
    let entries = res.result.entries;
    while (res.result.has_more) {
      res = await dropbox.filesListFolderContinue({ cursor: res.result.cursor });
      entries = entries.concat(res.result.entries);
    }
    return entries
      .filter((e) => e['.tag'] === 'file')
      .map((e) => ({ name: e.name, ref: e.path_lower, modified: e.server_modified }));
  }
  try {
    const files = await readdir(config.localBeatsDir, { withFileTypes: true });
    return files
      .filter((f) => f.isFile())
      .map((f) => ({ name: f.name, ref: path.join(config.localBeatsDir, f.name), modified: null }));
  } catch {
    return [];
  }
}

let cache = null;
let cacheAt = 0;
const TTL = 60 * 1000;

export function invalidateBeats() {
  cache = null;
}

const exclusiveDefault = licenses.licenses.find((l) => l.exclusive);

export async function getBeats({ includeSold = false } = {}) {
  if (!cache || Date.now() - cacheAt > TTL) {
    try {
      const entries = await listEntries();
      const images = entries.filter((e) => IMAGE.test(e.name));
      cache = entries
        .filter((e) => AUDIO.test(e.name))
        .map((e) => {
          const meta = parseBeatFilename(e.name);
          const base = e.name.replace(/\.[^.]+$/, '').toLowerCase();
          const titleBase = base.split('_')[0];
          const cover =
            images.find((i) => i.name.replace(/\.[^.]+$/, '').toLowerCase() === base) ||
            images.find((i) => i.name.replace(/\.[^.]+$/, '').toLowerCase().split('_')[0] === titleBase);
          return { ...meta, audioRef: e.ref, coverRef: cover ? cover.ref : null, modified: e.modified };
        })
        .sort((a, b) => String(b.modified || '').localeCompare(String(a.modified || '')) || a.title.localeCompare(b.title));
      cacheAt = Date.now();
    } catch (err) {
      console.error('[beats] lecture impossible :', err?.message || err);
      cache = cache || [];
    }
  }
  const overrides = beatOverrides();
  return cache
    .map((b) => {
      const o = overrides[b.slug] || {};
      return {
        ...b,
        exclusivePrice: o.exclusivePrice || exclusiveDefault?.price || null,
        sold: !!o.sold,
        featured: !!o.featured,
        deliveryLink: o.deliveryLink || null,
        deliveryLinkExpires: o.deliveryLinkExpires || null,
      };
    })
    .filter((b) => includeSold || !b.sold);
}

export async function findBeat(slug) {
  return (await getBeats({ includeSold: true })).find((b) => b.slug === slug) || null;
}

export function publicBeat(b) {
  return {
    slug: b.slug,
    title: b.title,
    bpm: b.bpm,
    key: b.key,
    tags: b.tags,
    featured: b.featured,
    exclusivePrice: b.exclusivePrice,
    cover: b.coverRef ? `/api/cover/${b.slug}` : null,
    stream: `/api/stream/${b.slug}`,
  };
}

const MIME = { mp3: 'audio/mpeg', m4a: 'audio/mp4', ogg: 'audio/ogg', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const mimeOf = (ref) => MIME[ref.split('.').pop().toLowerCase()] || 'application/octet-stream';

// Envoie un fichier (local ou Dropbox) en respectant les requêtes Range (lecture/seek dans le player).
export async function pipeFile(ref, req, res, { cacheControl }) {
  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (beatsSource !== 'dropbox') {
    return res.sendFile(ref, { headers: { 'Content-Type': mimeOf(ref) }, cacheControl: false });
  }
  const url = await temporaryLink(ref);
  const headers = req.headers.range ? { Range: req.headers.range } : {};
  const upstream = await fetch(url, { headers });
  if (!upstream.ok && upstream.status !== 206) {
    res.status(502).end();
    return;
  }
  res.status(upstream.status);
  res.setHeader('Content-Type', mimeOf(ref));
  for (const h of ['content-length', 'content-range', 'accept-ranges']) {
    const val = upstream.headers.get(h);
    if (val) res.setHeader(h, val);
  }
  Readable.fromWeb(upstream.body).pipe(res);
}
