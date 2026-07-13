'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, CirclePlus, Mail, LucideIcon } from 'lucide-react'

const ITEMS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/', label: 'Map', Icon: Map },
  { href: '/add-your-game', label: 'Add game', Icon: CirclePlus },
  { href: '/contact', label: 'Contact', Icon: Mail },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-20 flex items-stretch justify-around border-t border-border bg-card px-4 pt-1.5"
      style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-semibold transition-colors ${
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {active && <span aria-hidden className="absolute -top-1.5 h-0.5 w-6 rounded-full bg-primary" />}
            <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
            <span className={active ? 'font-display uppercase tracking-wide' : ''}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
