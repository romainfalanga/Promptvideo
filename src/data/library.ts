/**
 * Bibliotheque creative — types et reservoirs transverses.
 *
 * Le mode Studio ne tire pas au hasard dans une soupe de mots : il combine
 * des briques ecrites pour tenir ensemble (une palette va avec une lumiere,
 * qui va avec une texture, qui va avec une grammaire camera). Les reservoirs
 * ci-dessous sont les briques communes a tous les univers ; les briques
 * identitaires vivent dans `universes.ts`.
 */

import type { Palette } from '../types'

export interface CharacterSeed {
  name: string
  role: string
  tagline: string
  age: string
  build: string
  face: string
  hair: string
  skin: string
  eyes: string
  distinctive: string
  costume: string
  accessories: string
  colorCode: string
  posture: string
  energy: string
  voice: string
  arc: string
}

export interface PlaceSeed {
  name: string
  kind: string
  tagline: string
  description: string
  architecture: string
  materials: string
  light: string
  weather: string
  timeOfDay: string
  soundscape: string
  details: string
  forbidden: string
}

export interface PropSeed {
  name: string
  description: string
  role: string
}

export interface FormatSeed {
  name: string
  pitch: string
  duration: number
  beats: string[]
  hook: string
  payoff: string
  cta: string
  recurring: string[]
}

/**
 * Blocs detailles de direction artistique.
 *
 * Optionnels au niveau de l'univers : les univers generiques se contentent
 * des reservoirs communs ci-dessous, un socle d'artiste ecrit a la main les
 * remplit entierement.
 */
export interface UniverseExtras {
  textureTraits?: string[]
  preferredTimes?: string[]
  avoidedTimes?: string[]
  lightSources?: string[]
  cameraMoves?: string[]
  compositionRules?: string[]
  livingElements?: string[]
  backgroundLife?: string[]
  crowdRules?: string[]
  wardrobe?: string[]
  wardrobeRules?: string[]
  emotionalRegister?: string[]
  transitionTriggers?: string[]
  environmentPool?: string[]
  continuityRules?: string[]
}

export interface Universe extends UniverseExtras {
  id: string
  name: string
  emoji: string
  pitch: string
  /** Mots-cles utilises par l'interpreteur du mode Sur-Mesure. */
  keywords: string[]
  genres: string[]
  palettes: Palette[]
  lightings: string[]
  textures: string[]
  lensKits: string[][]
  cameraGrammars: string[]
  grades: string[]
  soundSignatures: string[]
  mottos: string[]
  doList: string[]
  dontList: string[]
  negatives: string[]
  archetypes: string[]
  missions: string[]
  audiences: string[]
  voices: string[]
  promises: string[]
  signatures: string[]
  values: string[]
  taboos: string[]
  nameA: string[]
  nameB: string[]
  characters: CharacterSeed[]
  places: PlaceSeed[]
  props: PropSeed[]
  formats: FormatSeed[]
}

/* ------------------------------------------------------------------ */
/* Reservoirs transverses                                              */
/* ------------------------------------------------------------------ */

export const COMPOSITIONS = [
  'cadrage centre et symetrique, sujet plein axe',
  'regle des tiers, sujet decale a gauche, vide narratif a droite',
  'composition en profondeur : premier plan flou, sujet net au second plan',
  'cadre dans le cadre (porte, fenetre, miroir) autour du sujet',
  'lignes de fuite fortes qui convergent sur le sujet',
  'sujet en bas de cadre, grand espace negatif au-dessus',
  'plan tres serre, le decor n\'existe que par les sons et les reflets',
  'diagonale dominante, horizon incline de quelques degres seulement',
]

export const RHYTHMS = [
  'plans longs de 6 a 10 secondes, une seule idee par plan',
  'coupe seche toutes les 2 a 3 secondes, montage nerveux',
  'un plan-sequence unique du debut a la fin',
  'accelerando : plans de plus en plus courts jusqu\'a la chute',
  'alternance plan large / insert macro toutes les 4 secondes',
  'trois blocs de duree egale, un par acte',
]

export const CADENCES = [
  '1 video par jour, meme heure',
  '3 videos par semaine (lundi, mercredi, vendredi)',
  '5 videos par semaine en semaine, pause le week-end',
  '2 videos par semaine + 1 format long le dimanche',
  '1 saison de 12 episodes publies quotidiennement, puis pause',
]

export const CTA_POOL = [
  'Dis-moi en commentaire ce que tu veux voir dans le prochain episode.',
  'Abonne-toi, l\'episode 2 tombe demain a la meme heure.',
  'Enregistre si tu veux le revoir en entier.',
  'Le nom du prochain lieu est dans les commentaires epingles.',
  'Choisis la suite : option A ou option B en commentaire.',
  'Partage a la personne qui pense exactement le contraire.',
]

export const HOOK_SHAPES = [
  'Ouvrir sur le detail le plus etrange, expliquer seulement apres.',
  'Poser une question a la premiere seconde, y repondre a la derniere.',
  'Montrer la fin d\'abord, puis remonter le fil.',
  'Commencer par un geste net et sonore, sans aucun mot.',
  'Annoncer une regle absurde, puis la respecter jusqu\'au bout.',
  'Faire une promesse chiffree tenue a l\'image.',
]

export const VALUE_WORDS = [
  'precision',
  'lenteur',
  'artisanat',
  'silence',
  'demesure',
  'tendresse',
  'rigueur documentaire',
  'humour pince-sans-rire',
  'melancolie',
  'emerveillement',
  'obsession du detail',
  'respect du reel',
  'gout du risque',
  'economie de moyens',
]

/* ------------------------------------------------------------------ */
/* Reservoirs par defaut des blocs detailles                           */
/* ------------------------------------------------------------------ */

/**
 * Ce qui doit bouger dans un plan, meme calme. Sans cette consigne,
 * Seedance produit une photo animee : le sujet respire et rien d'autre.
 */
export const DEFAULT_LIVING_ELEMENTS = [
  'le vent dans les vetements',
  'une meche de cheveux qui bouge',
  'de la circulation au loin',
  'une personne qui traverse le fond du cadre',
  'la lumiere qui change lentement',
  'de la vapeur ou de la fumee qui monte',
  'un reflet qui se deplace',
]

export const DEFAULT_BACKGROUND_LIFE = [
  "quelqu'un consulte son telephone",
  'deux personnes discutent sans se soucier de la camera',
  "quelqu'un traverse le cadre au premier plan",
  "quelqu'un ajuste sa veste",
  "quelqu'un s'assoit un peu plus loin",
  "quelqu'un regarde ailleurs, ailleurs que vers l'objectif",
]

export const DEFAULT_CROWD_RULES = [
  'personne ne regarde jamais la camera',
  'aucun figurant immobile : chacun a une action en cours',
  "la scene continue d'exister quand le sujet principal en sort",
]

export const DEFAULT_TRANSITION_TRIGGERS = [
  'un passage devant l’objectif',
  'un changement de direction du sujet',
  'une porte qui s’ouvre ou se ferme',
  'un balayage de lumiere',
  'un regard vers le hors-champ',
]

export const DEFAULT_EMOTIONAL_REGISTER = ['presence', 'retenue', 'attention']

export const PLATFORM_PRESETS = {
  tiktok: { aspect: '9:16', duration: 12, label: 'TikTok' },
  reels: { aspect: '9:16', duration: 15, label: 'Instagram Reels' },
  shorts: { aspect: '9:16', duration: 20, label: 'YouTube Shorts' },
  youtube: { aspect: '16:9', duration: 30, label: 'YouTube' },
  multi: { aspect: '9:16', duration: 15, label: 'Multi-plateformes' },
} as const

/** Types de references derivees automatiquement pour un personnage. */
export const CHARACTER_REF_TYPES = [
  {
    key: 'visage',
    label: 'fiche visage',
    defines: 'les traits du visage, la structure osseuse, la coiffure et la carnation',
    exclude: 'l\'arriere-plan, l\'eclairage et le cadrage de cette image',
    aspect: '1:1' as const,
    primary: true,
  },
  {
    key: 'silhouette',
    label: 'fiche silhouette et costume',
    defines: 'la morphologie complete, le costume, les matieres et les accessoires portes',
    exclude: 'le decor et la pose, qui doivent suivre le prompt',
    aspect: '3:4' as const,
    primary: true,
  },
  {
    key: 'profil',
    label: 'fiche profil et trois-quarts',
    defines: 'le profil, la nuque, l\'implantation des cheveux et les details vus de cote',
    exclude: 'les variations de costume presentes sur cette planche',
    aspect: '1:1' as const,
    primary: false,
  },
] as const

export const PLACE_REF_TYPES = [
  {
    key: 'plate',
    label: 'plaque de decor',
    defines: 'l\'architecture, les matieres, la profondeur et l\'organisation du lieu',
    exclude: 'les personnages et les objets mobiles presents sur l\'image',
    aspect: '16:9' as const,
    // Un decor n'est pas un « sujet principal » au sens du modele : ce sont
    // les identites de personnage qui saturent la reconnaissance.
    primary: false,
  },
  {
    key: 'ambiance',
    label: 'planche d\'ambiance lumineuse',
    defines: 'la direction de la lumiere, la densite des ombres et la brume du lieu',
    exclude: 'la composition et le cadrage, qui doivent suivre le prompt',
    aspect: '16:9' as const,
    primary: false,
  },
] as const
