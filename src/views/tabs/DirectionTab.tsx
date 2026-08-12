import type { Project } from '../../types'
import { updateProject } from '../../store'
import { getUniverse } from '../../data/universes'
import { COMPOSITIONS, RHYTHMS } from '../../data/library'
import { LENSES } from '../../data/seedance'
import { makeRng, randomSeed } from '../../lib/utils'
import { Area, Card, Field, Grid, ListEditor, Swatches } from '../../components/ui'
import { cx } from '../../lib/utils'

export default function DirectionTab({ project }: { project: Project }) {
  const d = project.direction
  const u = getUniverse(project.universeId)
  const rng = () => makeRng(randomSeed())

  const set = <K extends keyof typeof d>(key: K, value: (typeof d)[K]) =>
    updateProject(project.id, (dr) => {
      dr.direction[key] = value
    })

  return (
    <div className="space-y-4">
      <Card title="Le look en une phrase" subtitle="C'est la logline de l'image : si elle n'est pas nette, rien ne le sera.">
        <Area label="Pitch visuel" value={d.pitch} onChange={(v) => set('pitch', v)} rows={2} />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Suggestible label="Genre" value={d.genre} onChange={(v) => set('genre', v)} onSuggest={() => set('genre', rng().pick(u.genres))} />
          <Suggestible label="Regle d'or" value={d.motto} onChange={(v) => set('motto', v)} onSuggest={() => set('motto', rng().pick(u.mottos))} hint="L'interdit fondateur, repris dans chaque prompt." />
        </div>
      </Card>

      <Card
        title="Palette"
        subtitle="Imposee dans tous les prompts. Quatre a cinq couleurs, dont une seule dominante saturee."
        actions={
          <button type="button" className="btn-ghost px-3 py-1.5 text-[12px]" onClick={() => set('palette', rng().pick(u.palettes))}>
            ↻ Autre palette de l&apos;univers
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
          <div className="space-y-3">
            <Field label="Nom de la palette" value={d.palette.name} onChange={(v) => set('palette', { ...d.palette, name: v })} />
            <Area label="Note d'usage" value={d.palette.note} onChange={(v) => set('palette', { ...d.palette, note: v })} rows={2} />
          </div>
          <div>
            <span className="label">Couleurs</span>
            <div className="mb-3">
              <Swatches colors={d.palette.colors} />
            </div>
            <div className="space-y-1.5">
              {d.palette.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(c) ? c : '#888888'}
                    onChange={(e) =>
                      set('palette', { ...d.palette, colors: d.palette.colors.map((x, j) => (j === i ? e.target.value : x)) })
                    }
                    className="h-8 w-10 cursor-pointer rounded border border-ink-700 bg-ink-850"
                  />
                  <input
                    className="input flex-1 font-mono text-[12px]"
                    value={c}
                    onChange={(e) =>
                      set('palette', { ...d.palette, colors: d.palette.colors.map((x, j) => (j === i ? e.target.value : x)) })
                    }
                  />
                  <button
                    type="button"
                    className="btn-quiet px-2 py-1.5 text-ink-500 hover:text-signal-bad"
                    onClick={() => set('palette', { ...d.palette, colors: d.palette.colors.filter((_, j) => j !== i) })}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-ghost w-full py-1.5 text-[12px]"
                onClick={() => set('palette', { ...d.palette, colors: [...d.palette.colors, '#888888'] })}
              >
                + Ajouter une couleur
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Grid cols={2}>
        <Card title="Image" subtitle="Ce qui fait que deux videos se ressemblent.">
          <div className="space-y-4">
            <SuggestibleArea label="Lumiere" value={d.lighting} onChange={(v) => set('lighting', v)} onSuggest={() => set('lighting', rng().pick(u.lightings))} />
            <SuggestibleArea label="Texture et support" value={d.texture} onChange={(v) => set('texture', v)} onSuggest={() => set('texture', rng().pick(u.textures))} />
            <SuggestibleArea label="Etalonnage" value={d.colorGrade} onChange={(v) => set('colorGrade', v)} onSuggest={() => set('colorGrade', rng().pick(u.grades))} />
          </div>
        </Card>

        <Card title="Camera" subtitle="La grammaire de mouvement est ce qui empeche Seedance d'improviser un travelling different a chaque fois.">
          <div className="space-y-4">
            <SuggestibleArea
              label="Grammaire camera"
              value={d.cameraGrammar}
              onChange={(v) => set('cameraGrammar', v)}
              onSuggest={() => set('cameraGrammar', rng().pick(u.cameraGrammars))}
            />
            <SuggestibleArea label="Composition" value={d.composition} onChange={(v) => set('composition', v)} onSuggest={() => set('composition', rng().pick(COMPOSITIONS))} />
            <SuggestibleArea label="Rythme de montage" value={d.rhythm} onChange={(v) => set('rhythm', v)} onSuggest={() => set('rhythm', rng().pick(RHYTHMS))} />
          </div>
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card title="Optiques" subtitle="Les focales autorisees. Elles sont proposees plan par plan dans les episodes.">
          <div className="flex flex-wrap gap-1.5">
            {LENSES.map((l) => {
              const on = d.lensKit.includes(l)
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => set('lensKit', on ? d.lensKit.filter((x) => x !== l) : [...d.lensKit, l])}
                  className={cx(
                    'rounded-full border px-3 py-1 text-[12px] transition',
                    on ? 'border-amber/60 bg-amber/10 text-amber-soft' : 'border-ink-700 bg-ink-850 text-ink-400 hover:border-ink-600',
                  )}
                >
                  {l}
                </button>
              )
            })}
          </div>
        </Card>

        <Card title="Son" subtitle="Seedance 2.5 genere l'audio. Sans consigne, il inventera une musique generique.">
          <SuggestibleArea
            label="Signature sonore"
            value={d.soundSignature}
            onChange={(v) => set('soundSignature', v)}
            onSuggest={() => set('soundSignature', rng().pick(u.soundSignatures))}
          />
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card title="Toujours" subtitle="Rappele dans le bloc style de chaque prompt.">
          <ListEditor label="Regles positives" items={d.doList} onChange={(v) => set('doList', v)} placeholder="ex. garder des surfaces mouillees" />
        </Card>
        <Card title="Jamais" subtitle="Alimente automatiquement le bloc « a eviter » des prompts.">
          <ListEditor label="Interdits visuels" items={d.dontList} onChange={(v) => set('dontList', v)} placeholder="ex. lumiere du jour" />
        </Card>
      </Grid>
    </div>
  )
}

function Suggestible({
  label,
  value,
  onChange,
  onSuggest,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onSuggest: () => void
  hint?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <button type="button" className="btn-quiet -mt-1 px-2 py-0.5 text-[11px]" onClick={onSuggest}>
          ↻ variante
        </button>
      </div>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="mt-1 block text-[11px] text-ink-500">{hint}</span>}
    </div>
  )
}

function SuggestibleArea({
  label,
  value,
  onChange,
  onSuggest,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onSuggest: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <button type="button" className="btn-quiet -mt-1 px-2 py-0.5 text-[11px]" onClick={onSuggest}>
          ↻ variante
        </button>
      </div>
      <textarea className="textarea" rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
