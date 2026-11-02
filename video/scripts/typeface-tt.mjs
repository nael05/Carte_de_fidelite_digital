// Convertit une police (.woff) au format « typeface » de three.js (FontLoader), pour le texte extrudé en 3D.
// Usage : node scripts/typeface-tt.mjs <police.woff> <sortie.json>
import fs from 'fs'
import opentype from 'opentype.js'

const [src, out] = process.argv.slice(2)
const buf = fs.readFileSync(src)
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
const r = v => Math.round(v)
const glyphs = {}
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:;!?\'’-+%€&/()«»ÀÂÇÉÈÊËÎÏÔÙÛÜàâçéèêëîïôùûü'
for (const ch of chars) {
  const g = font.charToGlyph(ch)
  if (!g) continue
  const o = []
  for (const c of g.path.commands) {
    if (c.type === 'M') o.push('m', r(c.x), r(c.y))
    else if (c.type === 'L') o.push('l', r(c.x), r(c.y))
    else if (c.type === 'Q') o.push('q', r(c.x), r(c.y), r(c.x1), r(c.y1))
    else if (c.type === 'C') o.push('b', r(c.x), r(c.y), r(c.x1), r(c.y1), r(c.x2), r(c.y2))
  }
  const bb = g.getBoundingBox()
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o: o.join(' ') }
}
const h = font.tables.head
fs.writeFileSync(out, JSON.stringify({
  glyphs,
  familyName: font.names.fontFamily?.en ?? 'font',
  ascender: font.ascender,
  descender: font.descender,
  underlinePosition: font.tables.post.underlinePosition,
  underlineThickness: font.tables.post.underlineThickness,
  boundingBox: { xMin: h.xMin, yMin: h.yMin, xMax: h.xMax, yMax: h.yMax },
  resolution: font.unitsPerEm,
  original_font_information: { format: 0 },
}))
console.log(out, Object.keys(glyphs).length, 'glyphes')
