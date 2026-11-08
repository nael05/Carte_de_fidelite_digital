#!/bin/sh
# Version sans voix d'une vidéo déjà rendue avec voix : mêmes images, bande-son « musique et bruitages » seule.
# Usage : scripts/campagne/muet.sh <composition-muet> <vidéo avec voix> <sortie>
comp=$1; video=$2; out=$3
cd "$(dirname "$0")/../.."
mkdir -p "$(dirname "$out")"
a="/tmp/claude-0/muet-$comp.m4a"
npx remotion render "$comp" "$a" --codec=aac --browser-executable=/opt/pw-browsers/chromium --log=error --timeout=240000 || exit 1
ffmpeg -y -hide_banner -loglevel error -i "$video" -i "$a" -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" -c:a aac -b:a 192k -shortest -movflags +faststart "$out" && rm -f "$a"
echo "✓ $out"
