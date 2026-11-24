// Descarcari politicoase: User-Agent care ne identifica, timp limita, reincercari cu asteptare crescatoare,
// cereri conditionate (ETag / Last-Modified) si respectarea robots.txt.
import type { Descarcare } from './tipuri'

export const USER_AGENT = () =>
  `CadranulBot/1.0 (+${process.env.NEXT_PUBLIC_SITE_URL || 'https://cadranul.ro'}/pagina/despre; ${process.env.SURSE_CONTACT || 'contact: date@[domeniul-redactiei]'})`

export type FetchFn = typeof fetch
export type CacheHttp = Record<string, { etag?: string; lastModified?: string }>

/** Pagini de blocare / validare anti-robot / login: le recunoastem si le raportam, nu le ocolim. */
export const BLOCAJ = /Validation request|User validation required|captcha|cf-challenge|Just a moment\.\.\.|Access denied|Attention Required|<title>\s*Blocked\s*<\/title>|Request blocked/i

const asteapta = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ——— robots.txt (RFC 9309, varianta simpla: grupul nostru sau „*”, reguli Allow/Disallow pe prefix, cea mai lunga castiga)
type Reguli = { allow: string[]; disallow: string[]; crawlDelay?: number }
const robotsCache = new Map<string, { t: number; r: Reguli | 'tot-interzis' | 'inaccesibil' }>()

export function parseazaRobots(txt: string, agent = 'cadranulbot'): Reguli {
  const grupuri: { agenti: string[]; r: Reguli }[] = []
  let cur: { agenti: string[]; r: Reguli } | null = null
  let ultimaAgent = false
  for (const linie of txt.split(/\r?\n/)) {
    const l = linie.replace(/#.*/, '').trim()
    const m = l.match(/^([A-Za-z-]+)\s*:\s*(.*)$/)
    if (!m) continue
    const k = m[1].toLowerCase(), v = m[2].trim()
    if (k === 'user-agent') {
      if (!cur || !ultimaAgent) { cur = { agenti: [], r: { allow: [], disallow: [] } }; grupuri.push(cur) }
      cur.agenti.push(v.toLowerCase()); ultimaAgent = true
    } else if (cur && k === 'crawl-delay') {
      ultimaAgent = false
      const n = Number(v); if (Number.isFinite(n) && n > 0) cur.r.crawlDelay = n
    } else if (cur && (k === 'allow' || k === 'disallow')) {
      ultimaAgent = false
      if (v) cur.r[k === 'allow' ? 'allow' : 'disallow'].push(v)
    } else ultimaAgent = false
  }
  const al = grupuri.find((g) => g.agenti.some((a) => a !== '*' && agent.includes(a))) || grupuri.find((g) => g.agenti.includes('*'))
  return al?.r || { allow: [], disallow: [] }
}

export function permis(reguli: Reguli, cale: string) {
  const potriveste = (p: string) => {
    const re = new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'))
    return re.test(cale)
  }
  const a = reguli.allow.filter(potriveste).sort((x, y) => y.length - x.length)[0]
  const d = reguli.disallow.filter(potriveste).sort((x, y) => y.length - x.length)[0]
  if (!d) return true
  return !!a && a.length >= d.length
}

async function robotsPermite(url: string, f: FetchFn): Promise<true | string> {
  const u = new URL(url)
  const k = u.origin
  const c = robotsCache.get(k)
  let r = c && Date.now() - c.t < 24 * 3600e3 ? c.r : null
  if (!r) {
    try {
      const res = await f(`${k}/robots.txt`, { headers: { 'User-Agent': USER_AGENT() }, signal: AbortSignal.timeout(15000) })
      // 4xx = nu exista reguli; 5xx = serverul nu poate spune, deci nu descarcam (RFC 9309)
      r = res.ok ? parseazaRobots(await res.text()) : res.status >= 500 ? 'inaccesibil' : { allow: [], disallow: [] }
    } catch {
      r = 'inaccesibil'
    }
    robotsCache.set(k, { t: Date.now(), r })
  }
  if (r !== 'inaccesibil' && r !== 'tot-interzis' && r.crawlDelay) intarziere.set(u.host, Math.min(r.crawlDelay, 60) * 1000)
  if (r === 'inaccesibil' || r === 'tot-interzis') return `serverul ${u.host} nu răspunde (nici la robots.txt) din această rețea: verifică de pe serverul de producție (unele site-uri publice răspund doar din România)`
  return permis(r, u.pathname + u.search) || `robots.txt de la ${u.host} interzice ${u.pathname}`
}
export const golesteRobots = () => { robotsCache.clear(); intarziere.clear(); ultimaCerere.clear() }

// Crawl-delay din robots.txt (ex. cnadnr.ro: 10 s): pauza minima intre doua cereri catre acelasi server.
const intarziere = new Map<string, number>()
const ultimaCerere = new Map<string, number>()
async function respectaPauza(host: string) {
  const d = intarziere.get(host) || 0
  const t = (ultimaCerere.get(host) || 0) + d - Date.now()
  if (t > 0) await asteapta(t)
  ultimaCerere.set(host, Date.now())
}

function decodeaza(buf: ArrayBuffer, tip: string | null) {
  const cs = (tip || '').match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase()
  try { return new TextDecoder(cs || 'utf-8').decode(buf) } catch { return new TextDecoder('utf-8').decode(buf) }
}

/**
 * Descarcatorul unei rulari: tine minte ETag/Last-Modified in `cache` (salvat in registru intre rulari).
 * Arunca eroare la esec definitiv; 304 -> { neschimbat: true }.
 */
export function descarcator(f: FetchFn, cache: CacheHttp, opt: { timeoutMs?: number; incercari?: number; robots?: boolean; pauzaMs?: number } = {}) {
  const timeoutMs = opt.timeoutMs ?? 20000, incercari = opt.incercari ?? 3, pauza = opt.pauzaMs ?? 2000
  return async (url: string, o: { conditionat?: boolean; accept?: string; binar?: boolean } = {}): Promise<Descarcare> => {
    if (opt.robots !== false) { const p = await robotsPermite(url, f); if (p !== true) throw new Error(p) }
    await respectaPauza(new URL(url).host)
    const h: Record<string, string> = { 'User-Agent': USER_AGENT(), 'Accept-Language': 'ro-RO,ro;q=0.9' }
    if (o.accept) h.Accept = o.accept
    const c = cache[url]
    if (o.conditionat !== false && c?.etag) h['If-None-Match'] = c.etag
    if (o.conditionat !== false && c?.lastModified) h['If-Modified-Since'] = c.lastModified
    let ultima: unknown
    for (let i = 0; i < incercari; i++) {
      try {
        const res = await f(url, { headers: h, signal: AbortSignal.timeout(timeoutMs), redirect: 'follow' })
        if (res.status === 304) return { status: 304, text: '', url, neschimbat: true }
        if (res.status === 429 || res.status >= 500) {
          const ra = Number(res.headers.get('retry-after'))
          ultima = new Error(`HTTP ${res.status} de la ${new URL(url).host}`)
          await asteapta(Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 60000) : pauza * 2 ** i)
          continue
        }
        if (!res.ok) {
          const corp = await res.text().catch(() => '')
          const blocat = BLOCAJ.test(corp.slice(0, 4000))
          throw Object.assign(new Error(blocat
            ? `${new URL(url).host} a răspuns cu o pagină de blocare / validare anti-robot (HTTP ${res.status}). Nu o ocolim; sursa trebuie să permită accesul automat.`
            : `HTTP ${res.status} de la ${new URL(url).host}${res.status === 404 ? ' (pagina nu există: adresa s-a schimbat?)' : ''}`), { definitiv: true })
        }
        const buf = await res.arrayBuffer()
        const text = o.binar ? '' : decodeaza(buf, res.headers.get('content-type'))
        const etag = res.headers.get('etag') || undefined, lastModified = res.headers.get('last-modified') || undefined
        if (etag || lastModified) cache[url] = { etag, lastModified }
        return { status: res.status, text, url, neschimbat: false, etag, lastModified, ...(o.binar ? { bytes: new Uint8Array(buf) } : {}) }
      } catch (e) {
        if ((e as { definitiv?: boolean }).definitiv) throw e
        ultima = e
        if (i < incercari - 1) await asteapta(pauza * 2 ** i)
      }
    }
    throw ultima instanceof Error ? ultima : new Error(String(ultima))
  }
}
