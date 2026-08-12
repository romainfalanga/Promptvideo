/**
 * Compilateur de prompts Seedance 2.5.
 *
 * Ordre impose par le modele : sujet + action d'abord (les 20-30 premiers
 * mots pesent le plus), puis la scene, puis le style, puis la camera et
 * l'audio. Les references sont declarees en tete avec ce qu'elles
 * apportent ET ce qu'il faut y ignorer.
 */

import type { Episode, Project, Shot } from '../types'
import { AUDIO_SYNTAX, countWords, formatTimecode } from '../data/seedance'
import { join, lcFirst, sentence, ucFirst } from '../lib/utils'
import { indexReferences, type IndexedRef } from './references'

export interface CompiledPrompt {
  /** En-tete de declaration des references. */
  header: string
  /** Corps narratif : c'est lui qui doit peser 60 a 100 mots. */
  body: string
  /** Bloc technique final (style, camera, audio, interdits). */
  footer: string
  /** Prompt complet, pret a coller. */
  full: string
  /** Liste ordonnee des fichiers a joindre. */
  attachments: IndexedRef[]
  bodyWords: number
  totalWords: number
}

/* ------------------------------------------------------------------ */
/* Selection des references utiles                                     */
/* ------------------------------------------------------------------ */

function collectRefs(project: Project, shots: Shot[]): IndexedRef[] {
  const usedSubjects = new Set<string>()
  for (const s of shots) {
    s.characterIds.forEach((id) => usedSubjects.add(id))
    if (s.placeId) usedSubjects.add(s.placeId)
    s.propIds.forEach((id) => usedSubjects.add(id))
  }
  const explicit = new Set(shots.flatMap((s) => s.refIds))

  const kept = project.refs.filter(
    (r) =>
      r.subjectType === 'style' ||
      explicit.has(r.id) ||
      (r.subjectId !== null && usedSubjects.has(r.subjectId)),
  )

  // Renumerotation indispensable : Seedance numerote par ordre d'envoi.
  // Si l'episode n'utilise que 7 references sur 17, la cinquieme jointe est
  // @Image5 — pas le numero qu'elle occupe dans le manifeste complet.
  return indexReferences(kept)
}

function refDeclaration(r: IndexedRef): string {
  const defines = sentence(`${r.token} definit ${r.defines}`)
  const exclude = r.exclude ? ` Ne pas reprendre ${r.exclude}.` : ''
  return `${defines}${exclude}`
}

/* ------------------------------------------------------------------ */
/* Corps narratif                                                      */
/* ------------------------------------------------------------------ */

function subjectsOf(project: Project, shot: Shot): string {
  const names = shot.characterIds
    .map((id) => project.characters.find((c) => c.id === id))
    .filter(Boolean)
    .map((c) => c!.name.toUpperCase())
  return names.join(' et ')
}

/** Rappel d'identite compact : c'est ce qui tient la coherence entre videos. */
function anchorsOf(project: Project, shots: Shot[]): string[] {
  const ids = new Set(shots.flatMap((s) => s.characterIds))
  return project.characters.filter((c) => ids.has(c.id)).map((c) => c.anchor)
}

/**
 * Une ligne de plan. Le decor n'est decrit en entier qu'a sa premiere
 * apparition : le repeter a chaque plan gonfle le prompt sans rien apporter,
 * et dilue les 20-30 premiers mots qui portent le plus de poids.
 */
function shotLine(project: Project, shot: Shot, withTimecode: boolean, placesSeen: Set<string>): string {
  const place = shot.placeId ? project.places.find((p) => p.id === shot.placeId) : null
  const named = subjectsOf(project, shot)
  const placeIsSubject = !named && !!place
  const subject = named || (place ? place.name.toUpperCase() : 'LE CADRE')
  const props = shot.propIds
    .map((id) => project.props.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => p!.name)

  // Le lieu n'est detaille qu'a sa premiere apparition, et jamais repete
  // quand il est lui-meme le sujet du plan.
  let placeClause = ''
  if (place) {
    const first = !placesSeen.has(place.id)
    placesSeen.add(place.id)
    if (first) placeClause = placeIsSubject ? lcFirst(place.description) : `dans ${place.name} — ${lcFirst(place.description)}`
    else placeClause = placeIsSubject ? '' : `dans ${place.name}`
  }

  const head = join([subject, shot.action || 'action a preciser', placeClause], ', ')

  // Les complements sont introduits par un deux-points : ils gardent leur
  // majuscule d'origine sans casser la phrase.
  const tail = [
    shot.initialState ? `au depart : ${shot.initialState}` : '',
    shot.endState ? `a la fin : ${shot.endState}` : '',
    props.length ? `objet visible : ${props.join(' et ')}` : '',
  ].filter(Boolean)

  const tc = withTimecode ? `[${formatTimecode(shot.start)}–${formatTimecode(shot.end)}] ` : ''
  const cam = join([shot.angle, shot.movement, shot.lens], ', ')
  const core = [sentence(head), ...tail.map((t) => sentence(ucFirst(t)))].join(' ')
  return `${tc}${shot.shotSize.toUpperCase()} — ${core} Camera : ${cam}.`
}

/* ------------------------------------------------------------------ */
/* Audio                                                               */
/* ------------------------------------------------------------------ */

function audioLine(project: Project, shots: Shot[]): string {
  const parts: string[] = []
  const music = shots.map((s) => s.audio.music).find(Boolean)
  if (music) parts.push(AUDIO_SYNTAX.music(music))

  // Dedoublonnage : plusieurs plans partagent souvent la meme ambiance de
  // lieu, la repeter n'ajoute rien et brouille la consigne.
  const seen = new Set<string>()
  const uniq = (values: string[]) => values.filter((v) => v && !seen.has(v) && seen.add(v))

  for (const v of uniq(shots.map((s) => s.audio.sfx))) parts.push(AUDIO_SYNTAX.sfx(v))
  for (const v of uniq(shots.map((s) => s.audio.dialogue))) parts.push(AUDIO_SYNTAX.dialogue(v))
  if (project.settings.subtitles) {
    for (const v of uniq(shots.map((s) => s.audio.subtitle))) parts.push(AUDIO_SYNTAX.subtitle(v))
  }
  if (!parts.length) return ''
  const langNote = shots.some((s) => s.audio.dialogue) ? `Dialogues en ${project.settings.language}. ` : ''
  return `Audio : ${langNote}${parts.join(' ')}`
}

/* ------------------------------------------------------------------ */
/* Compilation                                                         */
/* ------------------------------------------------------------------ */

function styleFooter(project: Project, shots: Shot[]): string {
  const d = project.direction
  const place = shots.map((s) => s.placeId).find(Boolean)
  const placeObj = place ? project.places.find((p) => p.id === place) : null

  const lines = [
    `Style : ${join([d.genre, d.lighting, d.texture, d.colorGrade], ', ')}.`,
    `Palette imposee : ${d.palette.name} — ${d.palette.colors.join(', ')}. ${d.palette.note}`,
    `Grammaire camera : ${d.cameraGrammar}. Composition : ${d.composition}.`,
    placeObj?.soundscape ? `Ambiance sonore du lieu : ${placeObj.soundscape}.` : '',
  ]
  return lines.filter(Boolean).join('\n')
}

function constraintsFooter(project: Project, episode: Episode): string {
  const negatives = project.settings.negatives.filter(Boolean)
  const lines = [
    `Parametres : duree ${episode.duration} s, format ${episode.aspect}, resolution ${episode.resolution}${
      episode.cameraFixed ? ', camera verrouillee' : ''
    }${episode.seed ? `, seed ${episode.seed}` : ''}.`,
    negatives.length ? `A eviter absolument : ${negatives.join(' ; ')}.` : '',
    project.direction.motto ? `Regle d'or : ${project.direction.motto}` : '',
  ]
  return lines.filter(Boolean).join('\n')
}

/** Compile un episode entier en un seul prompt multi-plans timecode. */
export function compileEpisode(project: Project, episode: Episode): CompiledPrompt {
  const shots = episode.shots
  const attachments = collectRefs(project, shots)

  const header = attachments.length
    ? [
        'REFERENCES A JOINDRE, DANS CET ORDRE EXACT :',
        ...attachments.map((r) => `  ${r.token}  →  ${r.filename}${r.status === 'prete' ? '' : '  (a produire)'}   — ${r.label}`),
      ].join('\n')
    : 'Aucune reference : generation en texte seul.'

  const declarations = attachments.map(refDeclaration).join(' ')
  const anchors = anchorsOf(project, shots)
  const anchorLine = anchors.length
    ? `Identites a respecter a l'identique dans tous les plans — ${anchors.join(' | ')}.`
    : ''

  const multi = shots.length > 1
  const placesSeen = new Set<string>()
  const shotLines = shots.map((s) => shotLine(project, s, multi, placesSeen))

  // Le corps narratif est ce qui doit peser 60 a 100 mots. Les ancres
  // d'identite sont un rappel technique : elles sont comptees a part.
  const narrative = [episode.logline ? sentence(episode.logline) : '', ...shotLines].filter(Boolean).join('\n')
  const body = [narrative, anchorLine].filter(Boolean).join('\n')

  const footer = [styleFooter(project, shots), audioLine(project, shots), constraintsFooter(project, episode)]
    .filter(Boolean)
    .join('\n')

  const full = [declarations, '', body, '', footer].filter((p) => p !== null).join('\n').trim()

  return {
    header,
    body,
    footer,
    full,
    attachments,
    bodyWords: countWords(narrative),
    totalWords: countWords(full),
  }
}

/** Compile un plan isole : utile pour les clips courts de 4 a 10 secondes. */
export function compileShot(project: Project, episode: Episode, shot: Shot): CompiledPrompt {
  const attachments = collectRefs(project, [shot])
  const declarations = attachments.map(refDeclaration).join(' ')
  const anchors = anchorsOf(project, [shot])
  const duration = Math.max(4, Math.min(30, shot.end - shot.start || 5))

  const narrative = [shotLine(project, shot, false, new Set()), shot.styleNote].filter(Boolean).join('\n')
  const body = [narrative, anchors.length ? `Identite a respecter — ${anchors.join(' | ')}.` : '']
    .filter(Boolean)
    .join('\n')

  const footer = [
    styleFooter(project, [shot]),
    audioLine(project, [shot]),
    `Parametres : duree ${duration} s, format ${episode.aspect}, resolution ${episode.resolution}${
      episode.cameraFixed ? ', camera verrouillee' : ''
    }.`,
    project.settings.negatives.length ? `A eviter : ${project.settings.negatives.join(' ; ')}.` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const header = attachments.length
    ? ['REFERENCES A JOINDRE, DANS CET ORDRE EXACT :', ...attachments.map((r) => `  ${r.token}  →  ${r.filename}   — ${r.label}`)].join('\n')
    : 'Aucune reference.'

  const full = [declarations, '', body, '', footer].join('\n').trim()

  return {
    header,
    body,
    footer,
    full,
    attachments,
    bodyWords: countWords(narrative),
    totalWords: countWords(full),
  }
}
