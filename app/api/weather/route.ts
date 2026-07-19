import { NextResponse } from 'next/server'

export const revalidate = 1800

const WMO_LABEL: Record<number, string> = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Foggy',
  51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
  61: 'Rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
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
    return NextResponse.json({ temp, label: WMO_LABEL[code] ?? 'Unknown', code })
  } catch (err) {
    console.error('[weather] fetch error:', err)
    return NextResponse.json({ temp: null, label: null, code: null })
  }
}
