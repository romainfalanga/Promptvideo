/**
 * Migration des projets.
 *
 * Le modele s'enrichit quand un socle de direction artistique demande des
 * variables qui n'existaient pas. Les projets deja enregistres dans le
 * navigateur — ou importes depuis un JSON plus ancien — doivent continuer a
 * s'ouvrir : on complete les champs manquants avec des valeurs neutres
 * plutot que d'inventer du contenu a la place de l'utilisateur.
 */

import type { Character, Episode, Project, ReferenceSlot, Shot } from '../types'
import {
  DEFAULT_BACKGROUND_LIFE,
  DEFAULT_CROWD_RULES,
  DEFAULT_EMOTIONAL_REGISTER,
  DEFAULT_LIVING_ELEMENTS,
  DEFAULT_TRANSITION_TRIGGERS,
} from '../data/library'
import { CAMERA_MOVES } from '../data/seedance'
import { COMPOSITIONS } from '../data/library'

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
const list = (v: unknown, fallback: string[] = []): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [...fallback]

export function migrateShot(s: Partial<Shot>): Shot {
  return {
    ...(s as Shot),
    backgroundAction: str(s.backgroundAction),
    livingDetail: str(s.livingDetail),
    transitionOut: str(s.transitionOut),
    refIds: list(s.refIds),
  }
}

export function migrateEpisode(e: Partial<Episode>): Episode {
  return {
    ...(e as Episode),
    lyrics: str(e.lyrics),
    visualIdea: str(e.visualIdea),
    continuity: str(e.continuity),
    shots: (e.shots ?? []).map(migrateShot),
  }
}

export function migrateCharacter(c: Partial<Character>): Character {
  return {
    ...(c as Character),
    isGroup: c.isGroup === true,
    gaze: str(c.gaze),
    behaviors: list(c.behaviors),
  }
}

export function migrateRef(r: Partial<ReferenceSlot>): ReferenceSlot {
  return {
    ...(r as ReferenceSlot),
    sourceKind: r.sourceKind === 'photo-fournie' ? 'photo-fournie' : 'a-generer',
  }
}

export function migrateProject(p: Project): Project {
  const d = p.direction ?? ({} as Project['direction'])
  return {
    ...p,
    direction: {
      ...d,
      textureTraits: list(d.textureTraits, d.texture ? [d.texture] : []),
      preferredTimes: list(d.preferredTimes),
      avoidedTimes: list(d.avoidedTimes),
      lightSources: list(d.lightSources),
      cameraMoves: list(d.cameraMoves, CAMERA_MOVES.slice(0, 5)),
      compositionRules: list(d.compositionRules, d.composition ? [d.composition] : COMPOSITIONS.slice(0, 3)),
      livingElements: list(d.livingElements, DEFAULT_LIVING_ELEMENTS),
      backgroundLife: list(d.backgroundLife, DEFAULT_BACKGROUND_LIFE),
      crowdRules: list(d.crowdRules, DEFAULT_CROWD_RULES),
      wardrobe: list(d.wardrobe),
      wardrobeRules: list(d.wardrobeRules),
      emotionalRegister: list(d.emotionalRegister, DEFAULT_EMOTIONAL_REGISTER),
      transitionTriggers: list(d.transitionTriggers, DEFAULT_TRANSITION_TRIGGERS),
      environmentPool: list(d.environmentPool),
      continuityRules: list(d.continuityRules),
    },
    characters: (p.characters ?? []).map(migrateCharacter),
    episodes: (p.episodes ?? []).map(migrateEpisode),
    refs: (p.refs ?? []).map(migrateRef),
  }
}
