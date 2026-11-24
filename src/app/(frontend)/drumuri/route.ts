import { context, html } from '@/site/raspuns'
import { paginaDrumuri } from '@/site/pagini'

export const dynamic = 'force-dynamic'
export async function GET(req: Request) {
  const { snap, ed, acum, ultimaVizita } = await context(req)
  return html(paginaDrumuri(snap, ed, acum, ultimaVizita))
}
