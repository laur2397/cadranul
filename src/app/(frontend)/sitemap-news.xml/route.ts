import { date } from '@/site/date'
import { xmlR } from '@/site/raspuns'
import { xml } from '@/site/seo'
import { SITE_URL } from '@/lib/rute'

export const dynamic = 'force-dynamic'
// Google News: doar articolele din ultimele 48 de ore, fara continut platit (advertoriale).
export async function GET() {
  const s = await date()
  const u = SITE_URL()
  const lim = Date.now() - 48 * 3600e3
  const l = s.arts.filter((a) => +a.pub > lim && a.type !== 'advertorial').slice(0, 1000)
  return xmlR(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${l.map((a) => `<url><loc>${u}/articol/${a.slug}</loc><news:news><news:publication><news:name>Cadranul</news:name><news:language>ro</news:language></news:publication><news:publication_date>${a.pub.toISOString()}</news:publication_date><news:title>${xml(a.title)}</news:title></news:news></url>`).join('')}</urlset>`)
}
