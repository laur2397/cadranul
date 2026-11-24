import { date } from '@/site/date'
import { rss } from '@/site/seo'
import { xmlR } from '@/site/raspuns'

export const dynamic = 'force-dynamic'
export async function GET() {
  const snap = await date()
  return xmlR(rss('Cadranul', '/', 'România, oră de oră.', snap.arts.filter((a) => a.type !== 'advertorial')), 'application/rss+xml; charset=utf-8')
}
