import { CostType } from '@/types'

interface CostChipProps {
  costType?: CostType
  costCents?: number | null
  costLabel?: string | null
  className?: string
}

const CONFIGS: Record<Exclude<CostType, 'unknown'>, { label: string; color: string; bg: string }> = {
  free:         { label: 'Free',     color: 'oklch(0.68 0.21 145)', bg: 'oklch(0.68 0.21 145 / 14%)' },
  paid:         { label: 'Drop-in',  color: 'oklch(0.82 0.17 75)',  bg: 'oklch(0.82 0.17 75 / 14%)'  },
  registration: { label: 'Register', color: 'oklch(0.70 0.14 218)', bg: 'oklch(0.52 0.23 263 / 14%)' },
}

export default function CostChip({ costType, costCents, costLabel, className = '' }: CostChipProps) {
  if (!costType || costType === 'unknown') return null
  const cfg = CONFIGS[costType]
  let label = costLabel ?? cfg.label
  if (costType === 'paid' && costCents && !costLabel) {
    label = `$${(costCents / 100).toFixed(0)}`
  }
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${className}`}
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {label}
    </span>
  )
}
