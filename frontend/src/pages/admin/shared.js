export const STATUS = {
  new: 'Nouvelle',
  link_sent: 'Lien envoyé',
  offers_sent: 'Licences envoyées',
  sold: 'Vendu',
  closed: 'Classé',
}

export const fmtDate = (iso) =>
  new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export const storage = {
  get(k, d = '') { try { return sessionStorage.getItem(k) ?? localStorage.getItem(k) ?? d } catch { return d } },
  session(k, v) { try { v === null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v) } catch {} },
  local(k, v) { try { localStorage.setItem(k, v) } catch {} },
}
