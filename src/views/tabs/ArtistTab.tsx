import type { Project } from '../../types'
import { updateProject } from '../../store'
import { getUniverse } from '../../data/universes'
import { CADENCES } from '../../data/library'
import { handleize, makeRng, randomSeed } from '../../lib/utils'
import { Area, Card, CopyButton, Field, Grid, ListEditor, Select } from '../../components/ui'

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
        title="Identite"
        subtitle="Ce bloc alimente la bio de la plateforme et l'en-tete de l'export."
        actions={<CopyButton text={a.bio} label="Copier la bio" />}
      >
        <Grid cols={2}>
          <Field label="Nom du compte" value={a.name} onChange={(v) => set('name', v)} />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Handle" value={a.handle} onChange={(v) => set('handle', v)} hint="Sans le @." />
            </div>
            <button
              type="button"
              className="btn-ghost mb-[22px] px-3 py-2 text-[12px]"
              onClick={() => set('handle', handleize(a.name))}
            >
              Depuis le nom
            </button>
          </div>
        </Grid>

        <div className="mt-4 space-y-4">
          <Field label="Accroche" value={a.tagline} onChange={(v) => set('tagline', v)} />
          <Area label="Bio publique" value={a.bio} onChange={(v) => set('bio', v)} rows={3} />
        </div>
      </Card>

      <Grid cols={2}>
        <Card
          title="Intention"
          subtitle="Pourquoi ce compte existe et ce qu'il tient a chaque video."
        >
          <div className="space-y-4">
            <FieldWithSuggest
              label="Archetype"
              value={a.archetype}
              onChange={(v) => set('archetype', v)}
              onSuggest={() => suggest('archetype', u.archetypes)}
            />
            <AreaWithSuggest
              label="Mission"
              value={a.mission}
              onChange={(v) => set('mission', v)}
              onSuggest={() => suggest('mission', u.missions)}
            />
            <AreaWithSuggest
              label="Promesse tenue a chaque video"
              value={a.promise}
              onChange={(v) => set('promise', v)}
              onSuggest={() => suggest('promise', u.promises)}
              hint="C'est le contrat avec le spectateur. Une phrase, verifiable."
            />
            <Area label="Mythologie interne" value={a.lore} onChange={(v) => set('lore', v)} rows={4} />
          </div>
        </Card>

        <Card title="Voix et public" subtitle="Ce qui determine le ton des cartons, des dialogues et des legendes.">
          <div className="space-y-4">
            <AreaWithSuggest
              label="Voix et ton"
              value={a.voice}
              onChange={(v) => set('voice', v)}
              onSuggest={() => suggest('voice', u.voices)}
            />
            <AreaWithSuggest
              label="Audience"
              value={a.audience}
              onChange={(v) => set('audience', v)}
              onSuggest={() => suggest('audience', u.audiences)}
            />
            <FieldWithSuggest
              label="Phrase signature"
              value={a.signature}
              onChange={(v) => set('signature', v)}
              onSuggest={() => suggest('signature', u.signatures)}
            />
            <Select
              label="Rythme de publication"
              value={a.cadence}
              onChange={(v) => set('cadence', v)}
              options={Array.from(new Set([a.cadence, ...CADENCES])).filter(Boolean).map((c) => ({ value: c, label: c }))}
            />
          </div>
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card title="Valeurs" subtitle="Les obsessions qui reviennent d'un episode a l'autre.">
          <ListEditor label="Valeurs" items={a.values} onChange={(v) => set('values', v)} placeholder="ex. lenteur" />
        </Card>
        <Card title="Interdits" subtitle="Ce que le compte ne fera jamais. Repris dans l'export.">
          <ListEditor
            label="Interdits"
            items={a.taboos}
            onChange={(v) => set('taboos', v)}
            placeholder="ex. jamais de jump-scare"
          />
        </Card>
      </Grid>
    </div>
  )
}

function FieldWithSuggest({
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
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Field label={label} value={value} onChange={onChange} hint={hint} />
      </div>
      <button type="button" className="btn-ghost mb-[2px] shrink-0 px-3 py-2 text-[12px]" onClick={onSuggest} title="Proposer une variante issue de l'univers">
        ↻
      </button>
    </div>
  )
}

function AreaWithSuggest({
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
      <textarea className="textarea" rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="mt-1 block text-[11px] text-ink-500">{hint}</span>}
    </div>
  )
}
