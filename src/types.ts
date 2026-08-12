/**
 * Modele de donnees de Promptvideo Studio.
 *
 * Un "Compte" (Project) est l'unite de travail : un artiste, sa direction
 * artistique, son casting, ses lieux, ses formats recurrents, ses episodes
 * et le manifeste de references a envoyer a Seedance 2.5.
 */

export type ID = string

export type Platform = 'tiktok' | 'reels' | 'shorts' | 'youtube' | 'multi'

export type RefKind = 'image' | 'video' | 'audio'

export type SubjectType = 'character' | 'location' | 'prop' | 'style' | 'product' | 'audio' | 'other'

export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:3' | '3:4' | '21:9' | '9:21'

export type Resolution = '480p' | '720p' | '1080p' | '4K'

/* ------------------------------------------------------------------ */
/* Artiste                                                             */
/* ------------------------------------------------------------------ */

export interface Artist {
  /** Nom public du compte / de l'artiste. */
  name: string
  /** Identifiant social, sans @. */
  handle: string
  /** Une phrase qui vend le compte. */
  tagline: string
  /** Archetype createur (le "qui parle"). */
  archetype: string
  /** Pourquoi ce compte existe. */
  mission: string
  /** Biographie publique, prete a coller dans une bio de plateforme. */
  bio: string
  /** Mythologie interne : d'ou vient l'artiste, ce qu'il cherche. */
  lore: string
  /** Ton de voix, vocabulaire, rythme de parole. */
  voice: string
  /** A qui ca s'adresse. */
  audience: string
  /** La promesse tenue a chaque video. */
  promise: string
  /** Phrase signature repetee (outro, hook, mantra). */
  signature: string
  /** Rythme de publication vise. */
  cadence: string
  /** Valeurs / obsessions. */
  values: string[]
  /** Ce que le compte ne fera jamais. */
  taboos: string[]
}

/* ------------------------------------------------------------------ */
/* Direction artistique                                                */
/* ------------------------------------------------------------------ */

export interface Palette {
  name: string
  colors: string[]
  note: string
}

export interface ArtDirection {
  /** Pitch visuel en une phrase : la "logline" de l'image. */
  pitch: string
  genre: string
  palette: Palette
  lighting: string
  /** Grain, support, texture (16mm, capteur numerique propre, VHS...). */
  texture: string
  /** Focales et optiques privilegiees. */
  lensKit: string[]
  /** Grammaire camera : ce que la camera a le droit de faire. */
  cameraGrammar: string
  composition: string
  /** Rythme de montage / duree moyenne des plans. */
  rhythm: string
  colorGrade: string
  soundSignature: string
  /** La regle d'or, l'interdit fondateur. */
  motto: string
  doList: string[]
  dontList: string[]

  /* --- Blocs detailles ------------------------------------------- */
  /*
   * Un socle de direction artistique serieux ne tient pas dans une phrase
   * par rubrique : il enumere des traits cumulables (grain + halation +
   * blooming...) et des reservoirs dans lesquels on pioche a l'ecriture.
   * Ces blocs sont injectes automatiquement dans chaque prompt.
   */

  /** Traits de texture cumules : grain, VHS, halation, blooming, compression... */
  textureTraits: string[]
  /** Moments de tournage privilegies, par ordre de preference. */
  preferredTimes: string[]
  /** Moments explicitement ecartes. */
  avoidedTimes: string[]
  /** Sources de lumiere autorisees (lampadaires, phares, vitrines...). */
  lightSources: string[]
  /** Mouvements de camera autorises, dans lesquels les plans piochent. */
  cameraMoves: string[]
  /** Strategies de composition a faire tourner d'un plan a l'autre. */
  compositionRules: string[]
  /** Ce qui doit bouger dans chaque plan, meme le plus calme. */
  livingElements: string[]
  /** Micro-actions de la figuration, pour que l'arriere-plan ait sa vie. */
  backgroundLife: string[]
  /** Regles de comportement imposees a la figuration. */
  crowdRules: string[]
  /** Pieces de garde-robe autorisees. */
  wardrobe: string[]
  /** Regles de style vestimentaire. */
  wardrobeRules: string[]
  /** Registre emotionnel de l'univers. */
  emotionalRegister: string[]
  /** Ce qui peut motiver une transition entre deux plans. */
  transitionTriggers: string[]
  /** Reservoir de lieux a faire tourner pour ne pas se repeter. */
  environmentPool: string[]
  /** Ce qui doit rester identique d'un episode a l'autre. */
  continuityRules: string[]
}

/* ------------------------------------------------------------------ */
/* Casting, lieux, accessoires                                         */
/* ------------------------------------------------------------------ */

export interface Character {
  id: ID
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
  language: string
  arc: string
  relations: string
  /**
   * Entite collective (un groupe d'amis, une equipe). Une planche visage
   * n'a aucun sens pour un collectif : on produit une planche de groupe.
   */
  isGroup: boolean
  /**
   * Rapport a la camera : regarde-t-il l'objectif, et si oui quand ?
   * Sans consigne, le modele fait poser le sujet face camera par defaut.
   */
  gaze: string
  /** Actions credibles pour ce personnage, dans lesquelles l'ecriture pioche. */
  behaviors: string[]
  /**
   * Descripteur canonique compact reinjecte dans CHAQUE prompt.
   * C'est l'ancre de coherence entre les videos.
   */
  anchor: string
}

export interface Place {
  id: ID
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
  anchor: string
}

export interface Prop {
  id: ID
  name: string
  description: string
  role: string
  anchor: string
}

/* ------------------------------------------------------------------ */
/* Formats recurrents                                                  */
/* ------------------------------------------------------------------ */

export interface Format {
  id: ID
  name: string
  pitch: string
  duration: number
  /** Squelette narratif, une ligne par beat. */
  beats: string[]
  hook: string
  payoff: string
  cta: string
  recurring: string[]
}

/* ------------------------------------------------------------------ */
/* Episodes et plans                                                   */
/* ------------------------------------------------------------------ */

export type ShotSize =
  | 'Plan tres large'
  | 'Plan large'
  | 'Plan moyen'
  | 'Plan rapproche'
  | 'Gros plan'
  | 'Tres gros plan'
  | 'Insert macro'

export interface ShotAudio {
  music: string
  sfx: string
  dialogue: string
  subtitle: string
}

export interface Shot {
  id: ID
  label: string
  /** Bornes temporelles en secondes dans l'episode. */
  start: number
  end: number
  shotSize: ShotSize
  angle: string
  movement: string
  lens: string
  characterIds: ID[]
  placeId: ID | null
  propIds: ID[]
  /** Etat initial du plan. */
  initialState: string
  /** Evenement principal. */
  action: string
  /** Etat final. */
  endState: string
  styleNote: string
  /** Ce que font les autres personnes presentes pendant ce plan. */
  backgroundAction: string
  /** Ce qui bouge dans le cadre, meme si le plan est calme. */
  livingDetail: string
  /** Comment on quitte ce plan : la transition doit etre motivee par l'image. */
  transitionOut: string
  audio: ShotAudio
  /** Slots de reference explicitement rappeles sur ce plan. */
  refIds: ID[]
  notes: string
}

export interface Episode {
  id: ID
  title: string
  formatId: ID | null
  logline: string
  /**
   * Paroles sur lesquelles la scene est ecrite. Un clip part du texte :
   * c'est la matiere premiere du scenario, pas une metadonnee.
   */
  lyrics: string
  /** L'idee visuelle forte ou la metaphore que cet episode cherche. */
  visualIdea: string
  /** Ce qui doit rester identique a l'episode precedent (tenue, lieu, heure...). */
  continuity: string
  duration: number
  aspect: AspectRatio
  resolution: Resolution
  cameraFixed: boolean
  seed: string
  shots: Shot[]
  caption: string
  hashtags: string[]
  status: 'idee' | 'ecrit' | 'pret' | 'genere'
}

/* ------------------------------------------------------------------ */
/* References                                                          */
/* ------------------------------------------------------------------ */

export interface ReferenceSlot {
  id: ID
  kind: RefKind
  label: string
  subjectType: SubjectType
  subjectId: ID | null
  /** Ce que cette reference definit ("le visage, la coiffure et la veste"). */
  defines: string
  /** Ce que Seedance doit ignorer dans cette reference. */
  exclude: string
  /** Comment fabriquer ou trouver ce fichier. */
  howTo: string
  /** Prompt pret a l'emploi pour generer la reference dans un modele image. */
  genPrompt: string
  aspect: AspectRatio
  filename: string
  status: 'a-produire' | 'prete'
  /**
   * Une reference se fabrique... sauf quand l'artiste fournit ses propres
   * photos. Dans ce cas il ne faut surtout pas la regenerer.
   */
  sourceKind: 'a-generer' | 'photo-fournie'
  url: string
  /** Reference principale (compte dans la limite des 8 sujets principaux). */
  primary: boolean
}

/* ------------------------------------------------------------------ */
/* Reglages de rendu                                                   */
/* ------------------------------------------------------------------ */

export interface RenderSettings {
  duration: number
  aspect: AspectRatio
  resolution: Resolution
  cameraFixed: boolean
  language: string
  subtitles: boolean
  negatives: string[]
}

/* ------------------------------------------------------------------ */
/* Projet                                                              */
/* ------------------------------------------------------------------ */

export interface Project {
  id: ID
  name: string
  createdAt: number
  updatedAt: number
  origin: 'studio' | 'sur-mesure'
  /** Idee brute saisie par l'utilisateur en mode sur-mesure. */
  seedText: string
  /** Graine numerique du generateur, pour rejouer une generation. */
  seedNumber: number
  universeId: string
  platform: Platform
  artist: Artist
  direction: ArtDirection
  characters: Character[]
  places: Place[]
  props: Prop[]
  formats: Format[]
  episodes: Episode[]
  refs: ReferenceSlot[]
  settings: RenderSettings
  notes: string
}

/** Fiche courte presentee dans le mode Studio avant materialisation. */
export interface ConceptCard {
  seedNumber: number
  universeId: string
  name: string
  handle: string
  tagline: string
  pitch: string
  visual: string
  audience: string
  formatName: string
  formatPitch: string
  palette: Palette
  castNames: string[]
  placeNames: string[]
  hook: string
}

/* ------------------------------------------------------------------ */
/* Audit                                                               */
/* ------------------------------------------------------------------ */

export type AuditLevel = 'bloquant' | 'important' | 'confort'

export interface AuditIssue {
  id: string
  level: AuditLevel
  section: string
  title: string
  detail: string
  fix: string
}

export interface AuditResult {
  score: number
  max: number
  issues: AuditIssue[]
  sections: { name: string; score: number; max: number }[]
}
