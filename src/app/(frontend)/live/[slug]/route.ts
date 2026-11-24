import { context, html } from '@/site/raspuns'
import { paginaLive, pagina404 } from '@/site/pagini'
import { slugValid } from '@/lib/rute'

export const dynamic = 'force-dynamic'
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { snap, ed, acum } = await context(req)
  const p = slugValid(slug) ? await paginaLive(snap, ed, acum, slug) : null
  return p ? html(p) : html(pagina404(snap, ed, acum), 404)
}
