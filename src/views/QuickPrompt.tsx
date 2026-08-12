import { useMemo, useState } from 'react'
import type { AspectRatio, Project, Video } from '../types'
import { ASPECTS, PROMPT_RULES, SEEDANCE, promptWordBudget } from '../data/seedance'
import { ARTIST_PRESETS } from '../data/presets'
import { generateVideoForProject } from '../engine/video'
import { compileVideo } from '../engine/prompt'
import { projectFromBrief } from '../engine/interpret'
import { addProject, updateProject, useStore } from '../store'
import { cx } from '../lib/utils'
import { Area, Card, CodeBlock, CopyButton, NumberField, Select } from '../components/ui'

const EXAMPLES = [
  "Un plan de nuit sous la pluie : quelqu'un attend un bus qui n'arrive pas, les phares balaient la vitre de l'abribus.",
  "Des mains qui reparent une montre ancienne, macro, lumiere de fenetre, aucun visage.",
  "Une creature marine bioluminescente traverse le noir total, de gauche a droite, sans un bruit.",
  "Le crew sort d'un parking souterrain, la camera les depasse et reste sur la rampe vide.",
]

/**
 * Ecran principal : on decrit une video, on obtient le prompt Seedance.
 *
 * Le choix de l'univers est le point cle — c'est lui qui apporte la
 * direction artistique, les personnages, les lieux et les references, donc
 * la coherence d'une video a l'autre. Sans univers, on obtient quand meme un
 * prompt, simplement sans continuite.
 */
export default function QuickPrompt() {
  const { projects } = useStore()
  const [brief, setBrief] = useState('')
  const [universeChoice, setUniverseChoice] = useState<string>(projects[0]?.id ?? '')
  const [duration, setDuration] = useState(15)
  const [aspect, setAspect] = useState<AspectRatio>('16:9')
  const [result, setResult] = useState<{ project: Project; video: Video; saved: boolean } | null>(null)

  const choices = useMemo(
    () => [
      ...projects.map((p) => ({ value: p.id, label: `${p.name} — univers enregistre` })),
      ...ARTIST_PRESETS.filter((a) => !projects.some((p) => p.name === a.name)).map((a) => ({
        value: `preset:${a.id}`,
        label: `${a.name} — socle fourni`,
      })),
      { value: '', label: 'Aucun univers — prompt autonome' },
    ],
    [projects],
  )

  const run = () => {
    if (!brief.trim()) return

    // Un univers existant apporte sa direction artistique et ses references.
    // Sans univers, on en deduit un a la volee depuis le texte : le prompt
    // reste complet, il n'a simplement pas d'historique derriere lui.
    let project: Project
    if (universeChoice.startsWith('preset:')) {
      const preset = ARTIST_PRESETS.find((a) => a.id === universeChoice.slice(7))
      project = preset ? preset.build() : projectFromBrief(brief, {}).project
    } else if (universeChoice) {
      project = projects.find((p) => p.id === universeChoice) ?? projectFromBrief(brief, {}).project
    } else {
      project = projectFromBrief(brief, {}).project
      project.videos = []
    }

    const video = generateVideoForProject(project, { brief, duration, aspect })
    setResult({ project, video, saved: false })
  }

  const save = () => {
    if (!result) return
    const known = projects.find((p) => p.id === result.project.id)
    if (known) {
      updateProject(known.id, (d) => {
        d.videos.push(result.video)
      })
    } else {
      const copy = { ...result.project, videos: [...result.project.videos, result.video] }
      addProject(copy)
    }
    setResult({ ...result, saved: true })
  }

  const compiled = result ? compileVideo(result.project, result.video) : null
  const budget = result ? promptWordBudget(result.video.shots.length) : null

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="font-display text-3xl text-ink-100">Nouvelle vidéo</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-400">
          Décris la vidéo que tu veux, choisis sa durée et son format : tu obtiens le prompt Seedance{' '}
          {SEEDANCE.version} prêt à coller, avec la liste ordonnée des références à joindre. Rattache-la à un
          univers pour qu&apos;elle hérite de sa direction artistique, de ses personnages et de ses lieux — c&apos;est
          ce qui rend deux vidéos cohérentes entre elles.
        </p>
      </header>

      <Card title="Ta vidéo">
        <Area
          label="Qu'est-ce qu'on voit ?"
          value={brief}
          onChange={setBrief}
          rows={4}
          placeholder="ex. Vland traverse un parking souterrain vide, la caméra le suit de dos et le perd derrière un pilier."
          hint="Une situation, un geste, une idée visuelle. Le reste est complété par l'univers choisi."
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              className="chip max-w-full text-left hover:border-ink-500 hover:text-ink-200"
              onClick={() => setBrief(e)}
            >
              <span className="truncate">{e}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Select label="Univers" value={universeChoice} onChange={setUniverseChoice} options={choices} />
          <NumberField
            label="Durée"
            value={duration}
            min={SEEDANCE.duration.min}
            max={SEEDANCE.duration.max}
            suffix="s"
            onChange={setDuration}
          />
          <Select
            label="Format"
            value={aspect}
            onChange={setAspect}
            options={ASPECTS.map((a) => ({ value: a.value, label: a.label }))}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-primary" onClick={run} disabled={!brief.trim()}>
            {result ? 'Regénérer le prompt' : 'Générer le prompt'}
          </button>
          {result && (
            <>
              <button type="button" className="btn-ghost" onClick={run}>
                Autre proposition
              </button>
              <button type="button" className="btn-quiet" onClick={() => setResult(null)}>
                Effacer
              </button>
            </>
          )}
        </div>
      </Card>

      {result && compiled && budget && (
        <>
          <Card
            title="Le prompt"
            subtitle={`${result.video.duration} s · ${result.video.aspect} · ${result.video.resolution} · ${result.video.shots.length} plans`}
            actions={
              <>
                <span
                  className={cx(
                    'text-[12px]',
                    compiled.bodyWords > budget.max
                      ? 'text-signal-bad'
                      : compiled.bodyWords < budget.min
                        ? 'text-signal-warn'
                        : 'text-signal-ok',
                  )}
                >
                  {compiled.bodyWords} mots
                </span>
                <CopyButton text={compiled.full} label="Copier le prompt" variant="primary" />
              </>
            }
          >
            <CodeBlock text={compiled.full} maxHeight={520} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <Card
              title="Références à joindre"
              subtitle="Dans cet ordre exact : le premier fichier devient @Image1."
              actions={<CopyButton text={compiled.header} label="Copier la liste" />}
            >
              {compiled.attachments.length ? (
                <div className="space-y-1.5">
                  {compiled.attachments.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-700/70 bg-ink-850/40 px-3 py-2"
                    >
                      <span className="rounded border border-amber/40 bg-amber/10 px-1.5 py-0.5 font-mono text-[11px] text-amber-soft">
                        {r.token}
                      </span>
                      <span className="font-mono text-[11.5px] text-ink-400">{r.filename}</span>
                      <span className="text-[12px] text-ink-300">{r.label}</span>
                      {r.sourceKind === 'photo-fournie' && (
                        <span className="ml-auto text-[10.5px] text-signal-info">photo fournie</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12.5px] text-ink-500">
                  Aucune référence : ce prompt fonctionne en texte seul. Rattache-le à un univers pour ancrer
                  les visages et les décors.
                </p>
              )}
            </Card>

            <Card title="Et maintenant ?">
              <div className="space-y-3">
                <button
                  type="button"
                  className={result.saved ? 'btn-ghost w-full' : 'btn-primary w-full'}
                  onClick={save}
                  disabled={result.saved}
                >
                  {result.saved ? '✓ Enregistrée dans l’univers' : 'Enregistrer dans l’univers'}
                </button>
                <p className="text-[12px] leading-relaxed text-ink-500">
                  Enregistrer la vidéo la rend modifiable plan par plan dans l&apos;atelier, et évite que la
                  prochaine génération rejoue le même lieu.
                </p>
                <div className="border-t border-ink-700/70 pt-3">
                  <span className="label">Règles appliquées à ce prompt</span>
                  <ul className="space-y-1.5 text-[11.5px] leading-relaxed text-ink-400">
                    {PROMPT_RULES.slice(0, 5).map((r) => (
                      <li key={r} className="flex gap-2">
                        <span className="text-amber">·</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
