/**
 * Generation d'une video a partir d'une idee.
 *
 * C'est le coeur du produit : on decrit ce qu'on veut, on obtient une video
 * decoupee en plans, prete a etre compilee en prompt Seedance. L'univers
 * fournit la direction artistique, le casting, les lieux et les references —
 * c'est ce qui fait que deux videos du meme univers se ressemblent.
 */

import type { AspectRatio, Project, Resolution, Shot, Video } from '../types'
import { SEEDANCE } from '../data/seedance'
import { clamp, makeRng, randomSeed, uid, type Rng } from '../lib/utils'

export interface VideoOptions {
  /** L'idee en texte libre. Devient l'idee visuelle de la video. */
  brief?: string
  duration?: number
  aspect?: AspectRatio
  resolution?: Resolution
  seed?: number
  /** Format recurrent a suivre. Par defaut : le premier de l'univers. */
  formatId?: string
  /** Lieu impose. Par defaut : un lieu peu utilise, pour ne pas se repeter. */
  placeId?: string
  /** Personnages presents. Par defaut : le premier du casting. */
  characterIds?: string[]
}

const DEFAULT_BEATS = [
  'entree dans la scene',
  "l'action principale se deroule",
  'la scene se referme',
]

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Choisit le lieu de la video.
 *
 * Si l'idee mentionne un decor precis, c'est celui-la qu'il faut : rien de
 * plus agacant que de demander un parking et d'obtenir un toit. A defaut,
 * on prend le lieu le moins utilise — un socle demande explicitement de ne
 * pas rejouer toujours le meme decor.
 */
function pickPlace(project: Project, rng: Rng, brief: string): string | null {
  if (!project.places.length) return null

  const hay = normalize(brief)
  if (hay.length > 3) {
    let best: { id: string; score: number } | null = null
    for (const p of project.places) {
      // Les mots du nom et du type pesent le plus : ce sont eux que
      // l'utilisateur emploie quand il designe un decor.
      let score = 0
      for (const w of normalize(`${p.name} ${p.kind}`).split(/[^a-z0-9]+/)) {
        if (w.length > 3 && hay.includes(w)) score += 3
      }
      for (const w of normalize(p.description).split(/[^a-z0-9]+/)) {
        if (w.length > 4 && hay.includes(w)) score += 1
      }
      if (score > 0 && (!best || score > best.score)) best = { id: p.id, score }
    }
    if (best) return best.id
  }

  const usage = new Map<string, number>()
  for (const p of project.places) usage.set(p.id, 0)
  for (const v of project.videos) {
    for (const s of v.shots) {
      if (s.placeId && usage.has(s.placeId)) usage.set(s.placeId, (usage.get(s.placeId) ?? 0) + 1)
    }
  }
  const min = Math.min(...usage.values())
  const freshest = project.places.filter((p) => (usage.get(p.id) ?? 0) === min)
  return rng.pick(freshest).id
}

/** Fait tourner un reservoir sans repiocher deux fois de suite la meme entree. */
function rotator(pool: string[], rng: Rng) {
  const order = pool.length ? rng.sample(pool, pool.length) : []
  let i = 0
  return () => (order.length ? order[i++ % order.length] : '')
}

export function generateVideoForProject(project: Project, opts: VideoOptions = {}): Video {
  const seed = opts.seed ?? randomSeed()
  const rng = makeRng(seed)
  const d = project.direction

  const format = opts.formatId
    ? project.formats.find((f) => f.id === opts.formatId)
    : project.formats[0]

  const duration = Math.min(
    SEEDANCE.duration.max,
    Math.max(SEEDANCE.duration.min, opts.duration ?? format?.duration ?? project.settings.duration),
  )
  const beats = format?.beats.length ? format.beats : DEFAULT_BEATS
  const n = beats.length
  const step = duration / n

  const placeId = opts.placeId ?? pickPlace(project, rng, opts.brief ?? '')
  const lead = opts.characterIds?.length
    ? opts.characterIds
    : project.characters[0]
      ? [project.characters[0].id]
      : []

  // Chaque reservoir de la direction artistique tourne : sans cela, toutes
  // les videos d'un univers reutilisent la meme poignee d'elements.
  const nextMove = rotator(d.cameraMoves, rng)
  const nextComposition = rotator(d.compositionRules, rng)
  const nextLiving = rotator(d.livingElements, rng)
  const nextBackground = rotator(d.backgroundLife, rng)
  const nextTransition = rotator(d.transitionTriggers, rng)

  const sizes = ['Plan large', 'Plan moyen', 'Plan rapproche', 'Plan large'] as const

  const place = placeId ? project.places.find((p) => p.id === placeId) : null
  const leadName = project.characters.find((c) => c.id === lead[0])?.name ?? 'le sujet'
  const briefText = (opts.brief ?? '').trim()

  /*
   * Les beats d'un format sont des notes de mise en scene, pas des actions :
   * les recopier telles quelles produit des lignes du genre « Sortie motivee
   * par un passage devant l'objectif » a la place de ce qui se passe a
   * l'image. Ils servent donc d'intitules, et l'action decrit ce qu'on voit —
   * l'idee de l'utilisateur portant le plan central.
   */
  const actionFor = (i: number, last: boolean): string => {
    if (i === 0) {
      return place
        ? `${place.name} avant que quiconque entre, le decor seul occupe le cadre`
        : 'le decor seul, avant toute entree dans le champ'
    }
    if (last && n > 2) {
      return `${leadName} quitte le cadre, le lieu reste une seconde de plus`
    }
    // L'idee ne porte qu'un seul plan : la repeter mot pour mot sur les
    // suivants gonfle le prompt et n'apprend rien de plus au modele.
    if (i === 1) return briefText || `${leadName} occupe la scene`
    return `la meme action se poursuit, saisie sous un autre angle`
  }

  const shots: Shot[] = beats.map((beat, i) => {
    const last = i === n - 1
    return {
      id: uid('sht'),
      label: beat,
      start: Math.round(i * step),
      end: last ? duration : Math.round((i + 1) * step),
      shotSize: sizes[Math.min(i, sizes.length - 1)],
      angle: "hauteur d'oeil",
      movement: nextMove() || 'camera portee, legerement instable',
      lens: d.lensKit[Math.min(i, d.lensKit.length - 1)] ?? d.lensKit[0] ?? '35 mm',
      // Le premier plan installe le lieu avant que quiconque entre.
      characterIds: i === 0 ? [] : lead,
      placeId,
      propIds: [],
      initialState: i === 0 && format?.hook ? format.hook : '',
      action: actionFor(i, last),
      endState: last && format?.payoff ? format.payoff : '',
      styleNote: nextComposition(),
      backgroundAction: nextBackground(),
      livingDetail: nextLiving(),
      transitionOut: last ? '' : nextTransition(),
      audio: {
        music: i === 0 ? d.soundSignature.split(';')[0].trim() : '',
        sfx: '',
        dialogue: '',
        subtitle: '',
      },
      refIds: [],
      notes: '',
    }
  })

  const brief = (opts.brief ?? '').trim()
  return {
    id: uid('vid'),
    title: brief ? clamp(brief, 60) : `${format?.name ?? 'Video'} ${project.videos.length + 1}`,
    formatId: format?.id ?? null,
    logline: format?.pitch ?? '',
    lyrics: '',
    // L'idee de l'utilisateur passe en tete du prompt : c'est elle qui doit
    // orienter la generation, avant le squelette du format.
    visualIdea: brief,
    continuity: '',
    duration,
    aspect: opts.aspect ?? project.settings.aspect,
    resolution: opts.resolution ?? project.settings.resolution,
    cameraFixed: project.settings.cameraFixed,
    seed: '',
    shots,
    status: 'ecrit',
  }
}
