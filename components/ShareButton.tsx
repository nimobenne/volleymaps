'use client'

import { useState } from 'react'
import { Link2, Check, Share2 } from 'lucide-react'

interface ShareButtonProps {
  url: string
  text?: string
  compact?: boolean
}

export default function ShareButton({ url, text, compact = false }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const payload = text ? `${text} ${url}` : url

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for browsers that block clipboard
      window.prompt('Copy this link:', payload)
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Link copied' : 'Share this session'}
        title={copied ? 'Copied!' : 'Share'}
        className="p-1.5 min-h-[28px] min-w-[28px] inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Share2 className="h-3.5 w-3.5" />}
      </button>
    )
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Link2 className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
