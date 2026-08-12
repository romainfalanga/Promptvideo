import { useMemo, useState } from 'react'
import {
  detect,
  explainInterpretation,
  projectFromBrief,
  scoreUniverses,
  type InterpretResult,
  type NounRole,
} from '../engine/interpret'
import { UNIVERSES, getUniverse } from '../data/universes'
import { addProject } from '../store'
import { Area, Card, Select, Swatches } from '../components/ui'
import { cx } from '../lib/utils'

const EXAMPLES = [
  "Un chat samourai dans le Tokyo des annees 80, filme la nuit sous la pluie, sans dialogue.",
  "Une grand-mere qui repare des objets casses dans son atelier, tres lent, sons de matiere uniquement, format vertical de 15 secondes.",
  "Des cassettes VHS retrouvees dans un hopital ferme en 1997, une enquete qui avance video apres video.",
  "Un documentaire sur des creatures marines qui n'existent pas, voix off tres serieuse, pour s'endormir.",
]

export default function CustomMode() {
  const [brief, setBrief] = useState('')
  const [forced, setForced] = useState<string>('')
  const [nouns, setNouns] = useState<Record<string, NounRole>>({})
  const [result, setResult] = useState<InterpretResult | null>(null)

  const live = useMemo(() => (brief.trim().length > 8 ? scoreUniverses(brief).slice(0, 3) : []), [brief])
  const properNouns = useMemo(() => (brief.trim().length > 8 ? detect(brief).properNouns : []), [brief])

  const run = (overrides?: Record<string, NounRole>) => {
    if (!brief.trim()) return
    setResult(
      projectFromBrief(brief, {
        universeId: forced || undefined,
        nouns: overrides ?? nouns,
      }),
    )
  }

  const assign = (noun: string, role: NounRole) => {
    const next = { ...nouns, [noun]: role }
    setNouns(next)
    if (result) run(next)
  }

  const keep = () => {
    if (!result) return
    addProject(result.project)
  }

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="font-display text-3xl text-ink-100">Créer un univers</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-400">
          Écris ton idée comme elle te vient. L&apos;outil la garde mot pour mot comme colonne vertébrale de
          l&apos;univers, reconnaît celui dont le vocabulaire s&apos;en rapproche le plus pour en tirer une
          direction artistique cohérente, et déduit le format et la durée si tu les mentionnes. Tu pourras
          ensuite y générer autant de vidéos que tu veux.
        </p>
      </header>

      <Card title="Ton idee" subtitle="Plus tu es precis sur le ton, le rythme et ce que tu ne veux pas, meilleur sera le squelette.">
        <Area
          label="Decris l'univers que tu veux"
          value={brief}
          onChange={setBrief}
          rows={6}
          placeholder="ex. Une chercheuse solitaire explore une station spatiale abandonnee. Tres calme, presque aucune parole, format vertical de 20 secondes, uniquement des sons de ventilation."
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

        {live.length > 0 && (
          <div className="mt-4 rounded-lg border border-ink-700/70 bg-ink-850/50 p-3">
            <span className="label mb-2">Univers reconnus en direct</span>
            <div className="flex flex-wrap gap-2">
              {live.map((s) => (
                <span key={s.universeId} className={cx('chip', s.score > 0 && 'border-amber/40 text-amber-soft')}>
                  {s.emoji} {s.name}
                  <span className="text-ink-500">· {s.score}</span>
                  {s.matched.length > 0 && <span className="text-ink-500">({s.matched.slice(0, 3).join(', ')})</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {properNouns.length > 0 && (
          <div className="mt-4 rounded-lg border border-ink-700/70 bg-ink-850/50 p-3">
            <span className="label mb-2">Noms propres reperes</span>
            <p className="mb-3 text-[11.5px] leading-relaxed text-ink-500">
              Un nom propre est aussi souvent un lieu qu&apos;un personnage. Dis-moi ce qu&apos;il est plutot que
              de me laisser deviner : je cree la fiche correspondante, vide, prete a completer.
            </p>
            <div className="space-y-1.5">
              {properNouns.map((n) => (
                <div key={n} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-[120px] text-[13px] text-ink-200">{n}</span>
                  {(
                    [
                      ['ignore', 'Ni l’un ni l’autre'],
                      ['character', 'Personnage'],
                      ['place', 'Lieu'],
                    ] as [NounRole, string][]
                  ).map(([role, lbl]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => assign(n, role)}
                      className={cx(
                        'rounded-full border px-2.5 py-1 text-[11.5px] transition',
                        (nouns[n] ?? 'ignore') === role
                          ? 'border-amber/60 bg-amber/10 text-amber-soft'
                          : 'border-ink-700 bg-ink-850 text-ink-400 hover:border-ink-600',
                      )}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <Select
            label="Forcer un univers de reference"
            value={forced}
            onChange={setForced}
            options={[
              { value: '', label: 'Laisser la detection decider' },
              ...UNIVERSES.map((u) => ({ value: u.id, label: `${u.emoji} ${u.name}` })),
            ]}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="button" className="btn-primary" onClick={() => run()} disabled={!brief.trim()}>
            {result ? 'Reinterpreter' : "Construire l'univers"}
          </button>
          {result && (
            <button type="button" className="btn-quiet" onClick={() => setResult(null)}>
              Effacer
            </button>
          )}
        </div>
      </Card>

      {result && <Preview result={result} onKeep={keep} />}
    </div>
  )
}

function Preview({ result, onKeep }: { result: InterpretResult; onKeep: () => void }) {
  const p = result.project
  const u = getUniverse(p.universeId)
  const notes = explainInterpretation(result)

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <Card
        title={p.name}
        subtitle={`${u.emoji} ${u.name}`}
        actions={
          <button type="button" className="btn-primary px-3.5 py-1.5 text-[13px]" onClick={onKeep}>
            Ouvrir dans l&apos;atelier
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="label">Ton idee, conservee telle quelle</span>
            <p className="rounded-lg border-l-2 border-amber/50 bg-ink-850/60 px-3 py-2 text-[13px] italic leading-relaxed text-ink-200">
              {p.seedText}
            </p>
          </div>

          <div>
            <span className="label">Palette deduite — {p.direction.palette.name}</span>
            <Swatches colors={p.direction.palette.colors} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Lumiere" value={p.direction.lighting} />
            <Info label="Texture" value={p.direction.texture} />
            <Info label="Grammaire camera" value={p.direction.cameraGrammar} />
            <Info label="Signature sonore" value={p.direction.soundSignature} />
          </div>

          <div>
            <span className="label">Casting amorce</span>
            <ul className="space-y-1 text-[12.5px] text-ink-300">
              {p.characters.map((c) => (
                <li key={c.id}>
                  <span className="text-ink-100">{c.name}</span>
                  {c.role ? ` — ${c.role}` : ''}
                  {c.face ? '' : <span className="ml-1 text-signal-warn">· fiche a completer</span>}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="label">Lieux</span>
            <ul className="space-y-1 text-[12.5px] text-ink-300">
              {p.places.map((l) => (
                <li key={l.id}>
                  <span className="text-ink-100">{l.name}</span> — {l.kind}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card title="Ce que l'outil a compris">
          <ul className="space-y-2 text-[12.5px] leading-relaxed text-ink-300">
            {notes.map((n) => (
              <li key={n} className="flex gap-2">
                <span className="text-amber">→</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Ce qui est deja pret" subtitle="Tout reste editable dans l'atelier.">
          <div className="grid grid-cols-2 gap-2 text-[12.5px]">
            <Stat n={p.characters.length} label="personnages" />
            <Stat n={p.places.length} label="lieux" />
            <Stat n={p.props.length} label="accessoires" />
            <Stat n={p.formats.length} label="formats" />
            <Stat n={p.videos.length} label="video pilote" />
            <Stat n={p.refs.length} label="references decrites" />
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-ink-500">
            Les fiches vides sont volontaires : l&apos;outil ne va pas inventer un visage a la place du tien.
            L&apos;audit de l&apos;atelier liste precisement ce qu&apos;il reste a ecrire pour obtenir un rendu stable.
          </p>
        </Card>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="label">{label}</span>
      <p className="text-[12.5px] leading-relaxed text-ink-300">{value}</p>
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-lg border border-ink-700/70 bg-ink-850/50 px-3 py-2">
      <span className="font-display text-lg text-ink-100">{n}</span>
      <span className="ml-1.5 text-[12px] text-ink-400">{label}</span>
    </div>
  )
}
