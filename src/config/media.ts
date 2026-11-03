// Video library generated with Higgsfield (Seedance 2.5).
// Served from Higgsfield's CDN. 1080p: convergence, skywhale, chrome, koi, concept, monolith.
// The rest are 480p drafts (expire ~7 days after 2026-11-02) — finalize or replace them.
// For production, consider self-hosting compressed copies in /public/media.

const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_37rqmscBmkIXk1oc6RKnNRalhAb';

export type Clip = {
  id: string;
  src: string;
  title: { en: string; 'zh-tw': string };
  genre: { en: string; 'zh-tw': string };
};

const clip = (id: string, file: string, title: Clip['title'], genre: Clip['genre']): Clip => ({
  id,
  src: `${CDN}/${file}.mp4`,
  title,
  genre,
});

export const clips = {
  convergence: clip(
    'convergence',
    'hf_20261102_193050_53bb35da-88e8-435e-9335-9d3aa9f291d2',
    { en: 'Convergence', 'zh-tw': '收斂' },
    { en: 'Tech', 'zh-tw': '科技' },
  ),
  orbital: clip(
    'orbital',
    'hf_20261102_173555_c75ae6d5-1949-498e-8117-0c3bb0068d60',
    { en: 'Orbital', 'zh-tw': '軌道' },
    { en: 'Sci-fi', 'zh-tw': '科幻' },
  ),
  skywhale: clip(
    'skywhale',
    'hf_20261102_193049_12f526da-8b1b-40df-ae85-89837b504243',
    { en: 'Night Whale', 'zh-tw': '夜鯨' },
    { en: 'Surreal', 'zh-tw': '超現實' },
  ),
  chrome: clip(
    'chrome',
    'hf_20261102_193051_f88403b0-1ec7-494d-8eb3-3d342bcd01ca',
    { en: 'Liquid Chrome', 'zh-tw': '液態鉻' },
    { en: 'Art', 'zh-tw': '藝術' },
  ),
  network: clip(
    'network',
    'hf_20261102_173555_8f43937d-3c78-49e9-b825-b5400182a453',
    { en: 'Signal City', 'zh-tw': '訊號之城' },
    { en: 'Tech', 'zh-tw': '科技' },
  ),
  koi: clip(
    'koi',
    'hf_20261102_193050_698e29c5-86e9-4137-b592-8c89c7b9ac5e',
    { en: 'Neon Koi', 'zh-tw': '霓虹錦鯉' },
    { en: 'Cyberpunk', 'zh-tw': '賽博龐克' },
  ),
  door: clip(
    'door',
    'hf_20261102_173555_4814c86c-fe41-4111-b739-8eb0b6402d12',
    { en: 'The Door', 'zh-tw': '門' },
    { en: 'Surreal', 'zh-tw': '超現實' },
  ),
  orrery: clip(
    'orrery',
    'hf_20261102_173555_3c1a7fbc-a86f-44fe-9ffe-423569689599',
    { en: 'Orrery', 'zh-tw': '天體鐘' },
    { en: 'Tech', 'zh-tw': '科技' },
  ),
  inkwash: clip(
    'inkwash',
    'hf_20261102_173732_17c49442-ea56-4d4d-86d7-83fc203d4823',
    { en: 'Ink & Water', 'zh-tw': '水墨' },
    { en: 'Eastern Art', 'zh-tw': '東方藝術' },
  ),
  concept: clip(
    'concept',
    'hf_20261102_193050_736f2d67-7c89-4782-bc88-b7117cf8c998',
    { en: 'Concept Car', 'zh-tw': '概念跑車' },
    { en: 'Commercial', 'zh-tw': '商業廣告' },
  ),
  butterflies: clip(
    'butterflies',
    'hf_20261102_173555_0634c0ca-a784-4604-872f-b0a0b4d22bbf',
    { en: 'Metamorphosis', 'zh-tw': '蛻變' },
    { en: 'Fashion', 'zh-tw': '時尚' },
  ),
  monolith: clip(
    'monolith',
    'hf_20261102_193050_a6e20950-843b-48a2-9c1c-61a845377607',
    { en: 'Monolith', 'zh-tw': '巨碑' },
    { en: 'Sci-fi', 'zh-tw': '科幻' },
  ),
} satisfies Record<string, Clip>;

export const heroClip = clips.chrome;

// Order shown in the portfolio reel.
export const reel: Clip[] = [
  clips.skywhale,
  clips.koi,
  clips.orbital,
  clips.butterflies,
  clips.concept,
  clips.inkwash,
  clips.door,
  clips.chrome,
  clips.monolith,
  clips.orrery,
  clips.network,
  clips.convergence,
];
