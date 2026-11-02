// Télécharge depuis Pixabay les musiques et bruitages des TikToks 3D (non versionnés : licence Pixabay,
// pas de redistribution isolée). Sources et auteurs : public/sons_tt/SOURCES.md.
// Usage : node scripts/sons-tt.mjs [--force]   (--force retélécharge même si le fichier existe)
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CDN = 'https://cdn.pixabay.com/audio/'
const SONS = {
  'sons_tt/musique-bandeannonce': '2021/10/15/audio_2320f2b0bc',
  'sons_tt/musique-keynote': '2025/05/21/audio_280fb2e66e',
  'sons_tt/musique-concurrent': '2026/07/25/audio_dc9b4de07f',
  'sons_tt/musique-noir': '2026/08/30/audio_dfc9db7a4b',
  'sons_tt/musique-chrono': '2026/10/20/audio_9c94bca4c7',
  'sons_tt/braam': '2026/01/08/audio_07ebcd8b9c',
  'sons_tt/braam2': '2024/01/04/audio_0ce2f07dba',
  'sons_tt/whoosh': '2025/07/18/audio_f5a010a2d7',
  'sons_tt/whoosh_rapide': '2022/08/24/audio_4b5d7c0bb9',
  'sons_tt/whoosh7': '2025/09/26/audio_ebe45b8470',
  'sons_tt/riser': '2025/10/10/audio_cda4228686',
  'sons_tt/riser_court': '2025/04/14/audio_743d7b17e6',
  'sons_tt/bass_drop': '2025/08/15/audio_34184d2028',
  'sons_tt/swoosh': '2025/08/03/audio_f3fcedb3d6',
  'sons_tt/swoosh2': '2025/05/28/audio_06c890ad4c',
  'sons_tt/clic': '2023/04/23/audio_4de3f97248',
  'sons_tt/sub': '2026/10/27/audio_4e3e63472d',
  'sons_tt/notif': '2025/06/02/audio_f91dce208a',
  'sons_tt/notif_douce': '2026/11/01/audio_a21a628f0c',
  'sons_tt/scratch': '2022/03/26/audio_7d318dd030',
  'sons_tt/feu': '2024/07/12/audio_b99f06bd35',
  'sons_tt/machine': '2025/06/04/audio_ca0ab66411',
  'sons_tt/hit': '2025/12/21/audio_8e44cfb425',
  'sons_tt/hit_grave': '2025/01/22/audio_ae267fbe88',
  'sons_tt/hit_logo': '2023/02/13/audio_6e50f93c30',
  'sons_tt/pop': '2025/09/09/audio_3023b9bde2',
  'sons_tt/pop_cartoon': '2025/04/16/audio_cec206a548',
  'sons_tt/scintille': '2025/02/08/audio_988d52439c',
  'sons_tt/verre': '2022/03/15/audio_947caa0bcc',
  'sons_tt/goutte': '2022/12/25/audio_89a085d9cf',
  'sons_tt/visqueux': '2022/03/15/audio_c0c72ecf71',
  'sons_tt/chrono_tic': '2022/03/24/audio_0a2236b196',
  'sons_tt/chrono_stop': '2024/11/26/audio_f877c2d763',
  'sons_tt/laser': '2022/03/10/audio_a1641bdc9c',
  'sons_tt/laser_long': '2024/10/03/audio_23896cab60',
  'sons_tt/neon': '2026/06/07/audio_12fb721828',
  'sons_tiktok/dechirure': '2024/10/19/audio_5ed293fb1a',
  'sons_tiktok/bip-caisse': '2022/03/15/audio_f80e052d2e',
}

const force = process.argv.includes('--force')
let ok = 0
for (const [name, id] of Object.entries(SONS)) {
  const file = path.join(root, 'public', `${name}.mp3`)
  if (!force && fs.existsSync(file)) continue
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const r = await fetch(`${CDN}${id}.mp3`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!r.ok) {
    console.error(`❌ ${name} : ${r.status}`)
    process.exitCode = 1
    continue
  }
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()))
  console.log(`✓ ${name}`)
  ok++
}
console.log(`${ok} fichier(s) téléchargé(s)`)
