// Live generative "pigment" painting, rendered with a WebGL fragment shader.
// Domain-warped noise gives fluid marbling; pigments pool at their edges like
// watercolour; paper grain sits on top. The cursor stirs the paint.

export type Palette = { name: string; paper: string; colors: [string, string, string, string] };

export const palettes: Record<string, Palette> = {
  ultramarine: { name: 'Ultramarine', paper: '#eee7da', colors: ['#1f3bb3', '#e2412b', '#f0b429', '#141116'] },
  rothko: { name: 'Rothko', paper: '#ecdfcc', colors: ['#7a1c1c', '#d9541e', '#f2a33a', '#2a0f12'] },
  monet: { name: 'Monet', paper: '#f1ece4', colors: ['#7f93d6', '#e9a6a1', '#93bb96', '#33436b'] },
  sumi: { name: 'Sumi', paper: '#ece8e1', colors: ['#1a1a1a', '#6b6b6b', '#c8102e', '#0b0b0b'] },
};

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uStir;
uniform float uSeed;
uniform float uScale;
uniform vec3 uPaper, uC1, uC2, uC3, uC4;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 6; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  float s = min(uRes.x, uRes.y);
  vec2 p = (frag - 0.5 * uRes) / s;

  // Stir: rotate the paint around the cursor.
  vec2 m = (uMouse - 0.5 * uRes) / s;
  vec2 d = p - m;
  float ang = uStir * exp(-dot(d, d) * 5.0);
  p = m + mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * d;

  p *= uScale;
  float t = uTime * 0.035;
  vec2 q = vec2(fbm(p + vec2(0.0, t) + uSeed), fbm(p + vec2(5.2, 1.3) - t + uSeed));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 1.3), fbm(p + 3.0 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 3.5 * r);

  // Layer pigments over the paper.
  vec3 col = uPaper;
  float a1 = smoothstep(0.50, 0.62, f) * 0.95;
  float a2 = smoothstep(0.66, 0.86, length(q) + 0.15 * r.y) * 0.85;
  float a3 = smoothstep(0.55, 0.66, r.x) * smoothstep(0.30, 0.50, q.y) * 0.95;
  float a4 = smoothstep(0.70, 0.77, f) * 0.92;
  // Thin veins of pigment where washes meet.
  float vein = smoothstep(0.035, 0.0, abs(f - 0.5)) * 0.55;
  col = mix(col, uC1, a1);
  col = mix(col, uC2, a2);
  col = mix(col, uC3, a3);
  col = mix(col, uC4, a4);
  col = mix(col, uC4, vein * (1.0 - a4));

  // Pigment pools at the edges of each wash (watercolour darkening).
  float edge = fwidth(a1) + fwidth(a3) + fwidth(a4);
  col *= 1.0 - clamp(edge * 2.2, 0.0, 0.22);

  // Granulation and paper fibre.
  float gran = noise(frag * 0.7);
  col *= 0.95 + 0.05 * gran;
  float fibre = fbm(frag * vec2(0.012, 0.05));
  col = mix(col, col * 0.9, fibre * 0.25);

  gl_FragColor = vec4(col, 1.0);
}`;

type Painting = {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  u: Record<string, WebGLUniformLocation | null>;
  visible: boolean;
  mouse: [number, number];
  target: [number, number];
  stir: number;
  colors: number[][];
  goal: number[][];
  shift: number;
  t0: number;
};

const paintings: Painting[] = [];
let current = 'ultramarine';
let animating = false;

const paletteColors = (key: string, shift = 0) => {
  const p = palettes[key] ?? palettes.ultramarine;
  const cs = [...p.colors];
  for (let i = 0; i < shift; i++) cs.push(cs.shift()!);
  return [hex(p.paper), ...cs.map(hex)];
};

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader');
  return sh;
}

function create(canvas: HTMLCanvasElement): Painting | null {
  const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return null;
  try {
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const names = ['uRes', 'uTime', 'uMouse', 'uStir', 'uSeed', 'uScale', 'uPaper', 'uC1', 'uC2', 'uC3', 'uC4'];
    const u = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(prog, n)]));
    const shift = Number(canvas.dataset.shift ?? 0);
    const colors = paletteColors(current, shift);
    gl.uniform1f(u.uSeed, Number(canvas.dataset.seed ?? 0));
    gl.uniform1f(u.uScale, Number(canvas.dataset.scale ?? 1.4));
    return {
      canvas,
      gl,
      u,
      visible: false,
      mouse: [0, 0],
      target: [0, 0],
      stir: 0,
      colors,
      goal: colors.map((c) => [...c]),
      shift,
      t0: Math.random() * 1000,
    };
  } catch {
    return null;
  }
}

function resize(p: Painting) {
  const quality = Number(p.canvas.dataset.quality ?? 0.5);
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = Math.max(1, Math.round(p.canvas.clientWidth * dpr * quality));
  const h = Math.max(1, Math.round(p.canvas.clientHeight * dpr * quality));
  if (p.canvas.width !== w || p.canvas.height !== h) {
    p.canvas.width = w;
    p.canvas.height = h;
    p.gl.viewport(0, 0, w, h);
    if (!p.target[0]) p.mouse = p.target = [w * 0.62, h * 0.5];
  }
}

function draw(p: Painting, now: number) {
  const { gl, u } = p;
  resize(p);
  // Ease toward the target palette and cursor.
  for (let i = 0; i < 5; i++) for (let k = 0; k < 3; k++) p.colors[i][k] += (p.goal[i][k] - p.colors[i][k]) * 0.06;
  p.mouse[0] += (p.target[0] - p.mouse[0]) * 0.08;
  p.mouse[1] += (p.target[1] - p.mouse[1]) * 0.08;
  p.stir *= 0.96;
  gl.uniform2f(u.uRes, p.canvas.width, p.canvas.height);
  gl.uniform1f(u.uTime, p.t0 + now / 1000);
  gl.uniform2f(u.uMouse, p.mouse[0], p.mouse[1]);
  gl.uniform1f(u.uStir, 0.6 + p.stir);
  gl.uniform3fv(u.uPaper, p.colors[0]);
  gl.uniform3fv(u.uC1, p.colors[1]);
  gl.uniform3fv(u.uC2, p.colors[2]);
  gl.uniform3fv(u.uC3, p.colors[3]);
  gl.uniform3fv(u.uC4, p.colors[4]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

export function setPalette(key: string) {
  if (!palettes[key]) return;
  current = key;
  for (const p of paintings) {
    p.goal = paletteColors(key, p.shift);
    if (!animating) {
      p.colors = p.goal.map((c) => [...c]);
      draw(p, 0);
    }
  }
  const pal = palettes[key];
  const root = document.documentElement.style;
  root.setProperty('--p1', pal.colors[0]);
  root.setProperty('--p2', pal.colors[1]);
  root.setProperty('--p3', pal.colors[2]);
  root.setProperty('--p4', pal.colors[3]);
  document.querySelectorAll<HTMLElement>('[data-palette-set]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.paletteSet === key));
  });
  try {
    localStorage.setItem('palette', key);
  } catch {}
}

export function initPaint() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    const saved = localStorage.getItem('palette');
    if (saved && palettes[saved]) current = saved;
  } catch {}
  setPalette(current);

  document.querySelectorAll<HTMLCanvasElement>('canvas[data-paint]').forEach((canvas) => {
    const p = create(canvas);
    if (!p) {
      canvas.closest('[data-paint-wrap]')?.classList.add('paint-fallback');
      return;
    }
    paintings.push(p);
    new IntersectionObserver(([e]) => (p.visible = e.isIntersecting), { rootMargin: '100px' }).observe(canvas);

    if (canvas.dataset.interactive !== undefined) {
      const host = canvas.closest('section') ?? canvas;
      let lx = 0,
        ly = 0;
      host.addEventListener('pointermove', (ev) => {
        const e = ev as PointerEvent;
        const r = canvas.getBoundingClientRect();
        const sx = canvas.width / r.width;
        const x = (e.clientX - r.left) * sx;
        const y = (r.bottom - e.clientY) * sx;
        const speed = Math.hypot(e.clientX - lx, e.clientY - ly);
        lx = e.clientX;
        ly = e.clientY;
        p.target = [x, y];
        p.stir = Math.min(p.stir + speed * 0.004, 2.2);
      });
      host.addEventListener('pointerdown', () => (p.stir = Math.min(p.stir + 1.4, 3)));
    }
  });

  document.querySelectorAll<HTMLElement>('[data-palette-set]').forEach((b) =>
    b.addEventListener('click', () => setPalette(b.dataset.paletteSet!)),
  );

  if (reduce) {
    // One still frame per painting.
    paintings.forEach((p) => draw(p, 0));
    return;
  }
  animating = true;
  const loop = (now: number) => {
    for (const p of paintings) if (p.visible) draw(p, now);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
