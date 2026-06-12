#!/usr/bin/env node
// Rebrickable CSV → brick/data/parts.json + colors.json
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA  = resolve(__dir, '../data');

// ─── CSV parser (handles quoted fields) ─────────────────────────────────────
function parseCsv(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    vals.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
}

// ─── Categories we actually render in 3D ────────────────────────────────────
const RENDER_CATS = {
  11:  { label: 'Bricks',           type: 'brick'  },
  14:  { label: 'Plates',           type: 'plate'  },
  19:  { label: 'Tiles',            type: 'tile'   },
  3:   { label: 'Slopes',           type: 'slope'  },
  6:   { label: 'Wedges',           type: 'wedge'  },
  5:   { label: 'Bricks Special',   type: 'brick'  },
  9:   { label: 'Plates Special',   type: 'plate'  },
  15:  { label: 'Tiles Special',    type: 'tile'   },
  20:  { label: 'Round Bricks',     type: 'round'  },
  21:  { label: 'Round Plates',     type: 'round'  },
  37:  { label: 'Bricks Curved',    type: 'brick'  },
  49:  { label: 'Plates Angled',    type: 'plate'  },
  67:  { label: 'Tiles Round',      type: 'tile'   },
  1:   { label: 'Baseplates',       type: 'plate'  },
  32:  { label: 'Bars & Fences',    type: 'bar'    },
  23:  { label: 'Panels',           type: 'panel'  },
};

// ─── Extract W × D from part name ────────────────────────────────────────────
// Examples: "Brick 2 x 4", "Plate 1 x 1", "Slope 45° 2 x 2", "Tile 1 x 6"
function parseDims(name) {
  const m = name.match(/(\d+)\s*[xX×]\s*(\d+)/);
  if (!m) return null;
  const w = parseInt(m[1], 10), d = parseInt(m[2], 10);
  if (w < 1 || w > 16 || d < 1 || d > 32) return null;
  return { w, d };
}

// ─── Load CSVs ───────────────────────────────────────────────────────────────
const parts   = parseCsv(readFileSync(`${DATA}/parts.csv`,            'utf8'));
const colors  = parseCsv(readFileSync(`${DATA}/colors.csv`,           'utf8'));
const cats    = parseCsv(readFileSync(`${DATA}/part_categories.csv`,  'utf8'));

// ─── Build colors.json ───────────────────────────────────────────────────────
const colorsOut = colors
  .filter(c => c.id !== '-1' && c.name !== '[Unknown]')
  .map(c => ({
    id:       parseInt(c.id, 10),
    name:     c.name,
    hex:      '#' + c.rgb.toUpperCase(),
    is_trans: c.is_trans === 'True',
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(`${DATA}/colors.json`, JSON.stringify(colorsOut, null, 2));
console.log(`colors.json → ${colorsOut.length} colors`);

// ─── Build parts.json ─────────────────────────────────────────────────────────
const catMap = {}; // id → {label, type, parts:[]}
for (const [id, meta] of Object.entries(RENDER_CATS)) {
  catMap[id] = { id: parseInt(id, 10), label: meta.label, type: meta.type, parts: [] };
}

let skipped = 0, added = 0;
for (const p of parts) {
  const catId = p.part_cat_id;
  if (!catMap[catId]) { skipped++; continue; }
  if (p.part_material !== 'Plastic') { skipped++; continue; }

  const dims = parseDims(p.name);
  if (!dims) { skipped++; continue; }

  catMap[catId].parts.push({
    id:   p.part_num,
    name: p.name,
    w:    dims.w,
    d:    dims.d,
    type: catMap[catId].type,
  });
  added++;
}

// Sort parts within each category by w, then d
for (const cat of Object.values(catMap)) {
  cat.parts.sort((a, b) => a.w - b.w || a.d - b.d || a.name.localeCompare(b.name));
}

// Only keep categories that have parts
const categories = Object.values(catMap)
  .filter(c => c.parts.length > 0)
  .sort((a, b) => a.label.localeCompare(b.label));

writeFileSync(`${DATA}/parts.json`, JSON.stringify({ categories }, null, 2));

const total = categories.reduce((s, c) => s + c.parts.length, 0);
console.log(`parts.json → ${total} parts in ${categories.length} categories (skipped ${skipped})`);
categories.forEach(c => console.log(`  ${c.label.padEnd(20)} ${c.parts.length} parts`));
