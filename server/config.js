import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const readJson = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));

export const site = readJson('config/site.json');
export const licenses = readJson('config/licenses.json');
export function beatOverrides() {
  // relu à chaque appel : tu peux modifier config/beats.json sans redémarrer en local
  try {
    return readJson('config/beats.json').beats || {};
  } catch {
    return {};
  }
}

const env = process.env;

export const config = {
  port: Number(env.PORT) || 3000,
  siteUrl: (env.SITE_URL || `http://localhost:${Number(env.PORT) || 3000}`).replace(/\/$/, ''),
  adminPassword: env.ADMIN_PASSWORD || '',
  producerEmail: env.PRODUCER_EMAIL || '',
  paymentInfo: env.PAYMENT_INFO || '',
  dropbox: {
    accessToken: env.DROPBOX_ACCESS_TOKEN || '',
    refreshToken: env.DROPBOX_REFRESH_TOKEN || '',
    appKey: env.DROPBOX_APP_KEY || '',
    appSecret: env.DROPBOX_APP_SECRET || '',
    beatsDir: env.DROPBOX_BEATS_DIR || '/beatstore/prods',
    dataPath: env.DROPBOX_DATA_PATH || '/beatstore/data/db.json',
  },
  localBeatsDir: path.resolve(ROOT, env.LOCAL_BEATS_DIR || 'beats'),
  localDataPath: path.resolve(ROOT, env.LOCAL_DATA_PATH || 'data/db.json'),
  smtp: {
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT) || 465,
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.MAIL_FROM || env.SMTP_USER || '',
  },
};

export const hasDropbox = !!(config.dropbox.refreshToken || config.dropbox.accessToken);
export const beatsSource = env.BEATS_SOURCE || (hasDropbox ? 'dropbox' : 'local');
export const storageBackend = env.STORAGE || (hasDropbox ? 'dropbox' : 'local');
