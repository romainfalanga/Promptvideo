import { generateProject } from '../src/engine/generate'
import { compileEpisode } from '../src/engine/prompt'
const p = generateProject({ seed: 12345, universeId: 'neo-pluie', platform: 'tiktok' })
const c = compileEpisode(p, p.episodes[0])
console.log('=== COMPTE:', p.name, '@' + p.artist.handle, '===\n')
console.log(c.header)
console.log('\n--- PROMPT (' + c.bodyWords + ' mots dans le corps) ---\n')
console.log(c.full)
