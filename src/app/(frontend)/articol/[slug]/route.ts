import { context, html } from '@/site/raspuns'
import { incarcaArticol, paginaArticol } from '@/site/articol'
import { pagina404 } from '@/site/pagini'
import { slugValid } from '@/lib/rute'

export const dynamic = 'force-dynamic'
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { snap, ed, acum, ultimaVizita } = await context(req)
  const d = slugValid(slug) ? await incarcaArticol(slug) : null
  if (!d) return html(pagina404(snap, ed, acum), 404)
  return html(paginaArticol(snap, d, ed, acum, ultimaVizita))
}
