import type { Project } from '../../types'
import { updateProject } from '../../store'
import { getUniverse } from '../../data/universes'
import { makeRng, randomSeed } from '../../lib/utils'
import { Area, Card, Field, Grid, ListEditor } from '../../components/ui'

/**
 * Identite de l'univers.
 *
 * Aucun de ces champs ne part tel quel dans le prompt, sauf les interdits :
 * ils servent a ecrire. Ils fixent l'intention a laquelle chaque video doit
 * repondre, et ils sont repris dans le brief a deleguer.
 */
export default function ArtistTab({ project }: { project: Project }) {
  const a = project.artist
  const u = getUniverse(project.universeId)
  const set = <K extends keyof typeof a>(key: K, value: (typeof a)[K]) =>
    updateProject(project.id, (d) => {
      d.artist[key] = value
      if (key === 'name') d.name = value as string
    })

  const suggest = <K extends keyof typeof a>(key: K, pool: string[]) => {
    const rng = makeRng(randomSeed())
    set(key, rng.pick(pool) as (typeof a)[K])
  }

  return (
    <div className="space-y-4">
      <Card
        title="Identité"
        subtitle="Ces champs orientent l'écriture des vidéos. Seuls les interdits partent directement dans les prompts."
      >
        <Grid cols={2}>
          <Field label="Nom de l'univers" value={a.name} onChange={(v) => set('name', v)} />
          <Field
            label="Résumé en une phrase"
            value={a.tagline}
            onChange={(v) => set('tagline', v)}
            hint="Ce qu'on fabrique ici, en une ligne."
          />
        </Grid>
      </Card>

      <Grid cols={2}>
        <Card title="Intention" subtitle="Pourquoi ces vidéos existent et ce qu'elles cherchent.">
          <div className="space-y-4">
            <WithSuggest
              label="Qui filme"
              value={a.archetype}
              onChange={(v) => set('archetype', v)}
              onSuggest={() => suggest('archetype', u.archetypes)}
              hint="Du point de vue de la fiction : qui tient la caméra."
            />
            <WithSuggest
              label="Intention"
              value={a.mission}
              onChange={(v) => set('mission', v)}
              onSuggest={() => suggest('mission', u.missions)}
              area
            />
            <Area
              label="Le monde"
              value={a.lore}
              onChange={(v) => set('lore', v)}
              rows={5}
              hint="Le décor mental dans lequel toutes les vidéos se déroulent."
            />
          </div>
        </Card>

        <Card title="Ton" subtitle="Ce qui détermine l'écriture des textes incrustés et des dialogues.">
          <div className="space-y-4">
            <WithSuggest
              label="Ton et vocabulaire"
              value={a.voice}
              onChange={(v) => set('voice', v)}
              onSuggest={() => suggest('voice', u.voices)}
              area
            />
            <WithSuggest
              label="Phrase signature"
              value={a.signature}
              onChange={(v) => set('signature', v)}
              onSuggest={() => suggest('signature', u.signatures)}
            />
          </div>
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card title="Valeurs" subtitle="Les obsessions qui reviennent d'une vidéo à l'autre.">
          <ListEditor label="Valeurs" items={a.values} onChange={(v) => set('values', v)} placeholder="ex. lenteur" />
        </Card>
        <Card
          title="Interdits"
          subtitle="Ceux-là partent bien dans les prompts : ils alimentent le bloc négatif."
        >
          <ListEditor
            label="Interdits"
            items={a.taboos}
            onChange={(v) => set('taboos', v)}
            placeholder="ex. jamais de pose face caméra"
          />
        </Card>
      </Grid>
    </div>
  )
}

function WithSuggest({
  label,
  value,
  onChange,
  onSuggest,
  hint,
  area,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onSuggest: () => void
  hint?: string
  area?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <button type="button" className="btn-quiet -mt-1 px-2 py-0.5 text-[11px]" onClick={onSuggest}>
          ↻ variante
        </button>
      </div>
      {area ? (
        <textarea className="textarea" rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <span className="mt-1 block text-[11px] text-ink-500">{hint}</span>}
    </div>
  )
}
