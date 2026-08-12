/**
 * Contraintes et grammaire du modele Seedance 2.5.
 *
 * Ces valeurs pilotent le compilateur de prompts et l'audit qualite.
 * Sources : documentation de prompting Seedance 2.5 (formule officielle
 * sujet/action -> scene -> style -> camera+audio), conventions de reference
 * @Image / @Video / @Audio, brackets audio, limites multimodales.
 */

import type { AspectRatio, Resolution } from '../types'

export const SEEDANCE = {
  version: '2.5',
  duration: { min: 4, max: 30, default: 10 },
  /** Limites multimodales par generation. */
  refs: {
    maxTotal: 50,
    maxImages: 30,
    maxVideos: 10,
    maxAudio: 10,
    /** Au-dela, les traits distinctifs se diluent. */
    recommendedPrimarySubjects: 8,
    recommendedPrimaryWithVideo: 5,
    clipSweetSpotSeconds: [5, 10] as const,
  },
  /** Longueur de prompt efficace : les 20-30 premiers mots portent le plus de poids. */
  promptWords: { min: 60, max: 140, sweetMax: 100, leadWeight: 30 },
} as const

export const ASPECTS: { value: AspectRatio; label: string; usage: string }[] = [
  { value: '9:16', label: '9:16 — vertical', usage: 'TikTok, Reels, Shorts' },
  { value: '16:9', label: '16:9 — paysage', usage: 'YouTube, site, TV' },
  { value: '1:1', label: '1:1 — carre', usage: 'Feed, carrousel' },
  { value: '4:3', label: '4:3 — retro', usage: 'Archive, found footage' },
  { value: '3:4', label: '3:4 — portrait doux', usage: 'Feed portrait' },
  { value: '21:9', label: '21:9 — scope', usage: 'Cinema, bande-annonce' },
  { value: '9:21', label: '9:21 — vertical scope', usage: 'Affichage vertical extreme' },
]

export const RESOLUTIONS: Resolution[] = ['480p', '720p', '1080p', '4K']

export const SHOT_SIZES = [
  'Plan tres large',
  'Plan large',
  'Plan moyen',
  'Plan rapproche',
  'Gros plan',
  'Tres gros plan',
  'Insert macro',
] as const

export const CAMERA_ANGLES = [
  'hauteur d\'oeil',
  'legere plongee',
  'plongee marquee',
  'contre-plongee',
  'niveau du sol',
  'vue zenithale',
  'angle hollandais leger',
  'par-dessus l\'epaule',
]

export const CAMERA_MOVES = [
  'camera fixe sur pied',
  'travelling avant lent',
  'travelling arriere lent',
  'travelling lateral',
  'panoramique lent vers la droite',
  'panoramique lent vers la gauche',
  'camera portee discrete',
  'plan-sequence en steadicam',
  'grue montante',
  'orbite autour du sujet',
  'zoom optique tres lent',
  'plan fixe puis recadrage sur le sujet',
  'poursuite en marche arriere devant le sujet',
]

export const LENSES = [
  '18 mm grand angle',
  '24 mm',
  '35 mm',
  '50 mm',
  '85 mm portrait',
  '100 mm macro',
  '135 mm compression',
  'anamorphique 40 mm',
  'anamorphique 75 mm',
  'objectif a bascule (tilt-shift)',
]

/** Brackets audio de Seedance 2.5. */
export const AUDIO_SYNTAX = {
  music: (s: string) => `(${s})`,
  sfx: (s: string) => `<${s}>`,
  dialogue: (s: string) => `{${s}}`,
  subtitle: (s: string) => `【${s}】`,
}

export const AUDIO_LEGEND = [
  { symbol: '( ... )', role: 'Musique / nappe sonore' },
  { symbol: '< ... >', role: 'Effet sonore ponctuel' },
  { symbol: '{ ... }', role: 'Dialogue parle' },
  { symbol: '【 ... 】', role: 'Texte / sous-titre incruste' },
]

/**
 * Negatifs universels : ce que l'on refuse par defaut sur tout compte.
 * L'utilisateur les complete avec les interdits propres a sa DA.
 */
export const BASE_NEGATIVES = [
  'visage deforme, membres surnumeraires, mains a doigts incoherents',
  'texte illisible ou logo parasite',
  'changement d\'identite du personnage entre deux plans',
  'sur-saturation, halo HDR, aspect plastique',
  'sous-titres automatiques non demandes',
  'zoom brutal, secousses de camera non motivees',
  'filigrane, bordures noires, format non respecte',
]

/** Regles de redaction affichees dans l'interface (aide-memoire). */
export const PROMPT_RULES = [
  'Sujet et action d\'abord : les 20 a 30 premiers mots portent le plus de poids.',
  'Ensuite le decor, puis le style visuel, puis la camera et l\'audio.',
  'Decrire ce qui CHANGE pendant la duree, pas une image figee.',
  'Nommer chaque reference et dire precisement ce qu\'elle apporte.',
  'Dire aussi ce qu\'il faut ignorer dans une reference (ex : son arriere-plan).',
  'Reinjecter l\'ancre d\'identite du personnage a chaque prompt.',
  'Pour un plan multi-sequences, utiliser des etapes timecodees.',
  'Rester entre 60 et 100 mots pour le coeur du prompt.',
]

export function refToken(kind: 'image' | 'video' | 'audio', index: number): string {
  const prefix = kind === 'image' ? 'Image' : kind === 'video' ? 'Video' : 'Audio'
  return `@${prefix}${index}`
}

export function formatTimecode(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  const rest = s % 60
  return `${m}:${String(rest).padStart(2, '0')}`
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Budget de mots du corps narratif.
 *
 * La cible de 60-100 mots vaut pour une action continue. Un prompt
 * multi-plans decrit plusieurs etapes : chaque etape supplementaire a
 * legitimement besoin de sa propre ligne, sinon on perd la description de
 * ce qui change. Le budget grandit donc avec le nombre de plans.
 *
 * Increment : une ligne de plan complete pese environ 55 a 70 mots (sujet,
 * action, lieu, etats, vie de fond, element en mouvement, transition,
 * camera). Le plafond accorde donc une ligne pleine par plan supplementaire ;
 * la cible confortable en accorde une un peu plus serree.
 */
export function promptWordBudget(shotCount: number): { min: number; sweet: number; max: number } {
  const extra = Math.max(0, shotCount - 1)
  return {
    min: SEEDANCE.promptWords.min,
    sweet: SEEDANCE.promptWords.sweetMax + extra * 40,
    max: SEEDANCE.promptWords.max + extra * 55,
  }
}
