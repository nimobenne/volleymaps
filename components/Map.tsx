'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Venue, GameSession } from '@/types'
import { DEFAULT_CENTER, DEFAULT_ZOOM, MAP_STYLE } from '@/lib/mapbox'
import VenuePopover from './VenuePopover'

// Mikasa palette
const BEACH_COLOR  = '#D97706' // amber-gold
const INDOOR_COLOR = '#1D4ED8' // cobalt blue
const GRASS_COLOR  = '#16A34A' // grass green

interface MapProps {
  venues: Venue[]
  sessions: GameSession[]
  typeFilter: 'all' | 'beach' | 'indoor' | 'grass'
  searchQuery?: string
}

function createMarkerElement(venue: Venue, onClick: () => void): HTMLElement {
  const color = venue.type === 'beach' ? BEACH_COLOR : venue.type === 'grass' ? GRASS_COLOR : INDOOR_COLOR

  // wrapper: MapLibre owns the transform on this element (translate3d for positioning)
  const isMobile = window.innerWidth < 768
  const size = isMobile ? 44 : 36

  const wrapper = document.createElement('div')
  wrapper.style.cssText = `width:${size}px;height:${size}px;cursor:pointer;`
  wrapper.title = venue.name

  // pin: we apply scale() here — never conflicts with MapLibre's transform on wrapper
  const pin = document.createElement('div')
  pin.style.cssText = [
    `width:${size}px`,
    `height:${size}px`,
    'border-radius:50%',
    'border:2.5px solid rgba(255,255,255,0.95)',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    `font-size:${isMobile ? 20 : 16}px`,
    `background-color:${color}`,
    'box-shadow:0 0 0 3px rgba(0,0,0,0.25),0 4px 12px rgba(0,0,0,0.35)',
    'transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
    'will-change:transform',
  ].join(';')
  pin.textContent = '🏐'

  wrapper.appendChild(pin)

  wrapper.addEventListener('mouseenter', () => { pin.style.transform = 'scale(1.25)' })
  wrapper.addEventListener('mouseleave', () => { pin.style.transform = 'scale(1)' })
  wrapper.addEventListener('click', (e) => { e.stopPropagation(); onClick() })

  return wrapper
}

export default function Map({ venues, sessions, typeFilter, searchQuery = '' }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<{ marker: maplibregl.Marker; venueId: string }[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current.on('click', () => setSelectedVenue(null))

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const addMarkers = () => {
      markersRef.current.forEach(({ marker }) => marker.remove())
      markersRef.current = []

      const q = searchQuery.toLowerCase()
      venues
        .filter(v => typeFilter === 'all' || v.type === typeFilter)
        .forEach(venue => {
          const el = createMarkerElement(venue, () => setSelectedVenue(venue))
          const matches = !q || venue.name.toLowerCase().includes(q) || venue.address.toLowerCase().includes(q)
          el.style.opacity = matches ? '1' : '0.15'
          const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat([venue.lng, venue.lat])
            .addTo(map)
          markersRef.current.push({ marker, venueId: venue.id })
        })
    }

    if (map.loaded()) {
      addMarkers()
    } else {
      map.once('load', addMarkers)
    }
  }, [venues, typeFilter, searchQuery])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {selectedVenue && (
        <VenuePopover
          venue={selectedVenue}
          sessions={sessions.filter(s => s.venue_id === selectedVenue.id)}
          onClose={() => setSelectedVenue(null)}
        />
      )}
    </div>
  )
}
