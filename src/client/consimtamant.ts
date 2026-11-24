// INCARCATORUL UNIC al scripturilor terte (Google Tag Manager, Google Analytics 4, Google Ad Manager,
// AdSense, Meta Pixel). Este SINGURUL fisier din proiect care are voie sa contina adresele lor
// (verificat automat de scripts/valideaza-registru.ts).
//
// Reguli:
// - Implicit (in <head>, src/site/shell.ts) Consent Mode v2 porneste cu TOTUL refuzat si nu face nicio cerere.
// - Nimic tert nu se incarca inainte ca cititorul sa aleaga in banner.
// - Identificatorii vin din variabilele de mediu NEXT_PUBLIC_* (goale = nu se incarca nimic).
// - „Refuz tot”: nu se incarca statistica, nici Meta. Reclamele se incarca doar daca proprietarul a ales
//   NEXT_PUBLIC_ADS_ON_REFUSAL=limited (reclame ne-personalizate, fara cookie-uri de publicitate). Implicit: nu.

type Tags = { gtm: string; ga4: string; adsense: string; gam: string; pixel: string; adsOnRefusal: 'none' | 'limited'; adsenseSlots?: Record<string, string> }
type Alegere = { stat: boolean; ads: boolean }
type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; CAD_TAGS?: Tags; googletag?: any; adsbygoogle?: unknown[]; fbq?: any; _fbq?: unknown }

const w = window as W
const CHEIE = 'cad_ck'
let incarcat = false

function script(src: string, attrs: Record<string, string> = {}) {
  const s = document.createElement('script')
  s.async = true; s.src = src
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v)
  document.head.appendChild(s)
}

function citeste(): Alegere | null {
  let v: string | null = null
  try { v = localStorage.getItem(CHEIE) } catch { return null }
  if (!v) return null
  if (v === 'accept') return { stat: true, ads: true }
  if (v === 'deny') return { stat: false, ads: false }
  try { const o = JSON.parse(v); return { stat: !!o.stat, ads: !!o.ads } } catch { return null }
}

function sloturi() { return [...document.querySelectorAll<HTMLElement>('.adslot[data-slot]')] }

function incarcaReclame(t: Tags, personalizate: boolean) {
  const sl = sloturi()
  if (!sl.length) return
  if (t.gam) {
    w.googletag = w.googletag || { cmd: [] }
    script('https://securepubads.g.doubleclick.net/tag/js/gpt.js')
    w.googletag.cmd.push(() => {
      const g = w.googletag
      if (!personalizate) g.pubads().setPrivacySettings({ limitedAds: true, nonPersonalizedAds: true })
      sl.forEach((el, i) => {
        el.id = el.id || `ad-${i}`
        const [wd, ht] = (el.dataset.size || '300x250').split('x').map(Number)
        g.defineSlot(`/${t.gam}/${el.dataset.slot}`, [wd, ht], el.id)?.addService(g.pubads())
      })
      g.pubads().enableLazyLoad({ fetchMarginPercent: 100, renderMarginPercent: 50 })
      g.pubads().collapseEmptyDivs()
      g.enableServices()
      sl.forEach((el) => g.display(el.id))
    })
  } else if (t.adsense) {
    script(`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(t.adsense)}`, { crossorigin: 'anonymous' })
    w.adsbygoogle = w.adsbygoogle || []
    if (!personalizate) (w.adsbygoogle as unknown as { requestNonPersonalizedAds?: number }).requestNonPersonalizedAds = 1
    sl.forEach((el) => {
      const ins = document.createElement('ins')
      ins.className = 'adsbygoogle'; ins.style.display = 'block'; ins.style.width = '100%'; ins.style.height = '100%'
      ins.dataset.adClient = t.adsense
      const id = t.adsenseSlots?.[el.dataset.slot || '']
      if (id) ins.dataset.adSlot = id
      el.appendChild(ins)
      w.adsbygoogle!.push({})
    })
  }
}

function aplica(a: Alegere | 'deny-explicit') {
  const t = w.CAD_TAGS
  const al: Alegere = a === 'deny-explicit' ? { stat: false, ads: false } : a
  w.gtag?.('consent', 'update', {
    analytics_storage: al.stat ? 'granted' : 'denied',
    ad_storage: al.ads ? 'granted' : 'denied', ad_user_data: al.ads ? 'granted' : 'denied', ad_personalization: al.ads ? 'granted' : 'denied',
  })
  if (incarcat || !t) return
  incarcat = true
  if (t.gtm && (al.stat || al.ads)) {
    w.dataLayer!.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    script(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(t.gtm)}`)
  } else if (t.ga4 && al.stat) {
    script(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(t.ga4)}`)
    w.gtag?.('js', new Date()); w.gtag?.('config', t.ga4, { anonymize_ip: true })
  }
  if (al.ads) incarcaReclame(t, true)
  else if (t.adsOnRefusal === 'limited') incarcaReclame(t, false)
  else sloturi().forEach((el) => el.closest<HTMLElement>('.ad')?.setAttribute('hidden', ''))
  if (t.pixel && al.ads) {
    const f: any = (w.fbq = function (...args: unknown[]) { f.callMethod ? f.callMethod(...args) : f.queue.push(args) })
    w._fbq = f; f.push = f; f.loaded = true; f.version = '2.0'; f.queue = []
    script('https://connect.facebook.net/en_US/fbevents.js')
    w.fbq('init', t.pixel); w.fbq('track', 'PageView')
  }
}

export function initConsimtamant(toast: (t: string) => void) {
  const ck = document.getElementById('cookie')
  const ales = citeste()
  if (ales) aplica(ales)
  else ck?.classList.add('on')
  ck?.querySelectorAll<HTMLButtonElement>('[data-ck]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.ck
    if (a === 'choose') {
      if (!ck.classList.contains('more')) { ck.classList.add('more'); b.textContent = 'Salvează alegerea'; return }
      const al = { stat: (document.getElementById('ckStat') as HTMLInputElement).checked, ads: (document.getElementById('ckAds') as HTMLInputElement).checked }
      try { localStorage.setItem(CHEIE, JSON.stringify(al)) } catch { /* */ }
      aplica(al); toast('Am salvat alegerea ta.')
    } else {
      try { localStorage.setItem(CHEIE, a === 'accept' ? 'accept' : 'deny') } catch { /* */ }
      aplica(a === 'accept' ? { stat: true, ads: true } : 'deny-explicit')
      toast(a === 'accept' ? 'Mulțumim. Poți schimba oricând din subsol.' : 'Am înțeles. Vezi doar reclame după subiectul paginii.')
    }
    ck.classList.remove('on')
  }))
  document.getElementById('cookieReopen')?.addEventListener('click', (e) => {
    e.preventDefault()
    const al = citeste()
    if (al) { (document.getElementById('ckStat') as HTMLInputElement).checked = al.stat; (document.getElementById('ckAds') as HTMLInputElement).checked = al.ads }
    ck?.classList.add('on', 'more')
    const ch = ck?.querySelector<HTMLButtonElement>('[data-ck="choose"]'); if (ch) ch.textContent = 'Salvează alegerea'
  })
}
