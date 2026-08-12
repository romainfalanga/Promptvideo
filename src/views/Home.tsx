import { useRef } from 'react'
import { deleteProject, duplicateProject, importProject, openProject, useStore } from '../store'
import { auditProject, scorePercent } from '../engine/audit'
import { getUniverse } from '../data/universes'
import { formatDate } from '../lib/utils'
import { ConfirmButton, Empty, Meter } from '../components/ui'
import { PLATFORM_PRESETS } from '../data/library'
import { ARTIST_PRESETS } from '../data/presets'
import { addProject } from '../store'

export default function Home({ onStudio, onCustom }: { onStudio: () => void; onCustom: () => void }) {
  const { projects } = useStore()
  const fileInput = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-2">
        <ModeCard
          badge="Mode 1"
          title="Mode Studio"
          line="Je te propose des comptes complets."
          body="Le moteur assemble un artiste, une direction artistique, un casting, des lieux, des formats recurrents et un episode pilote, a partir d'une bibliotheque de neuf univers ecrits pour tenir ensemble. Tu regardes trois propositions, tu en gardes une, tu l'ouvres et tu l'affines."
          cta="Generer des idees de comptes"
          onClick={onStudio}
        />
        <ModeCard
          badge="Mode 2"
          title="Mode Sur-Mesure"
          line="Tu decris ton idee, je la deploie."
          body="Ecris ce que tu veux en texte libre. L'outil reconnait l'univers le plus proche, en deduit une direction artistique, cree les personnages que tu as nommes, et construit le squelette complet du compte — sans jamais reecrire ton idee."
          cta="Partir de mon idee"
          onClick={onCustom}
          alt
        />
      </section>

      <section>
        <div className="mb-3">
          <h2 className="font-display text-xl text-ink-100">Artistes</h2>
          <p className="text-[12.5px] text-ink-400">
            Socles de direction artistique fournis par l&apos;artiste. Rien n&apos;est tire au sort : le compte
            s&apos;ouvre deja ecrit.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {ARTIST_PRESETS.map((preset) => (
            <article key={preset.id} className="panel flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl leading-tight text-ink-100">
                    {preset.emoji} {preset.name}
                  </h3>
                  <p className="mt-0.5 text-[13px] text-amber-soft">{preset.tagline}</p>
                </div>
              </div>
              <p className="text-[12.5px] leading-relaxed text-ink-400">{preset.summary}</p>
              <div className="flex flex-wrap gap-1.5">
                {preset.highlights.map((h) => (
                  <span key={h} className="chip">
                    {h}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="btn-primary mt-1 w-fit"
                onClick={() => addProject(preset.build())}
              >
                Ouvrir le compte {preset.name}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl text-ink-100">Mes comptes</h2>
            <p className="text-[12.5px] text-ink-400">
              {projects.length
                ? `${projects.length} compte${projects.length > 1 ? 's' : ''} en cours d'elaboration.`
                : 'Aucun compte pour le moment.'}
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
                const text = await f.text()
                const res = importProject(text)
                if (!res.ok) window.alert(res.error ?? 'Import impossible.')
                e.target.value = ''
              }}
            />
            <button type="button" className="btn-ghost px-3 py-1.5 text-[13px]" onClick={() => fileInput.current?.click()}>
              Importer un JSON
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <Empty
            title="La chaine de production commence ici"
            hint="Choisis un mode ci-dessus. Un compte complet contient un artiste, une direction artistique, un casting, des lieux, des formats, des episodes et un manifeste de references."
          />
        ) : (
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
                      <div>
                        <h3 className="font-display text-[17px] leading-tight text-ink-100">{p.name}</h3>
                        <p className="text-[12px] text-ink-500">@{p.artist.handle}</p>
                      </div>
                      <span className="chip shrink-0">
                        {u.emoji} {u.name}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink-400">
                      {p.artist.mission || p.direction.pitch}
                    </p>
                  </button>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="chip">{p.characters.length} personnages</span>
                    <span className="chip">{p.places.length} lieux</span>
                    <span className="chip">{p.episodes.length} episodes</span>
                    <span className="chip">{p.refs.length} references</span>
                    <span className="chip">{PLATFORM_PRESETS[p.platform].label}</span>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-ink-500">Completude</span>
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

function ModeCard({
  badge,
  title,
  line,
  body,
  cta,
  onClick,
  alt,
}: {
  badge: string
  title: string
  line: string
  body: string
  cta: string
  onClick: () => void
  alt?: boolean
}) {
  return (
    <article className="panel relative flex flex-col gap-3 overflow-hidden p-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: alt ? 'linear-gradient(90deg,transparent,#7dd3fc55,transparent)' : 'linear-gradient(90deg,transparent,#f0b42977,transparent)' }}
      />
      <span className="chip w-fit">{badge}</span>
      <h2 className="font-display text-2xl text-ink-100">{title}</h2>
      <p className="text-[14px] text-amber-soft">{line}</p>
      <p className="text-[13px] leading-relaxed text-ink-400">{body}</p>
      <button type="button" className={alt ? 'btn-ghost mt-2 w-fit' : 'btn-primary mt-2 w-fit'} onClick={onClick}>
        {cta}
      </button>
    </article>
  )
}
