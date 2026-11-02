// Video library generated with Higgsfield (Seedance 2.5).
// These are 480p drafts served from Higgsfield's CDN. When the 1080p versions are
// finalized, replace `src` with the new URL or a self-hosted file in /public/media.

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
    'hf_20261102_173555_0809ec3a-e2b1-417b-bec4-4903ad254e65',
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
    'hf_20261102_173555_fa6d4609-6c84-49e6-85f1-ce5d9c0b973c',
    { en: 'Night Whale', 'zh-tw': '夜鯨' },
    { en: 'Surreal', 'zh-tw': '超現實' },
  ),
  chrome: clip(
    'chrome',
    'hf_20261102_173732_c4164a4e-58f0-4496-bd81-44eade6c61f3',
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
    'hf_20261102_173555_081b5a95-46d1-44ac-bf40-dab234377e2c',
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
    'hf_20261102_173555_2afc0938-0bc7-4fea-959f-1463715286b8',
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
    'hf_20261102_173556_5e71197a-2ec7-4822-befa-479a21781d4f',
    { en: 'Monolith', 'zh-tw': '巨碑' },
    { en: 'Sci-fi', 'zh-tw': '科幻' },
  ),
} satisfies Record<string, Clip>;

export const heroClip = clips.convergence;

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
