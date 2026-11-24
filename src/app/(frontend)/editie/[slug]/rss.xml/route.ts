import { date } from '@/site/date'
import { rss } from '@/site/seo'
import { xmlR } from '@/site/raspuns'

export const dynamic = 'force-dynamic'
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const snap = await date()
  const ed = snap.regBySlug.get(slug)
  if (!ed) return new Response('Nu există', { status: 404 })
  const arts = snap.arts.filter((a) => a.regKey === ed.key && a.type !== 'advertorial')
  return xmlR(rss(`Cadranul ${ed.short}`, `/editie/${ed.slug}`, `Știrile din ${ed.name}, oră de oră.`, arts), 'application/rss+xml; charset=utf-8')
}
