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
  const wrapper = document.createElement('div')
  wrapper.style.cssText = `width:${size}px;height:${size + 8}px;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;`

  if (isLive) {
    const ring = document.createElement('div')
    ring.style.cssText = [
      'position:absolute',
      `width:${size + 10}px`,
      `height:${size + 10}px`,
      'border-radius:50%',
      `border:2px solid ${color}`,
      'opacity:0.6',
      'animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
      'top:-5px',
      'left:-5px',
    ].join(';')
    wrapper.appendChild(ring)
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', String(size))
  svg.setAttribute('height', String(size + 8))
  svg.setAttribute('viewBox', '0 0 36 44')
  svg.style.cssText = 'filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5));transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1);'

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
