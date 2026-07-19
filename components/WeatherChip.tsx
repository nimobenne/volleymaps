'use client'

import { useEffect, useState } from 'react'
import {
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain,
  CloudRainWind, Snowflake, CloudLightning, Thermometer, LucideIcon,
} from 'lucide-react'

interface WeatherData {
  temp: number | null
  label: string | null
  code: number | null
}

function iconFor(code: number): LucideIcon {
  if (code === 0) return Sun
  if (code === 1 || code === 2) return CloudSun
  if (code === 3) return Cloud
  if (code === 45 || code === 48) return CloudFog
  if (code >= 51 && code <= 55) return CloudDrizzle
  if (code >= 61 && code <= 65) return CloudRain
  if (code >= 71 && code <= 75) return Snowflake
  if (code === 80 || code === 81) return CloudRain
  if (code === 82) return CloudRainWind
  if (code >= 95) return CloudLightning
  return Thermometer
}

export default function WeatherChip() {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    fetch('/api/weather')
      .then(r => r.json())
      .then(setWeather)
      .catch(() => {})
  }, [])

  if (weather?.temp == null || weather.code == null) return null

  const Icon = iconFor(weather.code)

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span>{weather.temp}°C</span>
      {weather.label && <span className="text-muted-foreground/60">· {weather.label}</span>}
    </span>
  )
}
