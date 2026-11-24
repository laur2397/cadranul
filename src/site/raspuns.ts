import 'server-only'
import { DEMO } from '../lib/rute'
import { date, type Reg, type Snap } from './date'

// Contextul unei cereri: datele, editia aleasa (cookie cad_ed) si ultima vizita (cookie cad_v).
// Ambele cookie-uri sunt strict functionale: le seteaza scriptul site-ului doar la alegerea cititorului.
export function cookies(req: Request): Record<string, string> {
  const o: Record<string, string> = {}
  for (const p of (req.headers.get('cookie') || '').split(';')) {
    const i = p.indexOf('=')
    if (i > 0) { try { o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()) } catch { /* ignorat */ } }
  }
  return o
}

export type Context = { snap: Snap; ed: Reg | null; acum: Date; ultimaVizita: number | null }

export async function context(req: Request): Promise<Context> {
  const snap = await date()
  const c = cookies(req)
  const ed = c.cad_ed ? snap.regBySlug.get(c.cad_ed) || null : null
  const v = Number(c.cad_v)
  return { snap, ed, acum: new Date(), ultimaVizita: Number.isFinite(v) && v > 1e12 ? v : null }
}

const antete = (tip: string, extra: Record<string, string> = {}) => ({
  'Content-Type': tip,
  'Cache-Control': 'private, no-cache',
  ...(DEMO() ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
  ...extra,
})

export const html = (corp: string, status = 200) => new Response(corp, { status, headers: antete('text/html; charset=utf-8') })
export const xmlR = (corp: string, tip = 'application/xml; charset=utf-8') => new Response(corp, { headers: antete(tip, { 'Cache-Control': 'public, max-age=300' }) })
export const text = (corp: string) => new Response(corp, { headers: antete('text/plain; charset=utf-8', { 'Cache-Control': 'public, max-age=300' }) })
