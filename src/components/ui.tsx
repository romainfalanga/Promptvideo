import { useEffect, useRef, useState, type ReactNode } from 'react'
import { copyToClipboard, cx } from '../lib/utils'

/* ------------------------------------------------------------------ */
/* Champs                                                              */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  mono,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  mono?: boolean
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className={cx('input', mono && 'font-mono text-[12.5px]')}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="mt-1 block text-[11px] text-ink-500">{hint}</span>}
    </label>
  )
}

export function Area({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
  mono,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  hint?: string
  mono?: boolean
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea
        className={cx('textarea', mono && 'font-mono text-[12.5px]')}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="mt-1 block text-[11px] text-ink-500">{hint}</span>}
    </label>
  )
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-850">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  suffix?: string
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="relative">
        <input
          type="number"
          className="input pr-10"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-500">
            {suffix}
          </span>
        )}
      </div>
    </label>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5 text-left transition hover:border-ink-600"
    >
      <span>
        <span className="block text-sm text-ink-100">{label}</span>
        {hint && <span className="block text-[11px] text-ink-500">{hint}</span>}
      </span>
      <span
        className={cx(
          'relative h-5 w-9 shrink-0 rounded-full transition',
          checked ? 'bg-amber' : 'bg-ink-700',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-4 w-4 rounded-full bg-ink-950 transition-all',
            checked ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  )
}

/** Liste de chaines editable (valeurs, interdits, negatifs, beats...). */
export function ListEditor({
  label,
  items,
  onChange,
  placeholder,
  ordered,
}: {
  label: string
  items: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  ordered?: boolean
}) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (!v) return
    onChange([...items, v])
    setDraft('')
  }
  return (
    <div>
      <span className="label">{label}</span>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={`${i}-${it.slice(0, 8)}`} className="flex items-start gap-2">
            <span className="mt-2 w-5 shrink-0 text-right text-[11px] text-ink-500">
              {ordered ? `${i + 1}.` : '•'}
            </span>
            <input
              className="input flex-1"
              value={it}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            />
            <button
              type="button"
              className="btn-quiet mt-0.5 px-2 py-1.5 text-ink-500 hover:text-signal-bad"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label="Supprimer"
            >
              ✕
            </button>
          </div>
        ))}
        <div className="flex items-center gap-2 pl-7">
          <input
            className="input flex-1"
            value={draft}
            placeholder={placeholder ?? 'Ajouter…'}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add()
              }
            }}
          />
          <button type="button" className="btn-ghost px-3 py-1.5" onClick={add}>
            +
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Structure                                                           */
/* ------------------------------------------------------------------ */

export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx('panel p-5', className)}>
      {(title || actions) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="section-title">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-[12.5px] text-ink-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

export function Grid({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  return (
    <div
      className={cx(
        'grid gap-4',
        cols === 1 && 'grid-cols-1',
        cols === 2 && 'grid-cols-1 md:grid-cols-2',
        cols === 3 && 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
      )}
    >
      {children}
    </div>
  )
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="font-display text-base text-ink-200">{title}</p>
      {hint && <p className="max-w-md text-[13px] text-ink-400">{hint}</p>}
      {action}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Copie                                                               */
/* ------------------------------------------------------------------ */

export function CopyButton({
  text,
  label = 'Copier',
  className,
  variant = 'ghost',
}: {
  text: string
  label?: string
  className?: string
  variant?: 'ghost' | 'primary' | 'quiet'
}) {
  const [done, setDone] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  return (
    <button
      type="button"
      className={cx(
        variant === 'primary' ? 'btn-primary' : variant === 'quiet' ? 'btn-quiet' : 'btn-ghost',
        className,
      )}
      onClick={async () => {
        const ok = await copyToClipboard(text)
        setDone(ok)
        if (timer.current) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setDone(false), 1600)
      }}
    >
      {done ? '✓ Copié' : label}
    </button>
  )
}

export function CodeBlock({ text, maxHeight = 420 }: { text: string; maxHeight?: number }) {
  return (
    <pre className="code overflow-auto" style={{ maxHeight }}>
      {text}
    </pre>
  )
}

/* ------------------------------------------------------------------ */
/* Divers                                                              */
/* ------------------------------------------------------------------ */

export function Swatches({ colors }: { colors: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((c) => (
        <span key={c} className="flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-850 py-1 pl-1 pr-2">
          <span className="h-4 w-4 rounded" style={{ background: c }} />
          <span className="font-mono text-[10.5px] text-ink-400">{c}</span>
        </span>
      ))}
    </div>
  )
}

export function Meter({ value, max, tone = 'amber' }: { value: number; max: number; tone?: 'amber' | 'ok' | 'bad' }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  const color = tone === 'ok' ? 'bg-signal-ok' : tone === 'bad' ? 'bg-signal-bad' : 'bg-amber'
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
      <div className={cx('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Collapse({ title, children, defaultOpen = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-ink-700/70 bg-ink-850/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-ink-200 hover:text-ink-100"
      >
        <span>{title}</span>
        <span className={cx('text-ink-500 transition-transform', open && 'rotate-90')}>›</span>
      </button>
      {open && <div className="border-t border-ink-700/70 p-4">{children}</div>}
    </div>
  )
}

export function ConfirmButton({
  label,
  confirmLabel = 'Confirmer ?',
  onConfirm,
  className,
}: {
  label: string
  confirmLabel?: string
  onConfirm: () => void
  className?: string
}) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = window.setTimeout(() => setArmed(false), 3000)
    return () => window.clearTimeout(t)
  }, [armed])
  return (
    <button
      type="button"
      className={cx(armed ? 'btn-danger' : 'btn-quiet', className)}
      onClick={() => {
        if (armed) {
          onConfirm()
          setArmed(false)
        } else setArmed(true)
      }}
    >
      {armed ? confirmLabel : label}
    </button>
  )
}
