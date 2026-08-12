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
        <Card title="Optiques" subtitle="Les focales autorisees. Elles sont proposees plan par plan dans les videos.">
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

      <Card
        title="Traits de texture"
        subtitle="Cumulables. C'est leur accumulation qui produit un rendu, pas un mot-cle unique — chacun est ecrit tel quel dans le bloc style du prompt."
      >
        <ListEditor
          label="Traits"
          items={d.textureTraits}
          onChange={(v) => set('textureTraits', v)}
          placeholder="ex. halation subtile autour des sources"
        />
      </Card>

      <Grid cols={2}>
        <Card title="Moments privilegies" subtitle="Le premier de la liste est injecte dans chaque prompt.">
          <ListEditor
            label="Moments recherches"
            items={d.preferredTimes}
            onChange={(v) => set('preferredTimes', v)}
            placeholder="ex. nuit (cadre principal)"
            ordered
          />
        </Card>
        <Card title="Moments ecartes" subtitle="Repris dans le bloc de contraintes.">
          <ListEditor
            label="Moments a eviter"
            items={d.avoidedTimes}
            onChange={(v) => set('avoidedTimes', v)}
            placeholder="ex. plein soleil de midi"
          />
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card
          title="Sources de lumiere"
          subtitle="Declarees comme les seules autorisees. Sans cette liste, Seedance ajoute un eclairage de studio invisible dans le reel."
        >
          <ListEditor
            label="Sources"
            items={d.lightSources}
            onChange={(v) => set('lightSources', v)}
            placeholder="ex. phares de voitures"
          />
        </Card>
        <Card title="Mouvements de camera autorises" subtitle="Proposes plan par plan dans les videos.">
          <ListEditor
            label="Mouvements"
            items={d.cameraMoves}
            onChange={(v) => set('cameraMoves', v)}
            placeholder="ex. camera qui recule devant le sujet"
          />
        </Card>
      </Grid>

      <Card
        title="Strategies de composition"
        subtitle="A faire tourner d'un plan a l'autre pour eviter que le sujet finisse toujours au centre."
      >
        <ListEditor
          label="Compositions"
          items={d.compositionRules}
          onChange={(v) => set('compositionRules', v)}
          placeholder="ex. le sujet au fond du cadre, l'environnement domine"
        />
      </Card>

      <Grid cols={2}>
        <Card
          title="Ce qui bouge"
          subtitle="Sans cette consigne, Seedance produit une photo animee : le sujet respire et rien d'autre. Un element est pioche pour chaque plan."
        >
          <ListEditor
            label="Elements en mouvement"
            items={d.livingElements}
            onChange={(v) => set('livingElements', v)}
            placeholder="ex. le vent dans les vetements"
          />
        </Card>
        <Card
          title="Vie de fond"
          subtitle="Micro-actions de la figuration. Un element est pioche pour chaque plan ou des gens sont presents."
        >
          <ListEditor
            label="Micro-actions"
            items={d.backgroundLife}
            onChange={(v) => set('backgroundLife', v)}
            placeholder="ex. quelqu'un repond a un message"
          />
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card title="Regles de figuration" subtitle="Injectees des qu'une scene contient d'autres personnes.">
          <ListEditor
            label="Regles"
            items={d.crowdRules}
            onChange={(v) => set('crowdRules', v)}
            placeholder="ex. personne ne regarde jamais l'objectif"
          />
        </Card>
        <Card title="Transitions motivees" subtitle="Ce qui peut declencher une coupe. Propose a la sortie de chaque plan.">
          <ListEditor
            label="Declencheurs"
            items={d.transitionTriggers}
            onChange={(v) => set('transitionTriggers', v)}
            placeholder="ex. un corps qui passe devant l'objectif"
          />
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card title="Garde-robe" subtitle="Pieces autorisees, rappelees dans le bloc style.">
          <div className="space-y-4">
            <ListEditor label="Pieces" items={d.wardrobe} onChange={(v) => set('wardrobe', v)} placeholder="ex. veste oversize" />
            <ListEditor
              label="Regles de style"
              items={d.wardrobeRules}
              onChange={(v) => set('wardrobeRules', v)}
              placeholder="ex. aucun cliche vestimentaire"
            />
          </div>
        </Card>
        <Card title="Registre emotionnel" subtitle="Le melange d'emotions que l'image doit produire.">
          <ListEditor
            label="Registre"
            items={d.emotionalRegister}
            onChange={(v) => set('emotionalRegister', v)}
            placeholder="ex. melancolie"
          />
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card
          title="Reservoir d'environnements"
          subtitle="Les lieux dans lesquels piocher pour ne pas se repeter. Un lieu utilise merite sa propre fiche dans l'onglet Lieux."
        >
          <ListEditor
            label="Environnements"
            items={d.environmentPool}
            onChange={(v) => set('environmentPool', v)}
            placeholder="ex. parking souterrain"
          />
        </Card>
        <Card
          title="Regles de continuite"
          subtitle="Ce qui doit rester identique d'une video a l'autre. Rappele en fin de chaque prompt."
        >
          <ListEditor
            label="Continuite"
            items={d.continuityRules}
            onChange={(v) => set('continuityRules', v)}
            placeholder="ex. meme texture et meme colorimetrie"
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
