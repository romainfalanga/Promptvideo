import type { AuditIssue, Project } from '../../types'
import { auditProject, scorePercent } from '../../engine/audit'
import { cx } from '../../lib/utils'
import { Card, Meter } from '../../components/ui'

const SECTION_TO_TAB: Record<string, string> = {
  Artiste: 'artiste',
  Direction: 'direction',
  Casting: 'casting',
  Lieux: 'lieux',
  Formats: 'formats',
  Videos: 'videos',
  References: 'references',
  Reglages: 'reglages',
}

const LEVEL_STYLE: Record<AuditIssue['level'], { chip: string; dot: string; label: string }> = {
  bloquant: { chip: 'border-signal-bad/40 text-signal-bad', dot: 'bg-signal-bad', label: 'Bloquant' },
  important: { chip: 'border-signal-warn/40 text-signal-warn', dot: 'bg-signal-warn', label: 'Important' },
  confort: { chip: 'border-signal-info/40 text-signal-info', dot: 'bg-signal-info', label: 'Confort' },
}

export default function AuditTab({ project, onGoTo }: { project: Project; onGoTo: (tab: string) => void }) {
  const audit = auditProject(project)
  const pct = scorePercent(audit)
  const counts = {
    bloquant: audit.issues.filter((i) => i.level === 'bloquant').length,
    important: audit.issues.filter((i) => i.level === 'important').length,
    confort: audit.issues.filter((i) => i.level === 'confort').length,
  }

  return (
    <div className="space-y-4">
      <Card
        title="Audit de l'univers"
        subtitle="Deux familles de controles : la solidite editoriale de l'univers, et la conformite technique aux contraintes reelles de Seedance 2.5."
      >
        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <div className="rounded-xl border border-ink-700/70 bg-ink-850/40 p-5 text-center">
            <div className={cx('font-display text-5xl', pct >= 85 ? 'text-signal-ok' : pct >= 60 ? 'text-signal-warn' : 'text-signal-bad')}>
              {pct}
              <span className="text-2xl text-ink-500">%</span>
            </div>
            <p className="mt-1 text-[12px] text-ink-400">
              {audit.score} / {audit.max} points
            </p>
            <div className="mt-3">
              <Meter value={pct} max={100} tone={pct >= 85 ? 'ok' : pct >= 60 ? 'amber' : 'bad'} />
            </div>
            <div className="mt-4 space-y-1 text-left text-[11.5px]">
              {(Object.keys(counts) as (keyof typeof counts)[]).map((k) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-ink-400">
                    <span className={cx('h-1.5 w-1.5 rounded-full', LEVEL_STYLE[k].dot)} />
                    {LEVEL_STYLE[k].label}
                  </span>
                  <span className="text-ink-200">{counts[k]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {audit.sections.map((s) => {
              const p = s.max ? Math.round((s.score / s.max) * 100) : 100
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => SECTION_TO_TAB[s.name] && onGoTo(SECTION_TO_TAB[s.name])}
                  className="block w-full text-left"
                >
                  <div className="mb-1 flex items-center justify-between text-[12.5px]">
                    <span className="text-ink-300 hover:text-ink-100">{s.name}</span>
                    <span className={p >= 90 ? 'text-signal-ok' : p >= 60 ? 'text-signal-warn' : 'text-signal-bad'}>{p} %</span>
                  </div>
                  <Meter value={p} max={100} tone={p >= 90 ? 'ok' : p >= 60 ? 'amber' : 'bad'} />
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {audit.issues.length === 0 ? (
        <Card title="Rien a corriger">
          <p className="text-[13px] text-ink-300">
            L'univers est complet et conforme aux contraintes du modele. Direction l&apos;onglet Export.
          </p>
        </Card>
      ) : (
        <Card title={`${audit.issues.length} point${audit.issues.length > 1 ? 's' : ''} a traiter`} subtitle="Classes par gravite. Clique pour aller directement a l'endroit concerne.">
          <div className="space-y-2.5">
            {audit.issues.map((i) => (
              <article key={i.id} className="rounded-lg border border-ink-700/70 bg-ink-850/40 p-4">
                <header className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={cx('rounded-full border px-2 py-0.5 text-[10.5px] uppercase tracking-wide', LEVEL_STYLE[i.level].chip)}>
                    {LEVEL_STYLE[i.level].label}
                  </span>
                  <h3 className="text-[14px] text-ink-100">{i.title}</h3>
                  {SECTION_TO_TAB[i.section] && (
                    <button
                      type="button"
                      className="ml-auto text-[12px] text-amber hover:underline"
                      onClick={() => onGoTo(SECTION_TO_TAB[i.section])}
                    >
                      Aller a {i.section} →
                    </button>
                  )}
                </header>
                <p className="text-[12.5px] leading-relaxed text-ink-300">{i.detail}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-amber-soft">→ {i.fix}</p>
              </article>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
