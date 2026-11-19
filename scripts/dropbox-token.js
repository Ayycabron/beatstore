// Obtient un refresh token Dropbox (qui n'expire pas) en 2 minutes.
// 1. https://www.dropbox.com/developers/apps → Create app → Scoped access → App folder ou Full Dropbox
// 2. Onglet Permissions : coche files.metadata.read, files.content.read, files.content.write → Submit
// 3. Mets DROPBOX_APP_KEY et DROPBOX_APP_SECRET dans .env, puis lance : npm run dropbox-token
import 'dotenv/config';
import readline from 'node:readline/promises';

const key = process.env.DROPBOX_APP_KEY;
const secret = process.env.DROPBOX_APP_SECRET;
if (!key || !secret) {
  console.error('Renseigne DROPBOX_APP_KEY et DROPBOX_APP_SECRET dans .env d\'abord.');
  process.exit(1);
}
console.log('\nOuvre ce lien, autorise l\'app, puis copie le code affiché :\n');
console.log(`https://www.dropbox.com/oauth2/authorize?client_id=${key}&response_type=code&token_access_type=offline\n`);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const code = (await rl.question('Code : ')).trim();
rl.close();
const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ code, grant_type: 'authorization_code', client_id: key, client_secret: secret }),
});
const json = await res.json();
if (!json.refresh_token) {
  console.error('Échec :', json);
  process.exit(1);
}
console.log(`\nAjoute cette ligne à ton .env (et aux variables de ton hébergeur) :\n\nDROPBOX_REFRESH_TOKEN=${json.refresh_token}\n`);
