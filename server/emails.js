import { config, site, licenses } from './config.js';
import { limitLabel } from '../shared/contract.js';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const USAGES = {
  ecoute: 'Juste écouter / écrire dessus pour l\'instant',
  sortie: 'Sortir un son (streaming)',
  clip: 'Sortir un son avec un clip',
  exclu: 'Intéressé par l\'exclu',
  sync: 'Pub, vidéo, film, podcast (synchro)',
};

const ACCENT = '#8B5CF6';

function layout(inner) {
  return `<!doctype html><html><body style="margin:0;background:#f4f3f8;font-family:Arial,Helvetica,sans-serif;color:#17151f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0d0c12;padding:20px 28px;color:#fff;font-size:20px;font-weight:bold;letter-spacing:3px">${esc(site.brand)}</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6">${inner}</td></tr>
<tr><td style="padding:16px 28px;background:#faf9fc;color:#77738a;font-size:12px">${esc(site.producerName)} · <a href="${config.siteUrl}" style="color:#77738a">${esc(config.siteUrl.replace(/^https?:\/\//, ''))}</a></td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href, label) =>
  `<a href="${esc(href)}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px">${esc(label)}</a>`;

const firstName = (r) => (r.name || r.artist || '').split(' ')[0];

// ----------------------------------------------------------------------------
// Pour toi : nouvelle demande
// ----------------------------------------------------------------------------
export function producerNotification(r, { autoSent }) {
  const rows = [
    ['Prod', r.beatTitle],
    ['E-mail', r.email],
    ['Nom', r.name],
    ['Nom d\'artiste', r.artist],
    ['Projet', USAGES[r.usage] || r.usage],
    ['Message', r.message],
  ].filter(([, val]) => val);
  const html = layout(`
<p style="margin-top:0;font-size:18px"><b>Nouvelle demande pour « ${esc(r.beatTitle)} »</b></p>
<table cellpadding="6" style="border-collapse:collapse;font-size:14px">${rows
    .map(([k, val]) => `<tr><td style="color:#77738a;vertical-align:top">${esc(k)}</td><td><b>${esc(val)}</b></td></tr>`)
    .join('')}</table>
<p>${autoSent ? '✅ Le lien de téléchargement a été envoyé automatiquement (lien réutilisable encore valide).' : '👉 À toi de jouer : envoie le lien WeTransfer, puis les licences.'}</p>
<p>${button(`${config.siteUrl}/admin`, 'Ouvrir l\'admin')}</p>
<p style="font-size:13px;color:#77738a">Tu peux aussi répondre directement à cet e-mail : la réponse part chez ${esc(r.email)}.</p>`);
  const text = `Nouvelle demande pour « ${r.beatTitle} »\n\n${rows.map(([k, val]) => `${k} : ${val}`).join('\n')}\n\n${
    autoSent ? 'Lien envoyé automatiquement.' : 'À toi : envoie le lien WeTransfer puis les licences.'
  }\nAdmin : ${config.siteUrl}/admin`;
  return { subject: `🎧 Demande : ${r.beatTitle} · ${r.artist || r.email}`, html, text, replyTo: r.email };
}

// ----------------------------------------------------------------------------
// Pour le client : accusé de réception
// ----------------------------------------------------------------------------
export function clientAck(r) {
  const hi = firstName(r) ? `Salut ${esc(firstName(r))},` : 'Salut,';
  const html = layout(`
<p style="margin-top:0">${hi}</p>
<p>Bien reçu ta demande pour <b>« ${esc(r.beatTitle)} »</b>. Je t'envoie la prod par WeTransfer, sur cette adresse, sous ${esc(site.replyDelay)} maximum.</p>
<p>Pense à vérifier tes spams si tu ne vois rien arriver.</p>
<p>À très vite,<br>${esc(site.producerName)}</p>`);
  const text = `Salut,\n\nBien reçu ta demande pour « ${r.beatTitle} ». Je t'envoie la prod par WeTransfer sous ${site.replyDelay} maximum. Vérifie tes spams.\n\n${site.producerName}`;
  return { subject: `Ta demande pour « ${r.beatTitle} » est bien reçue`, html, text };
}

// ----------------------------------------------------------------------------
// Pour le client : le lien de téléchargement
// ----------------------------------------------------------------------------
export function clientLink(r, url) {
  const hi = firstName(r) ? `Salut ${esc(firstName(r))},` : 'Salut,';
  const html = layout(`
<p style="margin-top:0">${hi}</p>
<p>Voici <b>« ${esc(r.beatTitle)} »</b> :</p>
<p>${button(url, 'Télécharger la prod')}</p>
<p style="font-size:13px;color:#77738a">Le lien expire au bout de quelques jours : télécharge le fichier dès maintenant.<br>${esc(url)}</p>
<p><b>Ce fichier sert à écouter et à écrire dessus.</b> Pour sortir un son (streaming, clip, scène…), il te faut une licence. Je t'envoie les options dans la foulée.</p>
<p>${esc(site.producerName)}</p>`);
  const text = `Salut,\n\nVoici « ${r.beatTitle} » : ${url}\n(le lien expire au bout de quelques jours)\n\nCe fichier sert à écouter et à écrire dessus. Pour sortir un son, il te faut une licence : je t'envoie les options dans la foulée.\n\n${site.producerName}`;
  return { subject: `🎧 « ${r.beatTitle} » : ton lien de téléchargement`, html, text, replyTo: config.producerEmail || undefined };
}

// ----------------------------------------------------------------------------
// Pour le client : les offres de licence
// ----------------------------------------------------------------------------
function keyPoints(l) {
  const x = l.limits;
  if (l.sync) return 'Ta vidéo, pub, podcast ou jeu. Prix selon le projet.';
  if (l.exclusive) return 'Tout illimité, prod retirée du catalogue, WAV + pistes.';
  return [
    `${limitLabel(x.streams)} streams`,
    x.videos === null ? 'clips illimités' : `${x.videos} clip${x.videos > 1 ? 's' : ''}`,
    x.radio ? 'radio OK' : null,
    x.stems ? 'WAV + pistes' : 'WAV',
  ]
    .filter(Boolean)
    .join(' · ');
}

export function clientOffers(r, beat, { message, exclusivePrice } = {}) {
  const exclu = exclusivePrice || beat?.exclusivePrice;
  const list = licenses.licenses.map((l) => ({
    name: l.name,
    price: l.exclusive && exclu ? `${exclu} €` : l.priceLabel,
    points: keyPoints(l),
  }));
  const hi = firstName(r) ? `Salut ${esc(firstName(r))},` : 'Salut,';
  const html = layout(`
<p style="margin-top:0">${hi}</p>
${message ? `<p>${esc(message).replace(/\n/g, '<br>')}</p>` : `<p>Si « ${esc(r.beatTitle)} » te plaît, voici comment l'utiliser pour de vrai. Tout est livré en <b>WAV</b> (pas de MP3), avec un contrat à ton nom.</p>`}
<table width="100%" cellpadding="10" style="border-collapse:collapse;font-size:14px">
${list
  .map(
    (o) => `<tr style="border-top:1px solid #ebe9f1"><td><b>${esc(o.name)}</b><br><span style="color:#77738a;font-size:13px">${esc(o.points)}</span></td><td align="right" style="white-space:nowrap"><b>${esc(o.price)}</b></td></tr>`,
  )
  .join('')}
</table>
<p>Le détail de chaque licence : <a href="${config.siteUrl}/licences" style="color:${ACCENT}">${esc(config.siteUrl.replace(/^https?:\/\//, ''))}/licences</a></p>
<p><b>Pour réserver :</b> réponds à ce mail avec la licence choisie et ton nom d'artiste. Je t'envoie le contrat, ${config.paymentInfo ? `tu règles (${esc(config.paymentInfo)})` : 'tu règles'}, et tu reçois le WAV dans la journée.</p>
<p>${esc(site.producerName)}</p>`);
  const text = `${message || `Si « ${r.beatTitle} » te plaît, voici les licences (tout en WAV, contrat à ton nom) :`}\n\n${list
    .map((o) => `- ${o.name} : ${o.price} (${o.points})`)
    .join('\n')}\n\nDétail : ${config.siteUrl}/licences\n\nPour réserver, réponds à ce mail avec la licence choisie.${
    config.paymentInfo ? ` Paiement : ${config.paymentInfo}.` : ''
  }\n\n${site.producerName}`;
  return { subject: `Licences pour « ${r.beatTitle} »`, html, text, replyTo: config.producerEmail || undefined };
}
