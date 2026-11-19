import nodemailer from 'nodemailer';
import { config } from './config.js';

const smtpReady = !!(config.smtp.host && config.smtp.user && config.smtp.pass);

const transport = smtpReady
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    })
  : null;

export const mailReady = smtpReady;

export async function sendMail({ to, subject, html, text, replyTo }) {
  if (!transport) {
    console.log(`\n[mail non configuré] → ${to}\nSujet : ${subject}\n${text}\n`);
    return { simulated: true };
  }
  return transport.sendMail({ from: config.smtp.from, to, subject, html, text, replyTo });
}
