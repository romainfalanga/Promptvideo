/**
 * Audit qualite.
 *
 * Deux familles de controles :
 *  - la completude editoriale (est-ce que l'univers tient debout ?),
 *  - la conformite technique aux contraintes reelles de Seedance 2.5
 *    (nombre de references, duree, longueur de prompt, ancres d'identite).
 */

import type { AuditIssue, AuditResult, Project } from '../types'
import { SEEDANCE, countWords, promptWordBudget } from '../data/seedance'
import { compileVideo } from './prompt'
import { refStats } from './references'

interface Check {
  section: string
  weight: number
  run: (p: Project) => AuditIssue | null
}

function issue(
  id: string,
  level: AuditIssue['level'],
  section: string,
  title: string,
  detail: string,
  fix: string,
): AuditIssue {
  return { id, level, section, title, detail, fix }
}

function isBlank(...values: string[]): boolean {
  return values.some((v) => !v || !v.trim())
}

const CHECKS: Check[] = [
  /* ---------------- Artiste ---------------- */
  {
    section: 'Identite',
    weight: 6,
    run: (p) =>
      isBlank(p.artist.name)
        ? issue('artist.identity', 'bloquant', 'Identite', 'Univers sans nom', "L'univers n'a pas de nom.", "Renseigne le nom dans l'onglet Identite.")
        : null,
  },
  {
    section: 'Identite',
    weight: 6,
    run: (p) =>
      isBlank(p.artist.mission)
        ? issue('artist.promise', 'important', 'Identite', 'Intention floue', "Sans intention ecrite, les videos partent dans toutes les directions.", "Ecris en une phrase ce que ces videos cherchent a faire.")
        : null,
  },
  {
    section: 'Identite',
    weight: 4,
    run: (p) =>
      isBlank(p.artist.voice)
        ? issue('artist.voice', 'confort', 'Identite', 'Ton non defini', "Le ton oriente l'ecriture des textes incrustes et des dialogues.", "Complete le champ Ton.")
        : null,
  },
  {
    section: 'Identite',
    weight: 4,
    run: (p) =>
      p.artist.taboos.length === 0
        ? issue('artist.taboos', 'confort', 'Identite', 'Aucun interdit declare', "Les interdits sont ce qui rend un univers reconnaissable.", "Ajoute au moins un interdit dans l'onglet Identite.")
        : null,
  },

  /* ---------------- Direction artistique ---------------- */
  {
    section: 'Direction',
    weight: 8,
    run: (p) =>
      isBlank(p.direction.lighting, p.direction.texture, p.direction.colorGrade)
        ? issue('da.look', 'bloquant', 'Direction', 'Look incomplet', "Lumiere, texture ou etalonnage manquant : les videos ne se ressembleront pas entre elles.", "Complete Lumiere, Texture et Etalonnage dans l'onglet Direction.")
        : null,
  },
  {
    section: 'Direction',
    weight: 6,
    run: (p) =>
      p.direction.palette.colors.length < 3
        ? issue('da.palette', 'important', 'Direction', 'Palette trop pauvre', "Moins de trois couleurs : impossible d'imposer une identite chromatique.", "Ajoute des couleurs a la palette (quatre a cinq est l'ideal).")
        : null,
  },
  {
    section: 'Direction',
    weight: 5,
    run: (p) =>
      isBlank(p.direction.cameraGrammar)
        ? issue('da.camera', 'important', 'Direction', 'Grammaire camera absente', "Sans regle de mouvement, chaque video aura une camera differente.", "Ecris ce que la camera a le droit de faire, et ce qu'elle ne fait jamais.")
        : null,
  },
  {
    section: 'Direction',
    weight: 5,
    run: (p) =>
      isBlank(p.direction.soundSignature)
        ? issue('da.sound', 'important', 'Direction', 'Signature sonore absente', "Seedance 2.5 genere l'audio : sans consigne, il inventera une musique generique.", "Decris l'ambiance sonore imposee dans l'onglet Direction.")
        : null,
  },
  {
    section: 'Direction',
    weight: 4,
    run: (p) =>
      p.direction.dontList.length === 0
        ? issue('da.dont', 'confort', 'Direction', 'Aucun interdit visuel', "La liste des interdits alimente le bloc « a eviter » de chaque prompt.", "Ajoute des interdits visuels dans l'onglet Direction.")
        : null,
  },

  /* ---------------- Casting ---------------- */
  {
    section: 'Casting',
    weight: 8,
    run: (p) =>
      p.characters.length === 0
        ? issue('cast.empty', 'bloquant', 'Casting', 'Aucun personnage', "Un univers sans personnage recurrent ne cree pas d'attachement.", "Cree au moins un personnage dans l'onglet Casting.")
        : null,
  },
  {
    section: 'Casting',
    weight: 10,
    run: (p) => {
      const weak = p.characters.filter((c) => isBlank(c.face, c.hair, c.costume) || countWords(c.anchor) < 12)
      return weak.length
        ? issue(
            'cast.anchor',
            'bloquant',
            'Casting',
            `Ancre d'identite trop courte (${weak.length})`,
            `${weak.map((c) => c.name).join(', ')} : sans description physique detaillee, le visage changera d'une video a l'autre.`,
            "Complete visage, cheveux et costume, puis regenere l'ancre depuis la fiche.",
          )
        : null
    },
  },
  {
    section: 'Casting',
    weight: 4,
    run: (p) =>
      p.characters.length > SEEDANCE.refs.recommendedPrimarySubjects
        ? issue(
            'cast.toomany',
            'important',
            'Casting',
            'Trop de personnages principaux',
            `${p.characters.length} personnages : au-dela de ${SEEDANCE.refs.recommendedPrimarySubjects} sujets principaux, les traits se diluent et le modele confond les identites.`,
            'Reduis le casting principal, ou repartis les personnages sur plusieurs videos distinctes.',
          )
        : null,
  },

  /* ---------------- Lieux ---------------- */
  {
    section: 'Lieux',
    weight: 6,
    run: (p) =>
      p.places.length === 0
        ? issue('places.empty', 'important', 'Lieux', 'Aucun lieu', "Les lieux recurrents sont ce qui fait exister un univers.", "Cree au moins un lieu dans l'onglet Lieux.")
        : null,
  },
  {
    section: 'Lieux',
    weight: 5,
    run: (p) => {
      const weak = p.places.filter((l) => isBlank(l.description, l.light, l.materials))
      return weak.length
        ? issue('places.weak', 'important', 'Lieux', `Fiches de lieu incompletes (${weak.length})`, `${weak.map((l) => l.name).join(', ')} : description, lumiere ou matieres manquantes.`, 'Complete les fiches de lieu, ce sont elles qui alimentent la plaque de decor.')
        : null
    },
  },

  /* ---------------- Formats ---------------- */
  {
    section: 'Formats',
    weight: 6,
    run: (p) =>
      p.formats.length === 0
        ? issue('formats.empty', 'important', 'Formats', 'Aucun format recurrent', "Sans format, chaque video repart de zero et le compte n'est pas identifiable.", "Cree un format dans l'onglet Formats.")
        : null,
  },
  {
    section: 'Formats',
    weight: 4,
    run: (p) => {
      const weak = p.formats.filter((f) => f.beats.length < 3 || isBlank(f.hook, f.payoff))
      return weak.length
        ? issue('formats.weak', 'confort', 'Formats', `Formats sous-ecrits (${weak.length})`, `${weak.map((f) => f.name).join(', ')} : moins de trois beats, ou accroche/chute manquante.`, 'Ecris au moins trois beats, une accroche et une chute par format.')
        : null
    },
  },

  /* ---------------- Videos ---------------- */
  {
    section: 'Videos',
    weight: 8,
    run: (p) =>
      p.videos.length === 0
        ? issue('ep.empty', 'bloquant', 'Videos', 'Aucune video', "Il n'y a rien a exporter tant qu'aucune video n'existe.", "Cree une video dans l'onglet Videos.")
        : null,
  },
  {
    section: 'Videos',
    weight: 6,
    run: (p) => {
      const bad = p.videos.filter((e) => e.duration < SEEDANCE.duration.min || e.duration > SEEDANCE.duration.max)
      return bad.length
        ? issue(
            'ep.duration',
            'bloquant',
            'Videos',
            `Duree hors limites (${bad.length})`,
            `${bad.map((e) => `${e.title} : ${e.duration} s`).join(', ')}. Seedance 2.5 accepte ${SEEDANCE.duration.min} a ${SEEDANCE.duration.max} secondes.`,
            `Ramene la duree entre ${SEEDANCE.duration.min} et ${SEEDANCE.duration.max} secondes.`,
          )
        : null
    },
  },
  {
    section: 'Videos',
    weight: 6,
    run: (p) => {
      const bad = p.videos.filter((e) => e.shots.length === 0)
      return bad.length
        ? issue('ep.noshots', 'bloquant', 'Videos', `Videos sans plan (${bad.length})`, `${bad.map((e) => e.title).join(', ')}.`, 'Ajoute au moins un plan par video.')
        : null
    },
  },
  {
    section: 'Videos',
    weight: 5,
    run: (p) => {
      const bad = p.videos.filter((e) => e.shots.some((s) => !s.action.trim()))
      return bad.length
        ? issue('ep.noaction', 'important', 'Videos', 'Plans sans action decrite', `${bad.map((e) => e.title).join(', ')} contiennent un plan dont l'action est vide. Seedance a besoin de savoir ce qui CHANGE pendant le plan.`, "Decris l'evenement principal de chaque plan.")
        : null
    },
  },
  {
    section: 'Videos',
    weight: 6,
    run: (p) => {
      const long: string[] = []
      const short: string[] = []
      for (const e of p.videos) {
        if (!e.shots.length) continue
        const w = compileVideo(p, e).bodyWords
        const budget = promptWordBudget(e.shots.length)
        if (w > budget.max) long.push(`${e.title} (${w} mots pour un budget de ${budget.max})`)
        else if (w < budget.min) short.push(`${e.title} (${w} mots)`)
      }
      if (long.length)
        return issue('ep.toolong', 'important', 'Videos', 'Prompt trop long', `${long.join(', ')} : au-dela du budget, le modele dilue les consignes.`, 'Raccourcis les descriptions de plan, ou coupe en deux videos.')
      if (short.length)
        return issue('ep.tooshort', 'confort', 'Videos', 'Prompt trop court', `${short.join(', ')} : en dessous de ${SEEDANCE.promptWords.min} mots, le modele improvise.`, 'Precise etat initial, evenement et etat final de chaque plan.')
      return null
    },
  },
  {
    section: 'Videos',
    weight: 4,
    run: (p) => {
      const silent = p.videos.filter((e) => e.shots.every((s) => !s.audio.music && !s.audio.sfx && !s.audio.dialogue))
      return silent.length
        ? issue('ep.audio', 'important', 'Videos', `Aucune consigne audio (${silent.length})`, `${silent.map((e) => e.title).join(', ')} : Seedance 2.5 genere du son. Sans consigne, il inventera.`, 'Renseigne au moins la musique ou une ambiance par video.')
        : null
    },
  },

  /* ---------------- References ---------------- */
  {
    section: 'References',
    weight: 8,
    run: (p) => {
      const s = refStats(p.refs)
      return s.images > SEEDANCE.refs.maxImages
        ? issue('ref.maximg', 'bloquant', 'References', 'Trop d\'images de reference', `${s.images} images pour un maximum de ${SEEDANCE.refs.maxImages} par generation.`, 'Retire les references secondaires, ou repartis-les entre plusieurs videos.')
        : null
    },
  },
  {
    section: 'References',
    weight: 6,
    run: (p) => {
      const s = refStats(p.refs)
      return s.total > SEEDANCE.refs.maxTotal
        ? issue('ref.maxtotal', 'bloquant', 'References', 'Trop de references au total', `${s.total} references pour un maximum de ${SEEDANCE.refs.maxTotal}.`, 'Reduis le manifeste.')
        : null
    },
  },
  {
    section: 'References',
    weight: 6,
    run: (p) => {
      const s = refStats(p.refs)
      return s.primary > SEEDANCE.refs.recommendedPrimarySubjects
        ? issue(
            'ref.primary',
            'important',
            'References',
            'Trop de sujets principaux',
            `${s.primary} references principales. Au-dela de ${SEEDANCE.refs.recommendedPrimarySubjects}, les traits distinctifs se diluent et le rendu se degrade.`,
            'Passe des references en secondaire, ou reduis le casting envoye par generation.',
          )
        : null
    },
  },
  {
    section: 'References',
    weight: 8,
    run: (p) => {
      const covered = new Set(p.refs.map((r) => r.subjectId).filter(Boolean))
      const missing = p.characters.filter((c) => !covered.has(c.id))
      return missing.length
        ? issue('ref.charmissing', 'bloquant', 'References', `Personnages sans reference (${missing.length})`, `${missing.map((c) => c.name).join(', ')} : sans planche visage, l'identite changera a chaque generation.`, "Clique sur « Reconstruire le manifeste » dans l'onglet References.")
        : null
    },
  },
  {
    section: 'References',
    weight: 5,
    run: (p) => {
      const weak = p.refs.filter((r) => isBlank(r.defines))
      return weak.length
        ? issue('ref.defines', 'important', 'References', `References sans role declare (${weak.length})`, "Une reference dont on ne dit pas ce qu'elle apporte sera interpretee au hasard.", 'Renseigne le champ « definit » de chaque reference.')
        : null
    },
  },
  {
    section: 'References',
    weight: 4,
    run: (p) => {
      const s = refStats(p.refs)
      return s.total > 0 && s.ready === 0
        ? issue('ref.none-ready', 'confort', 'References', 'Aucune reference produite', `${s.total} references sont decrites mais aucune n'est marquee comme prete.`, 'Genere les images depuis les prompts fournis, puis marque-les comme pretes.')
        : null
    },
  },

  /* ---------------- Vie de l'image ---------------- */
  {
    section: 'Direction',
    weight: 5,
    run: (p) =>
      p.direction.livingElements.length === 0
        ? issue(
            'da.living',
            'important',
            'Direction',
            'Rien ne bouge',
            "Aucun element en mouvement declare : Seedance produira une photo animee ou seul le sujet respire.",
            "Liste ce qui doit bouger dans un plan (vent, passants, lumiere, fumee) dans l'onglet Direction.",
          )
        : null,
  },
  {
    section: 'Direction',
    weight: 4,
    run: (p) =>
      p.direction.backgroundLife.length === 0
        ? issue(
            'da.background',
            'confort',
            'Direction',
            'Aucune vie de fond',
            'Sans micro-actions declarees, la figuration reste plantee et regarde la camera.',
            "Ajoute des micro-actions de figuration dans l'onglet Direction.",
          )
        : null,
  },
  {
    section: 'Casting',
    weight: 6,
    run: (p) => {
      const noGaze = p.characters.filter((c) => !c.gaze.trim())
      return noGaze.length
        ? issue(
            'cast.gaze',
            'important',
            'Casting',
            `Rapport a la camera non defini (${noGaze.length})`,
            `${noGaze.map((c) => c.name).join(', ')} : sans consigne de regard, le modele fait poser le sujet face objectif.`,
            "Renseigne le champ « Rapport a la camera » de chaque fiche personnage.",
          )
        : null
    },
  },
  {
    section: 'Videos',
    weight: 5,
    run: (p) => {
      const flat = p.videos.filter((e) => e.shots.length && e.shots.every((s) => !s.livingDetail.trim()))
      return flat.length
        ? issue(
            'ep.living',
            'important',
            'Videos',
            `Videos sans element en mouvement (${flat.length})`,
            `${flat.map((e) => e.title).join(', ')} : aucun plan ne declare ce qui bouge dans le cadre.`,
            "Renseigne « Ce qui bouge » sur les plans, ou pioche dans la direction artistique.",
          )
        : null
    },
  },
  {
    section: 'Videos',
    weight: 4,
    run: (p) => {
      // Une transition non motivee n'a de sens que sur le dernier plan.
      const missing = p.videos.filter((e) => e.shots.length > 1 && e.shots.slice(0, -1).every((s) => !s.transitionOut.trim()))
      return missing.length
        ? issue(
            'ep.transitions',
            'confort',
            'Videos',
            `Transitions non motivees (${missing.length})`,
            `${missing.map((e) => e.title).join(', ')} : aucune sortie de plan n'est justifiee par un element de l'image.`,
            'Renseigne « Sortie du plan » sur les plans intermediaires.',
          )
        : null
    },
  },

  /* ---------------- Reglages ---------------- */
  {
    section: 'Reglages',
    weight: 4,
    run: (p) =>
      p.settings.negatives.length === 0
        ? issue('set.negatives', 'important', 'Reglages', 'Aucun negatif', "Le bloc « a eviter » est ce qui empeche les derives les plus courantes.", "Ajoute des negatifs dans l'onglet Reglages.")
        : null,
  },
]

export function auditProject(project: Project): AuditResult {
  const issues: AuditIssue[] = []
  const sectionScores = new Map<string, { score: number; max: number }>()

  for (const check of CHECKS) {
    const found = check.run(project)
    const cur = sectionScores.get(check.section) ?? { score: 0, max: 0 }
    cur.max += check.weight
    if (found) {
      issues.push(found)
      // Un point de confort ne coute que la moitie de son poids.
      if (found.level === 'confort') cur.score += check.weight * 0.5
    } else {
      cur.score += check.weight
    }
    sectionScores.set(check.section, cur)
  }

  const sections = Array.from(sectionScores.entries()).map(([name, v]) => ({
    name,
    score: Math.round(v.score),
    max: v.max,
  }))
  const score = sections.reduce((a, s) => a + s.score, 0)
  const max = sections.reduce((a, s) => a + s.max, 0)

  const order: Record<AuditIssue['level'], number> = { bloquant: 0, important: 1, confort: 2 }
  issues.sort((a, b) => order[a.level] - order[b.level])

  return { score, max, issues, sections }
}

export function scorePercent(result: AuditResult): number {
  return result.max ? Math.round((result.score / result.max) * 100) : 0
}
