/**
 * Interpreteur — mode Sur-Mesure.
 *
 * L'utilisateur ecrit son idee en texte libre. On ne la reformule pas :
 * on la garde comme colonne vertebrale, et on va chercher dans la
 * bibliotheque l'univers dont le vocabulaire colle le mieux pour en tirer
 * une direction artistique et un squelette editable.
 */

import type { AspectRatio, Character, Place, Project } from '../types'
import { UNIVERSES } from '../data/universes'
import { SEEDANCE } from '../data/seedance'
import { clamp, join, makeRng, randomSeed, titleCase, uid } from '../lib/utils'
import { generateProject } from './generate'
import { buildReferences } from './references'

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export interface UniverseScore {
  universeId: string
  name: string
  emoji: string
  score: number
  matched: string[]
}

/** Classe les univers par affinite avec le texte de l'utilisateur. */
export function scoreUniverses(text: string): UniverseScore[] {
  const hay = normalize(text)
  return UNIVERSES.map((u) => {
    const matched: string[] = []
    let score = 0
    for (const kw of u.keywords) {
      const k = normalize(kw)
      const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g')
      const hits = (hay.match(re) ?? []).length
      if (hits > 0) {
        score += hits * 3
        matched.push(kw)
      }
    }
    // Le nom de l'univers vaut double s'il est cite.
    if (hay.includes(normalize(u.name))) score += 6
    for (const g of u.genres) {
      if (hay.includes(normalize(g).split(' ')[0])) score += 1
    }
    return { universeId: u.id, name: u.name, emoji: u.emoji, score, matched }
  }).sort((a, b) => b.score - a.score)
}

/* ------------------------------------------------------------------ */
/* Extraction                                                          */
/* ------------------------------------------------------------------ */

const STOPWORDS = new Set([
  'je', 'veux', 'un', 'une', 'des', 'le', 'la', 'les', 'de', 'du', 'sur', 'avec', 'dans', 'qui',
  'que', 'pour', 'compte', 'chaine', 'video', 'videos', 'faire', 'creer', 'genre', 'style', 'et',
  'ou', 'ce', 'cette', 'mon', 'ma', 'mes', 'il', 'elle', 'est', 'sont', 'aux', 'au', 'en', 'par',
  'plus', 'tres', 'tout', 'toute', 'comme', 'ils', 'elles', 'on', 'nous',
])

export interface Detected {
  aspect: AspectRatio | null
  duration: number | null
  /** Noms propres reperes dans le texte (candidats personnages ou lieux). */
  properNouns: string[]
  /** Mots pleins les plus significatifs. */
  keywords: string[]
  tone: string | null
}

export function detect(text: string): Detected {
  const raw = text.trim()
  const hay = normalize(raw)

  let aspect: AspectRatio | null = null
  if (/\bvertical|9:16|9\/16\b/.test(hay)) aspect = '9:16'
  else if (/\bpaysage|16:9|16\/9\b/.test(hay)) aspect = '16:9'
  else if (/\bcarre|1:1\b/.test(hay)) aspect = '1:1'
  else if (/\bcinemascope|scope|21:9\b/.test(hay)) aspect = '21:9'

  const durMatch = hay.match(/(\d{1,2})\s*(?:s|sec|secondes?)\b/)
  const duration = durMatch
    ? Math.min(SEEDANCE.duration.max, Math.max(SEEDANCE.duration.min, parseInt(durMatch[1], 10)))
    : null

  const properNouns = Array.from(
    new Set(
      (raw.match(/\b[A-ZÀ-Ý][a-zà-ÿ'’-]{2,}\b/g) ?? []).filter(
        (w, i) => !(i === 0 && raw.startsWith(w)) && !STOPWORDS.has(normalize(w)),
      ),
    ),
  ).slice(0, 6)

  const keywords = Array.from(
    new Set(
      normalize(raw)
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOPWORDS.has(w)),
    ),
  ).slice(0, 12)

  let tone: string | null = null
  if (/\bdrole|humour|comique|marrant\b/.test(hay)) tone = 'humour pince-sans-rire'
  else if (/\bpeur|angoiss|flippant|horreur|inquietant\b/.test(hay)) tone = 'inquietude sourde, jamais de jump-scare'
  else if (/\bcalme|apais|doux|relax|asmr\b/.test(hay)) tone = 'calme, lent, apaisant'
  else if (/\bepique|grandiose|spectaculaire\b/.test(hay)) tone = 'ampleur maitrisee, jamais tape-a-l-oeil'
  else if (/\btriste|melancol|nostalg\b/.test(hay)) tone = 'melancolie retenue'

  return { aspect, duration, properNouns, keywords, tone }
}

/* ------------------------------------------------------------------ */
/* Construction du projet                                              */
/* ------------------------------------------------------------------ */

/**
 * Les mots pleins du debut de phrase decrivent le sujet ("chat samourai"),
 * la ou un nom propre isole decrit souvent un decor ("Tokyo"). On prefere
 * donc les premiers, et on ne retombe sur les noms propres qu'a defaut.
 */
function nameFromBrief(text: string, fallback: string): string {
  const d = detect(text)
  const words = d.keywords.slice(0, 2)
  if (words.length >= 2) return titleCase(words.join(' '))
  if (d.properNouns.length) return titleCase(d.properNouns.slice(0, 2).join(' '))
  if (words.length === 1) return titleCase(words[0])
  return fallback
}

/** Cree un personnage a partir d'un nom repere, a completer par l'utilisateur. */
function draftCharacter(name: string, brief: string): Character {
  const base = {
    name: titleCase(name),
    role: 'a definir',
    tagline: clamp(brief, 90),
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
  }
  return {
    id: uid('chr'),
    ...base,
    anchor: `${base.name.toUpperCase()} — description physique a completer (age, morphologie, visage, cheveux, peau, yeux, signe distinctif, costume)`,
  }
}

/** Ce que l'utilisateur decide de faire d'un nom propre repere dans son texte. */
export type NounRole = 'ignore' | 'character' | 'place'

export interface InterpretOptions {
  seed?: number
  /** Forcer un univers plutot que celui detecte. */
  universeId?: string
  /**
   * Role attribue a chaque nom propre repere. Par defaut « ignore » :
   * un nom propre est aussi souvent un lieu qu'un personnage, et deviner
   * mal cree une fiche parasite que l'utilisateur devra supprimer.
   */
  nouns?: Record<string, NounRole>
}

/** Cree un lieu a partir d'un nom repere, a completer par l'utilisateur. */
function draftPlace(name: string, brief: string): Place {
  return {
    id: uid('plc'),
    name: titleCase(name),
    kind: 'a definir',
    tagline: clamp(brief, 90),
    description: '',
    architecture: '',
    materials: '',
    light: '',
    weather: '',
    timeOfDay: '',
    soundscape: '',
    details: '',
    forbidden: '',
    anchor: `${titleCase(name).toUpperCase()} — description a completer (architecture, matieres, lumiere, moment)`,
  }
}

export interface InterpretResult {
  project: Project
  scores: UniverseScore[]
  detected: Detected
}

/**
 * Transforme une idee en texte libre en projet complet.
 * Tout ce que l'utilisateur a ecrit est conserve : dans les notes, dans la
 * mission de l'artiste, dans le pitch visuel et dans la logline du pilote.
 */
export function projectFromBrief(brief: string, opts: InterpretOptions = {}): InterpretResult {
  const seed = opts.seed ?? randomSeed()
  const rng = makeRng(seed)
  const scores = scoreUniverses(brief)
  const universeId = opts.universeId ?? (scores[0]?.score > 0 ? scores[0].universeId : rng.pick(UNIVERSES).id)
  const detected = detect(brief)
  const project = generateProject({ seed, universeId, brief })

  // L'idee de l'utilisateur devient la colonne vertebrale de l'univers.
  const clean = brief.trim()
  project.origin = 'sur-mesure'
  project.seedText = clean
  project.name = nameFromBrief(clean, project.name)
  project.artist.name = project.name
  project.artist.mission = clean
  project.artist.tagline = clamp(clean, 110)
  project.direction.pitch = clean
  project.notes = `Idee d'origine (mot pour mot) :\n${clean}`

  if (detected.tone) {
    project.artist.voice = `${detected.tone}. ${project.artist.voice}`
  }

  // Noms propres : uniquement ceux que l'utilisateur a explicitement assignes.
  const assigned = opts.nouns ?? {}
  const asCharacters = detected.properNouns.filter((n) => assigned[n] === 'character')
  const asPlaces = detected.properNouns.filter((n) => assigned[n] === 'place')
  if (asCharacters.length) {
    project.characters = [...asCharacters.map((n) => draftCharacter(n, clean)), ...project.characters]
  }
  if (asPlaces.length) {
    project.places = [...asPlaces.map((n) => draftPlace(n, clean)), ...project.places]
  }

  // Reglages deduits du texte.
  if (detected.aspect) project.settings.aspect = detected.aspect
  if (detected.duration) project.settings.duration = detected.duration

  // Le pilote reprend l'idee telle quelle.
  const pilot = project.videos[0]
  if (pilot) {
    pilot.logline = clean
    pilot.aspect = project.settings.aspect
    if (detected.duration) {
      const total = detected.duration
      pilot.duration = total
      const n = pilot.shots.length || 1
      const step = total / n
      pilot.shots.forEach((s, i) => {
        s.start = Math.round(i * step)
        s.end = i === n - 1 ? total : Math.round((i + 1) * step)
      })
    }
    // Les nouveaux personnages entrent dans le pilote.
    const leadId = project.characters[0]?.id
    if (leadId) {
      pilot.shots.forEach((s, i) => {
        if (i > 0) s.characterIds = [leadId]
      })
    }
    pilot.title = `${clamp(clean, 60)} — video 1`
  }

  project.refs = buildReferences(project)
  project.updatedAt = Date.now()
  return { project, scores, detected }
}

/** Resume lisible de ce que l'interpreteur a compris, affiche a l'utilisateur. */
export function explainInterpretation(result: InterpretResult): string[] {
  const out: string[] = []
  const top = result.scores[0]
  if (top && top.score > 0) {
    out.push(`Univers rapproche : ${top.emoji} ${top.name} (mots reconnus : ${top.matched.slice(0, 6).join(', ')})`)
  } else {
    out.push("Aucun univers ne ressort du texte : direction artistique tiree au sort, a ajuster librement.")
  }
  const d = result.detected
  if (d.aspect) out.push(`Format deduit : ${d.aspect}`)
  if (d.duration) out.push(`Duree deduite : ${d.duration} s`)
  if (d.tone) out.push(`Ton detecte : ${d.tone}`)
  if (d.properNouns.length)
    out.push(
      `Noms propres reperes : ${d.properNouns.join(', ')} — a toi de dire si chacun est un personnage, un lieu, ou rien du tout.`,
    )
  out.push(join(['Tout le reste est un squelette editable', 'les fiches vides sont signalees par l\'audit'], ' — '))
  return out
}
