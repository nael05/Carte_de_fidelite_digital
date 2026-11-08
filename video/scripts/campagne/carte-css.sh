#!/bin/sh
# Recopie le style du pass depuis le site (à relancer si Home.css change)
cd "$(dirname "$0")/../../.." && { echo "/* Pass Apple Wallet : copié de frontend/src/pages/Home.css */"; sed -n "/═══════════ PASS APPLE WALLET 3D/,/═══════════ STATS/p" frontend/src/pages/Home.css | sed "\$d"; } > video/src/campagne/carte.css
