// Adresele publice ale site-ului (stabile: nu se schimba dupa lansare).
export const SITE_URL = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
export const DEMO = () => process.env.NEXT_PUBLIC_DEMO === 'true'

export const rute = {
  acasa: () => '/',
  editie: (slug: string) => `/editie/${slug}`,
  articol: (slug: string) => `/articol/${slug}`,
  judet: (slug: string) => `/judet/${slug}`,
  sectiune: (slug: string) => (slug === 'energie' ? '/energie' : `/${slug}`),
  autor: (slug: string) => `/autor/${slug}`,
  live: (slug: string) => `/live/${slug}`,
  pagina: (slug: string) => `/pagina/${slug}`,
  job: (slug: string) => `/joburi/${slug}`,
}

/** Slug valid (litere mici fara diacritice, cifre, cratime) */
export const slugValid = (s: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)

/** Doar legaturi sigure in textul articolelor (fara javascript:, data: etc.) */
export const urlSigur = (u: string) => (/^(https?:\/\/|\/(?!\/)|#|mailto:)/i.test(u.trim()) ? u.trim() : '#')
