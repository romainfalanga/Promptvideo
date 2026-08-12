import { ARTIST_PRESETS } from '../src/data/presets'
import { compileEpisode } from '../src/engine/prompt'
import { auditProject, scorePercent } from '../src/engine/audit'

const p = ARTIST_PRESETS[0].build()
const ep = p.episodes[0]
const c = compileEpisode(p, ep)
const a = auditProject(p)
console.log('=== COMPTE:', p.name, '@' + p.artist.handle, '— audit', scorePercent(a) + '% ===\n')
console.log(c.header)
console.log('\n--- PROMPT (' + c.bodyWords + ' mots dans le corps) ---\n')
console.log(c.full)
console.log('\n--- AUDIT ---')
for (const i of a.issues) console.log(`[${i.level}] ${i.title} — ${i.detail}`)
