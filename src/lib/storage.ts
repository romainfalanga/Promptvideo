import type { Project } from '../types'

const KEY = 'promptvideo.studio.v1'

export interface Persisted {
  projects: Project[]
  activeId: string | null
}

const EMPTY: Persisted = { projects: [], activeId: null }

export function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Persisted
    if (!parsed || !Array.isArray(parsed.projects)) return EMPTY
    return { projects: parsed.projects, activeId: parsed.activeId ?? null }
  } catch {
    return EMPTY
  }
}

export function save(state: Persisted): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Quota depasse ou stockage indisponible : on continue en memoire.
  }
}
