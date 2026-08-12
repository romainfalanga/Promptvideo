import type { AspectRatio, Platform, Project, Resolution } from '../../types'
import { updateProject } from '../../store'
import { ASPECTS, AUDIO_LEGEND, BASE_NEGATIVES, PROMPT_RULES, RESOLUTIONS, SEEDANCE } from '../../data/seedance'
import { PLATFORM_PRESETS } from '../../data/library'
import { Area, Card, Field, Grid, ListEditor, NumberField, Select, Toggle } from '../../components/ui'

export default function SettingsTab({ project }: { project: Project }) {
  const s = project.settings
  const set = <K extends keyof typeof s>(key: K, value: (typeof s)[K]) =>
    updateProject(project.id, (d) => {
      d.settings[key] = value
    })

  const applyToAllEpisodes = () =>
    updateProject(project.id, (d) => {
      d.episodes.forEach((e) => {
        e.aspect = d.settings.aspect
        e.resolution = d.settings.resolution
        e.cameraFixed = d.settings.cameraFixed
      })
    })

  return (
    <div className="space-y-4">
      <Grid cols={2}>
        <Card
          title="Rendu par defaut"
          subtitle="Valeurs appliquees aux nouveaux episodes."
          actions={
            <button type="button" className="btn-ghost px-3 py-1.5 text-[12px]" onClick={applyToAllEpisodes}>
              Appliquer a tous les episodes
            </button>
          }
        >
          <div className="space-y-4">
            <Select
              label="Plateforme"
              value={project.platform}
              onChange={(v: Platform) =>
                updateProject(project.id, (d) => {
                  d.platform = v
                  d.settings.aspect = PLATFORM_PRESETS[v].aspect as AspectRatio
                  d.settings.duration = PLATFORM_PRESETS[v].duration
                })
              }
              options={(Object.keys(PLATFORM_PRESETS) as Platform[]).map((k) => ({ value: k, label: PLATFORM_PRESETS[k].label }))}
            />
            <Grid cols={2}>
              <NumberField
                label="Duree"
                value={s.duration}
                min={SEEDANCE.duration.min}
                max={SEEDANCE.duration.max}
                suffix="s"
                onChange={(v) => set('duration', v)}
              />
              <Select
                label="Resolution"
                value={s.resolution}
                onChange={(v: Resolution) => set('resolution', v)}
                options={RESOLUTIONS.map((r) => ({ value: r, label: r }))}
              />
            </Grid>
            <Select
              label="Format"
              value={s.aspect}
              onChange={(v: AspectRatio) => set('aspect', v)}
              options={ASPECTS.map((a) => ({ value: a.value, label: `${a.label} — ${a.usage}` }))}
            />
            <Toggle
              label="Camera verrouillee par defaut"
              checked={s.cameraFixed}
              onChange={(v) => set('cameraFixed', v)}
              hint="Utile pour les comptes en plans fixes."
            />
          </div>
        </Card>

        <Card title="Langue et texte">
          <div className="space-y-4">
            <Field label="Langue des dialogues" value={s.language} onChange={(v) => set('language', v)} hint="Precisee dans le prompt quand un dialogue existe." />
            <Toggle
              label="Inclure les textes incrustes"
              checked={s.subtitles}
              onChange={(v) => set('subtitles', v)}
              hint="Les blocs 【 】 des plans sont ajoutes au prompt."
            />
            <div>
              <span className="label">Syntaxe audio de Seedance {SEEDANCE.version}</span>
              <div className="space-y-1.5">
                {AUDIO_LEGEND.map((l) => (
                  <div key={l.symbol} className="flex items-center gap-3 rounded-lg border border-ink-700/70 bg-ink-850/40 px-3 py-1.5">
                    <code className="font-mono text-[12px] text-amber-soft">{l.symbol}</code>
                    <span className="text-[12.5px] text-ink-300">{l.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </Grid>

      <Card
        title="Bloc negatif"
        subtitle="Ajoute a la fin de chaque prompt. C'est ce qui empeche les derives les plus courantes."
        actions={
          <button
            type="button"
            className="btn-ghost px-3 py-1.5 text-[12px]"
            onClick={() =>
              set('negatives', Array.from(new Set([...s.negatives, ...BASE_NEGATIVES, ...project.direction.dontList])))
            }
          >
            Recharger les negatifs de base + interdits de la DA
          </button>
        }
      >
        <ListEditor label="A eviter" items={s.negatives} onChange={(v) => set('negatives', v)} placeholder="ex. lumiere du jour" />
      </Card>

      <Grid cols={2}>
        <Card title="Notes de production">
          <Area
            label="Notes libres"
            value={project.notes}
            onChange={(v) => updateProject(project.id, (d) => { d.notes = v })}
            rows={8}
          />
        </Card>

        <Card title="Regles de redaction appliquees" subtitle="Le compilateur de prompts suit ces regles automatiquement.">
          <ol className="space-y-2 text-[12.5px] leading-relaxed text-ink-300">
            {PROMPT_RULES.map((r, i) => (
              <li key={r} className="flex gap-2.5">
                <span className="shrink-0 text-ink-500">{i + 1}.</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-lg border border-ink-700/70 bg-ink-850/40 p-3 text-[11.5px] leading-relaxed text-ink-400">
            <strong className="text-ink-200">Contraintes du modele</strong>
            <br />
            Duree : {SEEDANCE.duration.min}–{SEEDANCE.duration.max} s · References : {SEEDANCE.refs.maxImages} images,{' '}
            {SEEDANCE.refs.maxVideos} videos, {SEEDANCE.refs.maxAudio} audio ({SEEDANCE.refs.maxTotal} maximum au total) ·
            Sujets principaux conseilles : {SEEDANCE.refs.recommendedPrimarySubjects} ({SEEDANCE.refs.recommendedPrimaryWithVideo} si
            des references video sont utilisees) · Clips de reference : {SEEDANCE.refs.clipSweetSpotSeconds[0]}–
            {SEEDANCE.refs.clipSweetSpotSeconds[1]} s.
          </div>
        </Card>
      </Grid>
    </div>
  )
}
