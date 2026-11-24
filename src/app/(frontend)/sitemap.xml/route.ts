import { date } from '@/site/date'
import { xmlR } from '@/site/raspuns'
import { SITE_URL } from '@/lib/rute'

export const dynamic = 'force-dynamic'
export async function GET() {
  const s = await date()
  const u = SITE_URL()
  const url = (loc: string, mod?: Date) => `<url><loc>${u}${loc}</loc>${mod ? `<lastmod>${mod.toISOString()}</lastmod>` : ''}</url>`
  const l = [
    url('/'), url('/drumuri'), url('/energie'), url('/joburi'), url('/farmacii'),
    ...s.regs.map((r) => url(`/editie/${r.slug}`)), ...s.secs.map((x) => url(x.slug === 'energie' ? '/energie' : `/${x.slug}`)),
    ...s.juds.map((j) => url(`/judet/${j.slug}`)), ...s.pagini.map((p) => url(`/pagina/${p.slug}`)),
    ...s.arts.map((a) => url(`/articol/${a.slug}`, a.upd)), ...s.jobs.map((j) => url(`/joburi/${j.slug}`)), ...s.live.map((x) => url(`/live/${x.slug}`)),
  ]
  return xmlR(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(l)].join('')}</urlset>`)
}
