export type PinOptions = {
  color: string
  isLive: boolean
  isMobile: boolean
}

export const TYPE_COLORS: Record<string, string> = {
  beach:  '#D97706',
  indoor: '#1D4ED8',
  grass:  '#16A34A',
}

export function createPinElement({ color, isLive, isMobile }: PinOptions): HTMLElement {
  const size = isMobile ? 44 : 36
  // Maintain the viewBox aspect ratio (36:44 = 9:11) so the teardrop isn't distorted
  const pinW = size
  const pinH = Math.round(size * (44 / 36))

  // Wrapper sized exactly to the pin — ring is absolutely positioned but uses pointer-events:none
  // and does NOT overflow the wrapper's layout box, so MapLibre anchor calc stays accurate.
  const wrapper = document.createElement('div')
  wrapper.style.cssText = [
    `width:${pinW}px`,
    `height:${pinH}px`,
    'cursor:pointer',
    'position:relative',
    'will-change:transform',   // stable compositing layer — prevents zoom-repaint artifacts
    'display:flex',
    'align-items:center',
    'justify-content:center',
  ].join(';')

  if (isLive) {
    const ring = document.createElement('div')
    // Ring is centered on the pin head (top ~36% of pinH), not the tip
    const headCY = Math.round(pinH * 0.34)
    const ringSize = Math.round(pinW * 1.5)
    const ringOffset = Math.round((ringSize - pinW) / 2)
    ring.style.cssText = [
      'position:absolute',
      `width:${ringSize}px`,
      `height:${ringSize}px`,
      'border-radius:50%',
      `border:2px solid ${color}`,
      'animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
      'pointer-events:none',
      `top:${headCY - ringSize / 2}px`,
      `left:${-ringOffset}px`,
    ].join(';')
    wrapper.appendChild(ring)
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', String(pinW))
  svg.setAttribute('height', String(pinH))
  svg.setAttribute('viewBox', '0 0 36 44')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  // Use filter on a wrapper element trick: filter on SVG creates compositing layer,
  // will-change on parent ensures it's stable before MapLibre starts moving it.
  svg.style.cssText = 'filter:drop-shadow(0 2px 4px rgba(0,0,0,0.45));transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1);transform:scale(1);'

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M18 0C9.163 0 2 7.163 2 16c0 10.5 16 28 16 28s16-17.5 16-28C34 7.163 26.837 0 18 0z')
  path.setAttribute('fill', color)
  path.setAttribute('stroke', 'rgba(255,255,255,0.9)')
  path.setAttribute('stroke-width', '2')

  const ball = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  ball.setAttribute('cx', '18')
  ball.setAttribute('cy', '15')
  ball.setAttribute('r', '7')
  ball.setAttribute('fill', 'rgba(255,255,255,0.25)')
  ball.setAttribute('stroke', 'rgba(255,255,255,0.8)')
  ball.setAttribute('stroke-width', '1.5')

  svg.appendChild(path)
  svg.appendChild(ball)
  wrapper.appendChild(svg)

  wrapper.addEventListener('mouseenter', () => { svg.style.transform = 'scale(1.2) translateY(-2px)' })
  wrapper.addEventListener('mouseleave', () => { svg.style.transform = 'scale(1)' })

  return wrapper
}
