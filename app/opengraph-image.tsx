import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'VolleyMaps — Find Pickup Volleyball in Toronto'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'oklch(0.13 0.008 65)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 96, marginBottom: 24 }}>🏐</div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: 'oklch(0.82 0.17 75)',
            letterSpacing: '-2px',
            textTransform: 'uppercase',
          }}
        >
          VolleyMaps
        </div>
        <div
          style={{
            fontSize: 32,
            color: 'oklch(0.65 0.020 70)',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Find pickup volleyball games in Toronto
        </div>
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 40,
            fontSize: 20,
            color: 'oklch(0.94 0.010 75)',
          }}
        >
          <span>🏖️ Beach</span>
          <span>🌿 Grass</span>
          <span>🏟️ Indoor</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
