// Volleyball mark — circle with panel seams, drawn in the amber primary.
export default function Logo({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 2.8c3.5 3 5 7.5 4.2 12.6" />
      <path d="M2.9 13.7c4.3-1.4 9-.6 13 2.6" />
      <path d="M20.3 8.1c-4.4 1.5-7.9 4.6-9.9 9.6" />
    </svg>
  )
}
