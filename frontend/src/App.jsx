import { lazy, Suspense, useEffect, useState } from 'react'
import { api } from './lib/api.js'
import { usePath } from './lib/router.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import PlayerDock from './components/PlayerDock.jsx'
import RequestSheet from './components/RequestSheet.jsx'
import Home from './pages/Home.jsx'

// Pages secondaires chargées à la demande : la page d'accueil reste légère.
const Licences = lazy(() => import('./pages/Licences.jsx'))
const Mentions = lazy(() => import('./pages/Mentions.jsx'))
const Admin = lazy(() => import('./pages/admin/Admin.jsx'))

const TITLES = { '/licences': 'Licences', '/mentions': 'Mentions légales', '/admin': 'Admin' }

export default function App() {
  const path = usePath()
  const [cfg, setCfg] = useState(null)
  const [beats, setBeats] = useState(null)
  const [error, setError] = useState('')
  const [requesting, setRequesting] = useState(null)

  useEffect(() => {
    api('/api/config').then(setCfg).catch((e) => setError(e.message))
    api('/api/beats').then(setBeats).catch((e) => { setError(e.message); setBeats([]) })
  }, [])

  useEffect(() => {
    const name = cfg?.site?.producerName || 'Beatstore'
    const page = TITLES[path] || (path.startsWith('/admin') ? 'Admin' : null)
    document.title = page ? `${page} · ${name}` : `${name} · Prods`
  }, [path, cfg])

  const isAdmin = path.startsWith('/admin')
  let page
  if (isAdmin) page = <Admin cfg={cfg} />
  else if (path === '/licences') page = <Licences cfg={cfg} />
  else if (path === '/mentions') page = <Mentions cfg={cfg} />
  else page = <Home cfg={cfg} beats={beats} onRequest={setRequesting} />

  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <Header site={cfg?.site} />
      {error && <div className="container"><p role="alert" style={{ color: 'var(--danger)' }}>Le serveur ne répond pas ({error}).</p></div>}
      <Suspense fallback={<main style={{ minHeight: '70vh' }} />}>{page}</Suspense>
      <Footer site={cfg?.site} />
      {!isAdmin && <PlayerDock onRequest={setRequesting} />}
      {requesting && <RequestSheet beat={requesting} usages={cfg?.usages} site={cfg?.site} onClose={() => setRequesting(null)} />}
    </>
  )
}
