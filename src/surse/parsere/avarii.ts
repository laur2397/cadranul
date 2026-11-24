// Avarii si opriri programate (curent, apa, gaz) din tabelul publicat de distribuitor.
// Distributie Energie Oltenia publica saptamanal, pe judete, „Lucrari pentru prevenire si corectare avarii” (PDF) cu coloanele:
//   Data de întrerupere | Interval orar | Localitatea | Zona de întrerupere      (celula de data goala = aceeasi zi ca randul de sus)
//   23.03 | 09:30 - 12:00 | Novaci | PTA Fabrica de Pâine Novaci
// Cererea de acces (docs/cereri-acces/) le propune distribuitorilor exact aceste coloane, plus judetul, ca CSV/JSON:
//   judet;data;interval;localitate;zona
import { judetDinNume, localitate } from '../geo'
import { amprenta, dataPunct } from '../text'
import { camp, randuri } from './tabel'
import type { Element } from '../tipuri'

export type TipAvarie = 'power' | 'water' | 'gas'
const TITLU: Record<TipAvarie, string> = { power: 'Curent oprit', water: 'Apă oprită', gas: 'Gaz oprit' }

const ziSapt = (d: Date) => new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', weekday: 'long' }).format(d)
const ora = (d: Date) => new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d)

export function parseazaAvarii(text: string, tip: TipAvarie, opt: { acum?: Date; judetImplicit?: string; prefix: string }): Element[] {
  const acum = opt.acum || new Date()
  const an = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest', year: 'numeric' }).format(acum))
  const out: Element[] = []
  let ziAnt = ''
  for (const r of randuri(text)) {
    const zi = camp(r, 'data', 'data_de_intrerupere', 'ziua') || ziAnt
    ziAnt = zi
    const interval = camp(r, 'interval', 'interval_orar', 'ore')
    const loc = camp(r, 'localitate', 'localitatea')
    const zona = camp(r, 'zona', 'zona_de_intrerupere', 'strazi', 'zona_afectata')
    const j = judetDinNume(camp(r, 'judet')) || localitate(loc)?.judet || opt.judetImplicit || null
    const [a, b] = interval.split(/\s*[-–]\s*/)
    if (!zi || !a || !b || !loc || !j) continue
    let de = dataPunct(zi, a, an), pana = dataPunct(zi, b, an)
    if (!de || !pana) continue
    // un tabel din decembrie cu date din ianuarie
    if (de.getTime() < acum.getTime() - 200 * 864e5) { de = dataPunct(zi, a, an + 1)!; pana = dataPunct(zi, b, an + 1)! }
    if (pana <= de) pana = new Date(pana.getTime() + 864e5)
    if (pana.getTime() < acum.getTime()) continue // trecut
    const l = localitate(loc)
    out.push({
      externalId: `${opt.prefix}:${amprenta(j, de.toISOString(), pana.toISOString(), loc, zona)}`,
      data: {
        kind: tip, title: `${TITLU[tip]} ${ziSapt(de)}, ${ora(de)}–${ora(pana)}`, area: (zona || 'zona anunțată de distribuitor').slice(0, 300),
        county: j, city: loc, lat: l?.lat ?? null, lon: l?.lon ?? null, from: de.toISOString(), until: pana.toISOString(),
      },
    })
  }
  return out
}
