import type { AspectRatio, Project, ReferenceSlot } from '../../types'
import { rebuildRefs, updateProject } from '../../store'
import { ASPECTS, SEEDANCE } from '../../data/seedance'
import { indexReferences, refStats } from '../../engine/references'
import { exportReferenceManifest } from '../../engine/exporter'
import { cx } from '../../lib/utils'
import { Area, Card, CodeBlock, ConfirmButton, CopyButton, Field, Meter, Select, Toggle } from '../../components/ui'

export default function ReferencesTab({ project }: { project: Project }) {
  const refs = indexReferences(project.refs)
  const s = refStats(project.refs)

  const patch = (id: string, m: (r: ReferenceSlot) => void) =>
    updateProject(project.id, (d) => {
      const r = d.refs.find((x) => x.id === id)
      if (r) m(r)
    })

  const move = (index: number, dir: -1 | 1) =>
    updateProject(project.id, (d) => {
      const j = index + dir
      if (j < 0 || j >= d.refs.length) return
      ;[d.refs[index], d.refs[j]] = [d.refs[j], d.refs[index]]
    })

  return (
    <div className="space-y-4">
      <Card
        title="Manifeste de references"
        subtitle="Seedance identifie les references par leur ORDRE d'envoi : le premier fichier joint devient @Image1. Les tokens affiches ici valent si tu envoies tout le manifeste ; chaque episode recalcule les siens selon les references qu'il utilise reellement, et sa propre liste est livree avec son prompt."
        actions={
          <>
            <CopyButton text={exportReferenceManifest(project)} label="Copier le manifeste" />
            <button type="button" className="btn-primary px-3 py-1.5 text-[12px]" onClick={() => rebuildRefs(project.id)}>
              Reconstruire
            </button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Gauge label="Images" value={s.images} max={SEEDANCE.refs.maxImages} />
          <Gauge label="Videos" value={s.videos} max={SEEDANCE.refs.maxVideos} />
          <Gauge label="Audio" value={s.audio} max={SEEDANCE.refs.maxAudio} />
          <Gauge label="Sujets principaux" value={s.primary} max={SEEDANCE.refs.recommendedPrimarySubjects} soft />
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-ink-500">
          Limites du modele : {SEEDANCE.refs.maxImages} images, {SEEDANCE.refs.maxVideos} videos, {SEEDANCE.refs.maxAudio} audio,{' '}
          {SEEDANCE.refs.maxTotal} au total. Au-dela de {SEEDANCE.refs.recommendedPrimarySubjects} sujets principaux,
          les traits distinctifs se diluent : mieux vaut moins de references, mais justes.
        </p>
        <p className="mt-2 text-[12px] text-ink-400">
          {s.ready} / {s.total} references marquees comme pretes.
        </p>
      </Card>

      <div className="space-y-3">
        {refs.map((r, i) => (
          <article key={r.id} className="panel p-4">
            <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="rounded-md border border-amber/40 bg-amber/10 px-2 py-1 font-mono text-[12px] text-amber-soft">
                  {r.token}
                </span>
                <div>
                  <h3 className="text-[14.5px] text-ink-100">{r.label}</h3>
                  <p className="font-mono text-[11.5px] text-ink-500">{r.filename}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="btn-quiet px-2 py-1 text-[12px]" onClick={() => move(i, -1)}>↑</button>
                <button type="button" className="btn-quiet px-2 py-1 text-[12px]" onClick={() => move(i, 1)}>↓</button>
                <ConfirmButton
                  label="✕"
                  confirmLabel="Retirer ?"
                  className="px-2 py-1 text-[12px]"
                  onConfirm={() => updateProject(project.id, (d) => { d.refs = d.refs.filter((x) => x.id !== r.id) })}
                />
              </div>
            </header>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <Field label="Libelle" value={r.label} onChange={(v) => patch(r.id, (x) => { x.label = v })} />
                <Field label="Nom de fichier" value={r.filename} onChange={(v) => patch(r.id, (x) => { x.filename = v })} mono />
                <Area
                  label="Ce que cette reference definit"
                  value={r.defines}
                  onChange={(v) => patch(r.id, (x) => { x.defines = v })}
                  rows={2}
                  hint="Ecrit tel quel dans le prompt : « @ImageN definit … »"
                />
                <Area
                  label="Ce qu'il faut y ignorer"
                  value={r.exclude}
                  onChange={(v) => patch(r.id, (x) => { x.exclude = v })}
                  rows={2}
                  hint="Sans cette precision, le modele reprend le fond, la pose ou la lumiere de la reference."
                />
              </div>

              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    label="Format"
                    value={r.aspect}
                    onChange={(v: AspectRatio) => patch(r.id, (x) => { x.aspect = v })}
                    options={ASPECTS.map((a) => ({ value: a.value, label: a.value }))}
                  />
                  <Select
                    label="Type"
                    value={r.kind}
                    onChange={(v: ReferenceSlot['kind']) => patch(r.id, (x) => { x.kind = v })}
                    options={[
                      { value: 'image', label: 'Image' },
                      { value: 'video', label: 'Video' },
                      { value: 'audio', label: 'Audio' },
                    ]}
                  />
                </div>
                <Field label="URL ou chemin du fichier" value={r.url} onChange={(v) => patch(r.id, (x) => { x.url = v })} />
                <Toggle
                  label="Reference prete"
                  checked={r.status === 'prete'}
                  onChange={(v) => patch(r.id, (x) => { x.status = v ? 'prete' : 'a-produire' })}
                  hint="Coche quand le fichier existe reellement."
                />
                <Toggle
                  label="Sujet principal"
                  checked={r.primary}
                  onChange={(v) => patch(r.id, (x) => { x.primary = v })}
                  hint={`Compte dans la limite des ${SEEDANCE.refs.recommendedPrimarySubjects} sujets principaux.`}
                />
                <p className="text-[11.5px] leading-relaxed text-ink-500">{r.howTo}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="label mb-0">Prompt pour fabriquer cette reference</span>
                <CopyButton text={r.genPrompt} label="Copier" className="px-2.5 py-1 text-[12px]" />
              </div>
              <textarea
                className="textarea font-mono text-[12px]"
                rows={4}
                value={r.genPrompt}
                onChange={(e) => patch(r.id, (x) => { x.genPrompt = e.target.value })}
              />
            </div>
          </article>
        ))}
      </div>

      <Card title="Manifeste complet" subtitle="Version texte, a garder a cote de toi pendant la production.">
        <CodeBlock text={exportReferenceManifest(project)} maxHeight={420} />
      </Card>
    </div>
  )
}

function Gauge({ label, value, max, soft }: { label: string; value: number; max: number; soft?: boolean }) {
  const over = value > max
  return (
    <div className="rounded-lg border border-ink-700/70 bg-ink-850/40 p-3">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[12px] text-ink-400">{label}</span>
        <span className={cx('font-display text-base', over ? (soft ? 'text-signal-warn' : 'text-signal-bad') : 'text-ink-100')}>
          {value}
          <span className="text-[11px] text-ink-500"> / {max}</span>
        </span>
      </div>
      <Meter value={Math.min(value, max)} max={max} tone={over ? 'bad' : 'amber'} />
    </div>
  )
}
