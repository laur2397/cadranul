import 'server-only'
import { fmt } from '../shared/format'
import { curbaHTML, dialHTML, dialTextHTML, extreme } from '../shared/energie'
import { DEMO, SITE_URL } from '../lib/rute'
import { h, raw, type Safe } from './html'
import { imagine, payloadul, type Art, type Reg, type Snap } from './date'
import { dateHarta, instrument, inEditie } from './harta'
import { alertaDrumuri, calcCurent, calcPlin, cardFarmacii, cardJob, fuelCard, newsletter, notaSursa, randuriDrumuri, selectie, stCard, timpi } from './acasa'
import { reclama } from './reclame'
import { ic, pagina } from './shell'
import { cand, candLung, dataLunga, dataSimpla, hhmm, oraRO, ziRO } from './timp'
import { jsonLdFirimituri, jsonLdOrganizatie } from './seo'

type Doc = Record<string, any>
const demoNota = (t: string) => (DEMO() ? t : '')

function antet(crumb: [string, string][], titlu: string, lede?: string | Safe, extra?: Safe): Safe {
  return h`<section class="sec page-h"><div class="crumb">${crumb.map(([n, u], i) => h`${i ? h`<span>/</span>` : ''}${u ? h`<a href="${u}">${n}</a>` : h`<span>${n}</span>`}`)}</div><h1 class="ph1">${titlu}</h1>${lede ? h`<p class="lede">${lede}</p>` : ''}${extra || ''}</section>`
}

const grila = (arts: Art[], acum: Date, snap: Snap, gol = 'Nicio știre aici încă.') =>
  arts.length ? h`<div class="grid">${arts.map((a, i) => stCard(a, i, acum, snap))}</div>` : h`<p class="gol">${gol}</p>`

// ——— /drumuri
export function paginaDrumuri(snap: Snap, ed: Reg | null, acum: Date, ultimaVizita: number | null): string {
  const sel = selectie(snap, ed, acum, ultimaVizita)
  const dh = dateHarta(snap, ed, { stiri: sel.stiri, noi: sel.noi, callouts: [], acum, layer: 'drumuri' })
  const ok = inEditie(ed)
  const peRegiuni = snap.regs.filter((r) => ok(r.key)).map((r) => ({ r, ev: snap.ev.filter((e) => e.regKey === r.key).sort((a, b) => +(a.st === 'ok') - +(b.st === 'ok')) })).filter((x) => x.ev.length)
  const arts = snap.arts.filter((a) => a.sec.slug === 'trafic' && ok(a.regKey || (ed?.key ?? ''))).slice(0, 8)
  const main = h`${antet([['Cadranul', '/'], ['Drumuri', '']], ed ? `Drumurile din ${ed.short === 'Oltenia' ? 'Oltenia' : ed.name}` : 'Starea drumurilor', 'Drumuri închise, lucrări, cozi și coduri meteo pe drumurile naționale și autostrăzi. Actualizat la ' + hhmm(acum) + '.')}
<section class="sec" style="padding-top:0"><div class="roads roads-page">${instrument(snap, ed, dh, hhmm(acum))}<div>${alertaDrumuri(snap, ed)}<div class="rmini"><div class="card-h"><h2 class="h3">Cât stai pe drum azi</h2><small>față de o zi obișnuită</small></div><div class="rlist">${timpi(snap, ed)}</div><div class="demo" style="margin-top:8px">${demoNota('Timpi demonstrativi. ')}Surse: CNAIR, Poliția Rutieră, Infotrafic.</div></div></div></div></section>
${peRegiuni.map(({ r, ev }) => h`<section class="sec" aria-labelledby="dr-${r.key}"><div class="sec-h"><div><h2 id="dr-${r.key}">${r.name}</h2></div><a class="more" href="/editie/${r.slug}">Ediția ${r.short}</a></div><div class="rlist">${ev.map((e) => h`<div class="rrow"><span class="shield ${e.a ? 'a' : 'd'}">${e.road}</span><span><b>${e.where}</b><small>${e.what} <a href="/judet/${e.cty.slug}">${e.cty.name}</a></small></span><span class="st ${e.st}">${e.st === 'ok' ? 'normal' : e.lab}</span></div>`)}</div>${notaSursa(ev, acum) ? h`<p class="demo src">${notaSursa(ev, acum)}</p>` : ''}</section>`)}
${arts.length ? h`<section class="sec"><div class="sec-h"><div><h2>Știri din trafic</h2></div></div>${grila(arts, acum, snap)}</section>` : ''}`
  return pagina({ snap, acum, ed, titlu: 'Starea drumurilor acum: închideri, lucrări, cozi | Cadranul', descriere: 'Drumuri închise, lucrări și cozi pe autostrăzi și drumuri naționale, cu timpii de azi pe rutele principale. Pe harta României.', cale: '/drumuri', main,
    jsonld: [jsonLdFirimituri([['Cadranul', '/'], ['Drumuri', '/drumuri']])], client: { pagina: 'drumuri', harta: dh } })
}

// ——— /energie
export function paginaEnergie(snap: Snap, ed: Reg | null, acum: Date): string {
  const { h: ora, m: min } = oraRO(acum)
  const pr = snap.pret?.values
  const fc = fuelCard(snap, ed)
  const maine = snap.pretMaine
  const arts = snap.arts.filter((a) => a.sec.slug === 'energie').slice(0, 9)
  const peRegiuni = snap.regs.map((r) => ({ r, j: r.counties.map((c) => ({ c, f: snap.fuel.get(c.slug) })).filter((x) => x.f) }))
  const n = snap.fuelNat.azi
  const main = h`${antet([['Cadranul', '/'], ['Energie', '']], 'Prețul curentului, oră de oră', h`Prețul de pe bursa de energie pentru fiecare oră a zilei și prețurile la carburant în fiecare județ. ${demoNota('Cifre demonstrative.')}`)}
<section class="sec" style="padding-top:0"><div class="energy-page">
  <section class="card" id="energie" aria-labelledby="enT"><div class="card-h"><h2 class="h3" id="enT">Curentul azi${snap.pret && snap.pret.day !== ziRO(acum) ? ` (${snap.pret.day})` : ''}</h2><small>${snap.pret?.source || 'OPCOM'}</small></div>${snap.pret?.imp ? h`<p class="demo src" style="margin:0 0 6px">${notaSursa([snap.pret], acum)}</p>` : ''}
    ${pr ? h`<div class="dialwrap"><div class="dial" id="dial">${raw(dialHTML(pr, ora, min))}</div><div class="dialtxt" id="dialTxt">${raw(dialTextHTML(pr, ora, '/articol/curentul-cel-mai-ieftin-la-pranz', maine?.values))}</div></div><div class="dialtip" id="dialTip" aria-live="polite"></div>` : h`<p>Prețurile de azi nu au fost încă publicate.</p>`}
  </section>
  <div class="embed" style="margin:0"><h2 class="h3">Graficul zilei</h2><p class="sub">Lei/MWh, pe piața pentru ziua următoare. Linia punctată arată ora la care citești.</p>${pr ? h`<div id="artCurve">${raw(curbaHTML(pr, ora, min))}</div>` : ''}
    ${pr ? h`<div class="hgrid" role="table" aria-label="Prețul pe ore">${pr.map((v, i) => h`<div role="row" class="${i === ora ? 'now' : ''}"><span role="cell">${String(i).padStart(2, '0')}:00</span><b role="cell" style="color:${v < 400 ? 'var(--ok-ink)' : v >= 950 ? 'var(--red-ink)' : 'inherit'}">${fmt(v)}</b></div>`)}</div>` : ''}
    ${maine ? h`<p class="sub" style="margin-top:10px"><b>Mâine:</b> cel mai ieftin la ${extreme(maine.values).ieftin}:00 (${fmt(extreme(maine.values).minP)} lei/MWh), cel mai scump la ${extreme(maine.values).scump}:00 (${fmt(extreme(maine.values).maxP)} lei/MWh).</p>` : ''}
  </div>
</div></section>
<section class="sec" id="bani" aria-labelledby="cT"><div class="sec-h"><div><h2 id="cT">Cât economisești</h2><p>Mută consumul mare la orele ieftine. Contează direct dacă ai contract cu preț dinamic.</p></div></div><div class="calcs calcs-2">${calcCurent(snap)}${calcPlin(snap, ed, fc.f)}</div></section>
<section class="sec" aria-labelledby="fT"><div class="sec-h"><div><h2 id="fT">Carburant azi, pe județe</h2><p>Lei pe litru. Media țării: benzină ${fmt(n[0], 2)}, motorină ${fmt(n[1], 2)}, GPL ${fmt(n[2], 2)}. ${snap.fuelNat.vechi ? `Ultimele prețuri publicate: ${snap.fuelNat.vechi}. ` : ''}${snap.fuelNat.prov?.imp ? notaSursa([snap.fuelNat.prov], acum) : demoNota('Prețuri demonstrative.')}</p></div></div>
  <div class="fueltab">${peRegiuni.map(({ r, j }) => h`<div class="card"><h3 class="h3">${r.name}</h3><table class="tbl"><thead><tr><th scope="col">Județ</th><th scope="col">Benzină</th><th scope="col">Motorină</th><th scope="col">GPL</th></tr></thead><tbody>${j.map(({ c, f }) => h`<tr class="${f!.vechi ? 'vechi' : ''}" title="${f!.vechi ? `Ultimele prețuri: ${f!.azi.day}` : ''}"><th scope="row"><a href="/judet/${c.slug}">${c.name}</a></th><td class="num">${fmt(f!.azi.petrol, 2)}</td><td class="num">${fmt(f!.azi.diesel, 2)}</td><td class="num">${fmt(f!.azi.lpg, 2)}</td></tr>`)}</tbody></table></div>`)}</div>
</section>
${arts.length ? h`<section class="sec"><div class="sec-h"><div><h2>Știri despre energie</h2></div></div>${grila(arts, acum, snap)}</section>` : ''}`
  return pagina({ snap, acum, ed, titlu: 'Prețul curentului azi, oră de oră, și carburantul pe județe | Cadranul', descriere: 'Cât costă curentul în fiecare oră a zilei pe bursa de energie, când e cel mai ieftin și cât costă benzina, motorina și GPL în județul tău.', cale: '/energie', main,
    jsonld: [jsonLdFirimituri([['Cadranul', '/'], ['Energie', '/energie']])], client: { pagina: 'energie', pr: pr || null, prMaine: maine?.values || null, fuel: fc.f } })
}

// ——— /joburi
export function paginaJoburi(snap: Snap, ed: Reg | null, acum: Date, q: { regiune?: string; judet?: string; q?: string }): string {
  const reg = q.regiune ? snap.regBySlug.get(q.regiune) : null
  const jud = q.judet ? snap.judBySlug.get(q.judet) : null
  const t = (q.q || '').trim().toLowerCase()
  const l = snap.jobs.filter((j) => (!reg || j.regKey === reg.key) && (!jud || j.cty.id === jud.id) && (!t || `${j.title} ${j.employer} ${j.city}`.toLowerCase().includes(t)))
    .sort((a, b) => +b.promo - +a.promo || +b.created - +a.created)
  const total = snap.juds.reduce((a, j) => a + (j.jobsActive ?? 0), 0)
  const main = h`${antet([['Cadranul', '/'], ['Joburi', '']], jud ? `Locuri de muncă în ${jud.name}` : reg ? `Locuri de muncă în ${reg.name}` : 'Locuri de muncă', h`Anunțuri noi din regiunea ta, verificate de redacție. Cele marcate „Promovat” sunt plătite de angajatori.${total ? ` În total, ${fmt(total)} de anunțuri active pe site-urile de profil.` : ''}`)}
<section class="sec" style="padding-top:0">
  <form class="filters" method="get" action="/joburi" role="search">
    <label><span>Regiunea</span><select name="regiune"><option value="">Toată țara</option>${snap.regs.map((r) => h`<option value="${r.slug}"${reg?.key === r.key ? raw(' selected') : ''}>${r.name}</option>`)}</select></label>
    <label><span>Județul</span><select name="judet"><option value="">Toate județele</option>${snap.regs.map((r) => h`<optgroup label="${r.name}">${r.counties.map((c) => h`<option value="${c.slug}"${jud?.id === c.id ? raw(' selected') : ''}>${c.name}</option>`)}</optgroup>`)}</select></label>
    <label class="grow"><span>Caută</span><input type="search" name="q" value="${q.q || ''}" placeholder="ex. sudor, contabil, Craiova"></label>
    <button class="btn">Arată</button>
  </form>
  <p class="count">${l.length === 1 ? 'Un anunț' : `${fmt(l.length)} anunțuri`} în Cadranul${jud || reg || t ? ' pentru filtrele alese' : ''}.</p>
  ${l.length ? h`<div class="jobs">${l.slice(0, 90).map(cardJob)}</div>` : h`<p class="gol">Niciun anunț pentru filtrele alese. <a href="/joburi">Vezi toate anunțurile</a>.</p>`}
  <div class="jobs-cta" id="publica"><span><b>Angajezi?</b> Anunțul tău, promovat în ediția regiunii tale, de la 149 lei pe săptămână. Îl vede cine caută de lucru în județul tău.</span><a class="btn" href="/pagina/publicitate#joburi">Publică un anunț</a></div>
</section>`
  return pagina({ snap, acum, ed, titlu: `${jud ? `Locuri de muncă în ${jud.name}` : reg ? `Locuri de muncă în ${reg.name}` : 'Locuri de muncă în România, pe județe'} | Cadranul`, descriere: 'Anunțuri de angajare din județul și regiunea ta, cu salariul afișat. Verificate de redacția Cadranul.', cale: '/joburi', main, noindex: !!(t || reg || jud),
    jsonld: [jsonLdFirimituri([['Cadranul', '/'], ['Joburi', '/joburi']])], client: { pagina: 'joburi' } })
}

export function paginaJob(snap: Snap, ed: Reg | null, acum: Date, slug: string): string | null {
  const j = snap.jobs.find((x) => x.slug === slug)
  if (!j) return null
  const alte = snap.jobs.filter((x) => x.cty.id === j.cty.id && x.slug !== j.slug).slice(0, 4)
  const cerinte = (j.requirements || '').split('\n').map((x) => x.trim()).filter(Boolean)
  const u = SITE_URL()
  const ld = {
    '@context': 'https://schema.org', '@type': 'JobPosting', title: j.title, description: `<p>${(j.description || j.title).replace(/[<>&]/g, '')}</p>`,
    datePosted: j.created.toISOString(), ...(j.deadline ? { validThrough: j.deadline.toISOString() } : {}), employmentType: 'FULL_TIME',
    hiringOrganization: { '@type': 'Organization', name: j.employer }, directApply: !!(j.applyEmail || j.applyUrl),
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: j.city, addressRegion: j.cty.name, addressCountry: 'RO' } },
    url: `${u}/joburi/${j.slug}`,
  }
  const main = h`<div class="art"><article class="art-main" aria-labelledby="jobT">
    <div class="crumb"><a href="/joburi">Joburi</a><span>/</span><a href="/joburi?judet=${j.cty.slug}">${j.cty.name}</a>${j.promo ? h`<span class="lv promo-l">Promovat, anunț plătit</span>` : ''}</div>
    <h1 id="jobT">${j.title}</h1>
    <p class="dek">${j.employer}</p>
    <div class="jobfacts"><div><small>Salariu</small><b class="pay">${j.pay}</b></div><div><small>Unde</small><b>${j.city}, ${j.cty.name}</b></div><div><small>Termen</small><b>${j.deadline ? dataSimpla(j.deadline) : 'până se ocupă'}</b></div>${j.where ? h`<div><small>Detalii</small><b>${j.where}</b></div>` : ''}</div>
    <div class="body">${(j.description || '').split('\n').filter(Boolean).map((p) => h`<p>${p}</p>`)}${cerinte.length ? h`<h2>Ce se cere</h2><ul>${cerinte.map((c) => h`<li>${c}</li>`)}</ul>` : ''}</div>
    <div class="apply">${j.applyEmail ? h`<a class="btn" href="mailto:${j.applyEmail}?subject=${encodeURIComponent('Aplicare: ' + j.title)}">Aplică pe e-mail</a>` : ''}${j.applyUrl ? h`<a class="btn ghost" href="${j.applyUrl}" rel="noopener nofollow">Aplică pe site-ul angajatorului</a>` : ''}</div>
    <p class="corr">Anunț ${j.source === 'import' ? 'preluat de pe un site de profil' : 'trimis direct de angajator'}, publicat ${candLung(j.created, acum).toLowerCase()}. Redacția verifică firma, dar nu răspunde pentru condițiile ofertei. Ceva nu e în regulă? <a href="mailto:joburi@cadranul.ro?subject=${encodeURIComponent('Semnalare anunț: ' + j.slug)}">Semnalează anunțul</a>.</p>
  </article>
  <aside class="aside" aria-label="Alte anunțuri"><div class="aside-in"><h2 class="toc-h">Alte joburi în ${j.cty.name}</h2><div class="jobs jobs-col">${alte.map(cardJob)}</div><a class="btn ghost" href="/joburi?judet=${j.cty.slug}">Toate anunțurile din ${j.cty.name}</a></div></aside></div>`
  return pagina({ snap, acum, ed, titlu: `${j.title}, ${j.employer} | Joburi Cadranul`, descriere: `${j.title} la ${j.employer}, ${j.city}. ${j.pay}.`, cale: `/joburi/${j.slug}`, main,
    jsonld: [ld, jsonLdFirimituri([['Joburi', '/joburi'], [j.cty.name, `/joburi?judet=${j.cty.slug}`], [j.title, `/joburi/${j.slug}`]])], client: { pagina: 'job' } })
}

// ——— /farmacii
export function paginaFarmacii(snap: Snap, ed: Reg | null, acum: Date, judet?: string): string {
  const jud = (judet && snap.judBySlug.get(judet)) || ed?.refCounty || null
  const l = jud ? snap.farm.filter((f) => f.cty.id === jud.id) : []
  const orase = [...new Set(l.map((f) => f.city))]
  const sp = l.find((f) => f.sponsor)
  const main = h`${antet([['Cadranul', '/'], ['Farmacii de gardă', '']], jud ? `Farmacii de gardă azi în ${jud.name}` : 'Farmacii de gardă azi', `${dataLunga(acum)}. Programul se poate schimba: sună înainte, dacă poți.`)}
<section class="sec" style="padding-top:0">
  <form class="filters" method="get" action="/farmacii"><label><span>Județul</span><select name="judet">${snap.regs.map((r) => h`<optgroup label="${r.name}">${r.counties.map((c) => h`<option value="${c.slug}"${jud?.id === c.id ? raw(' selected') : ''}>${c.name}</option>`)}</optgroup>`)}</select></label><button class="btn">Arată</button></form>
  ${!jud ? h`<p class="gol">Alege județul.</p>` : l.length ? orase.map((o) => h`<div class="card farm"><h2 class="h3">${ic('pharm')} ${o}</h2>${l.filter((f) => f.city === o).map((f) => h`<div class="u-row"><span><b>${f.name}</b><small>${f.address}, ${f.hours}${f.phone ? h`, <a href="tel:${f.phone.replace(/\s/g, '')}">${f.phone}</a>` : ''}</small></span></div>`)}</div>`) : h`<p class="gol">Lista farmaciilor de gardă din ${jud.name} pentru azi nu a fost încă publicată.</p>`}
  ${sp ? h`<p class="sponsorline"><span>Rubrică susținută de ${sp.name}.</span> <span class="adtag">Publicitate</span></p>` : ''}
  <p class="demo">${demoNota('Listă demonstrativă. ')}Sursa: colegiile farmaciștilor și direcțiile de sănătate publică județene.</p>
</section>`
  return pagina({ snap, acum, ed, titlu: `Farmacii de gardă azi${jud ? ` în ${jud.name}` : ''} | Cadranul`, descriere: 'Farmaciile deschise azi, cu adresa și programul, în județul tău.', cale: jud ? `/farmacii?judet=${jud.slug}` : '/farmacii', main,
    jsonld: [jsonLdFirimituri([['Cadranul', '/'], ['Farmacii de gardă', '/farmacii']])], client: { pagina: 'farmacii' } })
}

// ——— /<sectiune>
export function paginaSectiune(snap: Snap, ed: Reg | null, acum: Date, slug: string): string | null {
  const s = snap.secBySlug.get(slug)
  if (!s) return null
  const arts = snap.arts.filter((a) => a.sec.slug === slug && a.type !== 'advertorial')
  const ord = ed ? arts.filter((a) => a.regKey === ed.key).concat(arts.filter((a) => a.regKey !== ed.key)) : arts
  const main = h`${antet([['Cadranul', '/'], [s.name, '']], s.name, s.desc)}<section class="sec" style="padding-top:0">${grila(ord.slice(0, 30), acum, snap)}</section>`
  return pagina({ snap, acum, ed, titlu: `${s.name}: ultimele știri | Cadranul`, descriere: s.desc || `Știrile din secțiunea ${s.name}, pe Cadranul.`, cale: `/${slug}`, main,
    jsonld: [jsonLdFirimituri([['Cadranul', '/'], [s.name, `/${slug}`]])], client: { pagina: 'sectiune' } })
}

// ——— /judet/<slug>
export function paginaJudet(snap: Snap, ed: Reg | null, acum: Date, slug: string): string | null {
  const j = snap.judBySlug.get(slug)
  if (!j) return null
  const r = snap.regByKey.get(j.regKey)
  const arts = snap.arts.filter((a) => a.counties.some((c) => c.id === j.id) && a.type !== 'advertorial')
  const ev = snap.ev.filter((e) => e.cty.id === j.id)
  const out = snap.out.filter((o) => o.cty.id === j.id)
  const jobs = snap.jobs.filter((x) => x.cty.id === j.id).sort((a, b) => +b.promo - +a.promo).slice(0, 6)
  const w = snap.wx.find((x) => x.city === j.seat)
  const f = snap.fuel.get(j.slug)
  const main = h`${antet([['Cadranul', '/'], [r ? `Ediția ${r.short}` : '', r ? `/editie/${r.slug}` : ''], [j.name, '']], `Județul ${j.name}`, h`Știrile, drumurile, avariile și joburile din ${j.name}. Reședința: ${j.seat}.${r ? h` Face parte din <a href="/editie/${r.slug}">ediția ${r.name}</a>.` : ''}`)}
<section class="sec" style="padding-top:0"><div class="useful">
  ${w ? h`<div class="u-card"><h2 class="h3">${ic(w.w)}Vremea în ${w.city}</h2><div style="display:flex;align-items:flex-end;gap:10px"><span class="u-big num">${w.temp}°</span><span style="font-size:14px;color:var(--ink-2);padding-bottom:4px">${w.cond}</span></div></div>` : ''}
  <div class="u-card"><h2 class="h3">${ic('car')}Drumuri</h2>${ev.length ? ev.map((e) => h`<div class="u-row"><span class="status" style="background:var(--${e.st === 'closed' ? 'red' : e.st === 'ok' ? 'ok' : 'orange'})"></span><span><b>${e.road}, ${e.where}</b><small>${e.what}</small></span></div>`) : h`<div class="u-row">Niciun eveniment anunțat.</div>`}</div>
  <div class="u-card"><h2 class="h3">${ic('outage')}Avarii</h2>${out.length ? out.map((o) => h`<div class="u-row"><span class="ico ${o.k}" style="width:22px;height:22px;border-radius:6px;box-shadow:none;flex:none">${ic(o.k)}</span><span><b>${o.city}: ${o.t}</b><small>${o.d}</small></span></div>`) : h`<div class="u-row">Nicio avarie anunțată.</div>`}</div>
  <div class="u-card"><h2 class="h3">${ic('car')}Carburant azi</h2>${f ? h`<div class="fuel${f.vechi ? ' vechi' : ''}" title="${f.vechi ? `Ultimele prețuri: ${f.azi.day}` : ''}"><div><small>Benzină</small><b class="num">${fmt(f.azi.petrol, 2)}</b></div><div><small>Motorină</small><b class="num">${fmt(f.azi.diesel, 2)}</b></div><div><small>GPL</small><b class="num">${fmt(f.azi.lpg, 2)}</b></div></div><a href="/farmacii?judet=${j.slug}" class="more" style="font-size:13.5px;font-weight:650;color:var(--brand);text-decoration:none">Farmacii de gardă în ${j.name}</a>` : h`<div class="u-row">Fără date azi.</div>`}</div>
</div></section>
<section class="sec" aria-labelledby="jn"><div class="sec-h"><div><h2 id="jn">Știri din ${j.name}</h2></div></div>${grila(arts.slice(0, 24), acum, snap, `Nicio știre din ${j.name} în ultimele zile.`)}</section>
${jobs.length ? h`<section class="sec" aria-labelledby="jj"><div class="sec-h"><div><h2 id="jj">Locuri de muncă în ${j.name}</h2></div><a class="more" href="/joburi?judet=${j.slug}">Toate</a></div><div class="jobs">${jobs.map(cardJob)}</div></section>` : ''}`
  return pagina({ snap, acum, ed, titlu: `${j.name}: știri, drumuri, avarii și joburi azi | Cadranul`, descriere: `Ce se întâmplă azi în județul ${j.name}: știri, drumuri, avarii, carburant și locuri de muncă.`, cale: `/judet/${j.slug}`, main,
    noindex: arts.length < 3, jsonld: [jsonLdFirimituri([['Cadranul', '/'], [r?.name || 'Ediție', r ? `/editie/${r.slug}` : '/'], [j.name, `/judet/${j.slug}`]])], client: { pagina: 'judet' } })
}

// ——— /autor/<slug>
export function paginaAutor(snap: Snap, ed: Reg | null, acum: Date, slug: string): string | null {
  const a = snap.autBySlug.get(slug)
  if (!a) return null
  const arts = snap.arts.filter((x) => x.authors.some((y) => y.slug === slug))
  const main = h`${antet([['Cadranul', '/'], ['Autori', ''], [a.name, '']], a.name, h`${a.role || ''}${a.base ? `, ${a.base}` : ''}${a.beat ? `. Scrie despre ${a.beat}.` : ''}`)}<section class="sec" style="padding-top:0">${a.bio ? h`<p class="bio">${a.bio}</p>` : ''}${DEMO() ? h`<p class="demo">Autor fictiv, doar pentru versiunea demonstrativă.</p>` : ''}${grila(arts.slice(0, 24), acum, snap)}</section>`
  return pagina({ snap, acum, ed, titlu: `${a.name} | Cadranul`, descriere: `Articolele semnate de ${a.name} în Cadranul.`, cale: `/autor/${slug}`, main,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'Person', name: a.name, jobTitle: a.role, worksFor: { '@type': 'NewsMediaOrganization', name: 'Cadranul' } }], client: { pagina: 'autor' } })
}

// ——— /cauta
export async function paginaCauta(snap: Snap, ed: Reg | null, acum: Date, q: string): Promise<string> {
  const t = q.trim().slice(0, 80)
  let rez: Art[] = []
  if (t.length >= 2) {
    const payload = await payloadul()
    const r = await payload.find({ collection: 'articles', depth: 0, limit: 30, sort: '-publishedAt', overrideAccess: false, select: { slug: true } as never,
      where: { and: [{ _status: { equals: 'published' } }, { or: [{ title: { like: t } }, { dek: { like: t } }] }] } })
    rez = (r.docs as Doc[]).map((d) => snap.artBySlug.get(d.slug)).filter(Boolean) as Art[]
  }
  const main = h`${antet([['Cadranul', '/'], ['Caută', '']], 'Caută în Cadranul')}<section class="sec" style="padding-top:0">
  <form class="filters" method="get" action="/cauta" role="search"><label class="grow"><span>Ce cauți?</span><input type="search" name="q" value="${t}" placeholder="ex. pensii, DN6, apa caldă Craiova" autofocus></label><button class="btn">Caută</button></form>
  ${t.length >= 2 ? h`<p class="count">${rez.length ? `${rez.length} rezultate pentru „${t}”.` : `Niciun rezultat pentru „${t}”. Încearcă un cuvânt mai scurt.`}</p>${rez.length ? h`<div class="grid">${rez.map((a, i) => stCard(a, i + 1, acum, snap))}</div>` : ''}` : ''}
</section>`
  return pagina({ snap, acum, ed, titlu: t ? `„${t}”: căutare | Cadranul` : 'Caută | Cadranul', descriere: 'Caută în articolele Cadranul.', cale: '/cauta', main, noindex: true, client: { pagina: 'cauta' } })
}

// ——— /live/<slug>
export async function paginaLive(snap: Snap, ed: Reg | null, acum: Date, slug: string): Promise<string | null> {
  const payload = await payloadul()
  const r = await payload.find({ collection: 'liveblogs', where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] }, depth: 1, limit: 1, overrideAccess: false })
  const d = r.docs[0] as Doc | undefined
  if (!d) return null
  const intrari = ((d.entries || []) as Doc[]).map((e) => ({ ...e, t: new Date(e.at) }) as Doc).sort((a, b) => +b.t - +a.t)
  const img = imagine(d.image, new Map())
  const activ = d.liveState === 'activ'
  const u = SITE_URL()
  const main = h`<div class="art"><article class="art-main" aria-labelledby="lvT">
    <div class="crumb"><a href="/">Prima pagină</a><span>/</span><span>${d.section?.name || 'Live'}</span><span class="lv livetag">${activ ? 'LIVE' : 'Încheiat'}</span></div>
    <h1 id="lvT">${d.title}</h1>
    <p class="dek">${d.dek || ''}</p>
    <figure><img src="${img.src}" alt="${img.alt}"><figcaption>${img.caption || ''}</figcaption></figure>
    ${((d.keyPoints || []) as Doc[]).length ? h`<div class="brief"><h2>Pe scurt</h2><ul>${((d.keyPoints || []) as Doc[]).map((k) => h`<li>${k.x}</li>`)}</ul></div>` : ''}
    <ol class="live-list">${intrari.map((e) => h`<li class="${e.kind === 'important' ? 'imp' : ''}"><time datetime="${e.t.toISOString()}">${hhmm(e.t)}</time><div>${e.title ? h`<h2>${e.title}</h2>` : ''}<p>${e.x}</p>${e.author && typeof e.author === 'object' ? h`<small>${e.author.name}</small>` : ''}</div></li>`)}</ol>
    <div class="corr">Relatarea se actualizează ${activ ? 'pe măsură ce aflăm' : 'nu mai este actualizată'}. Corecturi: <a href="mailto:corecturi@cadranul.ro">corecturi@cadranul.ro</a>.</div>
  </article><aside class="aside" aria-label="Lateral"><div class="aside-in">${reclama('half', 'live-lateral', { titlu: 'Anvelope de iarnă, montaj în aceeași zi.', sub: 'Service Auto Bănie, Craiova. Programare online.', img: '/img/26-drum-700.jpg' })}</div></aside></div>`
  const ld = { '@context': 'https://schema.org', '@type': 'LiveBlogPosting', headline: d.title, description: d.dek, url: `${u}/live/${slug}`, coverageStartTime: new Date(d.publishedAt || d.createdAt).toISOString(), ...(activ ? {} : { coverageEndTime: intrari[0]?.t.toISOString() }),
    liveBlogUpdate: intrari.slice(0, 20).map((e) => ({ '@type': 'BlogPosting', headline: e.title || e.x.slice(0, 100), datePublished: e.t.toISOString(), articleBody: e.x })), publisher: jsonLdOrganizatie(snap) }
  return pagina({ snap, acum, ed, titlu: `LIVE: ${d.title} | Cadranul`, descriere: d.dek || d.title, cale: `/live/${slug}`, main, tip: 'article', imagine: img.src, jsonld: [ld], client: { pagina: 'live' } })
}

// ——— /pagina/<slug>
export async function paginaLegala(snap: Snap, ed: Reg | null, acum: Date, slug: string): Promise<string | null> {
  const payload = await payloadul()
  const r = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, depth: 0, limit: 1 })
  const d = r.docs[0] as Doc | undefined
  if (!d) return null
  const main = h`<div class="legal">${antet([['Cadranul', '/'], [d.title, '']], d.title, d.updated ? `Actualizat: ${d.updated}` : undefined)}
  <section class="sec" style="padding-top:0">${d.lawyerReviewed ? '' : h`<p class="protonote">Model de text, de verificat de avocat înainte de lansare.</p>`}<div class="body prose">${raw(String(d.html || ''))}</div></section></div>`
  return pagina({ snap, acum, ed, titlu: `${d.title} | Cadranul`, descriere: d.description || d.title, cale: `/pagina/${slug}`, main, client: { pagina: 'legal' } })
}

// ——— 404
export function pagina404(snap: Snap, ed: Reg | null, acum: Date): string {
  const sel = selectie(snap, ed, acum, null)
  const main = h`${antet([['Cadranul', '/']], 'Pagina nu există', 'Adresa e greșită sau articolul a fost mutat. Încearcă o căutare sau mergi la prima pagină.')}
<section class="sec" style="padding-top:0"><form class="filters" method="get" action="/cauta" role="search"><label class="grow"><span>Caută</span><input type="search" name="q" placeholder="ex. pensii, DN6"></label><button class="btn">Caută</button></form>
<div class="sec-h"><div><h2>Azi, pe scurt</h2></div></div><ol class="most">${sel.seven.slice(0, 5).map((a) => h`<li><span><a href="/articol/${a.slug}">${a.title}</a><small>${a.label}, ${cand(a.pub, acum)}</small></span></li>`)}</ol></section>`
  return pagina({ snap, acum, ed, titlu: 'Pagina nu există | Cadranul', descriere: 'Pagina nu există.', cale: '/404', main, noindex: true, client: { pagina: '404' } })
}

export { newsletter, cardFarmacii, randuriDrumuri }
