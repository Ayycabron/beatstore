import { useCallback, useEffect, useRef, useState } from 'react'
import { api, usePath } from './lib.jsx'
import { Header, Footer, Player, RequestModal } from './components.jsx'
import Home from './pages/Home.jsx'
import LicencesPage from './pages/LicencesPage.jsx'
import Mentions from './pages/Mentions.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  const path = usePath()
  const [cfg, setCfg] = useState(null)
  const [beats, setBeats] = useState(null)
  const [error, setError] = useState('')
  const [current, setCurrent] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [requesting, setRequesting] = useState(null)
  const audio = useRef(null)

  useEffect(() => {
    api('/api/config').then(setCfg).catch((e) => setError(e.message))
    api('/api/beats').then(setBeats).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    document.body.style.setProperty('--player-h', current ? '96px' : '0px')
  }, [current])

  const play = useCallback((beat) => {
    const el = audio.current
    if (current?.slug === beat.slug) {
      el.paused ? el.play() : el.pause()
      return
    }
    setCurrent(beat)
    setTime(0)
    setDuration(0)
    el.src = beat.stream
    el.play().catch(() => {})
  }, [current])

  const isAdmin = path.startsWith('/admin')

  return (
    <>
      {/* Lecteur sans contrôles natifs : pas de bouton « Télécharger » */}
      <audio
        ref={audio}
        preload="none"
        controlsList="nodownload"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onContextMenu={(e) => e.preventDefault()}
      />
      <Header site={cfg?.site} />
      {error && <div className="wrap"><div className="alert">Le site n'arrive pas à joindre le serveur ({error}).</div></div>}
      {isAdmin ? (
        <Admin cfg={cfg} />
      ) : path === '/licences' ? (
        <LicencesPage cfg={cfg} />
      ) : path === '/mentions' ? (
        <Mentions cfg={cfg} />
      ) : (
        <Home cfg={cfg} beats={beats} current={current} playing={playing} onPlay={play} onRequest={setRequesting} />
      )}
      <Footer site={cfg?.site} />
      {!isAdmin && (
        <Player
          beat={current}
          playing={playing}
          time={time}
          duration={duration}
          onToggle={() => play(current)}
          onSeek={(t) => { audio.current.currentTime = t }}
          onRequest={setRequesting}
        />
      )}
      {requesting && <RequestModal beat={requesting} usages={cfg?.usages} site={cfg?.site} onClose={() => setRequesting(null)} />}
    </>
  )
}
