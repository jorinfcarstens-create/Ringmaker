// 3D-Bühne: zeigt einen oder mehrere Ringe, drehbar per Finger.
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { buildRing, normalize, ringExtents, EXTENT_STEPS } from './ring.js';
import { MATERIALS, FINISHES } from './catalog.js';
import { textMaps } from './text.js';
import { gemGeometry, gemMaterial } from './gems.js';

// ----------------------------------------------------- Studio-Umgebung
// Ein helles Lichtzelt mit dunklen Akzenten – so wirkt poliertes Metall
// plastisch statt flach.
function buildStudio() {
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(20, 12, 20), new THREE.MeshBasicMaterial({ color: 0x8e9096, side: THREE.BackSide })));
  const panel = (w, h, color, intensity, pos, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos); m.rotation.set(...rot);
    scene.add(m);
  };
  panel(13, 13, 0xffffff, 5.5, [0, 5.9, 0], [Math.PI / 2, 0, 0]);       // Decke
  panel(20, 20, 0x2b2c33, 1, [0, -5.9, 0], [-Math.PI / 2, 0, 0]);        // Boden
  panel(6, 9, 0xfff3e2, 7, [-9.5, 1, 3], [0, Math.PI / 2, 0]);           // Softbox links (warm)
  panel(5, 8, 0xeaf3ff, 5, [9.5, 0.5, -2], [0, -Math.PI / 2, 0]);        // Softbox rechts (kühl)
  panel(9, 5, 0xffffff, 6, [1, 2, 9.6], [0, Math.PI, 0]);                // hinter der Kamera
  panel(2.2, 12, 0x050606, 1, [-5, 0, -9.6], [0, 0, 0]);                 // dunkle Streifen
  panel(2.2, 12, 0x050606, 1, [4, 0, -9.6], [0, 0, 0]);
  panel(1.6, 12, 0x050606, 1, [9.6, 0, 5], [0, -Math.PI / 2, 0]);
  panel(1.6, 12, 0x050606, 1, [-9.6, 0, -4.5], [0, Math.PI / 2, 0]);
  panel(20, 1.2, 0x050606, 1, [0, -2.2, -9.5], [0, 0, 0]);
  return scene;
}

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.2)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// Der Hintergrund wird mitgerendert (undurchsichtige Zeichenfläche ist
// auf dem Handy deutlich schneller als eine durchscheinende).
function backdropTexture(el) {
  const cs = getComputedStyle(el);
  const a = cs.getPropertyValue('--stage-a').trim() || '#333a66', b = cs.getPropertyValue('--stage-b').trim() || '#090b15';
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = b; g.fillRect(0, 0, 256, 256);
  g.translate(128, 92); g.scale(1.2, 0.9);
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, 256);
  grad.addColorStop(0, a); grad.addColorStop(0.76, b);
  g.fillStyle = grad; g.fillRect(-256, -256, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeMaterial(p, twoTone = false) {
  const m = MATERIALS[p.material] || MATERIALS.gold;
  const f = FINISHES[p.finish] || FINISHES.polished;
  const opacity = Math.min(p.opacity ?? 1, m.opacity ?? 1);
  return new THREE.MeshPhysicalMaterial({
    color: twoTone ? 0xffffff : m.color,
    vertexColors: twoTone,
    metalness: m.metal,
    roughness: Math.min(1, Math.max(m.rough ?? 0, f.rough)),
    clearcoat: m.metal ? 0 : 0.6,
    envMapIntensity: m.env ?? 1,
    transparent: opacity < 0.999,
    opacity,
    side: opacity < 0.999 ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: opacity >= 0.999,
  });
}

// Ein Ring samt Steinen als fertiges Objekt
export function ringObject(params, quality) {
  const p = normalize(params);
  const built = buildRing(p, { quality, maps: textMaps(p) });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(built.positions, 3));
  geo.setIndex(new THREE.BufferAttribute(built.indices, 1));
  if (built.zone) { // Zweitmetall als Farbe je Eckpunkt
    const c1 = new THREE.Color((MATERIALS[p.material] || MATERIALS.gold).color);
    const c2 = new THREE.Color((MATERIALS[p.material2] || MATERIALS.silver).color);
    const col = new Float32Array(built.zone.length * 3);
    for (let i = 0; i < built.zone.length; i++) {
      const c = built.zone[i] ? c2 : c1;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, makeMaterial(p, !!built.zone));
  for (const e of built.extras) { // Fassungen: eigene Körper mit klaren Kanten
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(e.positions, 3));
    g.setIndex(new THREE.BufferAttribute(e.indices, 1));
    g.computeVertexNormals();
    mesh.add(new THREE.Mesh(g, built.zone ? makeMaterial(p, false) : mesh.material));
  }
  for (const st of built.stones) {
    const gem = new THREE.Mesh(gemGeometry(p.stoneShape, st.hu, st.hv, p.stoneTurn, p.stoneCut), gemMaterial(p.stoneColor, p.stoneCut));
    gem.position.set(...st.pos);
    gem.rotation.z = -st.a; // „oben“ des Steins zeigt vom Finger weg
    gem.userData.shared = true;
    mesh.add(gem);
  }
  return { mesh, built, p };
}

// Abstand, den Ring B hinter Ring A braucht, damit beide sich berühren,
// aber nicht durchdringen (V- und Wellenringe schmiegen sich ineinander).
function nestOffset(a, b) {
  let m = -Infinity;
  for (let k = 0; k < EXTENT_STEPS; k++) if (a.hi[k] > -1e9 && b.lo[k] < 1e9) m = Math.max(m, a.hi[k] - b.lo[k]);
  return m > -1e9 ? m : 0;
}

export class Viewer {
  constructor(container) {
    this.container = container;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    container.prepend(r.domElement);

    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    this.env = this.scene.environment = pm.fromScene(buildStudio(), 0.035).texture;
    pm.dispose();
    this.refreshBackdrop();

    this.camera = new THREE.PerspectiveCamera(30, 1, 1, 2000);
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadow);

    this.finger = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 48, 1),
      new THREE.MeshStandardMaterial({ color: 0x1b1d26, roughness: 1, metalness: 0, envMapIntensity: 0.3 }));
    this.finger.rotation.x = Math.PI / 2;
    this.finger.visible = false;
    this.scene.add(this.finger);

    const c = this.controls = new OrbitControls(this.camera, r.domElement);
    c.enablePan = false; c.enableDamping = true; c.dampingFactor = 0.12;
    c.rotateSpeed = 0.9; c.autoRotateSpeed = 1.6;
    c.addEventListener('start', () => { c.autoRotate = false; this.onUserStart && this.onUserStart(); this.wake(); });
    c.addEventListener('change', () => this.wake());

    this.meshes = [];
    this.radius = 15;
    this.insetTop = 0; this.insetBottom = 0;
    this._frames = 0;
    this._loop = this._loop.bind(this);
    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    this.resetCamera();
  }

  refreshBackdrop() {
    if (this.scene.background) this.scene.background.dispose();
    this.scene.background = backdropTexture(this.container);
    if (this.controls) this.wake(2);
  }

  // Bereiche oben/unten, die von Bedienelementen belegt sind (in Pixeln).
  // Der Ring wird im freien Bereich dazwischen eingepasst und zentriert.
  setInsets(top, bottom) {
    if (Math.abs(top - this.insetTop) < 1 && Math.abs(bottom - this.insetBottom) < 1) return;
    this.insetTop = top; this.insetBottom = bottom;
    this.resize();
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + 'px';
    this.renderer.domElement.style.height = h + 'px';
    this._w = w; this._h = h;
    this.camera.aspect = w / h;
    const shift = (this.insetTop - this.insetBottom) / 2;
    if (Math.abs(shift) > 0.5) this.camera.setViewOffset(w, h, 0, -shift, w, h); else this.camera.clearViewOffset();
    const dist0 = this._dist;
    this._fit();
    if (dist0 && this.camera.position.lengthSq() > 0) this.camera.position.setLength(this.camera.position.length() * this._dist / dist0);
    this.wake();
  }

  wake(frames = 20) {
    this._frames = Math.max(this._frames, frames);
    if (!this._raf) this._raf = requestAnimationFrame(this._loop);
  }

  _loop() {
    this._raf = 0;
    if (!this.container.clientWidth) return; // ausgeblendet
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    if (this.controls.autoRotate || --this._frames > 0) this._raf = requestAnimationFrame(this._loop);
  }

  setAutoRotate(on) { this.controls.autoRotate = on; this.wake(); }

  _fit() {
    const h = this._h || 1, w = this._w || 1;
    const free = Math.max(0.35, (h - this.insetTop - this.insetBottom) / h);
    const fov = this.camera.fov * Math.PI / 180;
    const vHalf = Math.atan(Math.tan(fov / 2) * free);              // halber Winkel des freien Bereichs
    const hHalf = Math.atan(Math.tan(fov / 2) * (w / h));
    const dist = this.radius / Math.sin(Math.min(vHalf, hHalf)) * 1.06;
    this.controls.minDistance = dist * 0.35;
    this.controls.maxDistance = dist * 2.2;
    this._dist = dist;
    this.camera.updateProjectionMatrix();
  }

  resetCamera(dir = [0.55, 0.42, 1]) {
    this._fit();
    this.camera.position.copy(new THREE.Vector3(...dir).normalize().multiplyScalar(this._dist));
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.wake();
  }

  _dispose(m) {
    m.traverse((o) => { if (o.isMesh && !o.userData.shared) { o.geometry.dispose(); o.material.dispose(); } });
  }
  _clear() {
    for (const m of this.meshes) { this.group.remove(m); this._dispose(m); }
    this.meshes = [];
  }

  _frameScene(refit) {
    const box = new THREE.Box3().setFromObject(this.group);
    const newR = Math.max(8, box.getBoundingSphere(new THREE.Sphere()).radius);
    this.shadow.position.set(0, box.min.y - 1.2, (box.min.z + box.max.z) / 2);
    this.shadow.scale.set((box.max.x - box.min.x) * 1.5, (box.max.z - box.min.z) * 1.4 + 14, 1);
    if (refit || Math.abs(newR - this.radius) / this.radius > 0.18) {
      const ratio = this.camera.position.length() / (this._dist || 1);
      this.radius = newR;
      this._fit();
      this.camera.position.setLength(this._dist * (refit ? 1 : ratio));
    }
    this.wake();
  }

  // Ein einzelner Ring (Werkbank). Liefert die Kennzahlen zurück.
  // quality 'light' während des Ziehens an Reglern, sonst 'preview'.
  setRing(params, { refit = false, quality = 'preview' } = {}) {
    const { mesh, built } = ringObject(params, quality);
    this._clear();
    this.group.add(mesh); this.meshes.push(mesh);
    this.finger.visible = false;
    this.shadow.visible = true;
    this._frameScene(refit);
    return { ...built.stats, stones: built.stones };
  }

  // Mehrere Ringe: 'stack' = auf einem Stab, 'row' = nebeneinander.
  setRings(list, { mode = 'stack', finger = false } = {}) {
    this._clear();
    if (!list.length) { this.finger.visible = false; this.shadow.visible = false; this.wake(); return { length: 0 }; }
    this.shadow.visible = true;
    let z = 0, x = 0, prev = null, first = 0, last = 0;
    list.forEach((params, i) => {
      const { mesh, built, p } = ringObject(params, list.length > 1 ? 'light' : 'preview');
      let ext = ringExtents(p);
      if (params._flip) {
        mesh.rotation.y = Math.PI;
        ext = { lo: ext.hi.map((v) => -v), hi: ext.lo.map((v) => -v), min: -ext.max, max: -ext.min };
      }
      const r = built.stats.outerDiameter / 2;
      if (mode === 'row') {
        x += i ? r + 3 : 0;
        mesh.position.set(x, r - 12, 0);
        x += r;
      } else {
        if (prev) z += nestOffset(prev, ext) + 0.05;
        mesh.position.z = z;
        prev = ext;
        if (i === 0) first = z + ext.min;
        last = z + ext.max;
      }
      this.group.add(mesh); this.meshes.push(mesh);
    });
    const box = new THREE.Box3().setFromObject(this.group);
    const c = box.getCenter(new THREE.Vector3());
    for (const m of this.meshes) { m.position.x -= c.x; m.position.z -= c.z; if (mode === 'row') m.position.y -= c.y; }
    this.finger.visible = finger && mode === 'stack';
    if (this.finger.visible) {
      const minIn = Math.min(...list.map((q) => normalize(q).size / (2 * Math.PI)));
      this.finger.scale.set(minIn * 0.985, last - first + 14, minIn * 0.985);
      this.finger.position.set(0, 0, 0);
    }
    this._frameScene(true);
    return { length: last - first };
  }

  // Vorschaubild mit fester Perspektive (für Galerie und Stilbuch).
  snapshot(params, size = 320) {
    const { mesh, built } = ringObject({ ...params, opacity: 1 }, 'preview');
    const scene = new THREE.Scene();
    scene.environment = this.env;
    scene.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh);
    const R = Math.max(box.getBoundingSphere(new THREE.Sphere()).radius * 0.86, built.stats.outerDiameter / 2 * 1.12);
    const sh = this.shadow.clone();
    sh.visible = true;
    sh.position.set(0, box.min.y - 1, 0);
    sh.scale.set(R * 3, R * 2.2, 1);
    scene.add(sh);
    const cam = new THREE.PerspectiveCamera(26, 1, 1, 1000);
    const mid = (box.max.y + box.min.y) / 2;
    cam.position.copy(new THREE.Vector3(0.62, 0.5, 1).normalize().multiplyScalar(R / Math.sin(13 * Math.PI / 180) * 1.02)).add(new THREE.Vector3(0, mid, 0));
    cam.lookAt(0, mid - R * 0.04, 0);
    const rt = new THREE.WebGLRenderTarget(size, size, { samples: 4, colorSpace: THREE.SRGBColorSpace });
    const r = this.renderer;
    r.setRenderTarget(rt);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(scene, cam);
    const buf = new Uint8Array(size * size * 4);
    r.readRenderTargetPixels(rt, 0, 0, size, size, buf);
    r.setRenderTarget(null);
    rt.dispose(); this._dispose(mesh);
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) img.data.set(buf.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
    ctx.putImageData(img, 0, 0);
    this.wake(2);
    return cv.toDataURL('image/png');
  }
}
