import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'

const cache = new Map()

export function loadPeaks(slug) {
  if (!cache.has(slug)) {
    const p = api(`/api/peaks/${slug}`).catch(() => null)
    cache.set(slug, p)
  }
  return cache.get(slug)
}

export function usePeaks(slug, enabled = true) {
  const [data, setData] = useState(null)
  useEffect(() => {
    if (!enabled || !slug) return
    let alive = true
    loadPeaks(slug).then((d) => alive && setData(d))
    return () => { alive = false }
  }, [slug, enabled])
  return data
}
