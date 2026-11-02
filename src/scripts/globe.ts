// Hero particle globe: thousands of points fly in from chaos and settle into a
// slowly rotating sphere with two orbit rings. Mouse tilts it; scrolling past
// the hero scatters and fades it.
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
uniform float uProgress;
uniform float uScroll;
uniform float uPixel;
attribute vec3 aStart;
attribute float aRand;
varying float vAlpha;
varying float vTint;

float ease(float t){ return 1.0 - pow(1.0 - t, 4.0); }

void main(){
  float delay = aRand * 0.45;
  float t = ease(clamp((uProgress - delay) / 0.55, 0.0, 1.0));
  vec3 p = mix(aStart, position, t);
  // Gentle breathing once settled.
  p += normalize(position) * sin(uTime * 1.3 + aRand * 40.0) * 0.012 * t;
  // Scroll scatters outward.
  p *= 1.0 + uScroll * (0.6 + aRand * 0.8);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float twinkle = 0.65 + 0.35 * sin(uTime * 2.0 + aRand * 80.0);
  gl_PointSize = (2.2 + aRand * 2.6) * twinkle * uPixel * (5.0 / -mv.z);
  // Points on the far side of the sphere are dimmer.
  float facing = smoothstep(-2.6, 0.4, mv.z + 4.6);
  vAlpha = (0.35 + 0.65 * facing) * (0.45 + 0.55 * t) * (1.0 - uScroll) * 0.95;
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
  vec3 col = mix(uColorA, uColorB, step(0.82, vTint));
  gl_FragColor = vec4(col, a * vAlpha);
}`;

export function initGlobe(canvas: HTMLCanvasElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.innerWidth < 760;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch {
    canvas.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  // --- Particles: sphere (fibonacci) + two orbit rings ---
  const nSphere = small ? 3200 : 6400;
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
      const jitter = (Math.random() - 0.5) * 0.04;
      let x = Math.cos(a) * (radius + jitter);
      let y = 0;
      let z = Math.sin(a) * (radius + jitter);
      // tilt around X then Z
      const y1 = y * Math.cos(tiltX) - z * Math.sin(tiltX);
      const z1 = y * Math.sin(tiltX) + z * Math.cos(tiltX);
      const x2 = x * Math.cos(tiltZ) - y1 * Math.sin(tiltZ);
      const y2 = x * Math.sin(tiltZ) + y1 * Math.cos(tiltZ);
      pos.set([x2, y2, z1], i * 3);
    }
  };
  ring(2.25, 1.2, 0.35);
  ring(2.6, 1.35, -0.5);

  for (let k = 0; k < total; k++) {
    // Start scattered in a wide cloud.
    const u = Math.random() * Math.PI * 2;
    const v = Math.acos(2 * Math.random() - 1);
    const d = 3 + Math.random() * 7;
    start.set([Math.sin(v) * Math.cos(u) * d, Math.sin(v) * Math.sin(u) * d, Math.cos(v) * d], k * 3);
    rand[k] = Math.random();
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('aStart', new Float32BufferAttribute(start, 3));
  geo.setAttribute('aRand', new Float32BufferAttribute(rand, 1));

  const mat = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: reduce ? 1 : 0 },
      uScroll: { value: 0 },
      uPixel: { value: renderer.getPixelRatio() },
      uColorA: { value: new Color('#ffffff') },
      uColorB: { value: new Color('#7c6cff') },
    },
  });

  const group = new Group();
  group.add(new Points(geo, mat));
  group.rotation.set(0.35, 0, -0.12);
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

  // Mouse tilt
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

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  const hero = canvas.closest('section');
  const t0 = performance.now();
  const render = (now: number) => {
    const t = (now - t0) / 1000;
    mat.uniforms.uTime.value = t;
    if (!reduce) mat.uniforms.uProgress.value = Math.min(t / 2.8, 1);
    const hh = hero?.offsetHeight || window.innerHeight;
    mat.uniforms.uScroll.value = Math.min(Math.max(window.scrollY / hh, 0), 1);
    tx += (mx - tx) * 0.04;
    ty += (my - ty) * 0.04;
    group.rotation.y = (reduce ? 0 : t * 0.07) + tx * 0.25;
    group.rotation.x = 0.35 + ty * 0.15;
    renderer.render(scene, camera);
  };

  if (reduce) {
    render(t0 + 3000);
    return;
  }
  const loop = (now: number) => {
    if (visible) render(now);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
