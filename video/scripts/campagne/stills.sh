#!/bin/sh
# Images de contrôle : scripts/campagne/stills.sh <composition> <secondes…> → /tmp/claude-0/stills/<comp>-<s>.png puis planche
comp=$1; shift
mkdir -p /tmp/claude-0/stills
for s in "$@"; do
  f=$(python3 -c "print(round($s*30))")
  npx remotion still "$comp" "/tmp/claude-0/stills/$comp-$s.png" --frame=$f --browser-executable=/opt/pw-browsers/chromium --log=error --scale=0.35 >/dev/null 2>&1 || echo "erreur $s"
done
python3 - "$comp" "$@" <<'PY'
import sys
from PIL import Image, ImageDraw
comp, ts = sys.argv[1], sys.argv[2:]
ims = [Image.open(f'/tmp/claude-0/stills/{comp}-{s}.png') for s in ts]
w, h = ims[0].size
cols = min(6 if w < h else 4, len(ims)); rows = (len(ims) + cols - 1) // cols
W = Image.new('RGB', (cols * w, rows * h), 'gray')
for i, (im, s) in enumerate(zip(ims, ts)):
    W.paste(im, ((i % cols) * w, (i // cols) * h)); ImageDraw.Draw(W).text(((i % cols) * w + 6, (i // cols) * h + 4), s, fill='yellow')
W.save(f'/tmp/claude-0/stills/planche-{comp}.png')
PY
