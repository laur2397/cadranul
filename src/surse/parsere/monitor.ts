// Monitorul prețurilor (Consiliul Concurenței): serviciul public folosit de aplicația web/mobilă, fără autentificare:
//   https://monitorulpreturilor.info/pmonsvc/Gas/GetUATByName?uatname=<oraș>          -> UAT-urile (Id, Name)
//   https://monitorulpreturilor.info/pmonsvc/Gas/GetGasItemsByUat?UatId=<id>&CSVGasCatalogProductIds=<id-uri>&OrderBy=price
// Serviciul nu răspunde din afara României, deci formatul NU a putut fi observat de aici: parserul e tolerant (XML sau JSON,
// orice spațiu de nume) și caută după nume de câmp: un „preț” are Price + ProductId + StationId (+ UpdateDate),
// o stație are Id + Name (+ Addr/Address, Network), un produs are Id + Name. De verificat la prima rulare pe un server din România.
import { DOMParser } from 'linkedom'

type Nod = { k: string; v: string; c: Nod[] }
const loc = (s: string) => s.replace(/^.*:/, '').toLowerCase()

function arbore(text: string): Nod {
  const t = String(text || '').replace(/^﻿/, '').trim()
  if (t.startsWith('{') || t.startsWith('[')) {
    const conv = (k: string, o: unknown): Nod => {
      if (Array.isArray(o)) return { k: loc(k), v: '', c: o.map((x) => conv(k.replace(/s$/i, ''), x)) }
      if (o && typeof o === 'object') return { k: loc(k), v: '', c: Object.entries(o).map(([kk, vv]) => conv(kk, vv)) }
      return { k: loc(k), v: o == null ? '' : String(o), c: [] }
    }
    return conv('root', JSON.parse(t))
  }
  if (!t.startsWith('<')) throw new Error(`Monitorul prețurilor: răspuns neașteptat („${t.slice(0, 60)}”)`)
  const doc = new DOMParser().parseFromString(t, 'text/xml')
  if (/<html/i.test(t.slice(0, 300))) throw new Error('Monitorul prețurilor: a răspuns cu o pagină HTML, nu cu date (serviciul s-a mutat sau cere altceva).')
  type E = { tagName: string; children: ArrayLike<E>; textContent: string | null }
  const conv = (e: E): Nod => { const c = Array.from(e.children).map(conv); return { k: loc(e.tagName), v: c.length ? '' : (e.textContent || '').trim(), c } }
  return conv(doc.documentElement as unknown as E)
}
const toate = (n: Nod, f: (x: Nod) => boolean, out: Nod[] = []): Nod[] => { if (f(n)) out.push(n); for (const c of n.c) toate(c, f, out); return out }
const camp = (n: Nod, ...k: string[]) => { for (const x of k) { const c = n.c.find((y) => y.k === x); if (c) return c } return undefined }
const val = (n: Nod | undefined): string => (!n ? '' : n.v || (camp(n, 'name', 'addrstring', 'value')?.v ?? ''))

/** Id-ul UAT-ului cu numele dat (primul care se potrivește exact, altfel primul) */
export function idUat(text: string, nume: string): string | null {
  const l = toate(arbore(text), (n) => !!camp(n, 'id') && !!camp(n, 'name'))
  const k = nume.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const f = (n: Nod) => val(camp(n, 'name')).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const g = l.find((n) => f(n) === k) || l.find((n) => f(n).includes(k))
  return g ? val(camp(g, 'id')) || null : null
}

export type RandStatie = { judet: string; localitate: string; statie: string; retea: string; adresa: string; produs: string; pret: string; actualizat: string }

/** Prețurile pe stații dintr-un răspuns GetGasItemsByUat -> rânduri pentru media pe județ (parsere/carburanti.ts). */
export function statiiSiPreturi(text: string, judet: string, oras: string): RandStatie[] {
  const r = arbore(text)
  const preturi = toate(r, (n) => !!camp(n, 'price') && !!camp(n, 'stationid', 'station') && !!camp(n, 'productid', 'product'))
  if (!preturi.length && !toate(r, (n) => /gasitem|items/.test(n.k)).length) throw new Error('Monitorul prețurilor: răspunsul nu conține prețuri (câmpurile Price/ProductId/StationId lipsesc); formatul s-a schimbat.')
  const statii = new Map(toate(r, (n) => !!camp(n, 'id') && !!camp(n, 'name') && !!camp(n, 'addr', 'address', 'network', 'networkid')).map((n) => [val(camp(n, 'id')), n]))
  const produse = new Map(toate(r, (n) => !!camp(n, 'id') && !!camp(n, 'name') && /benz|motor|diesel|gpl|lpg/i.test(val(camp(n, 'name')))).map((n) => [val(camp(n, 'id')), val(camp(n, 'name'))]))
  const retele = new Map(toate(r, (n) => /network/.test(n.k) && !!camp(n, 'id') && !!camp(n, 'name')).map((n) => [val(camp(n, 'id')), val(camp(n, 'name'))]))
  return preturi.map((p) => {
    const sid = val(camp(p, 'stationid')) || val(camp(camp(p, 'station') || { k: '', v: '', c: [] }, 'id'))
    const pid = val(camp(p, 'productid')) || val(camp(camp(p, 'product') || { k: '', v: '', c: [] }, 'id'))
    const s = statii.get(sid)
    const adr = s ? camp(s, 'addr', 'address') : undefined
    const retea = s ? val(camp(s, 'network')) || retele.get(val(camp(s, 'networkid'))) || '' : ''
    return {
      judet, localitate: oras, statie: s ? val(camp(s, 'name')) : sid, retea, adresa: adr ? val(adr) : '',
      produs: produse.get(pid) || val(camp(p, 'productname')) || pid, pret: val(camp(p, 'price')), actualizat: val(camp(p, 'updatedate', 'updated', 'date')),
    }
  })
}
