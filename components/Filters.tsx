'use client'

type TypeFilter = 'all' | 'beach' | 'indoor' | 'grass'
type SkillFilter = 'all' | 'beginner' | 'intermediate' | 'competitive'

interface FiltersProps {
  typeFilter: TypeFilter
  onTypeChange: (type: TypeFilter) => void
  skillFilter: SkillFilter
  onSkillChange: (skill: SkillFilter) => void
}

const TYPES = [
  { value: 'all',    label: 'All' },
  { value: 'beach',  label: '🏖  Beach' },
  { value: 'grass',  label: '🌿  Grass' },
  { value: 'indoor', label: '🏟  Indoor' },
] as const

const SKILLS = [
  { value: 'all',          label: 'All levels' },
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'competitive',  label: 'Competitive' },
] as const

const pill = (active: boolean) =>
  `rounded-full font-semibold transition-all duration-150 whitespace-nowrap ${
    active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
  }`

export default function Filters({ typeFilter, onTypeChange, skillFilter, onSkillChange }: FiltersProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-0.5 rounded-full border border-border bg-card/90 backdrop-blur-md px-1 py-1 shadow-lg shadow-black/30">
        {TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onTypeChange(value)}
            className={`px-2.5 py-1.5 md:px-4 text-xs md:text-sm min-h-[36px] min-w-[36px] ${pill(typeFilter === value)}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-0.5 rounded-full border border-border bg-card/90 backdrop-blur-md px-1 py-1 shadow-lg shadow-black/30">
        {SKILLS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onSkillChange(value)}
            className={`px-2.5 py-1 text-[11px] ${pill(skillFilter === value)}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
