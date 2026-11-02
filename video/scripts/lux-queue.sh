#!/bin/sh
# File de rendu : rend une à une les lignes « Composition:fichier » de out/queue.txt (attend les ajouts ; « FIN » arrête).
cd "$(dirname "$0")/.."
touch out/queue.txt out/queue.done
while true; do
  while pgrep -f "bin/remotion render" >/dev/null; do sleep 10; done
  job=$(grep -vxFf out/queue.done out/queue.txt | head -1)
  if [ -z "$job" ]; then sleep 15; continue; fi
  [ "$job" = "FIN" ] && exit 0
  id=${job%%:*}; f=${job#*:}
  npx remotion render "$id" "out/$f.mp4" --gl=swangle --crf=16 --concurrency=4 --timeout=300000 --log=error && echo "OK $f" || echo "ECHEC $f"
  echo "$job" >> out/queue.done
done
