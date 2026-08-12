/**
 * Exports.
 *
 * « La Bible » est le document unique a copier-coller : la direction
 * artistique complete, les personnages, les lieux, le manifeste de
 * references et les prompts prets a coller dans Seedance.
 */

import type { Video, Project } from '../types'
import { AUDIO_LEGEND, PROMPT_RULES, SEEDANCE, promptWordBudget } from '../data/seedance'
import { getUniverse } from '../data/universes'
import { formatDate } from '../lib/utils'
import { auditProject, scorePercent } from './audit'
import { compileVideo, compileShot } from './prompt'
import { indexReferences, refStats } from './references'

const RULE = '─'.repeat(70)

function bullets(items: string[]): string {
  return items.filter(Boolean).map((i) => `- ${i}`).join('\n')
}

function kv(label: string, value: string): string {
  return value && value.trim() ? `**${label}** : ${value.trim()}` : ''
}

function block(lines: (string | undefined)[]): string {
  return lines.filter((l) => l && l.trim()).join('\n')
}

/* ------------------------------------------------------------------ */
/* Manifeste de references                                             */
/* ------------------------------------------------------------------ */

export function exportReferenceManifest(project: Project): string {
  const refs = indexReferences(project.refs)
  const s = refStats(project.refs)
  if (!refs.length) return 'Aucune reference definie.'

  const rows = refs.map((r) => {
    return block([
      `### ${r.token} — ${r.label}`,
      kv('Fichier', r.filename),
      kv('Format', r.aspect),
      kv('Statut', r.status === 'prete' ? 'prete' : 'a produire'),
      kv('Origine', r.sourceKind === 'photo-fournie' ? 'photo fournie par l\'artiste — ne pas regenerer' : 'a generer'),
      r.url ? kv('URL', r.url) : '',
      kv('Definit', r.defines),
      kv('Ne pas reprendre', r.exclude),
      kv('Comment la produire', r.howTo),
      '',
      '**Prompt de fabrication de la reference :**',
      '```',
      r.genPrompt,
      '```',
    ])
  })

  return block([
    `## Manifeste de references`,
    '',
    `${s.images} image(s), ${s.videos} video(s), ${s.audio} audio — ${s.total} sur ${SEEDANCE.refs.maxTotal} autorisees.`,
    `Sujets principaux : ${s.primary} (recommande : ${SEEDANCE.refs.recommendedPrimarySubjects} maximum).`,
    '',
    "> L'ORDRE D'ENVOI FAIT LE NUMERO. Le premier fichier joint est @Image1, le deuxieme @Image2, etc.",
    '> Les tokens ci-dessous valent si tu envoies le manifeste EN ENTIER.',
    "> Une video qui n'utilise qu'une partie des references recalcule ses propres numeros :",
    "> fie-toi toujours a la liste « fichiers a joindre » livree avec le prompt de la video.",
    '',
    '| Token | Fichier | Role |',
    '|---|---|---|',
    ...refs.map((r) => `| ${r.token} | \`${r.filename}\` | ${r.label} |`),
    '',
    ...rows,
  ])
}

/* ------------------------------------------------------------------ */
/* Prompts                                                             */
/* ------------------------------------------------------------------ */

export function exportVideoPrompt(project: Project, video: Video): string {
  const c = compileVideo(project, video)
  return block([
    `### ${video.title}`,
    video.visualIdea ? `**Idee visuelle** : ${video.visualIdea}` : '',
    video.lyrics ? `\n**Paroles de ce passage :**\n> ${video.lyrics.split('\n').join('\n> ')}\n` : '',
    video.continuity ? `**Continuite** : ${video.continuity}` : '',
    kv('Duree', `${video.duration} s`),
    kv('Format', video.aspect),
    kv('Resolution', video.resolution),
    video.cameraFixed ? '**Camera** : verrouillee' : '',
    video.seed ? kv('Seed', video.seed) : '',
    '',
    c.header,
    '',
    '**Prompt :**',
    '```',
    c.full,
    '```',
    `_${c.bodyWords} mots dans le corps du prompt (cible pour ${video.shots.length} plan(s) : ${promptWordBudget(video.shots.length).min} a ${promptWordBudget(video.shots.length).sweet})._`,
  ])
}

export function exportShotPrompts(project: Project, video: Video): string {
  if (video.shots.length < 2) return ''
  return block([
    `#### Variante plan par plan — ${video.title}`,
    '',
    "_A utiliser si tu preferes generer des clips courts et les monter ensuite._",
    '',
    ...video.shots.map((s) => {
      const c = compileShot(project, video, s)
      return block([
        `**${s.label || s.shotSize}** (${s.end - s.start} s)`,
        '```',
        c.full,
        '```',
      ])
    }),
  ])
}

/* ------------------------------------------------------------------ */
/* Le Compte                                                           */
/* ------------------------------------------------------------------ */

export function exportBible(project: Project): string {
  const u = getUniverse(project.universeId)
  const a = project.artist
  const d = project.direction
  const audit = auditProject(project)

  const head = block([
    `# ${project.name}`,
    `_${a.tagline}_`,
    '',
    `> Bible d'univers generee avec Promptvideo Studio pour Seedance ${SEEDANCE.version}.`,
    `> Univers : ${u.emoji} ${u.name} · Origine : ${project.origin} · Graine : ${project.seedNumber} · Mis a jour le ${formatDate(project.updatedAt)}`,
    `> Score de completude : ${scorePercent(audit)} %`,
  ])

  const brief = project.seedText
    ? block(['## Idee d\'origine', '', '> ' + project.seedText.split('\n').join('\n> ')])
    : ''

  const artist = block([
    "## 1. L'identite",
    '',
    kv('Nom', a.name),
    kv('Qui filme', a.archetype),
    kv('Intention', a.mission),
    kv('Ton', a.voice),
    kv('Phrase signature', a.signature),
    '',
    a.lore ? `**Le monde** : ${a.lore}` : '',
    a.values.length ? `\n**Valeurs** :\n${bullets(a.values)}` : '',
    a.taboos.length ? `\n**Ce que ces videos ne feront jamais** :\n${bullets(a.taboos)}` : '',
  ])

  const direction = block([
    '## 2. Direction artistique',
    '',
    kv('Pitch visuel', d.pitch),
    kv('Genre', d.genre),
    kv('Regle d\'or', d.motto),
    '',
    `**Palette — ${d.palette.name}**`,
    '',
    `${d.palette.colors.map((c) => `\`${c}\``).join(' · ')}`,
    '',
    d.palette.note,
    '',
    kv('Lumiere', d.lighting),
    kv('Texture et support', d.texture),
    kv('Etalonnage', d.colorGrade),
    kv('Optiques', d.lensKit.join(', ')),
    kv('Grammaire camera', d.cameraGrammar),
    kv('Composition', d.composition),
    kv('Rythme de montage', d.rhythm),
    kv('Signature sonore', d.soundSignature),
    d.textureTraits.length ? `\n**Traits de texture imposes** :\n${bullets(d.textureTraits)}` : '',
    d.preferredTimes.length ? `\n**Moments privilegies** :\n${d.preferredTimes.map((t, i) => `${i + 1}. ${t}`).join('\n')}` : '',
    d.avoidedTimes.length ? `\n**Moments ecartes** :\n${bullets(d.avoidedTimes)}` : '',
    d.lightSources.length ? `\n**Sources de lumiere autorisees** :\n${bullets(d.lightSources)}` : '',
    d.cameraMoves.length ? `\n**Mouvements de camera autorises** :\n${bullets(d.cameraMoves)}` : '',
    d.compositionRules.length ? `\n**Strategies de composition** :\n${bullets(d.compositionRules)}` : '',
    d.livingElements.length ? `\n**Ce qui doit bouger dans chaque plan** :\n${bullets(d.livingElements)}` : '',
    d.backgroundLife.length ? `\n**Vie de fond — micro-actions de la figuration** :\n${bullets(d.backgroundLife)}` : '',
    d.crowdRules.length ? `\n**Regles de figuration** :\n${bullets(d.crowdRules)}` : '',
    d.wardrobe.length ? `\n**Garde-robe** :\n${bullets(d.wardrobe)}` : '',
    d.wardrobeRules.length ? `\n**Regles vestimentaires** :\n${bullets(d.wardrobeRules)}` : '',
    d.emotionalRegister.length ? `\n**Registre emotionnel** : ${d.emotionalRegister.join(' · ')}` : '',
    d.transitionTriggers.length ? `\n**Transitions motivees** :\n${bullets(d.transitionTriggers)}` : '',
    d.environmentPool.length ? `\n**Reservoir d'environnements** :\n${bullets(d.environmentPool)}` : '',
    d.continuityRules.length ? `\n**Continuite entre videos** :\n${bullets(d.continuityRules)}` : '',
    d.doList.length ? `\n**Toujours** :\n${bullets(d.doList)}` : '',
    d.dontList.length ? `\n**Jamais** :\n${bullets(d.dontList)}` : '',
  ])

  const cast = block([
    '## 3. Casting',
    '',
    ...project.characters.map((c) =>
      block([
        `### ${c.name}${c.role ? ` — ${c.role}` : ''}`,
        c.tagline ? `_${c.tagline}_` : '',
        '',
        kv('Age', c.age),
        kv('Morphologie', c.build),
        kv('Visage', c.face),
        kv('Cheveux', c.hair),
        kv('Peau', c.skin),
        kv('Yeux', c.eyes),
        kv('Signe distinctif', c.distinctive),
        kv('Costume', c.costume),
        kv('Accessoires', c.accessories),
        kv('Code couleur', c.colorCode),
        kv('Posture', c.posture),
        kv('Energie', c.energy),
        kv('Voix', c.voice),
        kv('Rapport a la camera', c.gaze),
        c.behaviors.length ? `**Actions credibles** : ${c.behaviors.join(' · ')}` : '',
        kv('Arc', c.arc),
        kv('Relations', c.relations),
        '',
        "**Ancre d'identite** — a recopier dans chaque prompt ou ce personnage apparait :",
        '```',
        c.anchor,
        '```',
      ]),
    ),
  ])

  const places = block([
    '## 4. Lieux',
    '',
    ...project.places.map((l) =>
      block([
        `### ${l.name}${l.kind ? ` — ${l.kind}` : ''}`,
        l.tagline ? `_${l.tagline}_` : '',
        '',
        kv('Description', l.description),
        kv('Architecture', l.architecture),
        kv('Matieres', l.materials),
        kv('Lumiere', l.light),
        kv('Meteo', l.weather),
        kv('Moment', l.timeOfDay),
        kv('Ambiance sonore', l.soundscape),
        kv('Details', l.details),
        kv('Interdit dans ce lieu', l.forbidden),
        '',
        '**Ancre de lieu :**',
        '```',
        l.anchor,
        '```',
      ]),
    ),
  ])

  const props = project.props.length
    ? block([
        '## 5. Accessoires recurrents',
        '',
        ...project.props.map((p) => block([`### ${p.name}`, kv('Description', p.description), kv('Role', p.role)])),
      ])
    : ''

  const formats = project.formats.length
    ? block([
        '## 6. Formats recurrents',
        '',
        ...project.formats.map((f) =>
          block([
            `### ${f.name}`,
            f.pitch ? `_${f.pitch}_` : '',
            '',
            kv('Duree cible', `${f.duration} s`),
            kv('Accroche', f.hook),
            kv('Chute', f.payoff),
            f.beats.length ? `\n**Structure** :\n${f.beats.map((b, i) => `${i + 1}. ${b}`).join('\n')}` : '',
            f.recurring.length ? `\n**Elements recurrents** :\n${bullets(f.recurring)}` : '',
          ]),
        ),
      ])
    : ''

  const settings = block([
    '## 7. Reglages de generation',
    '',
    kv('Duree par defaut', `${project.settings.duration} s (limites du modele : ${SEEDANCE.duration.min}–${SEEDANCE.duration.max} s)`),
    kv('Format', project.settings.aspect),
    kv('Resolution', project.settings.resolution),
    kv('Camera verrouillee', project.settings.cameraFixed ? 'oui' : 'non'),
    kv('Langue', project.settings.language),
    kv('Sous-titres', project.settings.subtitles ? 'oui' : 'non'),
    '',
    project.settings.negatives.length ? `**A eviter (bloc negatif) :**\n${bullets(project.settings.negatives)}` : '',
    '',
    '**Syntaxe audio de Seedance 2.5 :**',
    '',
    ...AUDIO_LEGEND.map((l) => `- \`${l.symbol}\` → ${l.role}`),
  ])

  const refs = block(['## 8. References', '', exportReferenceManifest(project).replace(/^## Manifeste de references\n?/, '')])

  const videos = block([
    '## 9. Videos pretes a generer',
    '',
    ...project.videos.map((e) => block([exportVideoPrompt(project, e), '', exportShotPrompts(project, e)])),
  ])

  const method = block([
    '## 10. Mode d\'emploi',
    '',
    '1. Produis les references du manifeste (les prompts de fabrication sont fournis pour chacune).',
    '2. Verifie la planche visage de chaque personnage avant tout : c\'est elle qui tient la coherence.',
    `3. Joins les fichiers **dans l'ordre exact du manifeste** : le premier devient @Image1.`,
    '4. Colle le prompt de l\'video.',
    '5. Genere, puis reutilise les memes references pour l\'video suivant.',
    '',
    '**Regles de redaction appliquees par cet export :**',
    '',
    ...PROMPT_RULES.map((r) => `- ${r}`),
  ])

  const auditBlock = audit.issues.length
    ? block([
        '## 11. Points a corriger',
        '',
        ...audit.issues.map((i) => `- **[${i.level}] ${i.title}** (${i.section}) — ${i.detail} → _${i.fix}_`),
      ])
    : block(['## 11. Points a corriger', '', 'Aucun. Le compte est complet.'])

  return [head, brief, artist, direction, cast, places, props, formats, settings, refs, videos, method, auditBlock]
    .filter(Boolean)
    .join(`\n\n${RULE}\n\n`)
}

/* ------------------------------------------------------------------ */
/* Pack court                                                          */
/* ------------------------------------------------------------------ */

/** Version condensee : uniquement ce qu'il faut coller dans Seedance. */
export function exportSeedancePack(project: Project): string {
  const refs = indexReferences(project.refs)
  return block([
    `# ${project.name} — pack Seedance ${SEEDANCE.version}`,
    '',
    '## Fichiers a joindre, dans cet ordre',
    '',
    ...refs.map((r) => `${r.token}  →  ${r.filename}   (${r.label})`),
    '',
    RULE,
    '',
    ...project.videos.map((e) => {
      const c = compileVideo(project, e)
      return block([`## ${e.title}  —  ${e.duration} s  ·  ${e.aspect}  ·  ${e.resolution}`, '', '```', c.full, '```'])
    }),
  ])
}

/* ------------------------------------------------------------------ */
/* Brief de delegation                                                 */
/* ------------------------------------------------------------------ */

/**
 * Prompt a donner a un assistant conversationnel pour faire approfondir
 * le compte au-dela de ce que l'outil genere seul.
 */
export function exportDelegationBrief(project: Project): string {
  const audit = auditProject(project)
  const gaps = audit.issues.filter((i) => i.level !== 'confort')
  return block([
    "Tu es directeur artistique. Voici un univers video en cours d'ecriture, destine a etre produit avec Seedance 2.5 (video 4 a 30 s, audio natif, references multimodales identifiees par leur ordre d'envoi : @Image1, @Image2...).",
    '',
    'Ta mission : approfondir ce compte sans changer son identite. Tu dois rendre :',
    '1. Trois nouveaux videos completes, au format multi-plans timecode, respectant strictement la direction artistique ci-dessous.',
    '2. Les ancres d\'identite completees pour tout personnage dont la description est incomplete.',
    '3. Les references supplementaires necessaires, avec pour chacune : ce qu\'elle definit, ce qu\'il faut y ignorer, et son prompt de fabrication.',
    '',
    gaps.length ? `Manques identifies a combler en priorite :\n${gaps.map((g) => `- ${g.title} : ${g.detail}`).join('\n')}` : 'Aucun manque bloquant identifie.',
    '',
    RULE,
    '',
    exportBible(project),
  ])
}

export function exportJSON(project: Project): string {
  return JSON.stringify(project, null, 2)
}
