// 3D-Bühne: zeigt einen oder mehrere Ringe, drehbar per Finger.
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { buildRing, normalize, ringExtents, EXTENT_STEPS } from './ring.js';
import { MATERIALS, FINISHES } from './catalog.js';
import { textMaps } from './text.js';

// ----------------------------------------------------- Studio-Umgebung
// Ein helles Lichtzelt mit dunklen Akzenten – so wirkt poliertes Metall
// plastisch statt flach.
function buildStudio() {
  const scene = new THREE.Scene();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(20, 12, 20),
    new THREE.MeshBasicMaterial({ color: 0x8d9391, side: THREE.BackSide }));
  scene.add(box);
  const panel = (w, h, color, intensity, pos, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos); m.rotation.set(...rot);
    scene.add(m);
  };
  panel(13, 13, 0xffffff, 5.5, [0, 5.9, 0], [Math.PI / 2, 0, 0]);       // Decke
  panel(20, 20, 0x2a2f2e, 1, [0, -5.9, 0], [-Math.PI / 2, 0, 0]);        // Boden
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

export function makeMaterial(p) {
  const m = MATERIALS[p.material] || MATERIALS.gold;
  const f = FINISHES[p.finish] || FINISHES.polished;
  const opacity = Math.min(p.opacity ?? 1, m.opacity ?? 1);
  return new THREE.MeshPhysicalMaterial({
    color: m.color,
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

export function ringGeometry(params, quality) {
  const p = normalize(params);
  const built = buildRing(p, { quality, maps: textMaps(p) });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(built.positions, 3));
  geo.setIndex(new THREE.BufferAttribute(built.indices, 1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return { geo, built };
}

// Abstand, den Ring B hinter Ring A braucht, damit beide sich berühren,
// aber nicht durchdringen (V- und Wellenringe schmiegen sich ineinander).
function nestOffset(a, b) {
  let m = -Infinity;
  for (let k = 0; k < EXTENT_STEPS; k++) m = Math.max(m, a.hi[k] - b.lo[k]);
  return m;
}

export class Viewer {
  constructor(container) {
    this.container = container;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    container.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(buildStudio(), 0.035).texture;
    pm.dispose();

    this.camera = new THREE.PerspectiveCamera(30, 1, 1, 2000);
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadow);

    this.finger = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 48, 1),
      new THREE.MeshStandardMaterial({ color: 0x24403a, roughness: 0.95, metalness: 0, envMapIntensity: 0.5 }));
    this.finger.rotation.x = Math.PI / 2;
    this.finger.visible = false;
    this.scene.add(this.finger);
    

    const c = this.controls = new OrbitControls(this.camera, r.domElement);
    c.enablePan = false; c.enableDamping = true; c.dampingFactor = 0.08;
    c.rotateSpeed = 0.9; c.autoRotateSpeed = 1.6;
    c.addEventListener('start', () => { c.autoRotate = false; this.wake(); });
    c.addEventListener('change', () => this.wake());

    this.meshes = [];
    this.radius = 15;
    this._frames = 0;
    this._loop = this._loop.bind(this);
    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    this.resetCamera();
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + 'px';
    this.renderer.domElement.style.height = h + 'px';
    this.camera.aspect = w / h;
    this._fit();
    this.wake();
  }

  wake(frames = 24) {
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
    const fov = this.camera.fov * Math.PI / 180;
    const hfov = 2 * Math.atan(Math.tan(fov / 2) * this.camera.aspect);
    const dist = this.radius / Math.sin(Math.min(fov, hfov) / 2) * 1.08;
    this.controls.minDistance = dist * 0.35;
    this.controls.maxDistance = dist * 2.2;
    this._dist = dist;
    this.camera.updateProjectionMatrix();
  }

  resetCamera(dir = [0.55, 0.42, 1]) {
    this._fit();
    const v = new THREE.Vector3(...dir).normalize().multiplyScalar(this._dist);
    this.camera.position.copy(v);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.wake();
  }

  _clear() {
    for (const m of this.meshes) { this.group.remove(m); m.geometry.dispose(); m.material.dispose(); }
    this.meshes = [];
  }

  _frameScene(refit) {
    const box = new THREE.Box3().setFromObject(this.group);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const newR = Math.max(8, sphere.radius);
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
  setRing(params, { refit = false } = {}) {
    const p = normalize(params);
    const { geo, built } = ringGeometry(p, 'preview');
    if (this.meshes.length === 1) {
      const m = this.meshes[0];
      m.geometry.dispose(); m.geometry = geo;
      m.material.dispose(); m.material = makeMaterial(p);
    } else {
      this._clear();
      const m = new THREE.Mesh(geo, makeMaterial(p));
      this.group.add(m); this.meshes.push(m);
    }
    this.meshes[0].position.set(0, 0, 0);
    this.finger.visible = false;
    this._frameScene(refit);
    return built.stats;
  }

  // Mehrere Ringe: 'stack' = auf einem Finger, 'row' = nebeneinander.
  setRings(list, { mode = 'stack', finger = false } = {}) {
    this._clear();
    if (!list.length) { this.finger.visible = false; this.shadow.visible = false; this.wake(); return { length: 0 }; }
    this.shadow.visible = true;
    let z = 0, x = 0, prev = null, first = 0, last = 0, maxIn = 0;
    list.forEach((params, i) => {
      const p = normalize(params);
      const { geo, built } = ringGeometry(p, list.length > 1 ? 'light' : 'preview');
      const mesh = new THREE.Mesh(geo, makeMaterial(p));
      let ext = ringExtents(p);
      if (params._flip) {
        mesh.rotation.y = Math.PI;
        ext = { lo: ext.hi.map((v) => -v), hi: ext.lo.map((v) => -v) };
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
        if (i === 0) first = z + Math.min(...ext.lo);
        last = z + Math.max(...ext.hi);
        maxIn = Math.max(maxIn, built.stats.innerDiameter / 2);
      }
      this.group.add(mesh); this.meshes.push(mesh);
    });
    // zentrieren
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
    const p = normalize({ ...params, opacity: 1 });
    const { geo, built } = ringGeometry(p, 'preview');
    const mesh = new THREE.Mesh(geo, makeMaterial(p));
    const scene = new THREE.Scene();
    scene.environment = this.scene.environment;
    scene.add(mesh);
    const R = Math.max(built.stats.outerDiameter / 2, built.stats.axialWidth / 2) * 1.12;
    const sh = this.shadow.clone();
    sh.position.set(0, -built.stats.outerDiameter / 2 - 1, 0);
    sh.scale.set(R * 3, R * 2.2, 1);
    scene.add(sh);
    const cam = new THREE.PerspectiveCamera(26, 1, 1, 1000);
    cam.position.copy(new THREE.Vector3(0.62, 0.5, 1).normalize().multiplyScalar(R / Math.sin(13 * Math.PI / 180) * 1.02));
    cam.lookAt(0, -R * 0.04, 0);
    const rt = new THREE.WebGLRenderTarget(size, size, { samples: 4, colorSpace: THREE.SRGBColorSpace });
    const r = this.renderer;
    r.setRenderTarget(rt);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(scene, cam);
    const buf = new Uint8Array(size * size * 4);
    r.readRenderTargetPixels(rt, 0, 0, size, size, buf);
    r.setRenderTarget(null);
    rt.dispose(); geo.dispose(); mesh.material.dispose();
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      img.data.set(buf.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
    }
    ctx.putImageData(img, 0, 0);
    this.wake(2);
    return cv.toDataURL('image/png');
  }
}
