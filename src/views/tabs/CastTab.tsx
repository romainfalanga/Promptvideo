import { useState } from 'react'
import type { Character, Project } from '../../types'
import { rebuildRefs, updateProject } from '../../store'
import { getUniverse } from '../../data/universes'
import { countWords } from '../../data/seedance'
import { cx, join, makeRng, randomSeed, uid } from '../../lib/utils'
import { Area, Card, ConfirmButton, CopyButton, Empty, Field, Grid, ListEditor } from '../../components/ui'

const EMPTY: Omit<Character, 'id'> = {
  name: 'Nouveau personnage',
  role: '',
  tagline: '',
  age: '',
  build: '',
  face: '',
  hair: '',
  skin: '',
  eyes: '',
  distinctive: '',
  costume: '',
  accessories: '',
  colorCode: '',
  posture: '',
  energy: '',
  voice: '',
  language: 'francais',
  arc: '',
  relations: '',
  isGroup: false,
  gaze: '',
  behaviors: [],
  anchor: '',
}

function computeAnchor(c: Character): string {
  return join([c.name.toUpperCase(), c.age, c.build, c.face, c.hair, c.skin, c.eyes, c.distinctive, c.costume], ', ')
}

export default function CastTab({ project }: { project: Project }) {
  const [openId, setOpenId] = useState<string | null>(project.characters[0]?.id ?? null)
  const u = getUniverse(project.universeId)

  const patch = (id: string, mutate: (c: Character) => void) =>
    updateProject(project.id, (d) => {
      const c = d.characters.find((x) => x.id === id)
      if (c) mutate(c)
    })

  const add = () => {
    const id = uid('chr')
    updateProject(project.id, (d) => {
      d.characters.push({ id, ...EMPTY })
    })
    setOpenId(id)
  }

  const addFromLibrary = () => {
    const rng = makeRng(randomSeed())
    const existing = new Set(project.characters.map((c) => c.name))
    const pool = u.characters.filter((c) => !existing.has(c.name))
    if (!pool.length) return
    const s = rng.pick(pool)
    const id = uid('chr')
    updateProject(project.id, (d) => {
      const c: Character = {
        id,
        name: s.name,
        role: s.role,
        tagline: s.tagline,
        age: s.age,
        build: s.build,
        face: s.face,
        hair: s.hair,
        skin: s.skin,
        eyes: s.eyes,
        distinctive: s.distinctive,
        costume: s.costume,
        accessories: s.accessories,
        colorCode: s.colorCode,
        posture: s.posture,
        energy: s.energy,
        voice: s.voice,
        language: 'francais',
        arc: s.arc,
        relations: '',
        isGroup: false,
        gaze: '',
        behaviors: [],
        anchor: '',
      }
      c.anchor = computeAnchor(c)
      d.characters.push(c)
    })
    setOpenId(id)
  }

  return (
    <div className="space-y-4">
      <Card
        title="Casting"
        subtitle="L'ancre d'identite de chaque personnage est reinjectee dans tous les prompts. C'est elle qui empeche le visage de changer d'une video a l'autre."
        actions={
          <>
            <button type="button" className="btn-ghost px-3 py-1.5 text-[12px]" onClick={addFromLibrary}>
              + Depuis l&apos;univers
            </button>
            <button type="button" className="btn-primary px-3 py-1.5 text-[12px]" onClick={add}>
              + Personnage
            </button>
          </>
        }
      >
        {project.characters.length === 0 ? (
          <Empty title="Aucun personnage" hint="Un univers sans visage recurrent ne cree pas d'attachement." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {project.characters.map((c) => {
              const weak = countWords(c.anchor) < 12
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setOpenId(openId === c.id ? null : c.id)}
                  className={cx(
                    'rounded-lg border px-3 py-2 text-left text-[13px] transition',
                    openId === c.id ? 'border-amber/60 bg-amber/5 text-ink-100' : 'border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-600',
                  )}
                >
                  <span className="block">{c.name}</span>
                  <span className={cx('block text-[11px]', weak ? 'text-signal-warn' : 'text-ink-500')}>
                    {weak ? 'ancre incomplete' : c.role || 'role a definir'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </Card>

      {project.characters
        .filter((c) => c.id === openId)
        .map((c) => (
          <CharacterSheet
            key={c.id}
            character={c}
            onPatch={(m) => patch(c.id, m)}
            onDelete={() => {
              updateProject(project.id, (d) => {
                d.characters = d.characters.filter((x) => x.id !== c.id)
                d.videos.forEach((e) => e.shots.forEach((s) => (s.characterIds = s.characterIds.filter((i) => i !== c.id))))
              })
              rebuildRefs(project.id)
              setOpenId(null)
            }}
            onRebuildRefs={() => rebuildRefs(project.id)}
          />
        ))}
    </div>
  )
}

function CharacterSheet({
  character: c,
  onPatch,
  onDelete,
  onRebuildRefs,
}: {
  character: Character
  onPatch: (m: (c: Character) => void) => void
  onDelete: () => void
  onRebuildRefs: () => void
}) {
  const set = <K extends keyof Character>(key: K, value: Character[K]) => onPatch((x) => { x[key] = value })
  const anchorWords = countWords(c.anchor)

  return (
    <div className="space-y-4">
      <Card
        title={c.name}
        subtitle={c.tagline}
        actions={
          <ConfirmButton label="Supprimer" confirmLabel="Supprimer ce personnage ?" onConfirm={onDelete} className="px-3 py-1.5 text-[12px]" />
        }
      >
        <Grid cols={2}>
          <Field label="Nom" value={c.name} onChange={(v) => set('name', v)} />
          <Field label="Role dans l'univers" value={c.role} onChange={(v) => set('role', v)} />
        </Grid>
        <div className="mt-4">
          <Field label="Accroche" value={c.tagline} onChange={(v) => set('tagline', v)} />
        </div>
      </Card>

      <Grid cols={2}>
        <Card title="Physique" subtitle="Ces champs alimentent l'ancre et la planche visage. Plus ils sont precis, plus le visage tient.">
          <div className="space-y-3">
            <Field label="Age apparent" value={c.age} onChange={(v) => set('age', v)} placeholder="ex. la trentaine" />
            <Field label="Morphologie" value={c.build} onChange={(v) => set('build', v)} placeholder="ex. silhouette compacte, epaules larges" />
            <Area label="Visage" value={c.face} onChange={(v) => set('face', v)} rows={2} placeholder="forme, machoire, nez, expression au repos" />
            <Field label="Cheveux" value={c.hair} onChange={(v) => set('hair', v)} />
            <Field label="Peau" value={c.skin} onChange={(v) => set('skin', v)} />
            <Field label="Yeux" value={c.eyes} onChange={(v) => set('eyes', v)} />
            <Field
              label="Signe distinctif"
              value={c.distinctive}
              onChange={(v) => set('distinctive', v)}
              hint="Un seul detail impossible a confondre : cicatrice, tatouage, objet toujours porte."
            />
          </div>
        </Card>

        <Card title="Costume et presence" subtitle="Le costume doit etre invariant : c'est le second pilier de la reconnaissance.">
          <div className="space-y-3">
            <Area label="Costume" value={c.costume} onChange={(v) => set('costume', v)} rows={2} />
            <Field label="Accessoires" value={c.accessories} onChange={(v) => set('accessories', v)} />
            <Field label="Code couleur" value={c.colorCode} onChange={(v) => set('colorCode', v)} hint="Comment il se detache de la palette du decor." />
            <Field label="Posture" value={c.posture} onChange={(v) => set('posture', v)} />
            <Field label="Energie" value={c.energy} onChange={(v) => set('energy', v)} />
            <Field label="Voix" value={c.voice} onChange={(v) => set('voice', v)} />
            <Field label="Langue" value={c.language} onChange={(v) => set('language', v)} />
          </div>
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card
          title="Jeu et rapport a la camera"
          subtitle="Sans consigne de regard, le modele fait poser le sujet face objectif : c'est le premier reflexe a desamorcer."
        >
          <div className="space-y-3">
            <Area
              label="Rapport a la camera"
              value={c.gaze}
              onChange={(v) => set('gaze', v)}
              rows={3}
              placeholder="ex. ne regarde presque jamais l'objectif ; un seul regard camera autorise par video"
              hint="Recopie dans chaque prompt ou ce personnage apparait."
            />
            <ListEditor
              label="Actions credibles"
              items={c.behaviors}
              onChange={(v) => set('behaviors', v)}
              placeholder="ex. observe une situation sans y participer"
            />
          </div>
        </Card>

        <Card title="Narration">
          <div className="space-y-3">
            <Area label="Arc sur la saison" value={c.arc} onChange={(v) => set('arc', v)} rows={3} />
            <Area label="Relations" value={c.relations} onChange={(v) => set('relations', v)} rows={2} />
          </div>
        </Card>
      </Grid>

      <Grid cols={2}>
        <div />

        <Card
          title="Ancre d'identite"
          subtitle="Recopiee mot pour mot dans chaque prompt ou ce personnage apparait."
          actions={
            <>
              <button type="button" className="btn-ghost px-3 py-1.5 text-[12px]" onClick={() => set('anchor', computeAnchor(c))}>
                Regenerer depuis la fiche
              </button>
              <CopyButton text={c.anchor} label="Copier" />
            </>
          }
        >
          <textarea
            className="textarea font-mono text-[12px]"
            rows={5}
            value={c.anchor}
            onChange={(e) => set('anchor', e.target.value)}
          />
          <p className={cx('mt-2 text-[11.5px]', anchorWords < 12 ? 'text-signal-warn' : 'text-signal-ok')}>
            {anchorWords} mots — {anchorWords < 12 ? 'trop court, le modele va inventer les traits manquants.' : 'suffisant pour tenir l\'identite.'}
          </p>
          <button type="button" className="btn-quiet mt-3 px-0 text-[12px] text-amber hover:bg-transparent hover:underline" onClick={onRebuildRefs}>
            Mettre a jour le manifeste de references →
          </button>
        </Card>
      </Grid>
    </div>
  )
}
