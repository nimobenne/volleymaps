import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Venue, VenueType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isNewVenue(venue: Venue): boolean {
  if (!venue.created_at) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)
  return new Date(venue.created_at) > cutoff
}

export function getVenueColor(type: VenueType): string {
  if (type === 'beach') return 'oklch(0.82 0.17 75)'
  if (type === 'grass') return 'oklch(0.55 0.18 145)'
  return 'oklch(0.70 0.14 218)'
}

export function getVenueLabel(type: VenueType): string {
  if (type === 'beach') return 'Beach'
  if (type === 'grass') return 'Grass'
  return 'Indoor'
}
