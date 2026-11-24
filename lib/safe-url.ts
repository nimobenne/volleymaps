// Links from forms are rendered as <a href>, so only http(s) may through:
// `new URL('javascript:alert(1)')` parses fine and would run on click.
export function safeHttpUrl(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim()
  if (!v) return null
  try {
    const { protocol } = new URL(v)
    return protocol === 'https:' || protocol === 'http:' ? v : null
  } catch {
    return null
  }
}
