import { ARTIST_PRESETS } from '../src/data/presets'
import { generateVideoForProject } from '../src/engine/video'
import { compileVideo } from '../src/engine/prompt'

const p = ARTIST_PRESETS[0].build()
const brief = "Vland traverse un parking souterrain vide, la camera le perd derriere un pilier."
const v = generateVideoForProject(p, { brief, duration: 15, aspect: '16:9' })
const c = compileVideo(p, v)
console.log('=== UNIVERS :', p.name, '===\n')
console.log(c.header)
console.log('\n--- PROMPT (' + c.bodyWords + ' mots) ---\n')
console.log(c.full)
