/**
 * Derivation du manifeste de references.
 *
 * Seedance identifie les references par leur ORDRE d'envoi (@Image1,
 * @Image2, ...). Le manifeste est donc une liste ordonnee : sa position
 * dans le tableau EST le numero du token. Chaque slot dit ce qu'il definit
 * et ce qu'il faut ignorer, parce que c'est exactement ce que le modele
 * attend pour ne pas melanger les roles.
 */

import type { Character, Place, Project, ReferenceSlot } from '../types'
import { CHARACTER_REF_TYPES, PLACE_REF_TYPES } from '../data/library'
import { refToken } from '../data/seedance'
import { fileize, join, uid } from '../lib/utils'

/* ------------------------------------------------------------------ */
/* Prompts de fabrication des references                               */
/* ------------------------------------------------------------------ */

function characterRefPrompt(project: Project, c: Character, kind: string): string {
  const d = project.direction
  const common = `${d.palette.name.toLowerCase()} (${d.palette.colors.join(', ')}), ${d.texture}`
  if (kind === 'visage') {
    return join(
      [
        `Planche de reference de personnage, portrait de face, cadrage poitrine, fond gris neutre uni`,
        c.name,
        c.age,
        c.face,
        c.hair,
        c.skin,
        c.eyes,
        c.distinctive,
        `eclairage doux et egal a 45 degres, aucune ombre dure, expression neutre, regard camera`,
        `nettete maximale sur les traits, aucune stylisation, aucun filtre`,
        common,
      ],
      ', ',
    )
  }
  if (kind === 'silhouette') {
    return join(
      [
        `Planche de reference de costume, personnage en pied de face, fond gris neutre uni`,
        c.name,
        c.build,
        c.costume,
        c.accessories,
        c.colorCode,
        `pose neutre bras le long du corps, eclairage egal, aucune ombre portee sur le fond`,
        `matieres et coutures lisibles, chaussures visibles en entier`,
        common,
      ],
      ', ',
    )
  }
  return join(
    [
      `Planche de reference de personnage, triptyque profil gauche / trois-quarts / nuque, fond gris neutre uni`,
      c.name,
      c.face,
      c.hair,
      c.distinctive,
      `eclairage egal, aucune ombre dure, meme distance et meme focale sur les trois vues`,
      common,
    ],
    ', ',
  )
}

function placeRefPrompt(project: Project, p: Place, kind: string): string {
  const d = project.direction
  if (kind === 'plate') {
    return join(
      [
        `Plaque de decor sans personnage, vue large de ${p.name}`,
        p.description,
        p.architecture,
        p.materials,
        p.light,
        p.timeOfDay,
        p.details,
        `${d.lensKit[0] ?? '35 mm'}, ${d.composition}`,
        `${d.texture}, palette ${d.palette.name.toLowerCase()} (${d.palette.colors.join(', ')})`,
        `aucun etre humain, aucun animal, aucun texte lisible`,
      ],
      ', ',
    )
  }
  return join(
    [
      `Planche d'ambiance lumineuse de ${p.name}, sans personnage`,
      p.light,
      p.weather,
      p.timeOfDay,
      `atmosphere : ${p.soundscape}`,
      `${d.colorGrade}, ${d.texture}`,
      `cadrage libre, l'important est la direction et la qualite de la lumiere`,
      `aucun etre humain, aucun texte`,
    ],
    ', ',
  )
}

function styleRefPrompt(project: Project): string {
  const d = project.direction
  return join(
    [
      `Planche de style, image unique sans personnage identifiable`,
      d.genre,
      d.lighting,
      d.texture,
      d.colorGrade,
      d.composition,
      `palette ${d.palette.name.toLowerCase()} : ${d.palette.colors.join(', ')} — ${d.palette.note}`,
      `${d.lensKit.join(' ou ')}`,
      `aucun visage reconnaissable, aucun texte, aucun logo`,
    ],
    ', ',
  )
}

/* ------------------------------------------------------------------ */
/* Construction                                                        */
/* ------------------------------------------------------------------ */

function slot(partial: Omit<ReferenceSlot, 'id'>): ReferenceSlot {
  return { id: uid('ref'), ...partial }
}

/**
 * Construit le manifeste complet.
 * Ordre volontaire : style d'abord (il conditionne tout), puis les
 * personnages principaux, puis les lieux, puis les accessoires.
 * Les slots deja presents et marques "prete" gardent leur url et leur statut.
 */
export function buildReferences(project: Project, previous: ReferenceSlot[] = []): ReferenceSlot[] {
  const carry = new Map<string, ReferenceSlot>()
  for (const r of previous) carry.set(`${r.subjectType}:${r.subjectId ?? ''}:${r.label}`, r)

  const out: ReferenceSlot[] = []

  const push = (s: Omit<ReferenceSlot, 'id'>) => {
    const key = `${s.subjectType}:${s.subjectId ?? ''}:${s.label}`
    const old = carry.get(key)
    out.push(old ? { ...old, ...s, id: old.id, url: old.url, status: old.status, sourceKind: old.sourceKind } : slot(s))
  }

  // 1. Style
  push({
    kind: 'image',
    label: `${project.name} — planche de style`,
    subjectType: 'style',
    subjectId: null,
    defines: 'la palette, le grain, le contraste et la qualite de lumiere de tout le compte',
    exclude: 'le sujet, le cadrage et la composition de cette image',
    howTo: 'Generer avec un modele image, ou assembler un photogramme de reference et le retoucher a la bonne colorimetrie.',
    genPrompt: styleRefPrompt(project),
    aspect: project.settings.aspect,
    filename: `${fileize(project.name)}_style.png`,
    status: 'a-produire',
    sourceKind: 'a-generer',
    url: '',
    primary: false,
  })

  // 2. Personnages
  for (const c of project.characters) {
    // Un collectif n'a pas de visage : une planche de groupe suffit, et
    // trois planches d'identite pour un groupe saturent inutilement la
    // limite des sujets principaux.
    if (c.isGroup) {
      push({
        kind: 'image',
        label: `${c.name} — planche de groupe`,
        subjectType: 'character',
        subjectId: c.id,
        defines: `la composition du groupe, les silhouettes, les tenues et la maniere dont ils occupent l'espace`,
        exclude: "le decor, la pose et le cadrage de cette image",
        howTo:
          'Plan de groupe en pied, tous visibles, fond neutre ou repérage reel. Chaque membre doit rester distinguable d\'un episode a l\'autre.',
        genPrompt: join(
          [
            `Planche de reference de groupe, plusieurs personnes en pied, fond neutre`,
            c.name,
            c.build,
            c.costume,
            c.accessories,
            c.colorCode,
            `chacun distinct des autres par sa silhouette et sa tenue, aucune uniformite`,
            `eclairage egal, aucune ombre dure, aucun regard camera`,
            `${project.direction.palette.name.toLowerCase()} (${project.direction.palette.colors.join(', ')})`,
          ],
          ', ',
        ),
        aspect: '16:9',
        filename: `${fileize(project.name)}_${fileize(c.name)}_groupe.png`,
        status: 'a-produire',
        sourceKind: 'a-generer',
        url: '',
        primary: false,
      })
      continue
    }

    for (const t of CHARACTER_REF_TYPES) {
      push({
        kind: 'image',
        label: `${c.name} — ${t.label}`,
        subjectType: 'character',
        subjectId: c.id,
        defines: t.defines,
        exclude: t.exclude,
        howTo:
          t.key === 'visage'
            ? 'Fond neutre, lumiere egale, expression neutre. C\'est LA reference d\'identite : elle doit etre parfaite avant de produire le reste.'
            : t.key === 'silhouette'
              ? 'Personnage en pied, fond neutre, meme personne et meme visage que la fiche visage.'
              : 'Trois vues sur une seule planche, meme focale et meme distance.',
        genPrompt: characterRefPrompt(project, c, t.key),
        aspect: t.aspect,
        filename: `${fileize(project.name)}_${fileize(c.name)}_${t.key}.png`,
        status: 'a-produire',
        sourceKind: 'a-generer',
        url: '',
        primary: t.primary,
      })
    }
  }

  // 3. Lieux
  for (const p of project.places) {
    for (const t of PLACE_REF_TYPES) {
      push({
        kind: 'image',
        label: `${p.name} — ${t.label}`,
        subjectType: 'location',
        subjectId: p.id,
        defines: t.defines,
        exclude: t.exclude,
        howTo:
          t.key === 'plate'
            ? 'Decor vide, sans aucun personnage : Seedance y placera les sujets lui-meme.'
            : 'Cadrage libre, seule compte la lumiere. Peut etre une photo de repérage retouchee.',
        genPrompt: placeRefPrompt(project, p, t.key),
        aspect: t.aspect,
        filename: `${fileize(project.name)}_${fileize(p.name)}_${t.key}.png`,
        status: 'a-produire',
        sourceKind: 'a-generer',
        url: '',
        primary: t.primary,
      })
    }
  }

  // 4. Accessoires
  for (const pr of project.props) {
    push({
      kind: 'image',
      label: `${pr.name} — fiche objet`,
      subjectType: 'prop',
      subjectId: pr.id,
      defines: `la forme, la matiere, l'usure et l'echelle de l'objet « ${pr.name} »`,
      exclude: "le fond et l'eclairage de cette image",
      howTo: 'Objet seul sur fond neutre, trois-quarts, lumiere egale, echelle lisible.',
      genPrompt: join(
        [
          `Photo de reference d'objet sur fond gris neutre uni, vue de trois-quarts`,
          pr.name,
          pr.description,
          `eclairage doux et egal, aucune ombre dure, nettete maximale sur la matiere et l'usure`,
          `aucun texte, aucune main, aucun autre objet`,
        ],
        ', ',
      ),
      aspect: '1:1',
      filename: `${fileize(project.name)}_${fileize(pr.name)}_objet.png`,
      status: 'a-produire',
      sourceKind: 'a-generer',
      url: '',
      primary: false,
    })
  }

  return out
}

/* ------------------------------------------------------------------ */
/* Lecture                                                             */
/* ------------------------------------------------------------------ */

export interface IndexedRef extends ReferenceSlot {
  /** Numero d'ordre dans sa famille (1-based). */
  number: number
  /** Token a ecrire dans le prompt : @Image3, @Video1... */
  token: string
}

/** Numerote le manifeste par famille et calcule les tokens @ImageN. */
export function indexReferences(refs: ReferenceSlot[]): IndexedRef[] {
  const counters: Record<string, number> = { image: 0, video: 0, audio: 0 }
  return refs.map((r) => {
    counters[r.kind] += 1
    const number = counters[r.kind]
    return { ...r, number, token: refToken(r.kind, number) }
  })
}

/** Retourne les references liees a un sujet donne. */
export function refsForSubject(refs: IndexedRef[], subjectId: string): IndexedRef[] {
  return refs.filter((r) => r.subjectId === subjectId)
}

/** Statistiques utilisees par l'audit et l'interface. */
export function refStats(refs: ReferenceSlot[]) {
  const images = refs.filter((r) => r.kind === 'image')
  const videos = refs.filter((r) => r.kind === 'video')
  const audio = refs.filter((r) => r.kind === 'audio')
  return {
    total: refs.length,
    images: images.length,
    videos: videos.length,
    audio: audio.length,
    primary: refs.filter((r) => r.primary).length,
    ready: refs.filter((r) => r.status === 'prete').length,
  }
}
