'use client'

interface FiltersProps {
  typeFilter: 'all' | 'beach' | 'indoor' | 'grass'
  onTypeChange: (type: 'all' | 'beach' | 'indoor' | 'grass') => void
}

const TYPES = [
  { value: 'all',    label: 'All' },
  { value: 'beach',  label: '🏖  Beach' },
  { value: 'grass',  label: '🌿  Grass' },
  { value: 'indoor', label: '🏟  Indoor' },
] as const

export default function Filters({ typeFilter, onTypeChange }: FiltersProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-card/90 backdrop-blur-md px-1 py-1 shadow-lg shadow-black/30">
      {TYPES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onTypeChange(value)}
          className={`
            px-2.5 py-1.5 md:px-4 rounded-full text-xs md:text-sm font-semibold transition-all duration-150 whitespace-nowrap min-h-[36px] min-w-[36px]
            ${typeFilter === value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
