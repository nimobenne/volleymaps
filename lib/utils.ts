import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Venue } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isNewVenue(venue: Venue): boolean {
  if (!venue.created_at) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)
  return new Date(venue.created_at) > cutoff
}
