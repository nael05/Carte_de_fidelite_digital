#!/bin/sh
# Rendu d'une vidéo « campagne » puis normalisation du son à -14 LUFS (standard TikTok, Reels, Shorts).
# Usage : scripts/campagne/rendu.sh <composition> <fichier de sortie> [concurrence]
comp=$1; out=$2; conc=${3:-2}
cd "$(dirname "$0")/../.."
mkdir -p "$(dirname "$out")"
tmp="/tmp/claude-0/rendu-$comp.mp4"
npx remotion render "$comp" "$tmp" --browser-executable=/opt/pw-browsers/chromium --crf=17 --concurrency="$conc" --timeout=240000 --log=error || exit 1
ffmpeg -y -hide_banner -loglevel error -i "$tmp" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" -c:a aac -b:a 192k -movflags +faststart "$out" && rm -f "$tmp"
echo "✓ $out"
