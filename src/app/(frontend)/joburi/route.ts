import { context, html } from '@/site/raspuns'
import { paginaJoburi } from '@/site/pagini'

export const dynamic = 'force-dynamic'
export async function GET(req: Request) {
  const u = new URL(req.url)
  const { snap, ed, acum } = await context(req)
  return html(paginaJoburi(snap, ed, acum, { regiune: u.searchParams.get('regiune') || undefined, judet: u.searchParams.get('judet') || undefined, q: u.searchParams.get('q') || undefined }))
}
