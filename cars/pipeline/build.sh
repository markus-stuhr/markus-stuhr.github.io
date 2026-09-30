#!/bin/zsh
# Baut alle Modelle aus ~/cars-raw nach ../models (Originale per Sketchfab-API, siehe Vault-Notiz)
cd "${0:A:h}"
grep -v '^#' autos.tsv | while IFS=$'\t' read uid len flip tex name paint accent; do
  [[ -n "$1" && "$1" != "$uid" ]] && continue
  echo "== $name"
  /Applications/Blender.app/Contents/MacOS/Blender --background --python rig_car.py -- ~/cars-raw/$uid.glb ../models/$uid.glb $len $flip $tex "${paint:--}" "${accent:--}" 2>&1 | grep -E '^(RAEDER|BREITE|EXTRAS|PAINT|SIMPLIFY|GERADE|REST|PRUEF|TAUMEL|VERGESSEN|NACHSCHNITT|BREMSE|HALB|MITTE|REIN|UEBERSTAND|VERFORMT|NEUER-REIFEN|NABE|ANHEBEN)|Error'
done
