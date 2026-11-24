import { context, html } from '@/site/raspuns'
import { paginaAcasa } from '@/site/acasa'
import { pagina404 } from '@/site/pagini'

export const dynamic = 'force-dynamic'
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { snap, acum, ultimaVizita } = await context(req)
  const ed = snap.regBySlug.get(slug)
  if (!ed) return html(pagina404(snap, null, acum), 404)
  return html(paginaAcasa(snap, ed, acum, ultimaVizita))
}
