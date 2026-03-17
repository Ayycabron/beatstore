import { useState, useEffect } from 'react'
import BeatCard from './components/BeatCard.jsx'

export default function App() {
  const [beats, setBeats] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/beats')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setBeats(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Erreur chargement beats :', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const keywords = query.toLowerCase().split(' ').filter(Boolean)
  const filteredBeats = beats.filter((beat) =>
    keywords.every(
      (word) =>
        beat.title.toLowerCase().includes(word) ||
        beat.name.toLowerCase().includes(word) ||
        (beat.tags && beat.tags.some((tag) => tag.toLowerCase().includes(word))),
    ),
  )

  return (
    <div
      style={{
        fontFamily: 'Inter, Arial, sans-serif',
        minHeight: '100vh',
        background: 'linear-gradient(120deg,#181826 70%,#33204a 100%)',
      }}
    >
      <header
        style={{
          background: 'linear-gradient(90deg,#2d263a 60%,#e23268 100%)',
          padding: '34px 0 20px',
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            color: '#fece2f',
            fontWeight: 900,
            fontSize: 44,
            letterSpacing: -3,
            margin: 0,
            textShadow: '0 5px 18px #0007',
          }}
        >
          Beatstore
        </h1>
        <div
          style={{
            fontSize: 21,
            color: '#fff',
            fontWeight: 600,
            marginTop: 14,
          }}
        >
          Découvre ta prod sur-mesure — <span style={{ fontSize: 24 }}>🎧</span> Vitrine
          instrumentale premium
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: 'auto', padding: '24px 2vw' }}>
        <input
          type="text"
          placeholder="Recherche prod, type beat, artiste, style…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            marginBottom: 44,
            fontSize: 21,
            fontWeight: 600,
            borderRadius: 13,
            border: 'none',
            padding: 15,
            background: '#22223b',
            color: '#fefefe',
            boxShadow: '0 2px 9px #110c',
            boxSizing: 'border-box',
          }}
        />

        {loading && (
          <div style={{ color: '#fed03d', textAlign: 'center', fontSize: 20 }}>
            Chargement des beats…
          </div>
        )}

        {error && (
          <div
            style={{
              color: '#e23268',
              fontWeight: 700,
              fontSize: 18,
              padding: 24,
              background: '#32204a',
              borderRadius: 13,
            }}
          >
            Erreur : {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
            {filteredBeats.length ? (
              filteredBeats.map((beat) => <BeatCard key={beat.name} beat={beat} />)
            ) : (
              <div
                style={{
                  color: '#fed03d',
                  fontWeight: 700,
                  fontSize: 22,
                  padding: 55,
                  background: '#32204a',
                  borderRadius: 21,
                  boxShadow: '0 4px 24px #e2326855',
                }}
              >
                Aucun beat ne correspond à ta recherche.
              </div>
            )}
          </div>
        )}
      </main>

      <footer
        style={{
          marginTop: 62,
          padding: '38px 0 16px',
          color: '#888',
          textAlign: 'center',
          fontSize: 16,
          background: 'linear-gradient(90deg,#181826 40%,#e23268 100%)',
          borderTop: '1px solid #282630',
        }}
      >
        &copy; {new Date().getFullYear()} Beatstore &middot;{' '}
        <a
          href="/cgv.html"
          style={{ color: '#fed03d', textDecoration: 'underline', fontWeight: 700 }}
        >
          CGV &amp; Licences
        </a>
      </footer>
    </div>
  )
}
