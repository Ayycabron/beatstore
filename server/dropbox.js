import { Dropbox } from 'dropbox';
import { config, hasDropbox } from './config.js';

// Les tokens d'accès Dropbox expirent au bout de 4 h : en production, utilise
// DROPBOX_REFRESH_TOKEN + DROPBOX_APP_KEY + DROPBOX_APP_SECRET (le SDK rafraîchit tout seul).
export const dropbox = hasDropbox
  ? new Dropbox(
      config.dropbox.refreshToken
        ? {
            clientId: config.dropbox.appKey,
            clientSecret: config.dropbox.appSecret,
            refreshToken: config.dropbox.refreshToken,
            fetch,
          }
        : { accessToken: config.dropbox.accessToken, fetch },
    )
  : null;

// Cache des liens temporaires (valables 4 h côté Dropbox, on les garde 3 h)
const linkCache = new Map();
export async function temporaryLink(pathLower) {
  const hit = linkCache.get(pathLower);
  if (hit && hit.expires > Date.now()) return hit.url;
  const res = await dropbox.filesGetTemporaryLink({ path: pathLower });
  const url = res.result.link;
  linkCache.set(pathLower, { url, expires: Date.now() + 3 * 3600 * 1000 });
  return url;
}
