import 'server-only'
import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import hartaDate from '../shared/harta-date.json'
import { ORDINE } from '../shared/harta'
import { DEMO, SITE_URL } from '../lib/rute'
import { h, raw, jsonInScript, type Safe } from './html'
import type { Reg, Snap } from './date'
import { I } from '../shared/icons'
import { hhmm, oraRO } from './timp'

// Versiunea fisierelor statice (pentru cache): amprenta continutului, calculata o singura data.
const versiuni = new Map<string, string>()
export function v(file: string) {
  const p = path.join(process.cwd(), 'public', file)
  try {
    const k = `${file}:${statSync(p).mtimeMs}`
    if (!versiuni.has(k)) versiuni.set(k, createHash('sha1').update(readFileSync(p)).digest('hex').slice(0, 10))
    return `/${file}?v=${versiuni.get(k)}`
  } catch { return `/${file}` }
}

export { I }
export const ic = (k: keyof typeof I | string) => raw((I as Record<string, string>)[k] || I.cloud)

function logoSVG(acum: Date, mic = false) {
  const { h: hh, m } = oraRO(acum)
  const a = (((hh % 12) + m / 60) / 12) * Math.PI * 2
  let ticks = ''
  for (let i = 0; i < 8; i++) {
    const t = (i / 8) * Math.PI * 2
    ticks += `<line x1="${(16 + Math.sin(t) * 9.6).toFixed(2)}" y1="${(16 - Math.cos(t) * 9.6).toFixed(2)}" x2="${(16 + Math.sin(t) * 11.2).toFixed(2)}" y2="${(16 - Math.cos(t) * 11.2).toFixed(2)}"/>`
  }
  if (mic) return raw(`<svg viewBox="0 0 32 32" aria-hidden="true" style="width:26px;height:26px"><circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" stroke-width="3"/><line x1="16" y1="16" x2="22" y2="9" stroke="var(--live)" stroke-width="3" stroke-linecap="round"/></svg>`)
  return raw(`<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" stroke-width="3"/><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">${ticks}</g><line id="logoHand" x1="16" y1="16" x2="${(16 + Math.sin(a) * 9.5).toFixed(2)}" y2="${(16 - Math.cos(a) * 9.5).toFixed(2)}" stroke="var(--live)" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="16" r="2.6" fill="currentColor"/></svg>`)
}

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23F2F5F8' stroke='%230E1E2C' stroke-width='3'/%3E%3Cline x1='16' y1='16' x2='22' y2='8' stroke='%23EE3B2B' stroke-width='3.4' stroke-linecap='round'/%3E%3Ccircle cx='16' cy='16' r='2.8' fill='%230E1E2C'/%3E%3C/svg%3E"

// Tema inainte de prima randare (fara clipire), ca in prototip
const TEMA = `(function(){var t=null;try{t=localStorage.getItem('cad_theme')}catch(e){}if(t!=='dark'&&t!=='light')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t})()`

/** Modul de consimtamant Google v2: totul refuzat implicit. Nu face nicio cerere in retea. */
function consimtamantImplicit() {
  const tags = {
    gtm: process.env.NEXT_PUBLIC_GTM_ID || '', ga4: process.env.NEXT_PUBLIC_GA4_ID || '', adsense: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '',
    gam: process.env.NEXT_PUBLIC_GAM_NETWORK || '', pixel: process.env.NEXT_PUBLIC_META_PIXEL_ID || '',
    adsOnRefusal: process.env.NEXT_PUBLIC_ADS_ON_REFUSAL === 'limited' ? 'limited' : 'none',
    adsenseSlots: (() => { try { return JSON.parse(process.env.NEXT_PUBLIC_ADSENSE_SLOTS || '{}') } catch { return {} } })(),
  }
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});gtag('set','ads_data_redaction',true);window.CAD_TAGS=${jsonInScript(tags)};`
}

export type Pagina = {
  snap: Snap
  acum: Date
  titlu: string
  descriere: string
  cale: string
  ed: Reg | null
  main: Safe
  client?: Record<string, unknown>
  jsonld?: object[]
  tip?: 'website' | 'article'
  imagine?: string
  noindex?: boolean
  clasaBody?: string
  rss?: { titlu: string; href: string }
  preincarca?: string[]
}

export function pagina(p: Pagina): string {
  const u = SITE_URL()
  const demo = DEMO()
  const robots = demo || p.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
  const og = p.imagine ? (p.imagine.startsWith('http') ? p.imagine : u + p.imagine) : `${u}/img/35-date-700.jpg`
  const ed = p.ed
  const regsDef = ORDINE.map((k) => `<path id="rg-${k}" d="${(hartaDate.regions as Record<string, string>)[k]}"/>`).join('')
  const nJud = (k: string) => p.snap.regByKey.get(k)?.counties.length ?? 0
  const client = { ...(p.client || {}), demo, ed: ed?.key || '', edSlug: ed?.slug || '', regs: Object.fromEntries(p.snap.regs.map((r) => [r.key, { slug: r.slug, n: r.name, short: r.short, city: r.city }])) }

  return '<!doctype html>' + h`<html lang="ro" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${p.titlu}</title>
<meta name="description" content="${p.descriere}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${u + p.cale}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#F2F5F8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#07121C" media="(prefers-color-scheme: dark)">
<meta property="og:site_name" content="Cadranul">
<meta property="og:locale" content="ro_RO">
<meta property="og:type" content="${p.tip || 'website'}">
<meta property="og:title" content="${p.titlu}">
<meta property="og:description" content="${p.descriere}">
<meta property="og:url" content="${u + p.cale}">
<meta property="og:image" content="${og}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${raw(FAVICON)}">
<script>${raw(TEMA)}</script>
<script>${raw(consimtamantImplicit())}</script>
<link rel="preload" href="/fonts/mona-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/mona-sans-latin-ext.woff2" as="font" type="font/woff2" crossorigin>
${(p.preincarca || []).map((x) => h`<link rel="preload" href="${x}" as="image">`)}
<link rel="stylesheet" href="${v('css/cadranul.css')}">
<link rel="alternate" type="application/rss+xml" title="Cadranul" href="/rss.xml">
${p.rss ? h`<link rel="alternate" type="application/rss+xml" title="${p.rss.titlu}" href="${p.rss.href}">` : ''}
${(p.jsonld || []).map((j) => raw(`<script type="application/ld+json">${jsonInScript(j)}</script>`))}
</head>
<body class="${p.clasaBody || ''}">
<a class="skip" href="#main">Sari la conținut</a>
<div class="readbar" id="readbar" hidden></div>
<header class="top">
  <div class="top-in">
    <a class="logo" href="/" aria-label="Cadranul, prima pagină">${logoSVG(p.acum)}<b>cadranul</b></a>
    <button class="ed-btn" id="edBtn" aria-haspopup="dialog" aria-controls="edSheet" aria-expanded="false"><span class="pin"></span><span id="edName">${ed ? ed.short : 'România'}</span><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>
    <nav class="nav" aria-label="Secțiuni">
      <a href="${ed ? `/editie/${ed.slug}#acum` : '/#acum'}">Acum</a><a href="/drumuri">Drumuri</a><a href="/energie">Energie</a><a href="${ed ? `/editie/${ed.slug}#bani` : '/#bani'}">Cât primești</a><a href="/joburi">Joburi</a><a href="${ed ? `/editie/${ed.slug}#stiri` : '/#stiri'}">Știri</a>
    </nav>
    <div class="top-r">
      <span class="clock" title="Ora României"><i></i><span class="lbl">Live</span> <span id="clock" class="num">${hhmm(p.acum)}</span></span>
      <a class="icon-btn" href="/cauta" aria-label="Caută"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></a>
      <button class="icon-btn" id="themeBtn" aria-label="Comută modul întunecat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/></svg></button>
      <a class="support" href="${ed ? `/editie/${ed.slug}#sustine` : '/#sustine'}">Susține</a>
    </div>
  </div>
</header>

<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${raw(regsDef)}</defs></svg>
<div class="sheet-bg" id="sheetBg"></div>
<div class="sheet" id="edSheet" role="dialog" aria-modal="true" aria-labelledby="edTitle">
  <h2 id="edTitle">Alege ediția ta</h2>
  <p>Toată pagina se întoarce spre regiunea ta: harta, drumurile, avariile, joburile și știrile. Știrile naționale importante rămân.</p>
  <div class="ed-grid" id="edGrid">${p.snap.regs.map((r) => h`<a class="ed-card" href="/editie/${r.slug}" data-region="${r.key}" aria-current="${ed?.key === r.key ? 'true' : 'false'}"><svg viewBox="0 0 1000 704" aria-hidden="true">${raw(ORDINE.map((k) => `<use href="#rg-${k}" fill="${k === r.key ? 'var(--brand)' : 'var(--land)'}" stroke="var(--surface)" stroke-width="10"/>`).join(''))}</svg><b>${r.name}</b><span>${r.key === 'bi' ? 'București și Ilfov' : `${r.city}, ${nJud(r.key)} județe`}</span></a>`)}</div>
  <a class="ed-nat" href="/" data-region="">Înapoi la ediția națională</a>
</div>

<main id="main">
${p.main}
</main>

<footer>
  <div class="foot">
    <div><a class="logo" href="/" style="margin-bottom:8px">${logoSVG(p.acum, true)}<b style="font-size:19px">cadranul</b></a><p>România, oră de oră. Publicație independentă cu 8 ediții regionale.</p>${demo ? h`<p class="demo">Versiune demonstrativă. Conținutul este fictiv; cifrele de energie, carburant, drumuri și joburi sunt de probă.</p>` : ''}</div>
    <div><h2 class="foot-h">Ediții</h2>${p.snap.regs.map((r) => h`<a href="/editie/${r.slug}">${r.name}</a>`)}</div>
    <div><h2 class="foot-h">Redacția</h2><a href="/pagina/despre">Despre noi</a><a href="/pagina/despre#finantare">Cine ne finanțează</a><a href="/pagina/corecturi">Cum corectăm greșelile</a><a href="/pagina/despre#deontologie">Codul deontologic</a><a href="/pagina/despre#contact">Contact redacție</a></div>
    <div><h2 class="foot-h">Pentru firme</h2><a href="/pagina/publicitate">Publicitate</a><a href="/pagina/publicitate#joburi">Anunțuri de angajare</a><a href="/pagina/confidentialitate">Confidențialitate</a><a href="/pagina/cookie">Politica de cookie-uri</a><a href="/pagina/cookie#setari" id="cookieReopen">Setări cookie</a><a href="/pagina/termeni">Termeni</a><a href="https://anpc.ro" rel="noopener">ANPC</a></div>
  </div>
</footer>

<div class="cookie" id="cookie" role="dialog" aria-labelledby="ckT" aria-describedby="ckP">
  <h2 id="ckT">Cookie-uri, pe față</h2>
  <p id="ckP">Folosim cookie-uri pentru statistici și pentru reclame potrivite ție. Dacă refuzi, site-ul merge la fel, iar reclamele vor fi doar după subiectul paginii. Poți schimba oricând din subsol.</p>
  <div class="opts">
    <label><input type="checkbox" checked disabled> <span><b>Necesare</b><br>Țin minte ediția aleasă, ce ai citit și modul întunecat. Rămân pe telefonul tău.</span></label>
    <label><input type="checkbox" id="ckStat"> <span><b>Statistică</b><br>Aflăm ce articole se citesc (Google Analytics).</span></label>
    <label><input type="checkbox" id="ckAds"> <span><b>Publicitate personalizată</b><br>Reclame după interesele tale (Google Ads, Meta).</span></label>
  </div>
  <div class="btns">
    <button class="cb" data-ck="deny">Refuz tot</button>
    <button class="cb" data-ck="accept">Accept tot</button>
    <button class="cb choose" data-ck="choose">Aleg eu</button>
  </div>
</div>
<div class="toast" id="toast" role="status"></div>
<script id="cad-data" type="application/json">${raw(jsonInScript(client))}</script>
<script src="${v('js/cadranul.js')}" defer></script>
</body>
</html>`.s
}
