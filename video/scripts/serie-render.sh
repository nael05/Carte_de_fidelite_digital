#!/bin/sh
# Rend une ou plusieurs vidéos de la série : sh scripts/serie-render.sh SerieCartePerdue:serie-1-carte-perdue …
# (WebGL logiciel : --gl=swangle ; avec une carte graphique, GL=angle)
cd "$(dirname "$0")/.."
for v in "$@"; do
  id=${v%%:*}; out=${v#*:}
  npx remotion render "$id" "out/$out.mp4" --gl=${GL:-swangle} --crf=16 --concurrency=${CONC:-4} --timeout=240000 --log=error && echo "OK $out"
done
