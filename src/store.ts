/**
 * Store minimal : un etat global, un abonnement, une persistance locale.
 * Pas de dependance externe — l'application doit rester utilisable hors ligne.
 */

import { useSyncExternalStore } from 'react'
import type { Project } from './types'
import { load, save, type Persisted } from './lib/storage'
import { buildReferences } from './engine/references'

type Listener = () => void

let state: Persisted = load()
const listeners = new Set<Listener>()

function emit() {
  save(state)
  for (const l of listeners) l()
}

function subscribe(l: Listener) {
  listeners.add(l)
  return () => listeners.delete(l)
}

function getSnapshot(): Persisted {
  return state
}

export function useStore(): Persisted {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useActiveProject(): Project | null {
  const s = useStore()
  return s.projects.find((p) => p.id === s.activeId) ?? null
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export function addProject(project: Project) {
  state = { projects: [project, ...state.projects], activeId: project.id }
  emit()
}

export function openProject(id: string | null) {
  state = { ...state, activeId: id }
  emit()
}

export function deleteProject(id: string) {
  const projects = state.projects.filter((p) => p.id !== id)
  state = { projects, activeId: state.activeId === id ? null : state.activeId }
  emit()
}

export function duplicateProject(id: string) {
  const src = state.projects.find((p) => p.id === id)
  if (!src) return
  const copy: Project = {
    ...structuredClone(src),
    id: `prj_${Math.random().toString(36).slice(2, 10)}`,
    name: `${src.name} (copie)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  state = { projects: [copy, ...state.projects], activeId: copy.id }
  emit()
}

/** Applique une transformation au projet actif. */
export function updateProject(id: string, mutate: (draft: Project) => void) {
  const projects = state.projects.map((p) => {
    if (p.id !== id) return p
    const draft = structuredClone(p)
    mutate(draft)
    draft.updatedAt = Date.now()
    return draft
  })
  state = { ...state, projects }
  emit()
}

/** Reconstruit le manifeste de references en preservant ce qui est deja pret. */
export function rebuildRefs(id: string) {
  updateProject(id, (d) => {
    d.refs = buildReferences(d, d.refs)
  })
}

export function importProject(json: string): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(json) as Project
    if (!parsed || typeof parsed !== 'object' || !parsed.artist || !parsed.direction) {
      return { ok: false, error: "Ce fichier n'est pas un projet Promptvideo." }
    }
    parsed.id = `prj_${Math.random().toString(36).slice(2, 10)}`
    parsed.updatedAt = Date.now()
    addProject(parsed)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Fichier illisible.' }
  }
}
