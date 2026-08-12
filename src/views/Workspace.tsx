import { useState } from 'react'
import type { Project } from '../types'
import { auditProject, scorePercent } from '../engine/audit'
import { getUniverse } from '../data/universes'
import { cx } from '../lib/utils'
import { Meter } from '../components/ui'
import ArtistTab from './tabs/ArtistTab'
import DirectionTab from './tabs/DirectionTab'
import CastTab from './tabs/CastTab'
import PlacesTab from './tabs/PlacesTab'
import FormatsTab from './tabs/FormatsTab'
import VideosTab from './tabs/VideosTab'
import ReferencesTab from './tabs/ReferencesTab'
import SettingsTab from './tabs/SettingsTab'
import AuditTab from './tabs/AuditTab'
import ExportTab from './tabs/ExportTab'

const TABS = [
  { id: 'artiste', label: 'Identité', step: 2 },
  { id: 'direction', label: 'Direction artistique', step: 2 },
  { id: 'casting', label: 'Casting', step: 2 },
  { id: 'lieux', label: 'Lieux', step: 2 },
  { id: 'formats', label: 'Formats', step: 2 },
  { id: 'references', label: 'References', step: 3 },
  { id: 'videos', label: 'Vidéos', step: 4 },
  { id: 'reglages', label: 'Reglages', step: 4 },
  { id: 'audit', label: 'Audit', step: 5 },
  { id: 'export', label: 'Export', step: 5 },
] as const

type TabId = (typeof TABS)[number]['id']

export default function Workspace({ project }: { project: Project }) {
  const [tab, setTab] = useState<TabId>('artiste')
  const audit = auditProject(project)
  const pct = scorePercent(audit)
  const u = getUniverse(project.universeId)
  const blocking = audit.issues.filter((i) => i.level === 'bloquant').length

  return (
    <div className="space-y-5">
      <header className="panel flex flex-wrap items-end justify-between gap-5 p-5">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="chip">
              {u.emoji} {u.name}
            </span>
            <span className="chip">{project.origin === 'studio' ? 'Mode Studio' : 'Mode Sur-Mesure'}</span>
            <span className="chip font-mono">graine {project.seedNumber}</span>
          </div>
          <h1 className="font-display text-3xl leading-tight text-ink-100">{project.name}</h1>
          <p className="text-[13px] text-ink-400">{project.artist.tagline || project.direction.pitch}</p>
        </div>

        <div className="w-full max-w-xs">
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="text-ink-400">Complétude de l'univers</span>
            <span className={pct >= 85 ? 'text-signal-ok' : pct >= 60 ? 'text-signal-warn' : 'text-signal-bad'}>
              {pct} %
            </span>
          </div>
          <Meter value={pct} max={100} tone={pct >= 85 ? 'ok' : pct >= 60 ? 'amber' : 'bad'} />
          <p className="mt-1.5 text-[11.5px] text-ink-500">
            {blocking > 0 ? (
              <button type="button" className="text-signal-bad hover:underline" onClick={() => setTab('audit')}>
                {blocking} point{blocking > 1 ? 's' : ''} bloquant{blocking > 1 ? 's' : ''} — voir l&apos;audit
              </button>
            ) : (
              <span className="text-signal-ok">Aucun point bloquant.</span>
            )}
          </p>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-ink-800 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cx(
              'rounded-lg px-3 py-1.5 text-[13px] transition',
              tab === t.id ? 'bg-amber text-ink-950 font-medium' : 'text-ink-400 hover:bg-ink-850 hover:text-ink-200',
            )}
          >
            <span className="mr-1.5 text-[10px] opacity-60">{t.step}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <div>
        {tab === 'artiste' && <ArtistTab project={project} />}
        {tab === 'direction' && <DirectionTab project={project} />}
        {tab === 'casting' && <CastTab project={project} />}
        {tab === 'lieux' && <PlacesTab project={project} />}
        {tab === 'formats' && <FormatsTab project={project} />}
        {tab === 'references' && <ReferencesTab project={project} />}
        {tab === 'videos' && <VideosTab project={project} />}
        {tab === 'reglages' && <SettingsTab project={project} />}
        {tab === 'audit' && <AuditTab project={project} onGoTo={(s) => setTab(s as TabId)} />}
        {tab === 'export' && <ExportTab project={project} />}
      </div>
    </div>
  )
}
