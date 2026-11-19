import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { randomUUID, timingSafeEqual, createHash } from 'node:crypto';
import { config, site, licenses, ROOT, beatsSource, storageBackend } from './config.js';
import { getBeats, findBeat, publicBeat, pipeFile, invalidateBeats } from './beats.js';
import * as store from './store.js';
import { sendMail, mailReady } from './mailer.js';
import { producerNotification, clientAck, clientLink, clientOffers, USAGES } from './emails.js';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ----------------------------------------------------------------------------
// Public
// ----------------------------------------------------------------------------
app.get('/api/config', (req, res) => {
  res.json({
    site: { ...site, legal: undefined },
    licenses: site.showPricesOnSite ? licenses : { ...licenses, licenses: licenses.licenses.map((l) => ({ ...l, priceLabel: null, price: null })) },
    usages: USAGES,
  });
});

app.get('/api/beats', wrap(async (req, res) => {
  const beats = await getBeats();
  res.json(beats.map(publicBeat));
}));

// Lecture audio : streaming uniquement, pas de lien de téléchargement.
app.get('/api/stream/:slug', wrap(async (req, res) => {
  // Ouvrir l'URL directement dans un onglet (= télécharger) est refusé ; le lecteur du site passe.
  if (req.get('sec-fetch-dest') === 'document') return res.redirect(302, '/');
  const beat = await findBeat(req.params.slug);
  if (!beat || beat.sold) return res.status(404).end();
  await pipeFile(beat.audioRef, req, res, { cacheControl: 'private, no-store' });
}));

app.get('/api/cover/:slug', wrap(async (req, res) => {
  const beat = await findBeat(req.params.slug);
  if (!beat || !beat.coverRef) return res.status(404).end();
  await pipeFile(beat.coverRef, req, res, { cacheControl: 'public, max-age=86400' });
}));

// Anti-spam simple : 6 demandes / heure / IP
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 6;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (s, max = 200) => String(s ?? '').trim().slice(0, max);

app.post('/api/requests', wrap(async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot : les robots remplissent ce champ caché
  const email = clean(b.email, 160).toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Adresse e-mail invalide.' });
  if (!b.consent) return res.status(400).json({ error: 'Merci de cocher la case de consentement.' });
  if (rateLimited(req.ip)) return res.status(429).json({ error: 'Trop de demandes, réessaie dans une heure.' });

  const beat = await findBeat(clean(b.beat, 120));
  if (!beat || beat.sold) return res.status(404).json({ error: 'Cette prod n\'est plus disponible.' });

  const record = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    beat: beat.slug,
    beatTitle: beat.title,
    email,
    name: clean(b.name, 80),
    artist: clean(b.artist, 80),
    usage: USAGES[b.usage] ? b.usage : '',
    message: clean(b.message, 1000),
    status: 'new',
    history: [],
  };

  // Lien réutilisable encore valide ? (défini depuis l'admin ou dans config/beats.json)
  const db = await store.read();
  const now = Date.now();
  const saved = db.links[beat.slug];
  let autoLink = null;
  if (saved && new Date(saved.expiresAt).getTime() > now) autoLink = saved.url;
  else if (beat.deliveryLink && (!beat.deliveryLinkExpires || new Date(beat.deliveryLinkExpires).getTime() > now)) autoLink = beat.deliveryLink;

  if (autoLink) {
    record.status = 'link_sent';
    record.history.push({ at: record.createdAt, action: 'link_sent', url: autoLink, auto: true });
  }
  await store.update((d) => {
    d.requests.unshift(record);
  });

  // Les e-mails partent après la réponse pour que le formulaire reste rapide.
  res.json({ ok: true, autoSent: !!autoLink });

  const jobs = [];
  if (config.producerEmail) jobs.push(sendMail({ to: config.producerEmail, ...producerNotification(record, { autoSent: !!autoLink }) }));
  jobs.push(sendMail({ to: email, ...(autoLink ? clientLink(record, autoLink) : clientAck(record)) }));
  for (const r of await Promise.allSettled(jobs)) {
    if (r.status === 'rejected') console.error('[mail] échec :', r.reason?.message || r.reason);
  }
}));

// ----------------------------------------------------------------------------
// Admin (mot de passe : ADMIN_PASSWORD)
// ----------------------------------------------------------------------------
const digest = (s) => createHash('sha256').update(String(s)).digest();
function requireAdmin(req, res, next) {
  if (!config.adminPassword) return res.status(503).json({ error: 'ADMIN_PASSWORD n\'est pas défini sur le serveur.' });
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token || !timingSafeEqual(digest(token), digest(config.adminPassword))) return res.status(401).json({ error: 'Mot de passe incorrect.' });
  next();
}
const admin = express.Router();
admin.use(requireAdmin);

admin.get('/status', (req, res) => {
  res.json({ mailReady, beatsSource, storageBackend, producerEmail: !!config.producerEmail, paymentInfo: config.paymentInfo, site });
});

admin.get('/requests', wrap(async (req, res) => {
  const db = await store.read();
  res.json({ requests: db.requests, links: db.links });
}));

admin.get('/beats', wrap(async (req, res) => {
  const beats = await getBeats({ includeSold: true });
  res.json(beats.map((b) => ({ ...publicBeat(b), sold: b.sold })));
}));

async function withRequest(id) {
  const db = await store.read();
  const r = db.requests.find((x) => x.id === id);
  if (!r) {
    const err = new Error('Demande introuvable.');
    err.status = 404;
    throw err;
  }
  return r;
}

admin.post('/requests/:id/send-link', wrap(async (req, res) => {
  const r = await withRequest(req.params.id);
  const url = clean(req.body.url, 500);
  if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Colle un lien qui commence par https://' });
  await sendMail({ to: r.email, ...clientLink(r, url) });
  const reuseDays = Number(req.body.reuseDays) || 0;
  await store.update((d) => {
    const x = d.requests.find((y) => y.id === r.id);
    x.status = x.status === 'offers_sent' ? x.status : 'link_sent';
    x.history.push({ at: new Date().toISOString(), action: 'link_sent', url });
    if (reuseDays > 0) d.links[r.beat] = { url, expiresAt: new Date(Date.now() + reuseDays * 86400_000).toISOString() };
  });
  res.json({ ok: true });
}));

admin.post('/requests/:id/send-offers', wrap(async (req, res) => {
  const r = await withRequest(req.params.id);
  const beat = await findBeat(r.beat);
  await sendMail({ to: r.email, ...clientOffers(r, beat, { message: clean(req.body.message, 2000), exclusivePrice: Number(req.body.exclusivePrice) || null }) });
  await store.update((d) => {
    const x = d.requests.find((y) => y.id === r.id);
    x.status = 'offers_sent';
    x.history.push({ at: new Date().toISOString(), action: 'offers_sent' });
  });
  res.json({ ok: true });
}));

const STATUSES = ['new', 'link_sent', 'offers_sent', 'sold', 'closed'];
admin.post('/requests/:id/status', wrap(async (req, res) => {
  const r = await withRequest(req.params.id);
  if (!STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'Statut inconnu.' });
  await store.update((d) => {
    const x = d.requests.find((y) => y.id === r.id);
    x.status = req.body.status;
    if (req.body.license) x.license = clean(req.body.license, 40);
    x.history.push({ at: new Date().toISOString(), action: `status:${req.body.status}` });
  });
  res.json({ ok: true });
}));

admin.delete('/links/:slug', wrap(async (req, res) => {
  await store.update((d) => {
    delete d.links[req.params.slug];
  });
  res.json({ ok: true });
}));

admin.post('/refresh', (req, res) => {
  invalidateBeats();
  res.json({ ok: true });
});

app.use('/api/admin', admin);
app.use('/api', (req, res) => res.status(404).json({ error: 'Route inconnue.' }));

// ----------------------------------------------------------------------------
// Front (React compilé dans frontend/dist)
// ----------------------------------------------------------------------------
const dist = path.join(ROOT, 'frontend', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  app.get('/', (req, res) => res.send('API OK. Lance « npm run build » pour compiler le site.'));
}

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return res.end();
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Erreur serveur.' });
});

app.listen(config.port, () => {
  console.log(`Beatstore sur ${config.siteUrl}  (prods : ${beatsSource}, données : ${storageBackend}, mail : ${mailReady ? 'SMTP' : 'console'})`);
});
