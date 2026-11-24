import { Volleyball } from 'lucide-react'

export default function DataLoadError() {
  return (
    <div className="flex min-h-[calc(100dvh-3.25rem)] items-center justify-center bg-background px-6 py-16 md:min-h-[calc(100dvh-5.75rem)]">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 text-center shadow-[0_0_80px_oklch(0.72_0.16_75_/_0.08)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
          <Volleyball className="h-7 w-7" strokeWidth={1.5} aria-hidden />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">Court Lights</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Games could not load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again soon.</p>
      </div>
    </div>
  )
}
