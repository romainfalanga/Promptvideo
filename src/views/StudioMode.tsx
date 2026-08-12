import { useState } from 'react'
import type { ConceptCard, Platform } from '../types'
import { generateConceptBatch, generateProject } from '../engine/generate'
import { UNIVERSES, getUniverse } from '../data/universes'
import { PLATFORM_PRESETS } from '../data/library'
import { addProject } from '../store'
import { Area, Card, Select, Swatches } from '../components/ui'
import { cx } from '../lib/utils'

const PLATFORM_OPTIONS: { value: Platform; label: string }[] = (
  Object.keys(PLATFORM_PRESETS) as Platform[]
).map((k) => ({ value: k, label: PLATFORM_PRESETS[k].label }))

export default function StudioMode() {
  const [platform, setPlatform] = useState<Platform>('multi')
  const [universeId, setUniverseId] = useState<string>('')
  const [brief, setBrief] = useState('')
  const [cards, setCards] = useState<ConceptCard[]>([])
  const [seedInput, setSeedInput] = useState('')

  const run = () => {
    const seed = seedInput.trim() ? Number(seedInput.trim()) : undefined
    setCards(
      generateConceptBatch(3, {
        platform,
        universeId: universeId || undefined,
        brief: brief.trim() || undefined,
        seed: Number.isFinite(seed) ? seed : undefined,
      }),
    )
  }

  const materialize = (card: ConceptCard) => {
    const project = generateProject({
      seed: card.seedNumber,
      universeId: card.universeId,
      platform,
      brief: brief.trim() || undefined,
    })
    addProject(project)
  }

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <h1 className="font-display text-3xl text-ink-100">Mode Studio</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-400">
          Le moteur propose des comptes entiers, pas des mots-cles. Chaque proposition contient un artiste,
          une direction artistique tenue, un casting, des lieux et un format recurrent. Tu peux tout laisser
          libre, ou poser des contraintes ci-dessous. Une graine identique redonne exactement le meme resultat.
        </p>
      </header>

      <Card title="Contraintes de depart" subtitle="Tout est facultatif. Laisse vide pour laisser le moteur decider.">
        <div className="grid gap-4 md:grid-cols-3">
          <Select
            label="Plateforme visee"
            value={platform}
            onChange={setPlatform}
            options={PLATFORM_OPTIONS}
          />
          <Select
            label="Univers impose"
            value={universeId}
            onChange={setUniverseId}
            options={[
              { value: '', label: 'Au choix du moteur' },
              ...UNIVERSES.map((u) => ({ value: u.id, label: `${u.emoji} ${u.name}` })),
            ]}
          />
          <label className="block">
            <span className="label">Graine (facultatif)</span>
            <input
              className="input font-mono text-[12.5px]"
              placeholder="ex. 1873421"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
            />
            <span className="mt-1 block text-[11px] text-ink-500">Meme graine = meme compte, a l&apos;identique.</span>
          </label>
        </div>

        <div className="mt-4">
          <Area
            label="Contrainte libre a garder en tete"
            value={brief}
            onChange={setBrief}
            rows={2}
            placeholder="ex. pas de visage humain · sans dialogue · doit tenir en 10 secondes"
            hint="Ce texte est conserve dans les notes du compte genere."
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="button" className="btn-primary" onClick={run}>
            {cards.length ? 'Regenerer trois propositions' : 'Generer trois propositions'}
          </button>
          {cards.length > 0 && (
            <button type="button" className="btn-quiet" onClick={() => setCards([])}>
              Effacer
            </button>
          )}
        </div>
      </Card>

      {cards.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          {cards.map((c) => (
            <ConceptView key={c.seedNumber} card={c} onKeep={() => materialize(c)} />
          ))}
        </div>
      )}

      {cards.length === 0 && (
        <Card title="Les neuf univers de la bibliotheque" subtitle="Chacun apporte sa palette, sa lumiere, sa grammaire camera, son casting et ses formats.">
          <div className="grid gap-3 md:grid-cols-3">
            {UNIVERSES.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setUniverseId(u.id === universeId ? '' : u.id)}
                className={cx(
                  'rounded-lg border p-4 text-left transition',
                  universeId === u.id
                    ? 'border-amber/60 bg-amber/5'
                    : 'border-ink-700/70 bg-ink-850/40 hover:border-ink-600',
                )}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-lg">{u.emoji}</span>
                  <span className="font-display text-[15px] text-ink-100">{u.name}</span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-400">{u.pitch}</p>
                <div className="mt-3">
                  <Swatches colors={u.palettes[0].colors} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function ConceptView({ card, onKeep }: { card: ConceptCard; onKeep: () => void }) {
  const u = getUniverse(card.universeId)
  return (
    <article className="panel flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="chip mb-2">
            {u.emoji} {u.name}
          </span>
          <h3 className="font-display text-xl leading-tight text-ink-100">{card.name}</h3>
          <p className="text-[12px] text-ink-500">@{card.handle}</p>
        </div>
      </div>

      <p className="text-[13px] leading-relaxed text-amber-soft">{card.tagline}</p>

      <Line label="Mission" value={card.pitch} />
      <Line label="Look" value={card.visual} />
      <Line label="Audience" value={card.audience} />

      <div>
        <span className="label">Palette — {card.palette.name}</span>
        <Swatches colors={card.palette.colors} />
      </div>

      <div>
        <span className="label">Format recurrent</span>
        <p className="text-[13px] text-ink-200">{card.formatName}</p>
        <p className="text-[12.5px] leading-relaxed text-ink-400">{card.formatPitch}</p>
      </div>

      <Line label="Accroche" value={card.hook} />

      <div>
        <span className="label">Casting amorce</span>
        <ul className="space-y-0.5 text-[12.5px] text-ink-300">
          {card.castNames.map((n) => (
            <li key={n}>· {n}</li>
          ))}
        </ul>
      </div>

      <div>
        <span className="label">Lieux</span>
        <ul className="space-y-0.5 text-[12.5px] text-ink-300">
          {card.placeNames.map((n) => (
            <li key={n}>· {n}</li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <span className="font-mono text-[10.5px] text-ink-600">graine {card.seedNumber}</span>
        <button type="button" className="btn-primary px-3 py-1.5 text-[13px]" onClick={onKeep}>
          Developper ce compte
        </button>
      </div>
    </article>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      <span className="label">{label}</span>
      <p className="text-[12.5px] leading-relaxed text-ink-300">{value}</p>
    </div>
  )
}
