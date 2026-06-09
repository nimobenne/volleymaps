'use client'

import { Waves, Trees, Building2, SlidersHorizontal, LucideIcon } from 'lucide-react'

type TypeFilter = 'all' | 'beach' | 'indoor' | 'grass'
type SkillFilter = 'all' | 'beginner' | 'intermediate' | 'competitive'
export type DayFilter = 'all' | 'today' | 'weekend'

interface FiltersProps {
  typeFilter: TypeFilter
  onTypeChange: (type: TypeFilter) => void
  skillFilter: SkillFilter
  onSkillChange: (skill: SkillFilter) => void
  dayFilter: DayFilter
  onDayChange: (v: DayFilter) => void
}

const TYPE_OPTIONS: { value: TypeFilter; label: string; Icon: LucideIcon }[] = [
  { value: 'all',    label: 'All',    Icon: SlidersHorizontal },
  { value: 'beach',  label: 'Beach',  Icon: Waves },
  { value: 'grass',  label: 'Grass',  Icon: Trees },
  { value: 'indoor', label: 'Indoor', Icon: Building2 },
]

const DAY_OPTIONS: { value: DayFilter; label: string }[] = [
  { value: 'all',     label: 'All days' },
  { value: 'today',   label: 'Today' },
  { value: 'weekend', label: 'Weekend' },
]

const SKILL_OPTIONS: { value: SkillFilter; label: string }[] = [
  { value: 'all',          label: 'Any skill' },
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'competitive',  label: 'Competitive' },
]

const activeCls = 'bg-primary text-primary-foreground shadow-sm'
const inactiveCls = 'bg-card/90 backdrop-blur border border-border text-muted-foreground hover:text-foreground'

interface PillRowProps<T extends string> {
  options: { value: T; label: string; Icon?: LucideIcon }[]
  active: T
  onSelect: (v: T) => void
  pillSize?: 'md' | 'sm'
}

function PillRow<T extends string>({ options, active, onSelect, pillSize = 'md' }: PillRowProps<T>) {
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-card/90 backdrop-blur-md px-1 py-1 shadow-lg shadow-black/30">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          onClick={() => onSelect(value)}
          className={`flex items-center gap-1.5 rounded-full font-semibold transition-all duration-150 whitespace-nowrap ${
            pillSize === 'md' ? 'px-2.5 py-1.5 md:px-4 text-xs md:text-sm min-h-[36px] min-w-[36px]' : 'px-2.5 py-1 text-[11px]'
          } ${active === value ? activeCls : inactiveCls}`}
        >
          {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
          {label}
        </button>
      ))}
    </div>
  )
}

export default function Filters({ typeFilter, onTypeChange, skillFilter, onSkillChange, dayFilter, onDayChange }: FiltersProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <PillRow options={TYPE_OPTIONS} active={typeFilter} onSelect={onTypeChange} pillSize="md" />
      <div className="w-full overflow-x-auto">
        <div className="flex items-center gap-1.5 w-max mx-auto">
          <PillRow options={DAY_OPTIONS} active={dayFilter} onSelect={onDayChange} pillSize="sm" />
          <div className="w-px h-5 bg-border shrink-0" />
          <PillRow options={SKILL_OPTIONS} active={skillFilter} onSelect={onSkillChange} pillSize="sm" />
        </div>
      </div>
    </div>
  )
}
