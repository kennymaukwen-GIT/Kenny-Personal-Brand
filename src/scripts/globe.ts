// Scroll-driven particle film for the hero.
// One point cloud morphs: scattered cloud → sphere with orbit rings → "SEEN." →
// "FOUND." → "USED." → explodes outward. The page drives it with setProgress().
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';

const VERT = /* glsl */ `
uniform float uTime;
uniform float uIntro;    // 0→1 assembling from the cloud on load
uniform float uMorph;    // 0..6: sphere → word1 → … → word6
uniform float uExplode;  // 0→1 at the end of the hero
uniform float uSpin;
uniform float uPixel;
attribute vec3 aStart;
attribute vec3 aS1;
attribute vec3 aS2;
attribute vec3 aS3;
attribute vec3 aS4;
attribute vec3 aS5;
attribute vec3 aS6;
attribute float aRand;
varying float vAlpha;
varying float vTint;

float ease(float t){ return t < 0.5 ? 4.0*t*t*t : 1.0 - pow(-2.0*t + 2.0, 3.0) / 2.0; }
float stagger(float m){ return ease(clamp((m - aRand * 0.35) / 0.65, 0.0, 1.0)); }

vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }

void main(){
  // The sphere spins; words stay facing the camera.
  vec3 sphere = rotY(position, uSpin);

  float m1 = stagger(clamp(uMorph, 0.0, 1.0));
  float m2 = stagger(clamp(uMorph - 1.0, 0.0, 1.0));
  float m3 = stagger(clamp(uMorph - 2.0, 0.0, 1.0));
  float m4 = stagger(clamp(uMorph - 3.0, 0.0, 1.0));
  float m5 = stagger(clamp(uMorph - 4.0, 0.0, 1.0));
  float m6 = stagger(clamp(uMorph - 5.0, 0.0, 1.0));
  vec3 p = mix(sphere, aS1, m1);
  p = mix(p, aS2, m2);
  p = mix(p, aS3, m3);
  p = mix(p, aS4, m4);
  p = mix(p, aS5, m5);
  p = mix(p, aS6, m6);

  // Particles swoop along an arc while travelling between shapes.
  float pi = 3.14159;
  float travel = sin(m1*pi) + sin(m2*pi) + sin(m3*pi) + sin(m4*pi) + sin(m5*pi) + sin(m6*pi);
  p += normalize(aStart) * travel * (0.35 + aRand * 0.6);

  // Assemble from the scattered cloud on load.
  float intro = ease(clamp((uIntro - aRand * 0.4) / 0.6, 0.0, 1.0));
  p = mix(aStart, p, intro);

  // Breathing and the final explosion.
  p += normalize(p + 0.0001) * sin(uTime * 1.4 + aRand * 40.0) * 0.012;
  p += normalize(aStart) * uExplode * (3.0 + aRand * 6.0);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float twinkle = 0.6 + 0.4 * sin(uTime * 2.2 + aRand * 80.0);
  gl_PointSize = (2.2 + aRand * 2.6) * twinkle * uPixel * (5.0 / -mv.z);
  float facing = smoothstep(-2.6, 0.4, mv.z + 4.6);
  float inWord = clamp(uMorph, 0.0, 1.0);
  vAlpha = mix(0.35 + 0.65 * facing, 1.0, inWord) * (0.4 + 0.6 * intro) * (1.0 - uExplode);
  vTint = aRand;
}`;

const FRAG = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
varying float vAlpha;
varying float vTint;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  vec3 col = mix(uColorA, uColorB, step(0.8, vTint));
  gl_FragColor = vec4(col, a * vAlpha);
}`;

/** Sample `count` points from the filled pixels of a word. */
function sampleWord(word: string, count: number, width: number) {
  const W = 1200,
    H = 320;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = 260;
  g.font = `600 ${size}px Geist, Inter, system-ui, sans-serif`;
  while (g.measureText(word).width > W * 0.92 && size > 40) {
    size -= 10;
    g.font = `600 ${size}px Geist, Inter, system-ui, sans-serif`;
  }
  g.fillText(word, W / 2, H / 2);
  const data = g.getImageData(0, 0, W, H).data;
  const pts: number[][] = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
    }
  }
  const out = new Float32Array(count * 3);
  const scale = width / W;
  for (let i = 0; i < count; i++) {
    const [x, y] = pts[Math.floor(Math.random() * pts.length)] ?? [W / 2, H / 2];
    out[i * 3] = (x - W / 2 + (Math.random() - 0.5) * 2) * scale;
    out[i * 3 + 1] = -(y - H / 2 + (Math.random() - 0.5) * 2) * scale;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
  }
  return out;
}

export type GlobeController = {
  /** 0 → 1 across the pinned hero. */
  setProgress(p: number): void;
  count: number;
};

const DEFAULT_WORDS = ['WEBSITES', 'APPS', 'FILMS', 'SOFTWARE', 'AGENTS', 'ANYTHING.'];

export function initGlobe(canvas: HTMLCanvasElement, words: string[] = DEFAULT_WORDS): GlobeController | null {
  if (!words.length) words = DEFAULT_WORDS;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.innerWidth < 760;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch {
    canvas.remove();
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  const nSphere = small ? 3600 : 6400;
  const nRing = small ? 500 : 900;
  const total = nSphere + nRing * 2;
  const pos = new Float32Array(total * 3);
  const start = new Float32Array(total * 3);
  const rand = new Float32Array(total);
  const R = 1.55;
  const golden = Math.PI * (3 - Math.sqrt(5));

  let i = 0;
  for (let k = 0; k < nSphere; k++, i++) {
    const y = 1 - (k / (nSphere - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * k;
    pos.set([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R], i * 3);
  }
  const ring = (radius: number, tiltX: number, tiltZ: number) => {
    for (let k = 0; k < nRing; k++, i++) {
      const a = (k / nRing) * Math.PI * 2;
      const rr = radius + (Math.random() - 0.5) * 0.04;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr;
      const y1 = -z * Math.sin(tiltX);
      const z1 = z * Math.cos(tiltX);
      pos.set([x * Math.cos(tiltZ) - y1 * Math.sin(tiltZ), x * Math.sin(tiltZ) + y1 * Math.cos(tiltZ), z1], i * 3);
    }
  };
  ring(2.25, 1.2, 0.35);
  ring(2.6, 1.35, -0.5);

  for (let k = 0; k < total; k++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.acos(2 * Math.random() - 1);
    const d = 3 + Math.random() * 7;
    start.set([Math.sin(v) * Math.cos(u) * d, Math.sin(v) * Math.sin(u) * d, Math.cos(v) * d], k * 3);
    rand[k] = Math.random();
  }

  const wordWidth = small ? 3.0 : 5.2;
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('aStart', new Float32BufferAttribute(start, 3));
  geo.setAttribute('aRand', new Float32BufferAttribute(rand, 1));
  // Six word shapes; missing words fall back to the last one.
  for (let w = 0; w < 6; w++) {
    const word = words[Math.min(w, words.length - 1)];
    geo.setAttribute(`aS${w + 1}`, new Float32BufferAttribute(sampleWord(word, total, wordWidth), 3));
  }

  const mat = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uIntro: { value: reduce ? 1 : 0 },
      uMorph: { value: 0 },
      uExplode: { value: 0 },
      uSpin: { value: 0 },
      uPixel: { value: renderer.getPixelRatio() },
      uColorA: { value: new Color('#ffffff') },
      uColorB: { value: new Color('#7c6cff') },
    },
  });

  const group = new Group();
  group.add(new Points(geo, mat));
  scene.add(group);

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  let mx = 0,
    my = 0,
    tx = 0,
    ty = 0;
  window.addEventListener(
    'pointermove',
    (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true },
  );

  // Scroll progress → morph targets (eased toward, so jumps feel smooth).
  let target = 0;
  let prog = 0;
  const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
  const map = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  const t0 = performance.now();
  const render = (now: number) => {
    const t = (now - t0) / 1000;
    prog += (target - prog) * 0.08;
    const u = mat.uniforms;
    u.uTime.value = t;
    if (!reduce) u.uIntro.value = Math.min(t / 2.6, 1);
    // Sphere first, then one word per slot, explode at the end.
    let morph = 0;
    for (let w = 0; w < 6; w++) {
      const start = 0.08 + w * 0.133;
      morph += map(prog, start, start + 0.07);
    }
    u.uMorph.value = morph;
    u.uExplode.value = map(prog, 0.88, 1);
    u.uSpin.value = reduce ? 0 : t * 0.12;
    // The sphere sits on the right, words move to the centre.
    const centre = map(prog, 0.06, 0.22);
    group.position.x = small ? 0 : 1.35 * (1 - centre);
    tx += (mx - tx) * 0.05;
    ty += (my - ty) * 0.05;
    group.rotation.y = tx * 0.22;
    group.rotation.x = 0.18 * (1 - centre) + ty * 0.12;
    renderer.render(scene, camera);
  };

  if (reduce) {
    render(t0 + 3000);
  } else {
    const loop = (now: number) => {
      if (visible) render(now);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  return {
    count: total,
    setProgress(p: number) {
      target = p;
      if (reduce) {
        prog = p;
        render(performance.now());
      }
    },
  };
}
