# VolleyMaps Design Context

## Target audience
Toronto volleyball players (rec to competitive, mostly 18-40) looking for a pickup game today or this week, usually on a phone, often outdoors or on transit. Secondary: organizers who want their games listed and admins approving submissions.

## Use cases
- "Is there a game near me tonight?" — open map, filter by day/type/skill, RSVP in seconds
- Check a venue's weekly schedule before heading out
- Submit a new game/venue as an organizer

## Brand personality / tone
"Court Lights" — evening beach court under floodlights. Energetic, sporty, a little gritty; not corporate, not cute. Fast and confident like a good pickup run. Dark theme is the identity, warm not techy.

## Visual system (established, keep)
- Warm charcoal background, amber/gold primary, Mikasa volleyball blue/yellow accents
- Venue type colors: beach amber, indoor blue, grass green (centralized in getVenueColor)
- Fonts: Barlow Condensed (display, uppercase, condensed sporty) + DM Sans (body)
- Live games get an animated pulse ring; teardrop SVG map pins
- WCAG AA is a hard floor: contrast + focus-visible rings everywhere

## Constraints
- Next.js 16 App Router, Tailwind v4, shadcn/ui, MapLibre GL
- Map performance is sacred: markers update in place, no re-mount flashes
- Mobile bottom nav + drawer pattern must keep working
- Live production site — changes ship to real users
