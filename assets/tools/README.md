# Werkzeuge

## Eigene Figur bauen (Redhead Adventurer)

Die Figur ist keine Handarbeit, sondern das KayKit-Mage-Modell ohne Hut mit
umgefaerbter Textur und verlaengerten Haaren. Sie entsteht in drei Schritten
und laesst sich jederzeit neu erzeugen:

```bash
cd assets/tools
python3 extract_tex.py    # holt mage_texture.png aus Mage.glb
python3 recolor.py        # faerbt Haar, Robe, Umhang und Stiefel um
/Applications/Blender.app/Contents/MacOS/Blender --background --python build_girl.py
```

Ergebnis: `assets/models/Custom_Characters/Characters/gltf/Redhead_Adventurer.glb`

Danach das Manifest neu bauen, damit die Figur im Katalog auftaucht und ihre
Rig-Signatur bekannt ist:

```bash
cd assets && python3 build_manifest.py
```

Die Zwischendateien `mage_texture.png` und `girl_texture.png` entstehen im
Ordner `tools/` und werden nur beim Bauen gebraucht.
