import { useMemo, useState } from 'react'
import type { Project } from '../../types'
import {
  exportBible,
  exportDelegationBrief,
  exportJSON,
  exportReferenceManifest,
  exportSeedancePack,
} from '../../engine/exporter'
import { auditProject, scorePercent } from '../../engine/audit'
import { compileVideo } from '../../engine/prompt'
import { download, fileize, cx } from '../../lib/utils'
import { Card, CodeBlock, CopyButton } from '../../components/ui'

type Kind = 'bible' | 'pack' | 'references' | 'delegation' | 'json'

const TABS: { id: Kind; label: string; hint: string }[] = [
  { id: 'bible', label: 'La Bible', hint: 'Le document complet : identite, direction artistique, casting, lieux, formats, references, prompts et mode d\'emploi.' },
  { id: 'pack', label: 'Pack Seedance', hint: 'Version courte : la liste ordonnee des fichiers a joindre, puis un prompt par video. Rien d\'autre.' },
  { id: 'references', label: 'Manifeste de references', hint: 'Uniquement les references, avec le prompt de fabrication de chacune.' },
  { id: 'delegation', label: 'Brief a deleguer', hint: 'A coller dans un assistant conversationnel pour faire ecrire de nouveaux videos dans la meme direction artistique.' },
  { id: 'json', label: 'JSON du projet', hint: 'Sauvegarde complete, reimportable depuis l\'accueil.' },
]

export default function ExportTab({ project }: { project: Project }) {
  const [kind, setKind] = useState<Kind>('bible')
  const audit = auditProject(project)
  const pct = scorePercent(audit)
  const blocking = audit.issues.filter((i) => i.level === 'bloquant')

  const content = useMemo(() => {
    switch (kind) {
      case 'bible':
        return exportBible(project)
      case 'pack':
        return exportSeedancePack(project)
      case 'references':
        return exportReferenceManifest(project)
      case 'delegation':
        return exportDelegationBrief(project)
      case 'json':
        return exportJSON(project)
    }
  }, [kind, project])

  const filename = useMemo(() => {
    const base = fileize(project.name)
    switch (kind) {
      case 'bible':
        return `${base}_bible.md`
      case 'pack':
        return `${base}_pack_seedance.md`
      case 'references':
        return `${base}_references.md`
      case 'delegation':
        return `${base}_brief.md`
      case 'json':
        return `${base}.json`
    }
  }, [kind, project.name])

  const active = TABS.find((t) => t.id === kind)!

  return (
    <div className="space-y-4">
      {blocking.length > 0 && (
        <div className="rounded-xl border border-signal-bad/40 bg-signal-bad/5 p-4">
          <p className="text-[13px] text-signal-bad">
            {blocking.length} point{blocking.length > 1 ? 's' : ''} bloquant{blocking.length > 1 ? 's' : ''} — l&apos;export
            fonctionne, mais le rendu sera instable.
          </p>
          <ul className="mt-1.5 space-y-0.5 text-[12.5px] text-ink-300">
            {blocking.slice(0, 4).map((b) => (
              <li key={b.id}>· {b.title} — {b.fix}</li>
            ))}
          </ul>
        </div>
      )}

      <Card
        title="Exporter l'univers"
        subtitle={`Completude : ${pct} %. Tout est genere en direct depuis les fiches de l'atelier.`}
        actions={
          <>
            <button type="button" className="btn-ghost px-3 py-1.5 text-[12px]" onClick={() => download(filename, content, kind === 'json' ? 'application/json' : 'text/markdown;charset=utf-8')}>
              Telecharger
            </button>
            <CopyButton text={content} label="Tout copier" variant="primary" />
          </>
        }
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setKind(t.id)}
              className={cx(
                'rounded-lg border px-3 py-1.5 text-[12.5px] transition',
                kind === t.id ? 'border-amber/60 bg-amber/10 text-amber-soft' : 'border-ink-700 bg-ink-850 text-ink-400 hover:border-ink-600',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="mb-3 text-[12.5px] leading-relaxed text-ink-400">{active.hint}</p>
        <p className="mb-3 font-mono text-[11.5px] text-ink-600">
          {filename} · {content.length.toLocaleString('fr-FR')} caracteres
        </p>

        <CodeBlock text={content} maxHeight={640} />
      </Card>

      <Card title="Prompts par video" subtitle="Le raccourci quotidien : un bouton par video.">
        {project.videos.length === 0 ? (
          <p className="text-[12.5px] text-ink-500">Aucune video a exporter.</p>
        ) : (
          <div className="space-y-2">
            {project.videos.map((e) => {
              const c = compileVideo(project, e)
              return (
                <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-700/70 bg-ink-850/40 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] text-ink-100">{e.title}</p>
                    <p className="text-[11.5px] text-ink-500">
                      {e.duration} s · {e.aspect} · {e.resolution} · {c.attachments.length} references · {c.bodyWords} mots
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <CopyButton text={c.header} label="Liste des fichiers" className="px-2.5 py-1 text-[12px]" />
                    <CopyButton text={c.full} label="Copier le prompt" className="px-2.5 py-1 text-[12px]" variant="primary" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card title="Comment s'en servir" subtitle="La chaine de production, du manifeste a la video.">
        <ol className="space-y-2.5 text-[13px] leading-relaxed text-ink-300">
          {[
            'Produis les references du manifeste avec les prompts de fabrication fournis. Commence par la planche visage de chaque personnage : c\'est elle qui tient l\'identite.',
            'Marque chaque reference comme prete dans l\'onglet References au fur et a mesure.',
            'Ouvre Seedance et joins les fichiers dans l\'ordre exact du manifeste : le premier devient @Image1.',
            'Colle le prompt de l\'video, verifie la duree et le format, lance la generation.',
            "Pour la video suivante, reutilise exactement les memes references : c'est ce qui rend l'univers coherent d'une video a l'autre.",
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber text-[11px] font-bold text-ink-950">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
