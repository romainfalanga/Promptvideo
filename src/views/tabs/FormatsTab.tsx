import type { Format, Project } from '../../types'
import { updateProject } from '../../store'
import { getUniverse } from '../../data/universes'
import { CTA_POOL, HOOK_SHAPES } from '../../data/library'
import { SEEDANCE } from '../../data/seedance'
import { makeRng, randomSeed, uid } from '../../lib/utils'
import { Area, Card, ConfirmButton, Empty, Field, Grid, ListEditor, NumberField } from '../../components/ui'

export default function FormatsTab({ project }: { project: Project }) {
  const u = getUniverse(project.universeId)

  const patch = (id: string, m: (f: Format) => void) =>
    updateProject(project.id, (d) => {
      const f = d.formats.find((x) => x.id === id)
      if (f) m(f)
    })

  const addBlank = () =>
    updateProject(project.id, (d) => {
      d.formats.push({
        id: uid('fmt'),
        name: 'Nouveau format',
        pitch: '',
        duration: project.settings.duration,
        beats: [],
        hook: '',
        payoff: '',
        cta: '',
        recurring: [],
      })
    })

  const addFromLibrary = () => {
    const rng = makeRng(randomSeed())
    const existing = new Set(project.formats.map((f) => f.name))
    const pool = u.formats.filter((f) => !existing.has(f.name))
    if (!pool.length) return
    const s = rng.pick(pool)
    updateProject(project.id, (d) => {
      d.formats.push({
        id: uid('fmt'),
        name: s.name,
        pitch: s.pitch,
        duration: s.duration,
        beats: [...s.beats],
        hook: s.hook,
        payoff: s.payoff,
        cta: s.cta,
        recurring: [...s.recurring],
      })
    })
  }

  return (
    <div className="space-y-4">
      <Card
        title="Formats recurrents"
        subtitle="Un format est un moule : meme structure, meme accroche, meme chute, contenu different. C'est ce qui rend un compte reconnaissable des la premiere seconde."
        actions={
          <>
            <button type="button" className="btn-ghost px-3 py-1.5 text-[12px]" onClick={addFromLibrary}>
              + Depuis l&apos;univers
            </button>
            <button type="button" className="btn-primary px-3 py-1.5 text-[12px]" onClick={addBlank}>
              + Format
            </button>
          </>
        }
      >
        {project.formats.length === 0 && (
          <Empty title="Aucun format" hint="Sans format, chaque video repart de zero." />
        )}
      </Card>

      {project.formats.map((f) => (
        <Card
          key={f.id}
          title={f.name}
          subtitle={f.pitch}
          actions={
            <ConfirmButton
              label="Supprimer"
              confirmLabel="Supprimer ce format ?"
              className="px-3 py-1.5 text-[12px]"
              onConfirm={() =>
                updateProject(project.id, (d) => {
                  d.formats = d.formats.filter((x) => x.id !== f.id)
                  d.episodes.forEach((e) => { if (e.formatId === f.id) e.formatId = null })
                })
              }
            />
          }
        >
          <Grid cols={2}>
            <div className="space-y-3">
              <Field label="Nom" value={f.name} onChange={(v) => patch(f.id, (x) => { x.name = v })} />
              <Area label="Pitch" value={f.pitch} onChange={(v) => patch(f.id, (x) => { x.pitch = v })} rows={2} />
              <NumberField
                label="Duree cible"
                value={f.duration}
                min={SEEDANCE.duration.min}
                max={SEEDANCE.duration.max}
                suffix="s"
                onChange={(v) => patch(f.id, (x) => { x.duration = v })}
              />
              <div>
                <div className="flex items-center justify-between">
                  <span className="label">Accroche</span>
                  <button
                    type="button"
                    className="btn-quiet -mt-1 px-2 py-0.5 text-[11px]"
                    onClick={() => patch(f.id, (x) => { x.hook = makeRng(randomSeed()).pick(HOOK_SHAPES) })}
                  >
                    ↻ variante
                  </button>
                </div>
                <textarea className="textarea" rows={2} value={f.hook} onChange={(e) => patch(f.id, (x) => { x.hook = e.target.value })} />
              </div>
              <Area label="Chute" value={f.payoff} onChange={(v) => patch(f.id, (x) => { x.payoff = v })} rows={2} />
              <div>
                <div className="flex items-center justify-between">
                  <span className="label">Appel a l&apos;action</span>
                  <button
                    type="button"
                    className="btn-quiet -mt-1 px-2 py-0.5 text-[11px]"
                    onClick={() => patch(f.id, (x) => { x.cta = makeRng(randomSeed()).pick(CTA_POOL) })}
                  >
                    ↻ variante
                  </button>
                </div>
                <input className="input" value={f.cta} onChange={(e) => patch(f.id, (x) => { x.cta = e.target.value })} />
              </div>
            </div>

            <div className="space-y-4">
              <ListEditor
                label="Structure (un beat par ligne)"
                ordered
                items={f.beats}
                onChange={(v) => patch(f.id, (x) => { x.beats = v })}
                placeholder="ex. Gros plan sur l'objet mort, aucun contexte"
              />
              <ListEditor
                label="Elements recurrents"
                items={f.recurring}
                onChange={(v) => patch(f.id, (x) => { x.recurring = v })}
                placeholder="ex. meme carton horaire en ouverture"
              />
              <p className="text-[11.5px] leading-relaxed text-ink-500">
                Les beats deviennent les plans quand tu crees un episode a partir de ce format,
                avec leurs bornes temporelles calculees sur la duree cible.
              </p>
            </div>
          </Grid>
        </Card>
      ))}
    </div>
  )
}
