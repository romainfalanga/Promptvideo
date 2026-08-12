import { generateConceptBatch, generateProject } from '../src/engine/generate'
import { projectFromBrief, explainInterpretation } from '../src/engine/interpret'
import { compileEpisode, compileShot } from '../src/engine/prompt'
import { auditProject, scorePercent } from '../src/engine/audit'
import { exportAccount, exportSeedancePack, exportDelegationBrief } from '../src/engine/exporter'
import { UNIVERSES } from '../src/data/universes'
import { indexReferences } from '../src/engine/references'

let fail = 0
const check = (name: string, cond: boolean, extra = '') => {
  if (!cond) { fail++; console.log('FAIL  ' + name + (extra ? ' :: ' + extra : '')) }
  else console.log('ok    ' + name)
}

// 1. Determinisme
const a = generateProject({ seed: 12345 })
const b = generateProject({ seed: 12345 })
check('determinisme du nom', a.name === b.name, a.name + ' vs ' + b.name)
check('determinisme de la palette', a.direction.palette.name === b.direction.palette.name)
check('determinisme du casting', a.characters.map(c=>c.name).join() === b.characters.map(c=>c.name).join())

// 2. Tous les univers generent un projet valide
for (const u of UNIVERSES) {
  const p = generateProject({ seed: 777, universeId: u.id })
  const ep = p.episodes[0]
  const c = compileEpisode(p, ep)
  const refs = indexReferences(p.refs)
  const ok = p.characters.length > 0 && p.places.length > 0 && p.episodes.length > 0 && p.refs.length > 0
    && c.full.length > 200 && refs[0].token === '@Image1'
  check('univers ' + u.id, ok, `chars=${p.characters.length} refs=${p.refs.length} words=${c.bodyWords}`)
  // contraintes du modele
  check('  duree ' + u.id, ep.duration >= 4 && ep.duration <= 30, String(ep.duration))
  check('  images<=30 ' + u.id, p.refs.filter(r=>r.kind==='image').length <= 30)
  // tokens presents dans le prompt
  const used = c.attachments.map(r=>r.token)
  check('  tokens declares ' + u.id, used.every(t => c.full.includes(t)), used.join(','))
}

// 3. Mode sur-mesure
const briefs = [
  "Un compte sur un chat samourai qui vit dans le Tokyo des annees 80, filme la nuit sous la pluie, sans dialogue, format vertical 15 secondes.",
  "Une grand-mere qui repare des objets casses dans son atelier, tres lent, ASMR.",
  "azerty qwerty",
]
for (const br of briefs) {
  const r = projectFromBrief(br, {})
  check('brief: ' + br.slice(0, 30), r.project.seedText === br.trim() && r.project.episodes.length > 0)
  check('  explication', explainInterpretation(r).length > 0)
  const c = compileEpisode(r.project, r.project.episodes[0])
  check('  prompt compile', c.full.includes(br.trim().slice(0, 20)) || c.full.length > 200)
}
const tokyo = projectFromBrief(briefs[0], {})
check('detection univers neo-pluie', tokyo.project.universeId === 'neo-pluie', tokyo.project.universeId)
check('detection duree 15s', tokyo.project.settings.duration === 15, String(tokyo.project.settings.duration))
check('detection format vertical', tokyo.project.settings.aspect === '9:16', tokyo.project.settings.aspect)

// 4. Audit
const audit = auditProject(a)
check('audit produit un score', scorePercent(audit) > 0 && scorePercent(audit) <= 100, String(scorePercent(audit)))
const empty = generateProject({ seed: 1 })
empty.characters = []
empty.refs = []
const a2 = auditProject(empty)
check('audit detecte casting vide', a2.issues.some(i => i.id === 'cast.empty'))

// 5. Exports
const md = exportAccount(a)
check('export compte non vide', md.length > 3000, String(md.length))
check('export contient le manifeste', md.includes('@Image1'))
check('export pack', exportSeedancePack(a).includes('@Image1'))
check('export delegation', exportDelegationBrief(a).length > md.length)

// 6. Compile shot
const s0 = a.episodes[0].shots[0]
check('compile shot', compileShot(a, a.episodes[0], s0).full.length > 100)

// 7. Concepts
const batch = generateConceptBatch(3, {})
check('3 concepts distincts', new Set(batch.map(c=>c.universeId)).size === 3, batch.map(c=>c.universeId).join())

console.log(fail === 0 ? '\nTOUT PASSE' : `\n${fail} ECHECS`)
if (fail) process.exit(1)
