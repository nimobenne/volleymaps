'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Venue, GameSession } from '@/types'
import { DEFAULT_CENTER, DEFAULT_ZOOM, MAP_STYLE } from '@/lib/mapbox'
import VenuePopover from './VenuePopover'
import { createPinElement, TYPE_COLORS } from './MapPin'
import { isLiveNow } from '@/lib/sessions'

interface MapProps {
  venues: Venue[]
  sessions: GameSession[]
  typeFilter: 'all' | 'beach' | 'indoor' | 'grass'
  searchQuery?: string
  onPinTap?: () => void
  onGeolocate?: (coords: { lat: number; lng: number }) => void
}


export default function Map({ venues, sessions, typeFilter, searchQuery = '', onPinTap, onGeolocate }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<{ marker: maplibregl.Marker; venueId: string }[]>([])
  const onPinTapRef = useRef(onPinTap)
  const onGeolocateRef = useRef(onGeolocate)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)

  useEffect(() => { onPinTapRef.current = onPinTap })
  useEffect(() => { onGeolocateRef.current = onGeolocate })

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    const geoControl = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showAccuracyCircle: false,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geoControl.on('geolocate', (e: any) => {
      onGeolocateRef.current?.({ lat: e.coords.latitude, lng: e.coords.longitude })
    })

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current.addControl(geoControl, 'top-right')
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
          const venueSessions = sessions.filter(s => s.venue_id === venue.id)
          const hasLive = venueSessions.some(s => isLiveNow(s))
          const color = TYPE_COLORS[venue.type] ?? TYPE_COLORS.indoor
          const el = createPinElement({
            color,
            isLive: hasLive,
            isMobile: window.innerWidth < 768,
          })
          el.title = venue.name
          const matches = !q || venue.name.toLowerCase().includes(q) || venue.address.toLowerCase().includes(q)
          el.style.opacity = matches ? '1' : '0.15'
          el.addEventListener('click', (e) => {
            e.stopPropagation()
            setSelectedVenue(venue)
            onPinTapRef.current?.()
          })
          const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([venue.lng, venue.lat])
            .addTo(map)
          markersRef.current.push({ marker, venueId: venue.id })
        })
    }

    if (map.loaded()) addMarkers()
    else map.once('load', addMarkers)
  }, [venues, sessions, typeFilter, searchQuery])

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
