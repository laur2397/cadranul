import { context, html } from '@/site/raspuns'
import { pagina404, paginaSectiune } from '@/site/pagini'
import { payloadul } from '@/site/date'

export const dynamic = 'force-dynamic'
// Restul adreselor: secțiunile (/politica, /bani...), redirecționările din /admin, altfel 404.
export async function GET(req: Request, { params }: { params: Promise<{ cale: string[] }> }) {
  const { cale } = await params
  const { snap, ed, acum } = await context(req)
  if (cale.length === 1 && /^[a-z0-9-]+$/.test(cale[0])) {
    const p = paginaSectiune(snap, ed, acum, cale[0])
    if (p) return html(p)
  }
  const from = '/' + cale.join('/')
  const payload = await payloadul()
  const r = await payload.find({ collection: 'redirects', where: { from: { equals: from } }, limit: 1, depth: 0 })
  const rd = r.docs[0] as { to: string; permanent?: boolean } | undefined
  if (rd && /^\/(?!\/)/.test(rd.to)) return new Response(null, { status: rd.permanent === false ? 302 : 301, headers: { Location: rd.to } })
  return html(pagina404(snap, ed, acum), 404)
}
