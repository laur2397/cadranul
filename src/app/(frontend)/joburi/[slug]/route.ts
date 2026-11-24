import { context, html } from '@/site/raspuns'
import { paginaJob, pagina404 } from '@/site/pagini'

export const dynamic = 'force-dynamic'
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { snap, ed, acum } = await context(req)
  const p = paginaJob(snap, ed, acum, slug)
  return p ? html(p) : html(pagina404(snap, ed, acum), 404)
}
