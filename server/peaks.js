// Waveform réelle de chaque prod : le MP3 est décodé une fois (WASM, ~100 ms), puis gardé en mémoire.
import { readFile } from 'node:fs/promises';
import { MPEGDecoder } from 'mpg123-decoder';
import { beatsSource } from './config.js';
import { dropbox } from './dropbox.js';

const BARS = 160;
const cache = new Map(); // slug -> { version, peaks, duration }
let queue = Promise.resolve();

async function readBytes(ref) {
  if (beatsSource === 'dropbox') {
    const res = await dropbox.filesDownload({ path: ref });
    return new Uint8Array(res.result.fileBinary);
  }
  return new Uint8Array(await readFile(ref));
}

function computePeaks({ channelData, samplesDecoded, sampleRate }) {
  const size = Math.max(1, Math.floor(samplesDecoded / BARS));
  const raw = new Array(BARS).fill(0);
  for (let b = 0; b < BARS; b++) {
    let sum = 0;
    const start = b * size;
    const end = Math.min(samplesDecoded, start + size);
    for (const ch of channelData) {
      for (let i = start; i < end; i += 4) sum += ch[i] * ch[i];
    }
    raw[b] = Math.sqrt(sum / (((end - start) / 4) * channelData.length || 1)); // RMS
  }
  const max = Math.max(...raw, 1e-6);
  return {
    peaks: raw.map((x) => Math.round(Math.max(0.04, Math.pow(x / max, 0.8)) * 100) / 100),
    duration: Math.round((samplesDecoded / sampleRate) * 10) / 10,
  };
}

export function cachedPeaks(beat) {
  const hit = cache.get(beat.slug);
  return hit && hit.version === `${beat.audioRef}:${beat.modified}` ? hit : null;
}

export function getPeaks(beat) {
  const hit = cachedPeaks(beat);
  if (hit) return Promise.resolve(hit);
  // Un décodage à la fois pour garder la mémoire basse sur un petit serveur.
  const job = queue.then(async () => {
    const again = cachedPeaks(beat);
    if (again) return again;
    if (!/\.mp3$/i.test(beat.audioRef)) throw new Error('Waveform disponible pour les MP3 uniquement.');
    const decoder = new MPEGDecoder();
    await decoder.ready;
    try {
      const result = { version: `${beat.audioRef}:${beat.modified}`, ...computePeaks(decoder.decode(await readBytes(beat.audioRef))) };
      cache.set(beat.slug, result);
      return result;
    } finally {
      decoder.free();
    }
  });
  queue = job.catch(() => {});
  return job;
}
