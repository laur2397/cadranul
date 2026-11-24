import { context, html } from '@/site/raspuns'
import { paginaAcasa } from '@/site/acasa'

export const dynamic = 'force-dynamic'
// Prima pagina: editia nationala sau editia aleasa de cititor (cookie), randata direct pe server.
export async function GET(req: Request) {
  const { snap, ed, acum, ultimaVizita } = await context(req)
  return html(paginaAcasa(snap, ed, acum, ultimaVizita))
}
