'use client'

import { useEffect, useState } from 'react'

interface WeatherData {
  temp: number | null
  label: string | null
  icon: string | null
}

export default function WeatherChip() {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    fetch('/api/weather')
      .then(r => r.json())
      .then(setWeather)
      .catch(() => {})
  }, [])

  if (!weather?.temp || !weather.icon) return null

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <span>{weather.icon}</span>
      <span>{weather.temp}°C</span>
      {weather.label && <span className="text-muted-foreground/60">· {weather.label}</span>}
    </span>
  )
}
