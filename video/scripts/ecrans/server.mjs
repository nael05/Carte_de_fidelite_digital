// Faux serveur d'API pour capturer les vrais écrans du site avec des données de démonstration.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const DIR = path.dirname(fileURLToPath(import.meta.url))
const state = JSON.parse(fs.readFileSync(path.join(DIR, 'data.json'), 'utf8'))
const reload = () => Object.assign(state, JSON.parse(fs.readFileSync(path.join(DIR, 'data.json'), 'utf8')))
const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' })
  res.end(type === 'application/json' ? JSON.stringify(body) : body)
}
http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, '', 'text/plain')
  const url = new URL(req.url, 'http://x')
  const p = url.pathname.replace(/^\/api/, '')
  if (p.startsWith('/img/')) {
    const f = path.join(DIR, 'img', path.basename(p))
    if (!fs.existsSync(f)) return send(res, 404, {})
    const ext = path.extname(f).slice(1)
    return send(res, 200, fs.readFileSync(f), ext === 'svg' ? 'image/svg+xml' : `image/${ext}`)
  }
  reload()
  let body = ''
  req.on('data', c => (body += c))
  req.on('end', () => {
    console.log(req.method, p)
    for (const [pattern, value] of Object.entries(state.routes)) {
      const [m, rx] = pattern.split(' ')
      if (m === req.method && new RegExp('^' + rx + '$').test(p)) return send(res, 200, value)
    }
    send(res, 200, req.method === 'GET' ? {} : { success: true, message: 'OK' })
  })
}).listen(5055, () => console.log('mock API sur 5055'))
