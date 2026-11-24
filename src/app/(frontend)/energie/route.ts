import { context, html } from '@/site/raspuns'
import { paginaEnergie } from '@/site/pagini'

export const dynamic = 'force-dynamic'
export async function GET(req: Request) {
  const { snap, ed, acum } = await context(req)
  return html(paginaEnergie(snap, ed, acum))
}
