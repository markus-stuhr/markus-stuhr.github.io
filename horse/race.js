// Rennbahn Belmont Park und Rennmodell für die Belmont Stakes 1973.
// Bahngeometrie: OpenStreetMap (ODbL), belmont.geojson. Zeiten: belmont1973.json (Wikipedia).
import * as THREE from 'three';

const LENGTH_M = 2.4; // eine Pferdelänge
export const RACE_M = 2414; // 1,5 Meilen

// ---------------------------------------------------------------- Bahn ----

const UP = new THREE.Vector3(0, 1, 0);
// Drehung, deren lokale x-Achse auf x zeigt und y nach oben; z ergibt sich rechtshändig
function basisQuat(x) {
  const z = new THREE.Vector3().crossVectors(x, UP);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, UP, z));
}

// lon/lat → lokale Meter: x = Osten, z = Süden (Norden ist -z)
function projector(lon0, lat0) {
  const kx = Math.cos(lat0 * Math.PI / 180) * 111320, kz = 111320;
  return ([lon, lat]) => new THREE.Vector2((lon - lon0) * kx, -(lat - lat0) * kz);
}

function signedAreaEN(pts) {
  // Fläche in (Osten, Norden): > 0 heißt gegen den Uhrzeigersinn auf der Karte
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p.x * (-q.y) - q.x * (-p.y);
  }
  return a / 2;
}

function ringOf(coords, proj) {
  const pts = coords.map(proj);
  if (pts[0].distanceTo(pts[pts.length - 1]) < 0.01) pts.pop();
  return pts;
}

function shapeFrom(pts, holes = []) {
  // Shape liegt in XY; nach rotateX(-π/2) wird y zu -z, also y = Norden = -z
  const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, -p.y)));
  for (const h of holes) sh.holes.push(new THREE.Path(h.map((p) => new THREE.Vector2(p.x, -p.y))));
  return new THREE.ShapeGeometry(sh, 64).rotateX(-Math.PI / 2);
}

function canvasTexture(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  return t;
}

function dirtTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#9b7149'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const v = Math.random();
      g.fillStyle = v < 0.5 ? 'rgba(70,45,25,0.18)' : 'rgba(200,160,110,0.16)';
      g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }
  }, 1 / 12);
}

function turfTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    // Mähstreifen
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#4f8f3a' : '#5c9c44';
      g.fillRect(0, i * h / 8, w, h / 8);
    }
    for (let i = 0; i < 6000; i++) {
      g.fillStyle = Math.random() < 0.5 ? 'rgba(30,70,20,0.15)' : 'rgba(150,200,110,0.12)';
      g.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 3);
    }
  }, 1 / 40);
}

// Abtastung eines geschlossenen Pfads in gleichen Abständen, mit Tangente und Außennormale
function samplePath(ring, step, centre) {
  const curve = new THREE.CatmullRomCurve3(ring.map((p) => new THREE.Vector3(p.x, 0, p.y)), true, 'centripetal');
  const L = curve.getLength();
  const n = Math.round(L / step);
  const pts = curve.getSpacedPoints(n).slice(0, n);
  const out = pts.map((p, i) => {
    const q = pts[(i + 1) % n], o = pts[(i - 1 + n) % n];
    const dir = q.clone().sub(o).normalize();
    let nrm = new THREE.Vector3(-dir.z, 0, dir.x);
    if (nrm.dot(p.clone().sub(centre)) < 0) nrm.negate();
    return { p, dir, nrm };
  });
  return { L, pts: out, step: L / n };
}

export async function buildBelmont(scene) {
  const geo = await (await fetch('belmont.geojson')).json();
  const dirtF = geo.features.find((f) => f.properties.surface === 'dirt');
  const turfF = geo.features.find((f) => f.properties.surface === 'turf');
  const [outerC, railC] = dirtF.geometry.coordinates;
  const turfInnerC = turfF.geometry.coordinates[1];
  const lon0 = railC.reduce((a, c) => a + c[0], 0) / railC.length;
  const lat0 = railC.reduce((a, c) => a + c[1], 0) / railC.length;
  const proj = projector(lon0, lat0);

  let rail = ringOf(railC, proj), outer = ringOf(outerC, proj), turfIn = ringOf(turfInnerC, proj);
  // US-Bahnen laufen gegen den Uhrzeigersinn
  if (signedAreaEN(rail) < 0) rail.reverse();
  const centre = new THREE.Vector3();
  const group = new THREE.Group();
  scene.add(group);

  // Flächen
  const dirt = new THREE.Mesh(shapeFrom(outer, [rail]), new THREE.MeshStandardMaterial({ map: dirtTexture(), roughness: 1 }));
  dirt.position.y = 0.03;
  const turf = new THREE.Mesh(shapeFrom(rail, [turfIn]), new THREE.MeshStandardMaterial({ map: turfTexture(), roughness: 1 }));
  turf.position.y = 0.02;
  const infield = new THREE.Mesh(shapeFrom(turfIn), new THREE.MeshStandardMaterial({ color: 0x6fa452, roughness: 1 }));
  infield.position.y = 0.015;
  for (const m of [dirt, turf, infield]) { m.receiveShadow = true; group.add(m); }

  // Mittellinie an der Innenkante und Außenkante als Pfade
  const path = samplePath(rail, 2, centre);
  const outerPath = samplePath(outer, 2, centre);
  // Bahnbreite: mittlerer Abstand der Außenkante zur Innenkante
  let width = 0;
  for (const q of outerPath.pts.filter((_, i) => i % 20 === 0)) {
    let best = 1e9;
    for (const p of path.pts) best = Math.min(best, p.p.distanceTo(q.p));
    width += best;
  }
  width /= Math.ceil(outerPath.pts.length / 20);

  // Zielgerade: die Gerade auf der Südseite vor der Tribüne (Hempstead Turnpike). Die Bahn ist gegen
  // die Ostachse gedreht, deshalb über die Krümmung suchen: längster gerader Lauf mit Außenseite nach Süden.
  // Das Ziel liegt 334 m (1097 ft) hinter dem Ende der Schlusskurve.
  const n = path.pts.length, win = 10;
  const straight = (i) => {
    const a = path.pts[(i - win + n) % n].dir, b = path.pts[(i + win) % n].dir;
    return a.dot(b) > 0.9995 && path.pts[i].nrm.z > 0.5;
  };
  let homeStart = 0, best = 0;
  for (let i = 0; i < n; i++) {
    if (!straight(i) || straight((i - 1 + n) % n)) continue;
    let k = 0;
    while (k < n && straight((i + k) % n)) k++;
    if (k > best) { best = k; homeStart = i; }
  }
  const finishS = (homeStart * path.step + 334) % path.L;

  const track = {
    group, L: path.L, width, finishS, path, outerPath, homeStart,
    // Punkt bei Strecke s (Meter entlang der Innenkante) und Abstand lane zur Innenkante
    pointAt(s, lane, target = new THREE.Vector3()) {
      const L = path.L, n = path.pts.length;
      const f = (((s % L) + L) % L) / path.step;
      const i = Math.floor(f) % n, j = (i + 1) % n, t = f - Math.floor(f);
      const a = path.pts[i], b = path.pts[j];
      target.lerpVectors(a.p, b.p, t);
      const nrm = a.nrm.clone().lerp(b.nrm, t).normalize();
      target.addScaledVector(nrm, lane);
      const dir = a.dir.clone().lerp(b.dir, t).normalize();
      return { pos: target, dir, nrm };
    },
  };

  buildRails(group, path, outerPath);
  buildPoles(group, track);
  buildFinish(group, track);
  buildGrandstand(group, track);
  track.gate = buildGate(group, track);
  track.board = buildBoard(group, track);
  return track;
}

function buildRails(group, path, outerPath) {
  const white = new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.5 });
  for (const [pp, off] of [[path, -0.35], [outerPath, 0.35]]) {
    // Handlauf als geschlossene Röhre etwas neben der Kante, Pfosten als Instanzen
    const pts = pp.pts.filter((_, i) => i % 2 === 0).map((q) => q.p.clone().addScaledVector(q.nrm, off).setY(1.05));
    const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), pts.length * 2, 0.07, 6, true), white);
    rail.castShadow = true;
    group.add(rail);
    const postGeo = new THREE.BoxGeometry(0.08, 1.05, 0.08).translate(0, 0.525, 0);
    const every = 2; // alle 4 m
    const count = Math.floor(pp.pts.length / every);
    const posts = new THREE.InstancedMesh(postGeo, white, count);
    const m = new THREE.Matrix4();
    for (let k = 0; k < count; k++) {
      const q = pp.pts[k * every];
      m.makeTranslation(q.p.x + q.nrm.x * off, 0, q.p.z + q.nrm.z * off);
      posts.setMatrixAt(k, m);
    }
    posts.castShadow = true;
    group.add(posts);
  }
}

// Distanzstangen an der Innenkante, gezählt vom Ziel rückwärts:
// Viertelmeilen rot-weiß, Achtel grün-weiß, Sechzehntel schwarz-weiß
function buildPoles(group, track) {
  const furlong = 201.168;
  const mats = {
    q: new THREE.MeshStandardMaterial({ color: 0xc8102e }),
    e: new THREE.MeshStandardMaterial({ color: 0x1f7a3a }),
    s: new THREE.MeshStandardMaterial({ color: 0x1b1b1b }),
    w: new THREE.MeshStandardMaterial({ color: 0xffffff }),
  };
  const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8).translate(0, 1.3, 0);
  for (let k = 1; k < 24; k++) {
    const kind = k % 4 === 0 ? 'q' : k % 2 === 0 ? 'e' : 's';
    const { pos } = track.pointAt(track.finishS - k * furlong / 2, -0.9);
    const pole = new THREE.Group();
    // abwechselnde Ringe
    for (let r = 0; r < 6; r++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.43, 8), r % 2 ? mats.w : mats[kind]);
      seg.position.y = 0.22 + r * 0.43;
      seg.castShadow = true;
      pole.add(seg);
    }
    pole.position.copy(pos);
    group.add(pole);
  }
  poleGeo.dispose();
}

function buildFinish(group, track) {
  const { pos, dir, nrm } = track.pointAt(track.finishS, 0);
  // Ziellinie quer über die Bahn
  // flache Ebene: Breite entlang der Normalen (quer zur Bahn), Tiefe entlang der Laufrichtung
  const line = new THREE.Mesh(new THREE.PlaneGeometry(track.width, 0.25).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  line.position.copy(pos).addScaledVector(nrm, track.width / 2).setY(0.05);
  line.quaternion.copy(basisQuat(nrm));
  group.add(line);
  // Zielpfosten mit Spiegelscheibe an der Innenkante
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 5, 10).translate(0, 2.5, 0), new THREE.MeshStandardMaterial({ color: 0xf2f2f2 }));
  post.position.copy(pos).addScaledVector(nrm, -1.0);
  post.castShadow = true;
  group.add(post);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshStandardMaterial({ color: 0xffd23f, side: THREE.DoubleSide, metalness: 0.4, roughness: 0.3 }));
  disc.position.copy(post.position).setY(5.4);
  disc.lookAt(disc.position.clone().add(dir));
  group.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 8, 32), new THREE.MeshStandardMaterial({ color: 0x1b1b1b }));
  ring.position.copy(disc.position);
  ring.quaternion.copy(disc.quaternion);
  group.add(ring);
}

// Tribüne außen an der Zielgeraden: gestufte Ränge, Dach auf Stützen, Zuschauer als Instanzen
function buildGrandstand(group, track) {
  const len = 360, depth = 36, tiers = 12;
  const { pos, dir, nrm } = track.pointAt(track.finishS - 40, track.width + 14);
  const stand = new THREE.Group();
  stand.position.copy(pos);
  // lokales System: x entlang der Gerade, z von der Bahn weg (Tribüne ist längs symmetrisch,
  // daher darf x auch gegen die Laufrichtung zeigen)
  const ax = dir.clone();
  if (new THREE.Vector3().crossVectors(ax, UP).dot(nrm) < 0) ax.negate();
  stand.quaternion.copy(basisQuat(ax));
  const concrete = new THREE.MeshStandardMaterial({ color: 0xd8d0bf, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2f5d45, roughness: 0.6, side: THREE.DoubleSide });
  const step = depth / tiers, rise = 1.2;
  for (let t = 0; t < tiers; t++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(len, rise * (t + 1), step), concrete);
    b.position.set(0, rise * (t + 1) / 2, t * step + step / 2);
    b.castShadow = b.receiveShadow = true;
    stand.add(b);
  }
  // Rückwand und Dach
  const back = new THREE.Mesh(new THREE.BoxGeometry(len, rise * tiers + 9, 1.5), concrete);
  back.position.set(0, (rise * tiers + 9) / 2, depth + 0.75);
  back.castShadow = true;
  stand.add(back);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(len + 6, 0.6, depth + 8), roofMat);
  roof.position.set(0, rise * tiers + 9, depth / 2 - 2);
  roof.rotation.x = -0.06;
  roof.castShadow = true;
  stand.add(roof);
  const colGeo = new THREE.CylinderGeometry(0.35, 0.35, rise * tiers + 9, 8);
  for (let x = -len / 2 + 10; x <= len / 2 - 10; x += 30) {
    const c = new THREE.Mesh(colGeo, concrete);
    c.position.set(x, (rise * tiers + 9) / 2, -0.5);
    c.castShadow = true;
    stand.add(c);
  }
  // Zuschauer: kleine Figuren aus Körper und Kopf auf jeder Stufe
  const bodyGeo = new THREE.BoxGeometry(0.45, 0.8, 0.3).translate(0, 0.4, 0);
  const headGeo = new THREE.SphereGeometry(0.13, 8, 6).translate(0, 0.98, 0);
  const perRow = 260, n = perRow * tiers;
  const bodies = new THREE.InstancedMesh(bodyGeo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), n);
  const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ color: 0xd9a77e, roughness: 0.8 }), n);
  const m = new THREE.Matrix4(), col = new THREE.Color();
  const palette = [0xc8102e, 0x1f4aa8, 0xf2c200, 0xffffff, 0x2b2b2b, 0x3a7d44, 0xe07a2e, 0x8e5bb5, 0xb0c4de];
  let k = 0;
  for (let t = 0; t < tiers; t++) for (let i = 0; i < perRow; i++) {
    const x = -len / 2 + 4 + (i + Math.random() * 0.5) * (len - 8) / perRow;
    m.makeTranslation(x, rise * (t + 1), t * step + step * 0.45);
    bodies.setMatrixAt(k, m);
    heads.setMatrixAt(k, m);
    bodies.setColorAt(k, col.setHex(palette[(Math.random() * palette.length) | 0]));
    k++;
  }
  stand.add(bodies, heads);
  group.add(stand);
}

// Startmaschine mit acht Boxen an der Startlinie (= Ziel, das Rennen über 1,5 Meilen ist genau eine Runde)
function buildGate(group, track) {
  const g = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({ color: 0x2f6b3f, roughness: 0.6 });
  const stalls = 8, w = 1.6, h = 3.4, deep = 3.6;
  // Boxenmitte liegt auf der Start-/Ziellinie: die Pferde stehen mittig darin
  const { pos, dir, nrm } = track.pointAt(track.finishS, 0);
  g.position.copy(pos);
  // x quer über die Bahn nach außen; die Türen sitzen auf der Seite, in die gelaufen wird
  g.quaternion.copy(basisQuat(nrm));
  const front = new THREE.Vector3().crossVectors(nrm, UP).dot(dir) > 0 ? 1 : -1;
  const doors = [];
  for (let i = 0; i <= stalls; i++) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.12, h, deep), green);
    wall.position.set(0.4 + i * w, h / 2, 0);
    wall.castShadow = true;
    g.add(wall);
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(stalls * w + 0.6, 0.5, deep), green);
  top.position.set(0.4 + stalls * w / 2, h + 0.25, 0);
  g.add(top);
  for (let i = 0; i < stalls; i++) {
    // zweiflügelige Fronttüren, öffnen sich beim Start
    for (const side of [0, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(0.4 + i * w + side * w, 0, front * deep / 2);
      const door = new THREE.Mesh(new THREE.BoxGeometry(w / 2 - 0.05, 1.8, 0.06), new THREE.MeshStandardMaterial({ color: 0xc9d2c4 }));
      door.position.set(side ? -w / 4 : w / 4, 1.4, 0);
      pivot.add(door);
      pivot.userData.side = side;
      g.add(pivot);
      doors.push(pivot);
    }
  }
  group.add(g);
  const home = g.position.clone();
  return {
    group: g,
    open(t) { for (const d of doors) d.rotation.y = (d.userData.side ? 1 : -1) * front * Math.min(1, t) * 1.6; },
    // nach dem Start wird die Maschine wie echt über die Außenkante von der Bahn gezogen
    clear(t) {
      const k = THREE.MathUtils.smoothstep(t, 6, 20);
      g.position.copy(home).addScaledVector(nrm, k * (track.width + 25));
      g.visible = k < 1;
    },
    laneOf: (post) => 0.4 + (post - 0.5) * w,
  };
}

// Anzeigetafel im Innenraum gegenüber dem Ziel, zeigt Rennzeit und Zwischenzeiten
function buildBoard(group, track) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 384;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const { pos, dir, nrm } = track.pointAt(track.finishS - 20, -60);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(24, 9), new THREE.MeshBasicMaterial({ map: tex }));
  board.position.copy(pos).setY(9);
  board.lookAt(board.position.clone().add(nrm));
  const frame = new THREE.Mesh(new THREE.BoxGeometry(25, 10, 0.6), new THREE.MeshStandardMaterial({ color: 0x1b2b22 }));
  frame.position.copy(board.position).addScaledVector(nrm, -0.35);
  frame.quaternion.copy(board.quaternion);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.5, 0.8), frame.material);
  for (const off of [-9, 9]) {
    const l = legs.clone();
    l.position.copy(board.position).addScaledVector(dir, off).setY(2.25);
    group.add(l);
  }
  group.add(frame, board);
  const g = c.getContext('2d');
  return {
    draw(lines) {
      g.fillStyle = '#0d1a12'; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#ffd23f'; g.font = 'bold 54px ui-monospace, Menlo, monospace';
      g.fillText('BELMONT PARK', 40, 72);
      g.fillStyle = '#f4f1ea'; g.font = 'bold 46px ui-monospace, Menlo, monospace';
      lines.forEach((l, i) => g.fillText(l, 40, 150 + i * 62));
      tex.needsUpdate = true;
    },
  };
}

// --------------------------------------------------------------- Modell ----

// Weg-Zeit-Kurve des Führenden aus den Zwischenzeiten. Tempoprofil statt reiner Interpolation:
// Start mit exponentieller Beschleunigung (τ = 2 s), danach je Abschnitt das Durchschnittstempo,
// Übergänge über 3 s geglättet. Anschließend wird jeder Abschnitt so skaliert, dass die offiziellen
// Zwischenzeiten exakt getroffen werden. (Eine monotone Interpolation mit v(0) = 0 überschoss auf 82 km/h.)
export function leaderModel(fractions) {
  const DT = 0.05, TAU = 2, SMOOTH = 3;
  const tEnd = fractions[fractions.length - 1].t, n = Math.ceil((tEnd + 60) / DT);
  const seg = (t) => { let i = 0; while (i < fractions.length - 2 && t >= fractions[i + 1].t) i++; return i; };
  const avg = fractions.slice(1).map((f, i) => (f.m - fractions[i].m) / (f.t - fractions[i].t));
  // erstes Abschnittstempo so, dass die Beschleunigungsphase die erste Teilstrecke genau ausfüllt
  const t1 = fractions[1].t;
  const v1 = fractions[1].m / (t1 - TAU * (1 - Math.exp(-t1 / TAU)));
  const raw = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const t = k * DT, i = seg(t);
    raw[k] = i === 0 ? v1 * (1 - Math.exp(-t / TAU)) : t > tEnd ? avg[avg.length - 1] : avg[i];
  }
  // gleitender Mittelwert, aber erst nach der Startphase
  const v = new Float32Array(n), w = Math.round(SMOOTH / DT / 2);
  for (let k = 0; k < n; k++) {
    if (k * DT < 6) { v[k] = raw[k]; continue; }
    let sum = 0, c = 0;
    for (let q = Math.max(0, k - w); q <= Math.min(n - 1, k + w); q++) { sum += raw[q]; c++; }
    v[k] = sum / c;
  }
  // Abschnittsweise auf die Zwischenzeiten skalieren (dreimal, die Glättung koppelt Nachbarn)
  for (let it = 0; it < 3; it++) {
    let d = 0, k = 0;
    for (let i = 0; i < fractions.length - 1; i++) {
      const k0 = k, d0 = d;
      while (k * DT < fractions[i + 1].t - 1e-9) { d += v[k] * DT; k++; }
      const f = (fractions[i + 1].m - fractions[i].m) / (d - d0);
      for (let q = k0; q < k; q++) v[q] *= f;
      d = d0; for (let q = k0; q < k; q++) d += v[q] * DT;
    }
  }
  const D = new Float32Array(n + 1);
  for (let k = 0; k < n; k++) D[k + 1] = D[k] + v[k] * DT;
  return (t) => {
    if (t <= 0) return { d: 0, v: 0 };
    const f = Math.min(n - 1, t / DT), k = Math.floor(f), r = f - k;
    return { d: D[k] + v[k] * r * DT, v: v[k] };
  };
}

// Rückstand eines Pferdes (Meter) abhängig von der Strecke des Führenden
export function behindModel(fractions, behindLengths) {
  const d = fractions.map((f) => f.m);
  return (lead) => {
    if (lead >= d[d.length - 1]) return behindLengths[behindLengths.length - 1] * LENGTH_M;
    let i = 0;
    while (lead > d[i + 1]) i++;
    const s = (lead - d[i]) / (d[i + 1] - d[i]);
    return (behindLengths[i] + (behindLengths[i + 1] - behindLengths[i]) * s) * LENGTH_M;
  };
}
