import { hueOf } from './format.js'

const cache = new Map()

// Couleur dominante (moyenne saturée) d'une cover, pour le halo d'ambiance.
export function coverColor(beat) {
  if (!beat) return Promise.resolve(null)
  if (cache.has(beat.slug)) return cache.get(beat.slug)
  const fallback = `hsl(${hueOf(beat.slug)} 70% 45%)`
  const p = !beat.cover
    ? Promise.resolve(fallback)
    : new Promise((resolve) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          try {
            const c = document.createElement('canvas')
            c.width = c.height = 24
            const ctx = c.getContext('2d', { willReadFrequently: true })
            ctx.drawImage(img, 0, 0, 24, 24)
            const d = ctx.getImageData(0, 0, 24, 24).data
            let r = 0, g = 0, b = 0, w = 0
            for (let i = 0; i < d.length; i += 4) {
              const max = Math.max(d[i], d[i + 1], d[i + 2])
              const min = Math.min(d[i], d[i + 1], d[i + 2])
              const weight = (max - min) / 255 + 0.05 // les pixels saturés comptent plus
              r += d[i] * weight; g += d[i + 1] * weight; b += d[i + 2] * weight; w += weight
            }
            resolve(`rgb(${Math.round(r / w)} ${Math.round(g / w)} ${Math.round(b / w)})`)
          } catch {
            resolve(fallback)
          }
        }
        img.onerror = () => resolve(fallback)
        img.src = beat.cover
      })
  cache.set(beat.slug, p)
  return p
}
