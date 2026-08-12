import { useRef } from 'react'
import { addProject, deleteProject, duplicateProject, importProject, openProject, useStore } from '../store'
import { auditProject, scorePercent } from '../engine/audit'
import { getUniverse } from '../data/universes'
import { ARTIST_PRESETS } from '../data/presets'
import { formatDate } from '../lib/utils'
import { ConfirmButton, Meter } from '../components/ui'

export default function Home({
  onStudio,
  onCustom,
  onQuick,
}: {
  onStudio: () => void
  onCustom: () => void
  onQuick: () => void
}) {
  const { projects } = useStore()
  const fileInput = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-8">
      <section className="panel relative overflow-hidden p-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,#f0b42977,transparent)' }}
        />
        <h1 className="font-display text-3xl leading-tight text-ink-100">
          Générateur de prompts pour Seedance 2.5
        </h1>
        <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-ink-300">
          Décris une vidéo, récupère le prompt prêt à coller et la liste ordonnée des références à joindre.
          Les univers servent à tenir la cohérence : même direction artistique, mêmes visages, mêmes décors
          d&apos;une vidéo à l&apos;autre.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={onQuick}>
            Générer un prompt
          </button>
          <button type="button" className="btn-ghost" onClick={onCustom}>
            Créer un univers depuis mon idée
          </button>
          <button type="button" className="btn-quiet" onClick={onStudio}>
            Me proposer des idées d&apos;univers
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-1.5">
          <span className="chip">Durée 4–30 s</span>
          <span className="chip">Ratios 9:16 · 16:9 · 21:9 · 1:1</span>
          <span className="chip">Jusqu&apos;à 30 images de référence</span>
          <span className="chip">Références numérotées @Image1…</span>
          <span className="chip">Audio ( ) &lt; &gt; {'{ }'} 【 】</span>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="font-display text-xl text-ink-100">Univers fournis</h2>
          <p className="text-[12.5px] text-ink-400">
            Socles de direction artistique écrits à la main. Rien n&apos;est tiré au sort.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {ARTIST_PRESETS.map((preset) => (
            <article key={preset.id} className="panel flex flex-col gap-3 p-5">
              <div>
                <h3 className="font-display text-xl leading-tight text-ink-100">
                  {preset.emoji} {preset.name}
                </h3>
                <p className="mt-0.5 text-[13px] text-amber-soft">{preset.tagline}</p>
              </div>
              <p className="text-[12.5px] leading-relaxed text-ink-400">{preset.summary}</p>
              <div className="flex flex-wrap gap-1.5">
                {preset.highlights.map((h) => (
                  <span key={h} className="chip">
                    {h}
                  </span>
                ))}
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                <button type="button" className="btn-primary" onClick={() => addProject(preset.build())}>
                  Ouvrir l&apos;univers {preset.name}
                </button>
                <button type="button" className="btn-ghost" onClick={onQuick}>
                  Générer une vidéo dedans
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl text-ink-100">Mes univers</h2>
            <p className="text-[12.5px] text-ink-400">
              {projects.length
                ? `${projects.length} univers · ${projects.reduce((a, p) => a + p.videos.length, 0)} vidéos écrites.`
                : "Aucun univers enregistré. Tu peux générer un prompt sans univers, mais rien ne garantira la cohérence d'une vidéo à l'autre."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                const res = importProject(await f.text())
                if (!res.ok) window.alert(res.error ?? 'Import impossible.')
                e.target.value = ''
              }}
            />
            <button type="button" className="btn-ghost px-3 py-1.5 text-[13px]" onClick={() => fileInput.current?.click()}>
              Importer un JSON
            </button>
          </div>
        </div>

        {projects.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => {
              const audit = auditProject(p)
              const pct = scorePercent(audit)
              const u = getUniverse(p.universeId)
              const blocking = audit.issues.filter((i) => i.level === 'bloquant').length
              return (
                <article key={p.id} className="panel flex flex-col gap-3 p-4">
                  <button type="button" className="text-left" onClick={() => openProject(p.id)}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-[17px] leading-tight text-ink-100">{p.name}</h3>
                      <span className="chip shrink-0">
                        {u.emoji} {u.name}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink-400">
                      {p.artist.mission || p.direction.pitch}
                    </p>
                  </button>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="chip">{p.videos.length} vidéos</span>
                    <span className="chip">{p.characters.length} personnages</span>
                    <span className="chip">{p.places.length} lieux</span>
                    <span className="chip">{p.refs.length} références</span>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-ink-500">Complétude</span>
                      <span className={pct >= 85 ? 'text-signal-ok' : pct >= 60 ? 'text-signal-warn' : 'text-signal-bad'}>
                        {pct} %{blocking ? ` · ${blocking} bloquant${blocking > 1 ? 's' : ''}` : ''}
                      </span>
                    </div>
                    <Meter value={pct} max={100} tone={pct >= 85 ? 'ok' : pct >= 60 ? 'amber' : 'bad'} />
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-ink-500">{formatDate(p.updatedAt)}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" className="btn-quiet px-2 py-1 text-[12px]" onClick={() => duplicateProject(p.id)}>
                        Dupliquer
                      </button>
                      <ConfirmButton
                        label="Supprimer"
                        confirmLabel="Supprimer ?"
                        className="px-2 py-1 text-[12px]"
                        onConfirm={() => deleteProject(p.id)}
                      />
                      <button type="button" className="btn-ghost px-2.5 py-1 text-[12px]" onClick={() => openProject(p.id)}>
                        Ouvrir
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
