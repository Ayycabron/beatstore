import { useState } from 'react'

export default function BeatCard({ beat }) {
  const [cgv, setCgv] = useState(false)

  const coverUrl = beat.cover
    ? `/api/beats/cover/${encodeURIComponent(beat.cover)}`
    : null

  const mp3Url = beat.mp3Url || `/api/beats/file/${encodeURIComponent(beat.name)}`

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#23202b',
        borderRadius: 19,
        boxShadow: '0 4px 18px #0002',
        padding: '18px 26px',
        gap: 24,
        flexWrap: 'wrap',
        minHeight: 82,
      }}
    >
      {/* Cover */}
      {coverUrl && (
        <img
          src={coverUrl}
          alt={beat.title}
          style={{
            width: 72,
            height: 72,
            borderRadius: 10,
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      )}

      {/* Infos */}
      <div style={{ flexGrow: 1, minWidth: 170 }}>
        <b style={{ fontSize: 21, color: '#fed03d', fontWeight: 800 }}>
          {beat.title || beat.name}
        </b>
        <div style={{ color: '#bbb', fontSize: 14, marginTop: 4, display: 'flex', gap: 12 }}>
          {beat.bpm && <span>{beat.bpm} BPM</span>}
          {beat.key && <span>{beat.key}</span>}
          {beat.tags && beat.tags.length > 0 && <span>{beat.tags.join(', ').toUpperCase()}</span>}
          {beat.price != null && (
            <span style={{ color: '#e23268', fontWeight: 700 }}>{beat.price} €</span>
          )}
        </div>
      </div>

      {/* Lecteur audio */}
      <audio
        controls
        style={{
          width: 250,
          background: '#302b34',
          borderRadius: 9,
          flexShrink: 0,
        }}
      >
        <source src={mp3Url} type="audio/mpeg" />
        Votre navigateur ne supporte pas l&apos;audio HTML5.
      </audio>

      {/* Achat */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ marginBottom: 7, display: 'flex', alignItems: 'center', gap: 7 }}>
          <input
            type="checkbox"
            id={`cgv-${beat.name}`}
            checked={cgv}
            onChange={(e) => setCgv(e.target.checked)}
          />
          <label
            htmlFor={`cgv-${beat.name}`}
            style={{ fontSize: 13, color: '#fed03d', fontWeight: 700 }}
          >
            J&apos;accepte les{' '}
            <a
              href="/cgv.html"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#e23268', textDecoration: 'underline' }}
            >
              CGV
            </a>
          </label>
        </div>
        <button
          disabled={!cgv}
          style={{
            background: cgv ? 'linear-gradient(92deg,#fed03d,#e23268 96%)' : '#555',
            color: '#232',
            fontWeight: 900,
            borderRadius: 13,
            fontSize: 17,
            padding: '11px 28px',
            border: 'none',
            cursor: cgv ? 'pointer' : 'not-allowed',
          }}
        >
          Acheter · {beat.price != null ? `${beat.price} €` : '30 €'}
        </button>
      </div>
    </div>
  )
}
