// Rothaariges Maedchen aus vorhandenen KayKit-Teilen.
//
// Die freien Packs enthalten nur maennlich gelesene Figuren. Diese hier ist
// keine Nachbildung, sondern das echte Mage-Modell: der Hut wird
// ausgeblendet, darunter kommen die langen Haare zum Vorschein, und deren
// Farbfeld im Textur-Atlas wird von Schwarz nach Rot umgefaerbt.
//
// KayKit texturiert ueber einen Atlas aus Farbfeldern — jedes Material
// entspricht einem Feld, die Flaechen sammeln sich auf wenigen Pixeln.
// Deshalb genuegt es, das Feld der Haare zu finden und neu einzufaerben;
// alle anderen Teile bleiben unberuehrt. Wichtig: glTF-Texturen haben
// flipY = false, v laeuft also von oben.
import * as THREE from 'three';

const HAIR_HUE = 18 / 360;                    // kupferrot
const HAIR_SAT = .74;
// Robe und Umhang liegen im Atlas in eigenen Farbfeldern: die Robe violett,
// der Umhang magenta. Beide lassen sich ueber den Farbton erkennen und
// umfaerben, ohne die Geometrie anzufassen.
const RECOLOR = [
  {from: [.66, .84], to: {h: 28/360, s: .40, l: 1.05}},   // violett -> braun
  {from: [.86, .97], to: {h: 128/360, s: .48, l: 1.0}},   // magenta -> gruen
];

function rgbToHsl(r, g, b){
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if(max === min) return [0, 0, l];
  const d = max - min;
  const s = l > .5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if(max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if(max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb(h, s, l){
  if(s === 0){ const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => {
    t = (t + 1) % 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  return [f(h + 1/3), f(h), f(h - 1/3)].map(v => Math.round(v * 255));
}

// Die Felder des Atlas suchen, auf denen die dunklen Flaechen des Kopfes
// liegen. Ein einzelnes umschliessendes Rechteck reicht nicht: es wuerde
// benachbarte Felder mitnehmen und faerbte prompt die Robe pink.
function hairCells(head, pixels, w, h, grid = 32){
  const uv = head.geometry.attributes.uv, idx = head.geometry.index;
  const cells = new Map();
  const n = idx ? idx.count : uv.count;
  for(let i = 0; i < n; i += 3){
    const a = idx ? idx.getX(i) : i, b = idx ? idx.getX(i+1) : i+1,
          c = idx ? idx.getX(i+2) : i+2;
    const u = (uv.getX(a) + uv.getX(b) + uv.getX(c)) / 3;
    const v = (uv.getY(a) + uv.getY(b) + uv.getY(c)) / 3;
    const x = Math.round(u * w), y = Math.round(v * h);
    const o = (y * w + x) * 4;
    const lum = pixels[o] * .3 + pixels[o+1] * .6 + pixels[o+2] * .1;
    if(lum > 70) continue;                    // nur die dunklen Haarflaechen
    const key = Math.floor(u * grid) + ',' + Math.floor(v * grid);
    cells.set(key, (cells.get(key) || 0) + 1);
  }
  // Die Augen liegen in einem eigenen, ebenfalls dunklen Feld — nur das
  // groesste zusammenhaengende Feld ist das Haar, alles weiter weg bleibt.
  const found = [...cells].filter(([, n]) => n >= 6)
    .map(([k, n]) => [...k.split(',').map(Number), n]);
  if(!found.length) return [];
  const [bx, by] = found.reduce((a, b) => (a[2] >= b[2] ? a : b));
  return found.filter(([x, y]) => Math.abs(x - bx) <= 2 && Math.abs(y - by) <= 3)
              .map(([x, y]) => [x, y]);
}

// Felder, die ein Mesh benutzt — mit Durchschnittsfarbe, um sie danach
// gezielt umzufaerben (etwa die Stiefel an den Beinen).
function meshCells(mesh, pixels, w, h, grid = 32, minTris = 15){
  const uv = mesh.geometry.attributes.uv, idx = mesh.geometry.index;
  const cells = new Map();
  const n = idx ? idx.count : uv.count;
  for(let i = 0; i < n; i += 3){
    const a = idx ? idx.getX(i) : i, b = idx ? idx.getX(i+1) : i+1,
          c = idx ? idx.getX(i+2) : i+2;
    const u = (uv.getX(a) + uv.getX(b) + uv.getX(c)) / 3;
    const v = (uv.getY(a) + uv.getY(b) + uv.getY(c)) / 3;
    const x = Math.round(u * w), y = Math.round(v * h), o = (y * w + x) * 4;
    const key = Math.floor(u * grid) + ',' + Math.floor(v * grid);
    if(!cells.has(key)) cells.set(key, {n: 0, r: 0, g: 0, b: 0});
    const e = cells.get(key);
    e.n++; e.r += pixels[o]; e.g += pixels[o+1]; e.b += pixels[o+2];
  }
  return [...cells].filter(([, e]) => e.n >= minTris).map(([k, e]) => ({
    cell: k.split(',').map(Number),
    rgb: [e.r / e.n, e.g / e.n, e.b / e.n],
  }));
}

export function makeGirl(scene){
  const meshes = [];
  let head = null, hat = null;
  scene.traverse(o=>{
    if(!o.isMesh) return;
    meshes.push(o);
    if(/_Head$/.test(o.name)) head = o;
    if(/_Hat$/.test(o.name)) hat = o;
  });
  if(hat) hat.visible = false;                // Hut ab
  if(!head) return scene;

  const img = head.material.map?.image;
  if(!img) return scene;

  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  const ctx = cv.getContext('2d', {willReadFrequently: true});
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, cv.width, cv.height);
  const px = data.data;

  const GRID = 32;
  const cw = cv.width / GRID, chh = cv.height / GRID;

  const paintCell = ([cx0, cy0], fn)=>{
    for(let y = Math.floor(cy0 * chh); y < (cy0 + 1) * chh; y++){
      for(let x = Math.floor(cx0 * cw); x < (cx0 + 1) * cw; x++){
        const o = (y * cv.width + x) * 4;
        const hsl = rgbToHsl(px[o], px[o+1], px[o+2]);
        const next = fn(hsl);
        if(!next) continue;
        const [nr, ng, nb] = hslToRgb(...next);
        px[o] = nr; px[o+1] = ng; px[o+2] = nb;
      }
    }
  };

  // Stiefel: die braunen Felder der Beine deutlich abdunkeln. Vor den
  // Farbtonregeln unten, sonst wuerde der umgefaerbte Robensaum mitgefangen.
  for(const leg of meshes.filter(m => /_Leg/.test(m.name))){
    // Mindestzahl klein halten: Schnalle und Riemen sind nur eine Handvoll
    // Dreiecke und blieben sonst hell.
    for(const {cell, rgb} of meshCells(leg, px, cv.width, cv.height, GRID, 4)){
      const [h] = rgbToHsl(...rgb);
      if(h < .02 || h > .11) continue;        // nur die braunen Felder
      paintCell(cell, ([, , l]) => [24/360, .46, Math.max(.06, l * .42)]);
    }
  }

  for(const cell of hairCells(head, px, cv.width, cv.height, GRID)){
    // Schwarz traegt kaum Helligkeit — deshalb aufhellen, damit das Rot
    // nicht als schwarze Flaeche endet, die Schattierung aber bleibt.
    paintCell(cell, ([, , l]) =>
      l > .42 ? null : [HAIR_HUE, HAIR_SAT, Math.min(.62, .13 + l * 2.1)]);
  }
  // Kleidung: Farbtonbereiche des Atlas umfaerben. Die Leinwand gehoert nur
  // dieser Figur, andere Modelle behalten ihre Farben.
  for(let o = 0; o < px.length; o += 4){
    const [h, sat, l] = rgbToHsl(px[o], px[o+1], px[o+2]);
    if(sat < .12) continue;
    for(const rule of RECOLOR){
      if(h < rule.from[0] || h > rule.from[1]) continue;
      const [nr, ng, nb] = hslToRgb(rule.to.h, rule.to.s,
        Math.min(.85, l * rule.to.l));
      px[o] = nr; px[o+1] = ng; px[o+2] = nb;
      break;
    }
  }

  ctx.putImageData(data, 0, 0);

  const tex = new THREE.CanvasTexture(cv);
  tex.flipY = false;                          // wie die glTF-Vorlage
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  const material = head.material.clone();
  material.map = tex;
  material.name = 'girl';
  for(const m of meshes) m.material = material;

  return scene;
}
