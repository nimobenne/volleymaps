import { NextResponse } from 'next/server'

export const revalidate = 1800

const WMO: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Clear',         icon: '☀️' },
  1:  { label: 'Mostly clear',  icon: '🌤️' },
  2:  { label: 'Partly cloudy', icon: '⛅' },
  3:  { label: 'Overcast',      icon: '☁️' },
  45: { label: 'Foggy',         icon: '🌫️' },
  48: { label: 'Foggy',         icon: '🌫️' },
  51: { label: 'Drizzle',       icon: '🌦️' },
  53: { label: 'Drizzle',       icon: '🌦️' },
  55: { label: 'Drizzle',       icon: '🌦️' },
  61: { label: 'Rain',          icon: '🌧️' },
  63: { label: 'Rain',          icon: '🌧️' },
  65: { label: 'Heavy rain',    icon: '🌧️' },
  71: { label: 'Snow',          icon: '❄️' },
  73: { label: 'Snow',          icon: '❄️' },
  75: { label: 'Heavy snow',    icon: '❄️' },
  80: { label: 'Showers',       icon: '🌦️' },
  81: { label: 'Showers',       icon: '🌦️' },
  82: { label: 'Heavy showers', icon: '⛈️' },
  95: { label: 'Thunderstorm',  icon: '⛈️' },
  96: { label: 'Thunderstorm',  icon: '⛈️' },
  99: { label: 'Thunderstorm',  icon: '⛈️' },
}

export async function GET() {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=43.65&longitude=-79.38&current=temperature_2m,weather_code&timezone=America/Toronto',
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) throw new Error('Weather fetch failed')
    const data = await res.json()
    const code = data.current.weather_code as number
    const temp = Math.round(data.current.temperature_2m as number)
    const weather = WMO[code] ?? { label: 'Unknown', icon: '🌡️' }
    return NextResponse.json({ temp, label: weather.label, icon: weather.icon })
  } catch (err) {
    console.error('[weather] fetch error:', err)
    return NextResponse.json({ temp: null, label: null, icon: null })
  }
}
