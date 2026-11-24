import { context, html } from '@/site/raspuns'
import { paginaCauta } from '@/site/pagini'

export const dynamic = 'force-dynamic'
export async function GET(req: Request) {
  const u = new URL(req.url)
  const { snap, ed, acum } = await context(req)
  return html(await paginaCauta(snap, ed, acum, u.searchParams.get('q') || ''))
}
