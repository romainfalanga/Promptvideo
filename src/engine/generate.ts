/**
 * Moteur de generation — mode Studio.
 *
 * Il ne tire pas des mots au hasard : il choisit un univers coherent puis
 * assemble ses briques avec une graine reproductible. Une meme graine
 * redonne exactement le meme compte, ce qui permet de rejouer, comparer
 * et affiner une idee.
 */

import type {
  ArtDirection,
  Artist,
  Character,
  ConceptCard,
  Episode,
  Format,
  Place,
  Platform,
  Project,
  Prop,
  Shot,
} from '../types'
import type { CharacterSeed, PlaceSeed, PropSeed, FormatSeed, Universe } from '../data/library'
import {
  CADENCES,
  COMPOSITIONS,
  DEFAULT_BACKGROUND_LIFE,
  DEFAULT_CROWD_RULES,
  DEFAULT_EMOTIONAL_REGISTER,
  DEFAULT_LIVING_ELEMENTS,
  DEFAULT_TRANSITION_TRIGGERS,
  HOOK_SHAPES,
  PLATFORM_PRESETS,
  RHYTHMS,
} from '../data/library'
import { UNIVERSES, getUniverse } from '../data/universes'
import { BASE_NEGATIVES, CAMERA_MOVES, SEEDANCE } from '../data/seedance'
import { handleize, join, makeRng, randomSeed, uid, type Rng } from '../lib/utils'
import { buildReferences } from './references'

export interface GenerateOptions {
  seed?: number
  universeId?: string
  platform?: Platform
  /** Contraintes libres saisies par l'utilisateur, injectees dans les notes. */
  brief?: string
  /** Univers a eviter (deja utilises). */
  avoid?: string[]
}

/* ------------------------------------------------------------------ */
/* Briques                                                             */
/* ------------------------------------------------------------------ */

function pickUniverse(rng: Rng, opts: GenerateOptions): Universe {
  if (opts.universeId) return getUniverse(opts.universeId)
  const pool = UNIVERSES.filter((u) => !opts.avoid?.includes(u.id))
  return rng.pick(pool.length ? pool : UNIVERSES)
}

function makeAccountName(rng: Rng, u: Universe): string {
  const a = rng.pick(u.nameA)
  const b = rng.pick(u.nameB)
  return rng.bool(0.35) ? `${a} ${b}` : `${a} ${b}`.trim()
}

function buildArtist(rng: Rng, u: Universe, name: string): Artist {
  const archetype = rng.pick(u.archetypes)
  const mission = rng.pick(u.missions)
  const promise = rng.pick(u.promises)
  const voice = rng.pick(u.voices)
  const audience = rng.pick(u.audiences)
  const signature = rng.pick(u.signatures)
  const values = rng.sample(u.values, Math.min(3, u.values.length))
  const taboos = rng.sample(u.taboos, Math.min(2, u.taboos.length))
  const cadence = rng.pick(CADENCES)

  return {
    name,
    handle: handleize(name),
    tagline: `${u.pitch.split(':')[0].trim()} — ${promise}`,
    archetype,
    mission,
    bio: `${name} — ${archetype}. ${promise[0].toUpperCase()}${promise.slice(1)}. ${signature}`,
    lore: `Le compte est tenu par ${archetype === 'aucun' ? 'une presence anonyme' : `un·e ${archetype}`} dont on ne sait presque rien. ${mission[0].toUpperCase()}${mission.slice(1)}. Le decor et les personnages reviennent d'un episode a l'autre : c'est la meme histoire qui avance, pas une serie de videos independantes.`,
    voice,
    audience,
    promise,
    signature,
    cadence,
    values,
    taboos,
  }
}

export function buildDirection(rng: Rng, u: Universe): ArtDirection {
  const texture = rng.pick(u.textures)
  return {
    pitch: u.pitch,
    genre: rng.pick(u.genres),
    palette: rng.pick(u.palettes),
    lighting: rng.pick(u.lightings),
    texture,
    lensKit: rng.pick(u.lensKits),
    cameraGrammar: rng.pick(u.cameraGrammars),
    composition: u.compositionRules?.length ? rng.pick(u.compositionRules) : rng.pick(COMPOSITIONS),
    rhythm: rng.pick(RHYTHMS),
    colorGrade: rng.pick(u.grades),
    soundSignature: rng.pick(u.soundSignatures),
    motto: rng.pick(u.mottos),
    doList: [...u.doList],
    dontList: [...u.dontList],

    // Blocs detailles : un univers qui ne les precise pas herite des
    // reservoirs communs, pour que chaque prompt ait quand meme une
    // consigne de vie de fond et de mouvement.
    textureTraits: u.textureTraits ? [...u.textureTraits] : [texture],
    preferredTimes: u.preferredTimes ? [...u.preferredTimes] : [],
    avoidedTimes: u.avoidedTimes ? [...u.avoidedTimes] : [],
    lightSources: u.lightSources ? [...u.lightSources] : [],
    cameraMoves: u.cameraMoves ? [...u.cameraMoves] : CAMERA_MOVES.slice(0, 6),
    compositionRules: u.compositionRules ? [...u.compositionRules] : COMPOSITIONS.slice(0, 4),
    livingElements: u.livingElements ? [...u.livingElements] : [...DEFAULT_LIVING_ELEMENTS],
    backgroundLife: u.backgroundLife ? [...u.backgroundLife] : [...DEFAULT_BACKGROUND_LIFE],
    crowdRules: u.crowdRules ? [...u.crowdRules] : [...DEFAULT_CROWD_RULES],
    wardrobe: u.wardrobe ? [...u.wardrobe] : [],
    wardrobeRules: u.wardrobeRules ? [...u.wardrobeRules] : [],
    emotionalRegister: u.emotionalRegister ? [...u.emotionalRegister] : [...DEFAULT_EMOTIONAL_REGISTER],
    transitionTriggers: u.transitionTriggers ? [...u.transitionTriggers] : [...DEFAULT_TRANSITION_TRIGGERS],
    environmentPool: u.environmentPool ? [...u.environmentPool] : [],
    continuityRules: u.continuityRules ? [...u.continuityRules] : [],
  }
}

function characterAnchor(c: Omit<Character, 'anchor' | 'id'>): string {
  return join([c.name.toUpperCase(), c.age, c.build, c.face, c.hair, c.skin, c.eyes, c.distinctive, c.costume], ', ')
}

function toCharacter(seed: CharacterSeed): Character {
  const base = {
    name: seed.name,
    role: seed.role,
    tagline: seed.tagline,
    age: seed.age,
    build: seed.build,
    face: seed.face,
    hair: seed.hair,
    skin: seed.skin,
    eyes: seed.eyes,
    distinctive: seed.distinctive,
    costume: seed.costume,
    accessories: seed.accessories,
    colorCode: seed.colorCode,
    posture: seed.posture,
    energy: seed.energy,
    voice: seed.voice,
    language: 'francais',
    arc: seed.arc,
    relations: '',
    isGroup: false,
    gaze: '',
    behaviors: [],
  }
  return { id: uid('chr'), ...base, anchor: characterAnchor(base) }
}

function placeAnchor(p: Omit<Place, 'anchor' | 'id'>): string {
  return join([p.name.toUpperCase(), p.description, p.architecture, p.materials, p.light, p.timeOfDay], ', ')
}

function toPlace(seed: PlaceSeed): Place {
  const base = {
    name: seed.name,
    kind: seed.kind,
    tagline: seed.tagline,
    description: seed.description,
    architecture: seed.architecture,
    materials: seed.materials,
    light: seed.light,
    weather: seed.weather,
    timeOfDay: seed.timeOfDay,
    soundscape: seed.soundscape,
    details: seed.details,
    forbidden: seed.forbidden,
  }
  return { id: uid('plc'), ...base, anchor: placeAnchor(base) }
}

function toProp(seed: PropSeed): Prop {
  return {
    id: uid('prp'),
    name: seed.name,
    description: seed.description,
    role: seed.role,
    anchor: `${seed.name.toUpperCase()}, ${seed.description}`,
  }
}

function toFormat(seed: FormatSeed, duration: number): Format {
  return {
    id: uid('fmt'),
    name: seed.name,
    pitch: seed.pitch,
    duration: Math.min(SEEDANCE.duration.max, Math.max(SEEDANCE.duration.min, seed.duration || duration)),
    beats: [...seed.beats],
    hook: seed.hook,
    payoff: seed.payoff,
    cta: seed.cta,
    recurring: [...seed.recurring],
  }
}

/* ------------------------------------------------------------------ */
/* Episode pilote                                                      */
/* ------------------------------------------------------------------ */

const MOVES_BY_POSITION = [
  'camera fixe sur pied',
  'travelling avant lent',
  'panoramique lent vers la droite',
  'camera fixe sur pied',
]

function buildPilot(
  rng: Rng,
  u: Universe,
  format: Format,
  characters: Character[],
  places: Place[],
  props: Prop[],
  direction: ArtDirection,
  aspect: Project['settings']['aspect'],
): Episode {
  const beats = format.beats.length ? format.beats : ['Ouverture', 'Developpement', 'Chute']
  const n = beats.length
  const duration = format.duration
  const step = duration / n
  const sizes = ['Plan large', 'Plan moyen', 'Gros plan', 'Plan large'] as const
  const lead = characters[0]
  const place = places[0]

  const shots: Shot[] = beats.map((beat, i) => {
    const start = Math.round(i * step)
    const end = i === n - 1 ? duration : Math.round((i + 1) * step)
    const size = sizes[Math.min(i, sizes.length - 1)]
    return {
      id: uid('sht'),
      label: beat,
      start,
      end,
      shotSize: size,
      angle: i === 0 ? "hauteur d'oeil" : rng.pick(["hauteur d'oeil", 'legere plongee', 'contre-plongee', 'niveau du sol']),
      movement: MOVES_BY_POSITION[Math.min(i, MOVES_BY_POSITION.length - 1)],
      lens: direction.lensKit[Math.min(i, direction.lensKit.length - 1)] ?? direction.lensKit[0],
      characterIds: i === 0 ? [] : lead ? [lead.id] : [],
      placeId: place ? place.id : null,
      propIds: i === n - 1 && props[0] ? [props[0].id] : [],
      // Seuls le premier et le dernier plan portent un etat explicite :
      // remplir les autres avec du texte generique gonfle le prompt pour rien.
      initialState: i === 0 ? `${place ? place.name : 'le lieu'} est vide, aucun mouvement` : '',
      action: beat,
      endState: i === n - 1 ? format.payoff : '',
      styleNote: i === 0 ? direction.composition : '',
      // Chaque plan recoit une vie de fond et un element en mouvement :
      // sans eux, Seedance produit une photo animee.
      backgroundAction: direction.backgroundLife.length ? rng.pick(direction.backgroundLife) : '',
      livingDetail: direction.livingElements.length ? rng.pick(direction.livingElements) : '',
      transitionOut:
        i < n - 1 && direction.transitionTriggers.length ? rng.pick(direction.transitionTriggers) : '',
      audio: {
        music: i === 0 ? direction.soundSignature.split(';')[0].trim() : '',
        sfx: i === 0 && place ? place.soundscape.split(',')[0].trim() : '',
        dialogue: '',
        subtitle: '',
      },
      refIds: [],
      notes: '',
    }
  })

  return {
    id: uid('ep'),
    title: `${format.name} — episode 1`,
    formatId: format.id,
    logline: `${format.pitch} ${rng.pick(HOOK_SHAPES)}`,
    lyrics: '',
    visualIdea: '',
    continuity: direction.continuityRules[0] ?? '',
    duration,
    aspect,
    resolution: '1080p',
    cameraFixed: direction.cameraGrammar.includes('fixe'),
    seed: '',
    shots,
    caption: `${format.pitch}\n\n${format.cta}`,
    hashtags: [u.id.replace(/-/g, ''), 'seedance', 'aivideo', ...u.keywords.slice(0, 3).map((k) => k.replace(/\s+/g, ''))],
    status: 'ecrit',
  }
}

/* ------------------------------------------------------------------ */
/* API publique                                                        */
/* ------------------------------------------------------------------ */

/** Fiche courte : ce que l'on montre avant de materialiser le projet. */
export function generateConcept(opts: GenerateOptions = {}): ConceptCard {
  const seed = opts.seed ?? randomSeed()
  const rng = makeRng(seed)
  const u = pickUniverse(rng, opts)
  const name = makeAccountName(rng, u)
  const artist = buildArtist(rng, u, name)
  const direction = buildDirection(rng, u)
  const format = rng.pick(u.formats)
  const cast = rng.sample(u.characters, Math.min(2, u.characters.length))
  const places = rng.sample(u.places, Math.min(2, u.places.length))

  return {
    seedNumber: seed,
    universeId: u.id,
    name,
    handle: artist.handle,
    tagline: artist.promise,
    pitch: artist.mission,
    visual: join([direction.genre, direction.lighting, direction.texture], ' · '),
    audience: artist.audience,
    formatName: format.name,
    formatPitch: format.pitch,
    palette: direction.palette,
    castNames: cast.map((c) => `${c.name} — ${c.role}`),
    placeNames: places.map((p) => `${p.name} — ${p.kind}`),
    hook: format.hook,
  }
}

/** Materialise un concept en projet complet et editable. */
export function generateProject(opts: GenerateOptions = {}): Project {
  const seed = opts.seed ?? randomSeed()
  const rng = makeRng(seed)
  const u = pickUniverse(rng, opts)
  const platform = opts.platform ?? 'multi'
  const preset = PLATFORM_PRESETS[platform]
  const name = makeAccountName(rng, u)

  const artist = buildArtist(rng, u, name)
  const direction = buildDirection(rng, u)

  const characters = rng.sample(u.characters, Math.min(3, u.characters.length)).map(toCharacter)
  const places = rng.sample(u.places, Math.min(3, u.places.length)).map(toPlace)
  const props = rng.sample(u.props, Math.min(2, u.props.length)).map(toProp)
  const formats = rng.sample(u.formats, Math.min(2, u.formats.length)).map((f) => toFormat(f, preset.duration))

  // Relations : on relie le premier personnage aux autres pour amorcer l'ecriture.
  if (characters.length > 1) {
    characters[0].relations = `Croise ${characters
      .slice(1)
      .map((c) => c.name)
      .join(' et ')} au fil des episodes.`
  }

  const aspect = preset.aspect as Project['settings']['aspect']
  const pilot = buildPilot(rng, u, formats[0], characters, places, props, direction, aspect)

  const project: Project = {
    id: uid('prj'),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    origin: 'studio',
    seedText: opts.brief ?? '',
    seedNumber: seed,
    universeId: u.id,
    platform,
    artist,
    direction,
    characters,
    places,
    props,
    formats,
    episodes: [pilot],
    refs: [],
    settings: {
      duration: preset.duration,
      aspect,
      resolution: '1080p',
      cameraFixed: false,
      language: 'francais',
      subtitles: true,
      negatives: Array.from(new Set([...BASE_NEGATIVES, ...u.negatives, ...direction.dontList])),
    },
    notes: opts.brief ? `Contrainte de depart : ${opts.brief}` : '',
  }

  project.refs = buildReferences(project)
  return project
}

/** Genere plusieurs concepts distincts (univers differents autant que possible). */
export function generateConceptBatch(count: number, opts: GenerateOptions = {}): ConceptCard[] {
  const out: ConceptCard[] = []
  const used: string[] = [...(opts.avoid ?? [])]
  for (let i = 0; i < count; i++) {
    const card = generateConcept({ ...opts, seed: opts.seed ? opts.seed + i * 7919 : undefined, avoid: opts.universeId ? [] : used })
    out.push(card)
    used.push(card.universeId)
  }
  return out
}
