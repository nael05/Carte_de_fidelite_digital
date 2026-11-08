#!/bin/sh
# Images de couverture des vidéos verticales → out/campagne/couvertures/NN.jpg (toutes, ou celles passées en argument : 04 09)
cd "$(dirname "$0")/../.."
mkdir -p out/campagne/couvertures
liste=${*:-$(node -e "import('./src/campagne/couvertures-liste.mjs').then(m=>console.log(Object.keys(m.L).join(' ')))")}
for n in $liste; do
  at=$(node -e "import('./src/campagne/couvertures-liste.mjs').then(m=>console.log(Math.round(m.L['$n']*30)))")
  npx remotion still C-couverture "out/campagne/couvertures/$n.png" --props="{\"n\":\"$n\"}" --frame="$at" --browser-executable=/opt/pw-browsers/chromium --log=error --timeout=240000 \
    && ffmpeg -y -loglevel error -i "out/campagne/couvertures/$n.png" -q:v 2 "out/campagne/couvertures/$n.jpg" && rm "out/campagne/couvertures/$n.png" && echo "✓ $n"
done
