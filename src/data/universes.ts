import type { Universe } from './library'
import { UNIVERSES_PART1 } from './universes.part1'
import { UNIVERSES_PART2 } from './universes.part2'
import { UNIVERSES_PART3 } from './universes.part3'
import { VLAND_UNIVERSE } from './universes.vland'

export const UNIVERSES: Universe[] = [
  VLAND_UNIVERSE,
  ...UNIVERSES_PART1,
  ...UNIVERSES_PART2,
  ...UNIVERSES_PART3,
]

export function getUniverse(id: string): Universe {
  return UNIVERSES.find((u) => u.id === id) ?? UNIVERSES[0]
}
