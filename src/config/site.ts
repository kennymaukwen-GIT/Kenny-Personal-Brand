// One place to change the brand, links and contact details.
// Anything marked TODO is a placeholder until Kenny confirms it.

export const site = {
  // TODO: working name only. Swap once the studio name is final.
  name: 'Kairo Studio',
  shortName: 'Kairo',
  founder: 'Kenny',
  // TODO: replace with the real domain once it is bought.
  url: 'https://kairo.studio',
  tagline: 'Seen. Found. Used. Scaled.',
  // TODO: real booking link (Cal.com now, Smart Schedule later).
  bookingUrl: 'https://cal.com/',
  // TODO: real contact email.
  email: 'hello@kairo.studio',
  // TODO: newsletter endpoint (e.g. Buttondown / ConvertKit form action). Empty = mailto fallback.
  newsletterAction: '',
  location: 'Taiwan · Working worldwide',
  social: {
    // TODO: fill in real profiles; empty ones are hidden.
    instagram: '',
    x: '',
    linkedin: '',
    github: 'https://github.com/kennymaukwen-git',
  },
  app: {
    name: 'Smart Schedule',
    status: 'Launching soon',
  },
} as const;

export type Lang = 'en' | 'zh-tw';
