/** Utilitaires transverses : identifiants, aleatoire reproductible, texte. */

export function uid(prefix = 'x'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Generateur pseudo-aleatoire deterministe (mulberry32).
 * Une meme graine redonne exactement le meme concept : indispensable pour
 * pouvoir rejouer, partager et affiner une generation.
 */
export function makeRng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (max: number) => Math.floor(next() * max),
    range: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    /** Tire n elements distincts (ou tout le tableau s'il est plus court). */
    sample: <T>(arr: readonly T[], n: number): T[] => {
      const pool = [...arr]
      const out: T[] = []
      while (out.length < n && pool.length) {
        out.push(pool.splice(Math.floor(next() * pool.length), 1)[0])
      }
      return out
    },
    bool: (p = 0.5) => next() < p,
  }
}

export type Rng = ReturnType<typeof makeRng>

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff)
}

export function slug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function handleize(input: string): string {
  return slug(input).replace(/-/g, '.')
}

export function fileize(input: string): string {
  return slug(input).replace(/-/g, '_')
}

export function titleCase(input: string): string {
  return input.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Coupe une phrase proprement a n caracteres. */
export function clamp(text: string, n: number): string {
  if (text.length <= n) return text
  return `${text.slice(0, n - 1).replace(/[\s,;.]+$/, '')}…`
}

/** Assemble des fragments non vides en une phrase separee par sep. */
export function join(parts: (string | undefined | null)[], sep = ', '): string {
  return parts.map((p) => (p ?? '').trim()).filter(Boolean).join(sep)
}

export function ucFirst(text: string): string {
  const t = text.trim()
  return t ? t[0].toUpperCase() + t.slice(1) : t
}

/** Minuscule initiale, sauf si le mot est un sigle ou un nom propre en capitales. */
export function lcFirst(text: string): string {
  const t = text.trim()
  if (!t) return t
  const firstWord = t.split(/\s/)[0]
  if (firstWord === firstWord.toUpperCase() && firstWord.length > 1) return t
  return t[0].toLowerCase() + t.slice(1)
}

/** Termine une phrase par un point si besoin. */
export function sentence(text: string): string {
  const t = text.trim()
  if (!t) return ''
  return /[.!?…]$/.test(t) ? t : `${t}.`
}

export function download(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Repli pour les contextes non securises.
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
