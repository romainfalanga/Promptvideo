import { useState } from 'react'
import type { AspectRatio, Episode, Project, Resolution, Shot, ShotSize } from '../../types'
import { updateProject } from '../../store'
import {
  ASPECTS,
  CAMERA_ANGLES,
  CAMERA_MOVES,
  RESOLUTIONS,
  SEEDANCE,
  SHOT_SIZES,
  formatTimecode,
  promptWordBudget,
} from '../../data/seedance'
import { compileEpisode, compileShot } from '../../engine/prompt'
import { cx, uid } from '../../lib/utils'
import {
  Area,
  Card,
  CodeBlock,
  Collapse,
  ConfirmButton,
  CopyButton,
  Empty,
  Field,
  Grid,
  NumberField,
  Select,
  Toggle,
} from '../../components/ui'

function blankShot(start: number, end: number, lens: string): Shot {
  return {
    id: uid('sht'),
    label: 'Nouveau plan',
    start,
    end,
    shotSize: 'Plan moyen',
    angle: "hauteur d'oeil",
    movement: 'camera fixe sur pied',
    lens,
    characterIds: [],
    placeId: null,
    propIds: [],
    initialState: '',
    action: '',
    endState: '',
    styleNote: '',
    audio: { music: '', sfx: '', dialogue: '', subtitle: '' },
    refIds: [],
    notes: '',
  }
}

export default function EpisodesTab({ project }: { project: Project }) {
  const [openId, setOpenId] = useState<string | null>(project.episodes[0]?.id ?? null)

  const addFromFormat = (formatId: string) => {
    const f = project.formats.find((x) => x.id === formatId)
    const id = uid('ep')
    const lens = project.direction.lensKit[0] ?? '35 mm'
    updateProject(project.id, (d) => {
      const beats = f?.beats.length ? f.beats : ['Ouverture', 'Developpement', 'Chute']
      const duration = f?.duration ?? d.settings.duration
      const step = duration / beats.length
      const shots = beats.map((b, i) =>
        Object.assign(blankShot(Math.round(i * step), i === beats.length - 1 ? duration : Math.round((i + 1) * step), lens), {
          label: b,
          action: b,
          placeId: d.places[0]?.id ?? null,
          characterIds: i === 0 ? [] : d.characters[0] ? [d.characters[0].id] : [],
        }),
      )
      d.episodes.push({
        id,
        title: f ? `${f.name} — episode ${d.episodes.length + 1}` : `Episode ${d.episodes.length + 1}`,
        formatId: f?.id ?? null,
        logline: f?.pitch ?? '',
        duration,
        aspect: d.settings.aspect,
        resolution: d.settings.resolution,
        cameraFixed: d.settings.cameraFixed,
        seed: '',
        shots,
        caption: f ? `${f.pitch}\n\n${f.cta}` : '',
        hashtags: [],
        status: 'ecrit',
      })
    })
    setOpenId(id)
  }

  return (
    <div className="space-y-4">
      <Card
        title="Episodes"
        subtitle={`Chaque episode se compile en un prompt multi-plans timecode. Duree autorisee : ${SEEDANCE.duration.min} a ${SEEDANCE.duration.max} secondes.`}
        actions={
          <>
            {project.formats.map((f) => (
              <button key={f.id} type="button" className="btn-ghost px-3 py-1.5 text-[12px]" onClick={() => addFromFormat(f.id)}>
                + {f.name}
              </button>
            ))}
            <button type="button" className="btn-primary px-3 py-1.5 text-[12px]" onClick={() => addFromFormat('')}>
              + Episode vierge
            </button>
          </>
        }
      >
        {project.episodes.length === 0 ? (
          <Empty title="Aucun episode" hint="Cree un episode a partir d'un format : les beats deviennent les plans." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {project.episodes.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setOpenId(openId === e.id ? null : e.id)}
                className={cx(
                  'rounded-lg border px-3 py-2 text-left text-[13px] transition',
                  openId === e.id ? 'border-amber/60 bg-amber/5 text-ink-100' : 'border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-600',
                )}
              >
                <span className="block">{e.title}</span>
                <span className="block text-[11px] text-ink-500">
                  {e.duration} s · {e.shots.length} plans · {e.aspect}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {project.episodes
        .filter((e) => e.id === openId)
        .map((e) => (
          <EpisodeSheet key={e.id} project={project} episode={e} onDelete={() => {
            updateProject(project.id, (d) => { d.episodes = d.episodes.filter((x) => x.id !== e.id) })
            setOpenId(null)
          }} />
        ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function EpisodeSheet({ project, episode, onDelete }: { project: Project; episode: Episode; onDelete: () => void }) {
  const patch = (m: (e: Episode) => void) =>
    updateProject(project.id, (d) => {
      const e = d.episodes.find((x) => x.id === episode.id)
      if (e) m(e)
    })

  const compiled = compileEpisode(project, episode)
  const words = compiled.bodyWords
  const budget = promptWordBudget(episode.shots.length)
  const wordTone = words > budget.max ? 'text-signal-bad' : words < budget.min ? 'text-signal-warn' : 'text-signal-ok'

  const addShot = () => {
    const last = episode.shots[episode.shots.length - 1]
    const start = last ? last.end : 0
    patch((e) => {
      e.shots.push(blankShot(start, Math.min(e.duration, start + 5), project.direction.lensKit[0] ?? '35 mm'))
    })
  }

  /** Repartit uniformement les plans sur la duree de l'episode. */
  const redistribute = () =>
    patch((e) => {
      const n = e.shots.length
      if (!n) return
      const step = e.duration / n
      e.shots.forEach((s, i) => {
        s.start = Math.round(i * step)
        s.end = i === n - 1 ? e.duration : Math.round((i + 1) * step)
      })
    })

  return (
    <div className="space-y-4">
      <Card
        title={episode.title}
        subtitle={episode.logline}
        actions={<ConfirmButton label="Supprimer" confirmLabel="Supprimer cet episode ?" onConfirm={onDelete} className="px-3 py-1.5 text-[12px]" />}
      >
        <div className="space-y-4">
          <Field label="Titre" value={episode.title} onChange={(v) => patch((e) => { e.title = v })} />
          <Area label="Logline" value={episode.logline} onChange={(v) => patch((e) => { e.logline = v })} rows={2} hint="Premiere phrase du prompt : elle porte le plus de poids." />

          <Grid cols={3}>
            <NumberField
              label="Duree"
              value={episode.duration}
              min={SEEDANCE.duration.min}
              max={SEEDANCE.duration.max}
              suffix="s"
              onChange={(v) => patch((e) => { e.duration = v })}
            />
            <Select
              label="Format"
              value={episode.aspect}
              onChange={(v: AspectRatio) => patch((e) => { e.aspect = v })}
              options={ASPECTS.map((a) => ({ value: a.value, label: `${a.label} — ${a.usage}` }))}
            />
            <Select
              label="Resolution"
              value={episode.resolution}
              onChange={(v: Resolution) => patch((e) => { e.resolution = v })}
              options={RESOLUTIONS.map((r) => ({ value: r, label: r }))}
            />
          </Grid>

          <Grid cols={2}>
            <Toggle
              label="Camera verrouillee"
              checked={episode.cameraFixed}
              onChange={(v) => patch((e) => { e.cameraFixed = v })}
              hint="Bride le modele vers un plan fixe."
            />
            <Field
              label="Seed (facultatif)"
              value={episode.seed}
              onChange={(v) => patch((e) => { e.seed = v })}
              mono
              hint="Rejouer exactement la meme generation."
            />
          </Grid>
        </div>
      </Card>

      <Card
        title="Plans"
        subtitle="Un plan = une etape timecodee du prompt. Decris l'etat initial, l'evenement, puis l'etat final : le modele a besoin de savoir ce qui CHANGE."
        actions={
          <>
            <button type="button" className="btn-ghost px-3 py-1.5 text-[12px]" onClick={redistribute}>
              Repartir les durees
            </button>
            <button type="button" className="btn-primary px-3 py-1.5 text-[12px]" onClick={addShot}>
              + Plan
            </button>
          </>
        }
      >
        <Timeline episode={episode} />
        <div className="mt-4 space-y-3">
          {episode.shots.map((s, i) => (
            <ShotRow
              key={s.id}
              project={project}
              episode={episode}
              shot={s}
              index={i}
              onPatch={(m) => patch((e) => { const t = e.shots.find((x) => x.id === s.id); if (t) m(t) })}
              onMove={(dir) =>
                patch((e) => {
                  const j = i + dir
                  if (j < 0 || j >= e.shots.length) return
                  const arr = e.shots
                  ;[arr[i], arr[j]] = [arr[j], arr[i]]
                })
              }
              onDelete={() => patch((e) => { e.shots = e.shots.filter((x) => x.id !== s.id) })}
            />
          ))}
          {episode.shots.length === 0 && <p className="text-[12.5px] text-ink-500">Aucun plan. Ajoute-en au moins un.</p>}
        </div>
      </Card>

      <Card
        title="Prompt compile"
        subtitle="Colle ce bloc dans Seedance apres avoir joint les references dans l'ordre indique."
        actions={
          <>
            <span className={cx('text-[12px]', wordTone)}>{words} mots</span>
            <CopyButton text={compiled.full} label="Copier le prompt" variant="primary" />
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <span className="label">Fichiers a joindre, dans cet ordre</span>
            <CodeBlock text={compiled.header} maxHeight={180} />
          </div>
          <div>
            <span className="label">Prompt</span>
            <CodeBlock text={compiled.full} maxHeight={520} />
          </div>
          <p className="text-[11.5px] leading-relaxed text-ink-500">
            Cible pour {episode.shots.length} plan{episode.shots.length > 1 ? 's' : ''} : {budget.min} a {budget.sweet} mots
            dans le corps narratif (plafond {budget.max}). En dessous, le modele improvise ; au-dessus, il dilue les
            consignes. Les ancres d&apos;identite ne sont pas comptees : ce sont des rappels techniques.
          </p>
        </div>
      </Card>

      {episode.shots.length > 1 && (
        <Collapse title="Variante plan par plan (clips courts a monter)">
          <div className="space-y-3">
            {episode.shots.map((s) => {
              const c = compileShot(project, episode, s)
              return (
                <div key={s.id} className="rounded-lg border border-ink-700/70 bg-ink-850/40 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-[13px] text-ink-200">
                      {s.label || s.shotSize} · {Math.max(4, s.end - s.start)} s
                    </span>
                    <CopyButton text={c.full} label="Copier" className="px-2.5 py-1 text-[12px]" />
                  </div>
                  <CodeBlock text={c.full} maxHeight={220} />
                </div>
              )
            })}
          </div>
        </Collapse>
      )}

      <Card title="Publication" subtitle="Texte de la legende et hashtags, prets a coller sur la plateforme.">
        <Grid cols={2}>
          <Area label="Legende" value={episode.caption} onChange={(v) => patch((e) => { e.caption = v })} rows={4} />
          <div>
            <Field
              label="Hashtags (separes par des espaces)"
              value={episode.hashtags.join(' ')}
              onChange={(v) => patch((e) => { e.hashtags = v.split(/\s+/).map((h) => h.replace(/^#/, '')).filter(Boolean) })}
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {episode.hashtags.map((h) => (
                <span key={h} className="chip">#{h}</span>
              ))}
            </div>
            <div className="mt-4">
              <Select
                label="Statut"
                value={episode.status}
                onChange={(v: Episode['status']) => patch((e) => { e.status = v })}
                options={[
                  { value: 'idee', label: 'Idee' },
                  { value: 'ecrit', label: 'Ecrit' },
                  { value: 'pret', label: 'Pret a generer' },
                  { value: 'genere', label: 'Genere' },
                ]}
              />
            </div>
          </div>
        </Grid>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Timeline({ episode }: { episode: Episode }) {
  if (!episode.shots.length) return null
  return (
    <div>
      <div className="flex h-8 w-full overflow-hidden rounded-lg border border-ink-700 bg-ink-850">
        {episode.shots.map((s, i) => {
          const w = Math.max(2, ((s.end - s.start) / Math.max(1, episode.duration)) * 100)
          return (
            <div
              key={s.id}
              className="flex items-center justify-center overflow-hidden border-r border-ink-950/60 text-[10.5px] text-ink-950 last:border-r-0"
              style={{ width: `${w}%`, background: i % 2 ? '#f0b429' : '#ffd77a' }}
              title={`${s.label} — ${formatTimecode(s.start)} → ${formatTimecode(s.end)}`}
            >
              <span className="truncate px-1 font-medium">{i + 1}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10.5px] text-ink-500">
        <span>0:00</span>
        <span>{formatTimecode(episode.duration)}</span>
      </div>
    </div>
  )
}

function ShotRow({
  project,
  episode,
  shot,
  index,
  onPatch,
  onMove,
  onDelete,
}: {
  project: Project
  episode: Episode
  shot: Shot
  index: number
  onPatch: (m: (s: Shot) => void) => void
  onMove: (dir: -1 | 1) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(index === 0)
  const set = <K extends keyof Shot>(key: K, value: Shot[K]) => onPatch((s) => { s[key] = value })

  const toggleId = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  return (
    <div className="rounded-lg border border-ink-700/70 bg-ink-850/40">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-ink-800 text-[11px] text-ink-300">
          {index + 1}
        </span>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpen(!open)}>
          <span className="block truncate text-[13px] text-ink-100">{shot.label || shot.shotSize}</span>
          <span className="block truncate text-[11px] text-ink-500">
            {formatTimecode(shot.start)}–{formatTimecode(shot.end)} · {shot.shotSize} · {shot.movement}
            {!shot.action && <span className="ml-1 text-signal-warn">· action manquante</span>}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" className="btn-quiet px-2 py-1 text-[12px]" onClick={() => onMove(-1)}>↑</button>
          <button type="button" className="btn-quiet px-2 py-1 text-[12px]" onClick={() => onMove(1)}>↓</button>
          <ConfirmButton label="✕" confirmLabel="Sur ?" className="px-2 py-1 text-[12px]" onConfirm={onDelete} />
          <button type="button" className="btn-quiet px-2 py-1 text-[12px]" onClick={() => setOpen(!open)}>
            {open ? '−' : '+'}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-4 border-t border-ink-700/70 p-4">
          <Grid cols={3}>
            <Field label="Intitule du plan" value={shot.label} onChange={(v) => set('label', v)} />
            <NumberField label="Debut" value={shot.start} min={0} max={episode.duration} suffix="s" onChange={(v) => set('start', v)} />
            <NumberField label="Fin" value={shot.end} min={0} max={episode.duration} suffix="s" onChange={(v) => set('end', v)} />
          </Grid>

          <Grid cols={2}>
            <div className="space-y-3">
              <Area label="Etat initial" value={shot.initialState} onChange={(v) => set('initialState', v)} rows={2} placeholder="ce que l'on voit a la premiere image" />
              <Area label="Evenement principal" value={shot.action} onChange={(v) => set('action', v)} rows={2} placeholder="ce qui se passe pendant le plan" />
              <Area label="Etat final" value={shot.endState} onChange={(v) => set('endState', v)} rows={2} placeholder="ce que l'on voit a la derniere image" />
            </div>

            <div className="space-y-3">
              <Select
                label="Echelle de plan"
                value={shot.shotSize}
                onChange={(v: ShotSize) => set('shotSize', v)}
                options={SHOT_SIZES.map((s) => ({ value: s, label: s }))}
              />
              <Select
                label="Angle"
                value={shot.angle}
                onChange={(v) => set('angle', v)}
                options={Array.from(new Set([shot.angle, ...CAMERA_ANGLES])).filter(Boolean).map((a) => ({ value: a, label: a }))}
              />
              <Select
                label="Mouvement"
                value={shot.movement}
                onChange={(v) => set('movement', v)}
                options={Array.from(new Set([shot.movement, ...CAMERA_MOVES])).filter(Boolean).map((m) => ({ value: m, label: m }))}
              />
              <Select
                label="Optique"
                value={shot.lens}
                onChange={(v) => set('lens', v)}
                options={Array.from(new Set([shot.lens, ...project.direction.lensKit])).filter(Boolean).map((l) => ({ value: l, label: l }))}
              />
            </div>
          </Grid>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <span className="label">Personnages presents</span>
              <div className="flex flex-wrap gap-1.5">
                {project.characters.length === 0 && <span className="text-[12px] text-ink-500">Aucun personnage.</span>}
                {project.characters.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => set('characterIds', toggleId(shot.characterIds, c.id))}
                    className={cx(
                      'rounded-full border px-2.5 py-1 text-[11.5px] transition',
                      shot.characterIds.includes(c.id)
                        ? 'border-amber/60 bg-amber/10 text-amber-soft'
                        : 'border-ink-700 bg-ink-850 text-ink-400 hover:border-ink-600',
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="label">Lieu</span>
              <div className="flex flex-wrap gap-1.5">
                {project.places.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => set('placeId', shot.placeId === p.id ? null : p.id)}
                    className={cx(
                      'rounded-full border px-2.5 py-1 text-[11.5px] transition',
                      shot.placeId === p.id
                        ? 'border-amber/60 bg-amber/10 text-amber-soft'
                        : 'border-ink-700 bg-ink-850 text-ink-400 hover:border-ink-600',
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="label">Accessoires</span>
              <div className="flex flex-wrap gap-1.5">
                {project.props.length === 0 && <span className="text-[12px] text-ink-500">Aucun accessoire.</span>}
                {project.props.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => set('propIds', toggleId(shot.propIds, p.id))}
                    className={cx(
                      'rounded-full border px-2.5 py-1 text-[11.5px] transition',
                      shot.propIds.includes(p.id)
                        ? 'border-amber/60 bg-amber/10 text-amber-soft'
                        : 'border-ink-700 bg-ink-850 text-ink-400 hover:border-ink-600',
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <span className="label">Audio de ce plan</span>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="( ) Musique / nappe" value={shot.audio.music} onChange={(v) => onPatch((s) => { s.audio.music = v })} />
              <Field label="< > Effet sonore" value={shot.audio.sfx} onChange={(v) => onPatch((s) => { s.audio.sfx = v })} />
              <Field label="{ } Dialogue" value={shot.audio.dialogue} onChange={(v) => onPatch((s) => { s.audio.dialogue = v })} />
              <Field label="【 】 Texte incruste" value={shot.audio.subtitle} onChange={(v) => onPatch((s) => { s.audio.subtitle = v })} />
            </div>
          </div>

          <Area label="Note de style pour ce plan" value={shot.styleNote} onChange={(v) => set('styleNote', v)} rows={2} />
        </div>
      )}
    </div>
  )
}
