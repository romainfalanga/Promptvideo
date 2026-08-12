/**
 * Prereglages d'artiste.
 *
 * Un univers est un reservoir dans lequel le mode Studio pioche. Un
 * prereglage, lui, est un compte deja ecrit : quand un artiste fournit son
 * socle de direction artistique, il ne faut rien tirer au sort, il faut
 * appliquer ce qu'il a dit.
 */

import type { Character, Video, Place, Project, Prop, Shot } from '../types'
import { VLAND_UNIVERSE } from './universes.vland'
import { buildDirection } from '../engine/generate'
import { buildReferences } from '../engine/references'
import { join, makeRng, uid } from '../lib/utils'

export interface ArtistPreset {
  id: string
  name: string
  emoji: string
  tagline: string
  summary: string
  /** Ce que le prereglage contient deja, affiche sur la carte. */
  highlights: string[]
  build: () => Project
}

/* ------------------------------------------------------------------ */
/* VLAND                                                               */
/* ------------------------------------------------------------------ */

function placeAnchorOf(p: Omit<Place, 'anchor' | 'id'>): string {
  return join([p.name.toUpperCase(), p.description, p.architecture, p.materials, p.light, p.timeOfDay], ', ')
}

/**
 * Rapport a la camera, personnage par personnage. C'est une variable a
 * part entiere du socle : « il ne doit pas constamment regarder la camera »
 * n'est pas une nuance de style, c'est une consigne a repeter a chaque prompt.
 */
const GAZE = {
  vland:
    "ne regarde presque jamais l'objectif ; il vit la scene, il ne pose pas. Un seul regard camera est autorise par video, et seulement s'il a une raison",
  crew: "ne regarde jamais l'objectif, meme brievement",
  elle: "ne regarde jamais l'objectif ; souvent de profil ou de dos",
} as const

const BEHAVIORS = {
  vland: [
    'marche',
    'discute avec quelqu’un',
    'rit avec ses amis',
    'regarde quelqu’un hors champ',
    'regarde la ville',
    'est assis',
    'conduit',
    'attend',
    'performe le morceau',
    'observe une situation sans y participer',
    'est seul dans le cadre',
    'est entoure de monde et reste a distance',
  ],
  crew: [
    'discutent entre eux',
    'rigolent',
    'fument',
    'regardent leur telephone',
    'entrent dans une voiture',
    'traversent le cadre',
  ],
  elle: ['marche devant', 'se retourne une fois', 'attend adossee', 'regarde ailleurs', 'quitte le cadre'],
} as const

/**
 * Ancres ecrites a la main.
 *
 * L'ancre auto-derivee concatene tous les champs de la fiche : pour un
 * personnage dont l'identite vient de photos reelles, cela produit cinq fois
 * « a completer depuis les photos de reference » dans le prompt. Inutile et
 * bruyant. On ecrit donc une ancre courte qui renvoie aux references.
 */
const ANCHORS = {
  vland:
    "VLAND — jeune rappeur ; visage, coiffure et silhouette strictement fixes par les photos de reference jointes, ne jamais les reinterpreter ; streetwear haut de gamme sombre, bijoux discrets",
  crew:
    "LE CREW — trois amis de la meme generation, silhouettes distinctes, hoodies et survetements premium, aucun d'eux ne ressemble a Vland",
  elle:
    "ELLE — presence feminine recurrente, identique a chaque reapparition, pieces vintage, une seule note plus chaude que le reste du cadre",
} as const

function vlandCharacters(): Character[] {
  return VLAND_UNIVERSE.characters.map((seed, i) => {
    const key = i === 0 ? 'vland' : i === 1 ? 'crew' : 'elle'
    return {
      id: uid('chr'),
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
      relations:
        i === 0
          ? "Le crew l'accompagne dans la moitie des scenes. Elle revient de loin en loin."
          : 'Gravite autour de Vland sans jamais lui voler le cadre.',
      isGroup: key === 'crew',
      gaze: GAZE[key],
      behaviors: [...BEHAVIORS[key]],
      anchor: ANCHORS[key],
    }
  })
}

function vlandPlaces(): Place[] {
  return VLAND_UNIVERSE.places.map((seed) => {
    const base = { ...seed }
    return { id: uid('plc'), ...base, anchor: placeAnchorOf(base) }
  })
}

function vlandProps(): Prop[] {
  return VLAND_UNIVERSE.props.map((seed) => ({
    id: uid('prp'),
    name: seed.name,
    description: seed.description,
    role: seed.role,
    anchor: `${seed.name.toUpperCase()}, ${seed.description}`,
  }))
}

/**
 * Video pilote de Vland.
 *
 * Ecrit a la main plutot que derive du format : il sert de modele de
 * redaction, en montrant a quoi ressemble un fragment de quinze secondes
 * qui respecte le socle — entree masquee, vie de fond, element en mouvement,
 * sortie motivee.
 */
function vlandPilot(characters: Character[], places: Place[], props: Prop[], formatId: string): Video {
  const vland = characters[0]
  const crew = characters[1]
  const station = places.find((p) => p.name === 'La station-service') ?? places[0]
  const phone = props.find((p) => p.name === 'Le telephone') ?? props[0]

  const shot = (partial: Partial<Shot> & Pick<Shot, 'label' | 'start' | 'end' | 'action'>): Shot => ({
    id: uid('sht'),
    shotSize: 'Plan moyen',
    angle: "hauteur d'oeil",
    movement: 'camera portee, legerement instable',
    lens: '35 mm',
    characterIds: [],
    placeId: station.id,
    propIds: [],
    initialState: '',
    endState: '',
    styleNote: '',
    backgroundAction: '',
    livingDetail: '',
    transitionOut: '',
    audio: { music: '', sfx: '', dialogue: '', subtitle: '' },
    refIds: [],
    notes: '',
    ...partial,
  })

  return {
    id: uid('ep'),
    title: 'Station-service, 3 h — fragment 1',
    formatId,
    logline: 'Quinze secondes sous l’auvent, personne ne s’arrete.',
    lyrics: '',
    visualIdea:
      'La station-service comme une scene de theatre : une flaque de lumiere blanche dans le noir, et personne pour la regarder.',
    continuity: 'Meme tenue que le fragment precedent : la scene est censee suivre immediatement.',
    duration: 15,
    aspect: '16:9',
    resolution: '1080p',
    cameraFixed: false,
    seed: '',
    shots: [
      shot({
        label: 'Entree masquee',
        start: 0,
        end: 4,
        shotSize: 'Plan large',
        movement: 'obstruction de premier plan',
        lens: '24 mm',
        action: 'une voiture traverse le premier plan et degage la vue',
        initialState: 'cadre presque noir, une lueur blanche derriere le vehicule',
        livingDetail: 'des insectes tournent dans le halo des tubes',
        transitionOut: 'un balayage de phares',
        audio: {
          music: '',
          sfx: 'bourdonnement des tubes neon, une voiture qui passe sur la route mouillee',
          dialogue: '',
          subtitle: '',
        },
      }),
      shot({
        label: 'Le crew sous l’auvent',
        start: 4,
        end: 9,
        shotSize: 'Plan moyen',
        movement: 'travelling lateral qui accompagne la marche',
        characterIds: crew ? [crew.id] : [],
        propIds: phone ? [phone.id] : [],
        action: 'le crew occupe l’auvent, deux discutent, un troisieme s’eloigne',
        backgroundAction: 'quelqu’un filme avec son telephone',
        livingDetail: 'la vapeur d’une respiration dans l’air froid',
        transitionOut: 'un changement de direction du rappeur',
      }),
      shot({
        label: 'Vland en retrait',
        start: 9,
        end: 15,
        shotSize: 'Plan large',
        movement: 'suivi de dos a hauteur d’epaule',
        lens: '35 mm',
        characterIds: vland ? [vland.id] : [],
        action: 'Vland reste en bordure du halo, dos a la camera, et regarde la route vide',
        endState: 'il sort du halo, sa silhouette disparait, la station continue de briller',
        styleNote: 'le rappeur decale sur le cote du cadre, la ville occupe le reste',
        backgroundAction: 'deux personnes discutent au loin',
        livingDetail: 'le vent dans les vetements',
      }),
    ],
    status: 'ecrit',
  }
}

function buildVland(): Project {
  const u = VLAND_UNIVERSE
  // La graine est fixe : un socle ecrit ne doit pas varier d'une ouverture
  // a l'autre. Elle ne sert qu'aux quelques champs restes generiques.
  const rng = makeRng(20260812)
  const direction = buildDirection(rng, u)

  // Le socle est explicite : on ne tire pas au sort ce que l'artiste a decrit.
  direction.pitch = u.pitch
  direction.genre = 'clip musical nocturne'
  direction.palette = u.palettes[0]
  direction.lighting = u.lightings[0]
  direction.texture = u.textures[0]
  direction.lensKit = ['24 mm', '35 mm', '50 mm']
  direction.cameraGrammar = u.cameraGrammars[0]
  direction.composition = u.compositionRules![0]
  direction.rhythm =
    'plans de 3 a 6 secondes cales sur le beat, chaque coupe motivee par un element de l’image'
  direction.colorGrade = u.grades[0]
  direction.soundSignature = u.soundSignatures[0]
  direction.motto = u.mottos[0]

  const characters = vlandCharacters()
  const places = vlandPlaces()
  const props = vlandProps()
  const formats = u.formats.map((f) => ({
    id: uid('fmt'),
    name: f.name,
    pitch: f.pitch,
    duration: f.duration,
    beats: [...f.beats],
    hook: f.hook,
    payoff: f.payoff,
    recurring: [...f.recurring],
  }))

  const project: Project = {
    id: uid('prj'),
    name: 'Vland',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    origin: 'studio',
    seedText: '',
    seedNumber: 20260812,
    universeId: u.id,
    artist: {
      name: 'Vland',
      tagline: 'Des images volees a un clip nocturne.',
      archetype: 'jeune rappeur contemporain',
      mission:
        'Produire des fragments de quinze secondes qui semblent extraits d’un meme clip nocturne, tourne a la camera analogique imparfaite.',
      lore:
        'Chaque video est un rush du meme clip. Le personnage, la texture et la colorimetrie ne changent jamais ; le lieu, la scene et l’idee visuelle changent a chaque fois. Le spectateur doit avoir l’impression de tomber sur des images qui n’etaient pas censees sortir.',
      voice: 'aucune narration : seules les paroles du morceau portent le texte',
      signature: 'La suite arrive.',
      values: ['authenticite', 'melancolie', 'obsession du detail'],
      taboos: [...u.taboos],
    },
    direction,
    characters,
    places,
    props,
    formats,
    videos: [vlandPilot(characters, places, props, formats[0].id)],
    refs: [],
    settings: {
      duration: 15,
      aspect: '16:9',
      resolution: '1080p',
      cameraFixed: false,
      language: 'francais',
      subtitles: false,
      // Liste curatee plutot que concatenee : u.negatives et dontList se
      // recouvrent largement, et un bloc negatif qui se repete perd de sa force.
      negatives: [
        'image ultra-propre, nette et stabilisee, rendu publicitaire 4K',
        'HDR excessif, peau lissee plastique, couleurs sursaturees',
        'neons multicolores, esthetique cyberpunk',
        'personnages qui regardent la camera, figurants immobiles, foule artificielle',
        'voiture de luxe mise en avant, liasse de billets, pose ostentatoire',
        'mouvement de camera flottant impossible, CGI visible',
        'pluie artificielle non motivee, rooftop systematique',
        'transitions artificielles ou effets de montage courts formats',
        'decors generiques, storytelling litteral',
        'musique ajoutee par le modele : ambiance captee uniquement, le morceau est pose au montage',
        'visage deforme, mains a doigts incoherents, changement d’identite entre deux plans',
        'filigrane, texte parasite, bordures noires, format non respecte',
      ],
    },
    notes: [
      'SOCLE APPLIQUE A TOUTES LES VIDEOS.',
      '',
      'Le scenario change d’une video a l’autre, l’identite visuelle ne bouge jamais.',
      'Chaque video fait environ 15 secondes et doit se lire comme un morceau d’un clip plus long.',
      '',
      'Ecriture d’une nouvelle video :',
      '1. Partir des paroles du morceau (champ « Paroles » de la video).',
      '2. Chercher une idee visuelle forte — une metaphore, une situation inattendue — plutot qu’une illustration litterale.',
      '3. Choisir un lieu qui n’a pas encore servi, dans le reservoir d’environnements.',
      '4. Donner a chaque plan une vie de fond, un element en mouvement et une sortie motivee.',
      '',
      'Format : 16:9 par defaut, pour le rendu clip. A basculer en 9:16 dans Reglages pour les formats courts.',
    ].join('\n'),
  }

  project.refs = buildReferences(project)

  // Les references de Vland sont des photos reelles fournies par l'artiste :
  // il ne faut surtout pas les regenerer, sinon le visage change.
  const vlandId = characters[0].id
  for (const r of project.refs) {
    if (r.subjectId === vlandId) {
      r.sourceKind = 'photo-fournie'
      r.howTo =
        'Photo reelle fournie par l’artiste. Ne pas la generer : c’est elle qui fixe le visage pour toutes les videos. Choisir une prise nette, de face, lumiere lisible, sans lunettes ni casquette qui masquerait les traits.'
      r.genPrompt =
        'Aucun prompt : cette reference est une photographie fournie. Si une planche complementaire est necessaire, la produire a partir de la photo existante, jamais d’une description.'
    }
  }

  return project
}

export const ARTIST_PRESETS: ArtistPreset[] = [
  {
    id: 'vland',
    name: 'Vland',
    emoji: '🎬',
    tagline: 'Clip nocturne, texture VHS, jeune rappeur contemporain.',
    summary:
      'Socle de direction artistique complet fourni par l’artiste : texture analogique, nuit et blue hour, palette desaturee, vie de fond obligatoire, garde-robe, politique de regard, transitions motivees et regles de continuite.',
    highlights: [
      '13 traits de texture cumules',
      '22 environnements en rotation',
      '17 micro-actions de figuration',
      '3 personnages recurrents',
      '3 formats de 15 s',
      'References de Vland en photos fournies',
    ],
    build: buildVland,
  },
]

export function getPreset(id: string): ArtistPreset | undefined {
  return ARTIST_PRESETS.find((p) => p.id === id)
}
