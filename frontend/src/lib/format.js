export const fmtTime = (s) => {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

const nf = new Intl.NumberFormat('fr-FR')
export const fmtNum = (n) => nf.format(n).replace(/ /g, ' ')

export const fmtCompact = (n) =>
  n >= 1_000_000 ? `${n / 1_000_000} M` : n >= 1000 ? `${n / 1000} k` : String(n)

// Hash stable d'une chaîne → teinte, pour les covers générées
export function hueOf(str) {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % 360
}
