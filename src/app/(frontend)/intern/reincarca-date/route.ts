import { timingSafeEqual } from 'node:crypto'
import { invalideazaDate } from '../../../../site/date'
import { semnaturaReincarcare } from '../../../../surse/semnatura'

// Worker-ul de importuri (npm run surse:worker, alt proces) cere aici reincarcarea instantaneului dupa o scriere.
// Semnatura deriva din PAYLOAD_SECRET, comun celor doua procese. Nimic public: fara semnatura raspunde 404.
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const s = Buffer.from(req.headers.get('x-cadranul-semnatura') || '')
  const ok = Buffer.from(semnaturaReincarcare())
  if (!process.env.PAYLOAD_SECRET || s.length !== ok.length || !timingSafeEqual(s, ok)) return new Response('Not found', { status: 404 })
  invalideazaDate()
  return new Response(null, { status: 204 })
}
