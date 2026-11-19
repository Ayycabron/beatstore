// Lecteur global : un seul élément <audio> hors du DOM (donc aucun menu « Télécharger »),
// exposé à React via useSyncExternalStore. Les composants s'abonnent à la tranche dont ils ont besoin.
import { useSyncExternalStore } from 'react'
import { coverColor } from '../lib/color.js'

const audio = new Audio()
audio.preload = 'metadata'

const readVolume = () => {
  try { return Number(localStorage.getItem('bs_volume') ?? 0.9) } catch { return 0.9 }
}
audio.volume = readVolume()

let state = {
  queue: [],
  current: null,
  playing: false,
  loading: false,
  time: 0,
  duration: 0,
  volume: audio.volume,
}
const listeners = new Set()

function set(patch) {
  state = { ...state, ...patch }
  for (const l of listeners) l()
}

// Temps fluide pendant la lecture (timeupdate n'arrive que ~4 fois/s)
let raf = 0
function tick() {
  set({ time: audio.currentTime })
  raf = requestAnimationFrame(tick)
}

audio.addEventListener('play', () => { set({ playing: true }); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick) })
audio.addEventListener('pause', () => { set({ playing: false, time: audio.currentTime }); cancelAnimationFrame(raf) })
audio.addEventListener('waiting', () => set({ loading: true }))
audio.addEventListener('playing', () => set({ loading: false }))
audio.addEventListener('loadedmetadata', () => set({ duration: audio.duration }))
audio.addEventListener('ended', () => player.next({ wrap: false }))
audio.addEventListener('error', () => set({ loading: false, playing: false }))

function updateMediaSession(beat) {
  if (!('mediaSession' in navigator) || !beat) return
  navigator.mediaSession.metadata = new MediaMetadata({
    title: beat.title,
    artist: document.title.split('·')[0].trim(),
    album: [beat.bpm && `${beat.bpm} BPM`, beat.key].filter(Boolean).join(' · '),
    artwork: beat.cover ? [{ src: beat.cover, sizes: '600x600' }] : [],
  })
}

export const player = {
  setQueue(queue) {
    set({ queue })
  },
  /** Lance une prod (ou pause/reprend si c'est déjà elle). startRatio : démarrer à x % (clic sur la waveform). */
  play(beat, startRatio) {
    if (state.current?.slug === beat.slug) return startRatio === undefined ? player.toggle() : player.seekRatio(startRatio)
    set({ current: beat, time: 0, duration: beat.duration || 0, loading: true })
    audio.src = beat.stream
    if (startRatio) {
      audio.addEventListener('loadedmetadata', () => { audio.currentTime = startRatio * audio.duration }, { once: true })
    }
    audio.play().catch(() => set({ loading: false }))
    updateMediaSession(beat)
    coverColor(beat).then((c) => c && document.documentElement.style.setProperty('--ambient', c))
  },
  toggle() {
    if (!state.current) return state.queue[0] && player.play(state.queue[0])
    audio.paused ? audio.play().catch(() => {}) : audio.pause()
  },
  pause() {
    audio.pause()
  },
  seek(seconds) {
    if (!state.current) return
    const d = audio.duration || state.duration
    audio.currentTime = Math.max(0, Math.min(d || 0, seconds))
    set({ time: audio.currentTime })
  },
  seekRatio(ratio) {
    player.seek(ratio * (audio.duration || state.duration))
  },
  step(delta, { wrap = true } = {}) {
    const { queue, current } = state
    if (!queue.length) return
    const i = queue.findIndex((b) => b.slug === current?.slug)
    let j = i + delta
    if (j >= queue.length || j < 0) {
      if (!wrap) return audio.pause()
      j = (j + queue.length) % queue.length
    }
    player.play(queue[j])
  },
  next(opts) { player.step(1, opts) },
  prev() {
    if (audio.currentTime > 3) return player.seek(0)
    player.step(-1)
  },
  setVolume(v) {
    audio.volume = Math.max(0, Math.min(1, v))
    set({ volume: audio.volume })
    try { localStorage.setItem('bs_volume', String(audio.volume)) } catch {}
  },
}

if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => player.toggle())
  navigator.mediaSession.setActionHandler('pause', () => player.pause())
  navigator.mediaSession.setActionHandler('nexttrack', () => player.next())
  navigator.mediaSession.setActionHandler('previoustrack', () => player.prev())
}

// Raccourcis : espace = lecture/pause, ← → = ±5 s, Maj+← → = prod précédente/suivante
window.addEventListener('keydown', (e) => {
  const t = e.target
  if (t.closest?.('input, textarea, select, button, [contenteditable], dialog') || e.metaKey || e.ctrlKey || e.altKey) return
  if (e.code === 'Space') { e.preventDefault(); player.toggle() }
  else if (e.key === 'ArrowRight') { e.preventDefault(); e.shiftKey ? player.next() : player.seek(audio.currentTime + 5) }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); e.shiftKey ? player.prev() : player.seek(audio.currentTime - 5) }
})

const subscribe = (cb) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** usePlayer((s) => s.playing) : ne re-rend que si la valeur choisie change. */
export function usePlayer(selector) {
  return useSyncExternalStore(subscribe, () => selector(state))
}

/** Progression (0-1) d'une prod donnée : 0 si ce n'est pas celle en cours. */
export function useProgress(slug) {
  return usePlayer((s) => (s.current?.slug === slug && s.duration ? s.time / s.duration : 0))
}

export const useIsCurrent = (slug) => usePlayer((s) => s.current?.slug === slug)
export const useIsPlaying = (slug) => usePlayer((s) => s.current?.slug === slug && s.playing)
