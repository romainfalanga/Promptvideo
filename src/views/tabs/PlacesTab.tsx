import { useState } from 'react'
import type { Place, Project, Prop } from '../../types'
import { rebuildRefs, updateProject } from '../../store'
import { getUniverse } from '../../data/universes'
import { cx, join, makeRng, randomSeed, uid } from '../../lib/utils'
import { Area, Card, ConfirmButton, CopyButton, Empty, Field, Grid } from '../../components/ui'

function computePlaceAnchor(p: Place): string {
  return join([p.name.toUpperCase(), p.description, p.architecture, p.materials, p.light, p.timeOfDay], ', ')
}

export default function PlacesTab({ project }: { project: Project }) {
  const [openId, setOpenId] = useState<string | null>(project.places[0]?.id ?? null)
  const u = getUniverse(project.universeId)

  const addBlank = () => {
    const id = uid('plc')
    updateProject(project.id, (d) => {
      d.places.push({
        id,
        name: 'Nouveau lieu',
        kind: '',
        tagline: '',
        description: '',
        architecture: '',
        materials: '',
        light: '',
        weather: '',
        timeOfDay: '',
        soundscape: '',
        details: '',
        forbidden: '',
        anchor: '',
      })
    })
    setOpenId(id)
  }

  const addFromLibrary = () => {
    const rng = makeRng(randomSeed())
    const existing = new Set(project.places.map((p) => p.name))
    const pool = u.places.filter((p) => !existing.has(p.name))
    if (!pool.length) return
    const s = rng.pick(pool)
    const id = uid('plc')
    updateProject(project.id, (d) => {
      const p: Place = { id, ...s, anchor: '' }
      p.anchor = computePlaceAnchor(p)
      d.places.push(p)
    })
    setOpenId(id)
  }

  return (
    <div className="space-y-4">
      <Card
        title="Lieux"
        subtitle="Les lieux recurrents font l'univers. Chaque fiche produit une plaque de decor vide, sans personnage, que Seedance peuplera."
        actions={
          <>
            <button type="button" className="btn-ghost px-3 py-1.5 text-[12px]" onClick={addFromLibrary}>
              + Depuis l&apos;univers
            </button>
            <button type="button" className="btn-primary px-3 py-1.5 text-[12px]" onClick={addBlank}>
              + Lieu
            </button>
          </>
        }
      >
        {project.places.length === 0 ? (
          <Empty title="Aucun lieu" hint="Ajoute au moins un lieu : c'est lui qui donnera sa profondeur a l'image." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {project.places.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setOpenId(openId === p.id ? null : p.id)}
                className={cx(
                  'rounded-lg border px-3 py-2 text-left text-[13px] transition',
                  openId === p.id ? 'border-amber/60 bg-amber/5 text-ink-100' : 'border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-600',
                )}
              >
                <span className="block">{p.name}</span>
                <span className={cx('block text-[11px]', p.description ? 'text-ink-500' : 'text-signal-warn')}>
                  {p.description ? p.kind || 'lieu' : 'fiche vide'}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {project.places
        .filter((p) => p.id === openId)
        .map((p) => (
          <PlaceSheet
            key={p.id}
            place={p}
            onPatch={(m) =>
              updateProject(project.id, (d) => {
                const target = d.places.find((x) => x.id === p.id)
                if (target) m(target)
              })
            }
            onDelete={() => {
              updateProject(project.id, (d) => {
                d.places = d.places.filter((x) => x.id !== p.id)
                d.episodes.forEach((e) => e.shots.forEach((s) => { if (s.placeId === p.id) s.placeId = null }))
              })
              rebuildRefs(project.id)
              setOpenId(null)
            }}
          />
        ))}

      <PropsCard project={project} />
    </div>
  )
}

function PlaceSheet({
  place: p,
  onPatch,
  onDelete,
}: {
  place: Place
  onPatch: (m: (p: Place) => void) => void
  onDelete: () => void
}) {
  const set = <K extends keyof Place>(key: K, value: Place[K]) => onPatch((x) => { x[key] = value })

  return (
    <div className="space-y-4">
      <Card
        title={p.name}
        subtitle={p.tagline}
        actions={<ConfirmButton label="Supprimer" confirmLabel="Supprimer ce lieu ?" onConfirm={onDelete} className="px-3 py-1.5 text-[12px]" />}
      >
        <Grid cols={3}>
          <Field label="Nom" value={p.name} onChange={(v) => set('name', v)} />
          <Field label="Type" value={p.kind} onChange={(v) => set('kind', v)} placeholder="ex. ruelle couverte" />
          <Field label="Accroche" value={p.tagline} onChange={(v) => set('tagline', v)} />
        </Grid>
      </Card>

      <Grid cols={2}>
        <Card title="Le lieu">
          <div className="space-y-3">
            <Area label="Description" value={p.description} onChange={(v) => set('description', v)} rows={3} />
            <Area label="Architecture" value={p.architecture} onChange={(v) => set('architecture', v)} rows={2} />
            <Area label="Matieres" value={p.materials} onChange={(v) => set('materials', v)} rows={2} />
            <Field label="Details qui font vrai" value={p.details} onChange={(v) => set('details', v)} />
          </div>
        </Card>

        <Card title="Atmosphere">
          <div className="space-y-3">
            <Area label="Lumiere" value={p.light} onChange={(v) => set('light', v)} rows={2} />
            <Field label="Meteo" value={p.weather} onChange={(v) => set('weather', v)} />
            <Field label="Moment" value={p.timeOfDay} onChange={(v) => set('timeOfDay', v)} />
            <Area
              label="Ambiance sonore"
              value={p.soundscape}
              onChange={(v) => set('soundscape', v)}
              rows={2}
              hint="Reprise telle quelle dans le bloc audio des prompts."
            />
            <Field
              label="Interdit dans ce lieu"
              value={p.forbidden}
              onChange={(v) => set('forbidden', v)}
              hint="ex. ne jamais montrer les deux extremites du tunnel."
            />
          </div>
        </Card>
      </Grid>

      <Card
        title="Ancre de lieu"
        actions={
          <>
            <button type="button" className="btn-ghost px-3 py-1.5 text-[12px]" onClick={() => set('anchor', computePlaceAnchor(p))}>
              Regenerer depuis la fiche
            </button>
            <CopyButton text={p.anchor} label="Copier" />
          </>
        }
      >
        <textarea className="textarea font-mono text-[12px]" rows={3} value={p.anchor} onChange={(e) => set('anchor', e.target.value)} />
      </Card>
    </div>
  )
}

function PropsCard({ project }: { project: Project }) {
  const u = getUniverse(project.universeId)

  const add = (seed?: Prop) => {
    updateProject(project.id, (d) => {
      d.props.push(
        seed ?? {
          id: uid('prp'),
          name: 'Nouvel accessoire',
          description: '',
          role: '',
          anchor: '',
        },
      )
    })
  }

  const addFromLibrary = () => {
    const rng = makeRng(randomSeed())
    const existing = new Set(project.props.map((p) => p.name))
    const pool = u.props.filter((p) => !existing.has(p.name))
    if (!pool.length) return
    const s = rng.pick(pool)
    add({ id: uid('prp'), name: s.name, description: s.description, role: s.role, anchor: `${s.name.toUpperCase()}, ${s.description}` })
  }

  return (
    <Card
      title="Accessoires recurrents"
      subtitle="Un objet qui revient d'episode en episode vaut une signature visuelle."
      actions={
        <>
          <button type="button" className="btn-ghost px-3 py-1.5 text-[12px]" onClick={addFromLibrary}>
            + Depuis l&apos;univers
          </button>
          <button type="button" className="btn-primary px-3 py-1.5 text-[12px]" onClick={() => add()}>
            + Accessoire
          </button>
        </>
      }
    >
      {project.props.length === 0 ? (
        <p className="text-[12.5px] text-ink-500">Aucun accessoire pour l&apos;instant.</p>
      ) : (
        <div className="space-y-3">
          {project.props.map((p) => (
            <div key={p.id} className="rounded-lg border border-ink-700/70 bg-ink-850/40 p-3">
              <div className="grid gap-3 md:grid-cols-3">
                <Field
                  label="Nom"
                  value={p.name}
                  onChange={(v) =>
                    updateProject(project.id, (d) => {
                      const t = d.props.find((x) => x.id === p.id)
                      if (t) t.name = v
                    })
                  }
                />
                <Field
                  label="Description"
                  value={p.description}
                  onChange={(v) =>
                    updateProject(project.id, (d) => {
                      const t = d.props.find((x) => x.id === p.id)
                      if (t) {
                        t.description = v
                        t.anchor = `${t.name.toUpperCase()}, ${v}`
                      }
                    })
                  }
                />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Field
                      label="Role"
                      value={p.role}
                      onChange={(v) =>
                        updateProject(project.id, (d) => {
                          const t = d.props.find((x) => x.id === p.id)
                          if (t) t.role = v
                        })
                      }
                    />
                  </div>
                  <ConfirmButton
                    label="✕"
                    confirmLabel="Sur ?"
                    className="mb-[2px] px-2 py-2 text-[12px]"
                    onConfirm={() => {
                      updateProject(project.id, (d) => {
                        d.props = d.props.filter((x) => x.id !== p.id)
                        d.episodes.forEach((e) => e.shots.forEach((s) => (s.propIds = s.propIds.filter((i) => i !== p.id))))
                      })
                      rebuildRefs(project.id)
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
