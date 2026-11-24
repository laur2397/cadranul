// Distributie Energie Oltenia: PDF-ul saptamanal „LUCRĂRI PENTRU PREVENIRE ȘI CORECTARE AVARII - SĂPTĂMÂNA 11.12 - 17.12.2023 - DOLJ”.
// Tabelul are coloanele Data | Interval orar de întrerupere | Localitatea | Zona de întrerupere, cu celule centrate vertical:
// celula de data e unita peste toate randurile zilei si apare o singura data, la mijlocul grupului (pe fiecare pagina).
// Extragem textul cu pozitii (unpdf / pdf.js) si refacem randurile: celulele = linii apropiate din aceeasi coloana,
// randul = celula cu intervalul orar + celulele din celelalte coloane cu acelasi centru; data = grupul al carui centru se potriveste.
import { getDocumentProxy } from 'unpdf'
import { judetDinNume } from '../geo'

type Item = { x: number; y: number; s: string }
type Celula = { sus: number; jos: number; centru: number; text: string }
export type RandDeo = { judet: string; data: string; interval: string; localitate: string; zona: string }

const ORE = /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/
const ZI = /^(\d{2})\.(\d{2})(?:\.(\d{4}))?$/

function celule(items: Item[]): Celula[] {
  const l = [...items].sort((a, b) => b.y - a.y)
  const out: Celula[] = []
  let cur: Item[] = []
  const inchide = () => { if (!cur.length) return; const sus = cur[0].y, jos = cur[cur.length - 1].y; out.push({ sus: sus + 6, jos: jos - 6, centru: (sus + jos) / 2, text: cur.map((i) => i.s).join(' ').replace(/\s+/g, ' ').trim() }); cur = [] }
  for (const it of l) { if (cur.length && cur[cur.length - 1].y - it.y > 14) inchide(); cur.push(it) }
  inchide()
  return out
}

export async function randuriDinPdf(bytes: Uint8Array): Promise<{ judet: string | null; an: number | null; randuri: RandDeo[] }> {
  const pdf = await getDocumentProxy(bytes)
  let col: number[] | null = null
  let judet: string | null = null, an: number | null = null
  let dataCarry = ''
  const randuri: RandDeo[] = []
  for (let n = 1; n <= pdf.numPages; n++) {
    const items: Item[] = ((await (await pdf.getPage(n)).getTextContent()).items as { str: string; transform: number[] }[])
      .filter((i) => i.str && i.str.trim()).map((i) => ({ x: i.transform[4], y: i.transform[5], s: i.str.trim() }))
    const titlu = items.find((i) => /S[ĂA]PT[ĂA]M[ÂA]NA/i.test(i.s))
    if (titlu) {
      const m = titlu.s.match(/(\d{2})\.(\d{2})\s*-\s*(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(.+)$/)
      if (m) { an = Number(m[5]); judet = judetDinNume(m[6]) }
    }
    const h = { d: items.find((i) => i.s === 'Data'), i: items.find((i) => /^Interval/.test(i.s)), l: items.find((i) => /^Localitatea/.test(i.s)), z: items.find((i) => /^Zona/.test(i.s)) }
    let sub = Infinity
    if (h.d && h.i && h.l && h.z) { col = [h.d.x, h.i.x, h.l.x, h.z.x]; sub = Math.min(h.d.y, h.i.y, h.l.y, h.z.y) - 2 }
    if (!col) continue
    const c = col
    const coloana = (x: number) => (x < c[0] - 3 ? -1 : x < c[1] - 3 ? 0 : x < c[2] - 3 ? 1 : x < c[3] - 3 ? 2 : 3)
    const tabel = items.filter((i) => i.y < sub && !/^Pagina \d|^\d{2}-\d{2}-\d{2}_P/.test(i.s))
    const pe = [0, 1, 2, 3].map((k) => celule(tabel.filter((i) => coloana(i.x) === k)))
    const intervale = pe[1].filter((x) => ORE.test(x.text))
    if (!intervale.length) continue // pagina fara tabel (ex. ultima, cu avertismente)
    const potriveste = (l: Celula[], cen: number) => l.filter((x) => Math.abs(x.centru - cen) <= 25).sort((a, b) => Math.abs(a.centru - cen) - Math.abs(b.centru - cen))[0]
    const rp = intervale.map((iv) => {
      const loc = potriveste(pe[2], iv.centru), zona = potriveste(pe[3], iv.centru)
      return { sus: Math.max(iv.sus, loc?.sus ?? -1e9, zona?.sus ?? -1e9), jos: Math.min(iv.jos, loc?.jos ?? 1e9, zona?.jos ?? 1e9), interval: iv.text.match(ORE)!.slice(1, 3).join(' - '), localitate: loc?.text || '', zona: zona?.text || '', data: '' }
    }).sort((a, b) => b.sus - a.sus)
    // datele: fiecare celula de data e centrata pe grupul ei de randuri
    const date = pe[0].filter((x) => ZI.test(x.text)).sort((a, b) => b.centru - a.centru)
    let start = 0
    date.forEach((d, k) => {
      let best = { s: start, e: start, err: Infinity }
      const sMax = k === 0 ? Math.min(rp.length - 1, start + 3) : start
      for (let s = start; s <= sMax; s++) for (let e = s; e < rp.length; e++) {
        const err = Math.abs((rp[s].sus + rp[e].jos) / 2 - d.centru)
        if (err < best.err) best = { s, e, err }
      }
      for (let i = start; i < best.s; i++) rp[i].data = dataCarry // continuarea zilei de pe pagina anterioara
      for (let i = best.s; i <= best.e; i++) rp[i].data = d.text
      start = best.e + 1
      dataCarry = d.text
    })
    for (let i = start; i < rp.length; i++) rp[i].data = dataCarry
    for (const r of rp) if (r.data && r.localitate) randuri.push({ judet: judet || '', data: an && !ZI.exec(r.data)?.[3] ? `${r.data}.${an}` : r.data, interval: r.interval, localitate: r.localitate.replace(/,\s*$/, ''), zona: r.zona })
  }
  return { judet, an, randuri }
}
