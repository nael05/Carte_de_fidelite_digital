#!/bin/sh
# Recalcule seulement la bande-son d'une vidéo déjà rendue (mêmes images) et la remplace, normalisée à -14 LUFS.
# Usage : scripts/campagne/son.sh <composition> <fichier vidéo>
comp=$1; video=$2
cd "$(dirname "$0")/../.."
a="/tmp/claude-0/son-$comp.m4a"
npx remotion render "$comp" "$a" --codec=aac --browser-executable=/opt/pw-browsers/chromium --log=error --timeout=240000 || exit 1
ffmpeg -y -hide_banner -loglevel error -i "$video" -i "$a" -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" -c:a aac -b:a 192k -shortest -movflags +faststart "$video.tmp.mp4" && mv "$video.tmp.mp4" "$video" && rm -f "$a"
echo "✓ son $video"
