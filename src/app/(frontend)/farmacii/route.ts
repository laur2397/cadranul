import { context, html } from '@/site/raspuns'
import { paginaFarmacii } from '@/site/pagini'

export const dynamic = 'force-dynamic'
export async function GET(req: Request) {
  const u = new URL(req.url)
  const { snap, ed, acum } = await context(req)
  return html(paginaFarmacii(snap, ed, acum, u.searchParams.get('judet') || undefined))
}
