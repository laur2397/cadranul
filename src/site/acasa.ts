import 'server-only'
import { fmt, pad } from '../shared/format'
import { D } from '../shared/harta'
import { dialHTML, dialTextHTML, fereastraIeftina } from '../shared/energie'
import { frazaHTML, frazaText } from '../shared/fraza'
import { h, raw, type Safe } from './html'
import type { Art, Prov, Reg, Snap } from './date'
import { dateHarta, instrument, inEditie } from './harta'
import { billboard } from './reclame'
import { ic, pagina } from './shell'
import { cand, candLung, dataLunga, hhmm, oraRO, salut, ziRO } from './timp'
import { jsonLdOrganizatie, jsonLdSite } from './seo'

const imp = (l: Art[]) => [...l].sort((a, b) => a.prio - b.prio || +b.pub - +a.pub)
const noi = (l: Art[]) => [...l].sort((a, b) => +b.pub - +a.pub)
const STL: Record<string, string> = { ok: 'normal', slow: 'aglomerat', works: 'lucrări', closed: 'închis' }

/** Ce articole intra in fiecare bloc al primei pagini (manual din /admin, completat automat) */
export function selectie(snap: Snap, ed: Reg | null, acum: Date, ultimaVizita: number | null) {
  const key = ed?.key || 'nat'
  const pr = snap.prima.get(key)
  const recent = (l: Art[], ore: number) => l.filter((a) => +acum - +a.pub < ore * 3600e3)
  const nat = snap.arts.filter((a) => a.regKey === '' && a.type !== 'advertorial')
  const own = ed ? snap.arts.filter((a) => a.regKey === ed.key && a.type !== 'advertorial') : []
  const larg = ed ? own : snap.arts.filter((a) => (a.regKey === '' || a.prio <= 2) && a.type !== 'advertorial')
  const umple = (manual: string[] | undefined, auto: Art[], n: number) => {
    const ids = (manual || []).filter((s) => snap.artBySlug.has(s))
    for (const a of auto) { if (ids.length >= n) break; if (!ids.includes(a.slug)) ids.push(a.slug) }
    return ids.slice(0, n).map((s) => snap.artBySlug.get(s)!)
  }
  const autoImp = ed ? imp(recent(own, 48)).concat(imp(recent(nat, 48)), imp(own), imp(nat)) : imp(recent(larg, 48)).concat(imp(larg))
  const catchUp = umple(pr?.catchUp, autoImp, 5)
  const seven = umple(pr?.seven, ed ? imp(recent(own, 48)).slice(0, 4).concat(imp(recent(nat, 48)), imp(own), imp(nat)) : imp(recent(nat, 48)).concat(imp(larg)), 7)
  const most = umple(pr?.most, autoImp, 5)
  const top = (pr?.top && snap.artBySlug.get(pr.top)) || (ed ? imp(own)[0] : imp(nat)[0]) || snap.arts[0]
  let stiri = noi(recent(larg.filter((a) => a.place), ed ? 72 : 48)).slice(0, 14)
  if (stiri.length < 4) stiri = noi(larg.filter((a) => a.place)).slice(0, 14)
  for (const a of [...catchUp, top]) if (a?.place && !stiri.includes(a) && (!ed || a.regKey === ed.key || a.prio <= 2)) stiri.push(a)
  const grila = ed ? noi(own).concat(noi(nat)) : noi(larg)
  const set = new Set<string>()
  if (ultimaVizita) { for (const a of snap.arts) if (+a.pub > ultimaVizita) set.add(a.slug) }
  else { for (const a of catchUp) set.add(a.slug); for (const a of recent(larg, 12)) if (a.prio <= 1) set.add(a.slug) }
  const callouts = (pr?.callouts || []).filter((c) => snap.artBySlug.has(c.slug))
  return { catchUp, seven, most, top, stiri, grila, noi: set, callouts }
}

/** Fraza automata (cand redactia nu a scris una), ca sumFor() din prototip */
function frazaAuto(snap: Snap, ed: Reg | null, h0: number): string {
  const ok = inEditie(ed)
  const w = snap.wx.find((x) => x.key === (ed ? ed.cityKey : 'Bucuresti'))
  const ev = snap.ev.find((e) => ok(e.regKey) && e.st !== 'ok')
  const a = snap.alerte.find((x) => !ed || x.counties.some((c) => c.regKey === ed.key))
  const pr = snap.pret?.values
  const f = pr ? fereastraIeftina(pr) : null
  // vremea pe orase e inca demonstrativa (fara sursa automata): in versiunea demonstrativa nu o punem in fraza
  let s = w && process.env.NEXT_PUBLIC_DEMO !== 'true' ? `${w.cond || 'Vremea'} la ${w.city}, ${w.temp}°C. ` : ''
  if (a) s += `{vreme|${a.text}}. `
  s += ev ? `Pe {drum|${ev.road}|${ev.where.split(',')[0]}}: ${ev.what.charAt(0).toLowerCase() + ev.what.split('.')[0].slice(1)}. ` : 'Drumurile sunt libere. '
  if (f !== null) s += `Curentul e cel mai ieftin azi între {ieftin|${pad(f)}:00 și ${pad(f + 3)}:00}.`
  void h0
  return s
}

export function frazaSiSalut(snap: Snap, ed: Reg | null, acum: Date) {
  const key = ed?.key || 'nat'
  const f = snap.fraze.find((x) => x.edition === key)
  const { h: ora } = oraRO(acum)
  return {
    salut: f?.greeting || `${salut(ora)}, ${ed ? ed.city : 'România'}.`,
    fraza: f?.phrase || frazaAuto(snap, ed, ora),
  }
}

function cardVreme(snap: Snap, ed: Reg | null): Safe {
  const w = snap.wx.find((x) => x.key === (ed ? ed.cityKey : 'Bucuresti'))
  const alerte = snap.alerte.filter((a) => !ed || a.counties.some((c) => c.regKey === ed.key))
  let cod = ''
  if (ed) cod = alerte[0]?.text || ''
  else if (alerte.length) {
    const culori = new Set(alerte.map((a) => a.code))
    const nume = { yellow: 'galben', orange: 'portocaliu', red: 'roșu' } as Record<string, string>
    cod = culori.size === 1 ? `Cod ${nume[alerte[0].code]}: ${[...new Set(alerte.map((a) => a.phen))].join(', ')}` : alerte.map((a) => a.text).join('; ')
  }
  const codSursa = alerte.some((a) => a.imp) ? ` (Sursa: ${[...new Set(alerte.filter((a) => a.imp).map((a) => a.src))].join(', ')})` : ''
  if (!w) return h`<div class="u-card"><h3>${ic('cloud')}Vremea</h3><div class="u-row">Datele meteo se actualizează.</div></div>`
  return h`<div class="u-card"><h3>${ic(w.w)}Vremea în ${w.city}</h3><div style="display:flex;align-items:flex-end;gap:10px"><span class="u-big num">${w.temp}°</span><span style="font-size:14px;color:var(--ink-2);padding-bottom:4px">${w.cond}</span></div>${w.hours.length ? h`<div class="hours">${w.hours.map((o) => h`<div>${o.h}:00<b>${o.t}°</b></div>`)}</div>` : ''}${cod ? h`<div class="alert" style="margin:4px 0 0;padding:8px 10px;font-size:13px">${ic('warn')}<span>${cod}${codSursa}</span></div>` : ''}</div>`
}

/** „Sursa: ANM, actualizat azi, la 14:05” pentru datele aduse de importurile automate (gol pentru cele scrise de redacție) */
export function notaSursa(l: Prov[], acum = new Date()): string {
  const imp = l.filter((p) => p.imp)
  if (!imp.length) return ''
  const surse = [...new Set(imp.map((p) => p.src).filter(Boolean))].join(', ')
  const upd = new Date(Math.max(...imp.map((p) => +p.upd)))
  return `Sursa: ${surse}, actualizat ${candLung(upd, acum).replace(/^Azi/, 'azi').replace(/^Aseară/, 'aseară').replace(/^Ieri/, 'ieri').replace(/^Pe /, 'pe ')}.`
}
const subsolSursa = (l: Prov[]) => { const n = notaSursa(l); return n ? h`<div class="demo src">${n}</div>` : '' }

export function cardFarmacii(snap: Snap, ed: Reg | null, link = true): Safe {
  if (!ed) return h`<div class="u-card"><h3>${ic('pharm')}Farmacii de gardă</h3><div class="u-row" style="flex-direction:column;align-items:flex-start;gap:8px">Ca să vezi farmaciile deschise acum lângă tine, alege orașul.<button class="btn" data-open-sheet>Alege ediția</button></div></div>`
  const j = ed.refCounty
  const l = snap.farm.filter((f) => j && f.cty.id === j.id && (f.city === ed.city || f.city === j.seat)).slice(0, 3)
  const sp = l.find((f) => f.sponsor)
  return h`<div class="u-card"><h3>${ic('pharm')}Farmacii de gardă azi</h3>${l.length ? l.map((p) => h`<div class="u-row"><span><b>${p.name}</b><small>${p.address}, ${p.hours}</small></span></div>`) : h`<div class="u-row">Lista de azi nu a fost încă publicată.</div>`}${link && j ? h`<a class="more" href="/farmacii?judet=${j.slug}" style="font-size:13.5px;font-weight:650;color:var(--brand);text-decoration:none">Toate farmaciile din ${j.name}</a>` : ''}${sp ? h`<div class="adlabel" style="margin-top:auto"><span>Rubrică susținută de ${sp.name}. Publicitate</span></div>` : ''}</div>`
}

export function utile(snap: Snap, ed: Reg | null): Safe {
  const ok = inEditie(ed)
  const ev = snap.ev.filter((e) => ok(e.regKey) && e.st !== 'ok').slice(0, 3)
  const outs = snap.out.filter((o) => ok(o.regKey)).slice(0, 4)
  return h`${cardVreme(snap, ed)}<div class="u-card"><h3>${ic('car')}Trafic acum</h3>${ev.length ? ev.map((e) => h`<div class="u-row"><span class="status" style="background:var(--${e.st === 'closed' ? 'red' : 'orange'})"></span><span><b>${e.road}, ${e.where}</b><small>${e.what}</small></span></div>`) : h`<div class="u-row">Drumuri libere în regiune.</div>`}${subsolSursa(ev)}</div><div class="u-card"><h3>${ic('outage')}Avarii: apă, curent, gaz</h3>${outs.length ? outs.map((o) => h`<div class="u-row"><span class="ico ${o.k}" style="width:22px;height:22px;border-radius:6px;box-shadow:none;flex:none">${ic(o.k)}</span><span><b>${o.city}: ${o.t}</b><small>${o.d}</small></span></div>`) : h`<div class="u-row">Nicio avarie anunțată.</div>`}${subsolSursa(outs)}</div>${cardFarmacii(snap, ed)}`
}

export function alertaDrumuri(snap: Snap, ed: Reg | null): Safe {
  const l = snap.alerte.filter((a) => !ed || a.counties.some((c) => c.regKey === ed.key))
  const a = ed ? l[0] : [...l].sort((x, y) => y.counties.length - x.counties.length)[0]
  if (!a) return h``
  return h`<div class="alert" id="roadAlert">${ic('warn')}<span><b>${a.text}.</b> ${a.roads}${a.imp ? ` Sursa: ${a.src}.` : ''}</span></div>`
}

export function randuriDrumuri(snap: Snap, ed: Reg | null, n = 7): Safe {
  const ok = inEditie(ed)
  const evs = snap.ev.filter((e) => ok(e.regKey)).sort((a, b) => +(a.st === 'ok') - +(b.st === 'ok'))
  if (!evs.length) return h`<p class="demo" style="margin:6px 0">Niciun drum închis, accident sau coadă raportată acum.</p>`
  return h`${evs.slice(0, n).map((e) => h`<div class="rrow"><span class="shield ${e.a ? 'a' : 'd'}">${e.road}</span><span><b>${e.where}</b><small>${e.what}</small></span><span class="st ${e.st}">${e.st === 'ok' ? 'normal' : e.lab}</span></div>`)}`
}

export function timpi(snap: Snap, ed: Reg | null): Safe {
  let l = snap.timpi.filter((t) => t.regKey === (ed?.key || ''))
  if (!l.length) l = snap.timpi.filter((t) => t.regKey === '')
  if (!l.length) return h`<p class="demo" style="margin:6px 0">Timpii de parcurs nu sunt încă disponibili.</p>`
  return h`${l.map((t) => h`<div class="rrow" style="grid-template-columns:1fr auto auto"><span><b>${t.route}</b></span><b class="num">${t.duration}</b><span class="st ${t.st}">${t.delta}</span></div>`)}`
}

export function cardJob(j: Snap['jobs'][number]): Safe {
  return h`<a class="job ${j.promo ? 'promo' : ''}" href="/joburi/${j.slug}">${j.promo ? h`<span class="pl">Promovat</span>` : ''}<b>${j.title}</b><span class="co">${j.employer}</span><span class="pay">${j.pay}</span><span class="where">${j.cty.name}${j.where ? `, ${j.where}` : ''}</span></a>`
}

export function stCard(a: Art, i: number, acum: Date, snap: Snap): Safe {
  const loc = a.counties[0]?.name || (a.regKey ? snap.regByKey.get(a.regKey)?.short : 'România') || 'România'
  return h`<a class="st-card ${i === 0 ? 'xl' : ''}" href="/articol/${a.slug}" data-cty="${a.counties.map((c) => c.slug).join(' ')}" data-id="${a.slug}"><div class="ph"><img src="${a.img.src}" alt="" loading="${i < 2 ? 'eager' : 'lazy'}"></div><div class="tx"><span class="meta"><span class="loc">${loc}</span><span>${a.label}, ${cand(a.pub, acum)}</span></span><h3>${a.title}</h3><p>${a.dek}</p></div></a>`
}

export const minute = (a: Art) => a.min

export function fuelCard(snap: Snap, ed: Reg | null) {
  const n = snap.fuelNat
  const j = ed?.refCounty
  const fjAll = j ? snap.fuel.get(j.slug) : null
  const fj = fjAll && !fjAll.vechi ? fjAll : null
  const f: [number, number, number] = fj ? [fj.azi.petrol, fj.azi.diesel, fj.azi.lpg] : n.azi
  const names = ['Benzină', 'Motorină', 'GPL']
  const cells = f.map((v, i) => {
    const d = fj ? +(v - n.azi[i]).toFixed(2) : n.ieri ? +(v - n.ieri[i]).toFixed(2) : 0
    const txt = fj ? (d === 0 ? 'ca media' : (d > 0 ? '+' : '') + fmt(d, 2)) : (d > 0 ? '+' : d < 0 ? '' : '') + fmt(d, 2)
    return h`<div><small>${names[i]}</small><b class="num">${fmt(v, 2)}</b><em class="${d > 0 ? 'up' : 'down'}">${txt}</em></div>`
  })
  const unde = j && fj ? `${j.name}, față de media țării` : 'media țării, față de ieri'
  const vechi = !fj && n.vechi ? n.vechi : ''
  const p = fj ? fj.azi : n.prov
  const nota = [vechi ? `Ultimele prețuri publicate: ${vechi}.` : '', fj?.azi.note ? `Cel mai ieftin azi: ${fj.azi.note}.` : '', p ? notaSursa([p]) : ''].filter(Boolean).join(' ')
  return { cells, unde, nota, f, vechi }
}

export function paginaAcasa(snap: Snap, ed: Reg | null, acum: Date, ultimaVizita: number | null): string {
  const sel = selectie(snap, ed, acum, ultimaVizita)
  const { h: ora, m: min } = oraRO(acum)
  const { salut: sal, fraza } = frazaSaluta(snap, ed, acum)
  const dh = dateHarta(snap, ed, { stiri: sel.stiri, noi: sel.noi, callouts: sel.callouts, acum })
  const regN = ed ? (ed.short === 'Oltenia' ? 'Oltenia' : ed.name) : ''
  const pr = snap.pret?.values
  const fc = fuelCard(snap, ed)
  const ok = inEditie(ed)
  const totalJob = ed ? dh.jobsReg[ed.key] : Object.values(dh.jobsReg).reduce((a, b) => a + b, 0)
  const joburi = snap.jobs.filter((j) => ok(j.regKey)).sort((a, b) => +b.promo - +a.promo || +b.created - +a.created).slice(0, 6)
  const catchPrefix = ultimaVizita ? candLung(new Date(ultimaVizita), acum) : 'Azi, pe scurt'
  const nC = sel.catchUp.length
  const LUCRURI = ['', 'Un lucru contează', 'Două lucruri contează', 'Trei lucruri contează', 'Patru lucruri contează', 'Cinci lucruri contează']
  const top = sel.top
  const grila = sel.grila.slice(0, 12)
  const judete = ed ? ed.counties : []
  const pensie = snap.pensie
  const pensieDemo = 2450
  const pretVechi = snap.pret && snap.pret.day < ziRO(acum) ? snap.pret.day : ''

  const main = h`
<div id="home">
  <section class="hero" id="acum" aria-labelledby="greet">
    <div class="hero-in">
      <div class="h-title">
        <p class="h-date"><span id="hDate">${dataLunga(acum)}, ora ${hhmm(acum)}</span><span class="edtag" id="hEd">${ed ? `Ediția ${ed.name}` : 'Ediția națională'}</span></p>
        <h1 class="greet" id="greet">${sal}</h1>
      </div>
      <p class="h-sum" id="hSum">${raw(frazaHTML(fraza))}</p>
      ${instrument(snap, ed, dh, hhmm(acum))}
      <div class="h-catch">
        <section class="catch" id="catch" aria-labelledby="catchT" data-prefix="${catchPrefix}">
          <div class="catch-h">
            <div class="ring"><svg viewBox="0 0 46 46" aria-hidden="true"><circle class="bg" cx="23" cy="23" r="19"/><circle class="fg" id="ringFg" cx="23" cy="23" r="19" stroke-dasharray="119.4" stroke-dashoffset="119.4"/></svg><b id="ringTxt">0/${nC}</b></div>
            <div><h2 id="catchT">De la ultima ta vizită</h2><p id="catchSub">${catchPrefix}. ${LUCRURI[nC] || `${nC} lucruri contează`}.</p></div>
          </div>
          <div id="catchList">${sel.catchUp.map((a) => h`<div class="citem" data-id="${a.slug}"><button class="tick" aria-pressed="false" aria-label="Marchează ca citit: ${a.title}">${ic('check')}</button><div><a href="/articol/${a.slug}">${a.title}</a><small>${a.place ? h`<span class="where">${a.place.name}</span>, ` : ''}${cand(a.pub, acum)}, ${minute(a)} min</small></div></div>`)}</div>
          <div class="uptodate"><b>Ești la zi.</b><span>${snap.nextUpdate}</span></div>
        </section>
      </div>
      <aside class="side" aria-label="Pe scurt">
        <section class="card" id="energie" aria-labelledby="enT">
          <div class="card-h"><h3 id="enT">Curentul azi, oră de oră</h3><small>${snap.pret ? 'OPCOM' : ''}</small></div>
          ${pr ? h`<div class="dialwrap"><div class="dial" id="dial">${raw(dialHTML(pr, ora, min))}</div><div class="dialtxt" id="dialTxt">${raw(dialTextHTML(pr, ora, '/energie', snap.pretMaine?.values))}</div></div><div class="dialtip" id="dialTip" aria-live="polite"></div>` : h`<p class="dialtxt">Prețurile de azi nu au fost încă publicate.</p>`}
          <div class="demo">${pretVechi ? `Ultimele prețuri publicate: ${pretVechi}. ` : ''}${process.env.NEXT_PUBLIC_DEMO === 'true' && !snap.pret?.imp ? 'Cifre demonstrative. ' : ''}${snap.pret ? notaSursa([snap.pret], acum) + ' ' : ''}Contează direct dacă ai contract cu preț dinamic.</div>
        </section>
        <section class="card" aria-labelledby="fuT">
          <div class="card-h"><h3 id="fuT">Carburant azi</h3><small id="fuWhere">${fc.unde}</small></div>
          <div class="fuel${fc.vechi ? ' vechi' : ''}" id="fuel">${fc.cells}</div>
          <div class="demo" style="margin-top:6px" id="fuNote">${fc.nota} ${process.env.NEXT_PUBLIC_DEMO === 'true' && !fc.vechi && !snap.fuelNat.prov?.imp ? 'Prețuri demonstrative, lei/litru.' : 'Lei/litru.'}</div>
        </section>
        ${top ? h`<a class="topstory" id="topStory" href="/articol/${top.slug}" data-id="${top.slug}"><div class="ph"><img src="${top.img.src}" alt="" fetchpriority="high"><span>${sel.noi.has(top.slug) ? `Acum, ${cand(top.pub, acum)}` : top.label}</span></div><div class="tx"><h2>${top.title}</h2><p>${top.dek}</p></div></a>` : ''}
      </aside>
    </div>
  </section>

  <section class="seven-band" aria-labelledby="s7T">
    <div class="sec">
      <div class="sec-h">
        <div><h2 id="s7T">Ziua în 7 subiecte</h2><p id="s7Sub">Tot ce contează azi, în ordinea importanței. Le bifezi pe măsură ce le citești.</p></div>
        <div class="prog"><span id="s7Count">0 din ${sel.seven.length} citite</span><span class="track"><i id="s7Bar"></i></span></div>
      </div>
      <div class="seven" id="seven">${sel.seven.map((a, i) => h`<a class="s7" data-id="${a.slug}" href="/articol/${a.slug}"><div class="ph"><img src="${a.img.src}" alt="" loading="lazy"><span class="no">${i + 1}</span><span class="chk">${ic('check')}</span></div><b>${a.title}</b><small>${a.label}, ${minute(a)} min${a.slug.includes('pensi') ? ', cu calculator' : ''}</small></a>`)}</div>
    </div>
  </section>

  <section class="sec" id="utile" aria-labelledby="uT">
    <div class="sec-h"><div><h2 id="uT">${ed ? `${salut(ora)}, ${ed.city}` : 'Utile acum'}</h2><p id="uSub">${ed ? `Ce trebuie să știi înainte să ieși din casă în ${regN}.` : 'Vremea, traficul, avariile și farmaciile de gardă. Alege o regiune pentru orașul tău.'}</p></div></div>
    <div class="useful" id="useful">${utile(snap, ed)}</div>
  </section>

  <section class="sec" id="drumuri" aria-labelledby="rT">
    <div class="sec-h"><div><h2 id="rT">Starea drumurilor</h2><p>Drumuri închise, lucrări, cozi și coduri meteo pe drumurile naționale și autostrăzi.</p></div><a class="more" href="#acum" data-layer="drumuri">Vezi pe hartă</a></div>
    <div class="roads">
      <div>${alertaDrumuri(snap, ed)}<div class="rlist" id="rlist">${randuriDrumuri(snap, ed)}</div><a class="more" href="/drumuri" style="display:inline-block;margin-top:10px;font-size:14px;font-weight:650;color:var(--brand);text-decoration:none">Toate drumurile</a></div>
      <div class="rmini">
        <div class="card-h"><h3>Cât stai pe drum azi</h3><small>față de o zi obișnuită</small></div>
        <div class="rlist" id="rtimes">${timpi(snap, ed)}</div>
        <div class="demo" style="margin-top:8px">${snap.timpi.length ? (process.env.NEXT_PUBLIC_DEMO === 'true' ? 'Timpi estimați, demonstrativi.' : 'Timpi estimați.') : ''}</div>
      </div>
    </div>
  </section>

  <section class="sec" id="stiri" aria-labelledby="nT">
    <div class="sec-h"><div><h2 id="nT">${ed ? `Știrile din ${regN}` : 'Știrile zilei'}</h2><p id="nSub">${ed ? 'Întâi ce e la tine, apoi ce contează în toată țara.' : 'Din toată țara. Alege o regiune pe hartă ca să vezi întâi ce e la tine.'}</p></div></div>
    ${ed?.sponsor ? h`<p class="sponsorline"><span>${ed.sponsor.line || `Ediția ${ed.short} este susținută de ${ed.sponsor.name}.`}</span> <span class="adtag">Publicitate</span></p>` : ''}
    <div class="chips" id="ctyChips">${ed ? h`<button class="ftag" aria-pressed="true" data-c="">Toată regiunea</button>${judete.map((c) => h`<button class="ftag" aria-pressed="false" data-c="${c.slug}">${c.name}</button>`)}` : snap.regs.map((r) => h`<a class="ftag" href="/editie/${r.slug}" data-r="${r.key}">${r.name}</a>`)}</div>
    <div class="grid" id="grid">${grila.map((a, i) => (i === 5 ? h`${nativ(ed)}${stCard(a, i, acum, snap)}` : stCard(a, i, acum, snap)))}</div>
    <p class="gridempty" id="gridEmpty" hidden>Nicio știre din acest județ azi. <a href="#" data-c-reset>Vezi toată regiunea</a>.</p>
  </section>

  <div class="sec">${billboard(ed ? `editie-billboard` : 'acasa-billboard', { firma: 'Termo Jiu, Târgu Jiu', titlu: 'Centrală nouă în condensare, montată în 48 de ore.', sub: 'Rate fără dobândă 12 luni. Oferta e valabilă în Oltenia.', img: '/img/25-fabrica-700.jpg' })}</div>

  <section class="sec" id="bani" aria-labelledby="cT">
    <div class="sec-h"><div><h2 id="cT">Cât primești tu</h2><p>Calculează în 10 secunde ce înseamnă știrile de azi pentru buzunarul tău.</p></div></div>
    <div class="calcs">${calcPensie(pensie, pensieDemo)}${calcCurent(snap)}${calcPlin(snap, ed, fc.f)}</div>
  </section>

  <section class="sec" id="joburi" aria-labelledby="jT">
    <div class="sec-h"><div><h2 id="jT">${ed ? `Locuri de muncă în ${regN}` : 'Locuri de muncă'}</h2><p id="jSub">${fmt(totalJob)} de anunțuri active. Cele marcate „Promovat” sunt plătite de angajatori.</p></div><a class="more" href="#acum" data-layer="joburi">Vezi pe hartă</a></div>
    <div class="jobs" id="jobs">${joburi.map(cardJob)}</div>
    <div class="jobs-cta"><span><b>Angajezi?</b> Anunțul tău, promovat în ediția regiunii tale, de la 149 lei pe săptămână.</span><a class="btn" href="/pagina/publicitate#joburi">Publică un anunț</a></div>
  </section>

  <section class="sec" aria-labelledby="mT">
    <div class="two">
      <div>
        <div class="sec-h"><div><h2 id="mT">Cele mai citite</h2><p id="mSub">${ed ? `Azi, în ${regN}` : 'Azi, în toată țara'}</p></div></div>
        <ol class="most" id="most">${sel.most.map((a) => h`<li><span><a href="/articol/${a.slug}">${a.title}</a><small>${a.label}, ${minute(a)} min</small></span></li>`)}</ol>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        ${newsletter(ed)}
        <div class="card"><h3 style="margin:0 0 6px;font-size:16px">Susține Cadranul</h3><p style="margin:0 0 10px;font-size:14.5px;color:var(--ink-2)">Avem puține reclame și nicio fereastră care sare peste text. Dacă îți e util, redirecționează 3,5% din impozit sau donează cât vrei.</p><a class="btn ghost" href="/pagina/despre#sustine">Vreau să susțin</a></div>
      </div>
    </div>
  </section>
</div>`

  const titlu = ed ? `Cadranul ${ed.short}: ${ed.city}, oră de oră` : 'Cadranul: România, oră de oră'
  const descriere = ed ? `${ed.city} și ${regN}, acum: ${frazaText(fraza)}`.slice(0, 300) : 'Cadranul: țara ta în timp real. Știri, drumuri, avarii, vremea, prețul curentului și locuri de muncă, pe harta regiunii tale.'
  return pagina({
    snap, acum, ed, titlu, descriere, cale: ed ? `/editie/${ed.slug}` : '/', main,
    jsonld: ed ? [jsonLdOrganizatie(snap)] : [jsonLdOrganizatie(snap), jsonLdSite()],
    rss: ed ? { titlu: `Cadranul ${ed.short}`, href: `/editie/${ed.slug}/rss.xml` } : undefined,
    preincarca: ['/map/relief.jpg'],
    client: {
      pagina: 'acasa', harta: dh, pr: pr || null, prMaine: snap.pretMaine?.values || null, catch: sel.catchUp.map((a) => a.slug), seven: sel.seven.map((a) => a.slug),
      fuel: fc.f, fuelNat: snap.fuelNat.azi, pensie: pensie.pct, regN, nlDemo: process.env.NEXT_PUBLIC_DEMO === 'true',
    },
  })
}

const frazaSaluta = frazaSiSalut

function nativ(ed: Reg | null): Safe {
  if (process.env.NEXT_PUBLIC_DEMO !== 'true') return h``
  return h`<a class="native" href="/pagina/publicitate" rel="sponsored"><div class="adlabel"><span>Publicitate, conținut plătit</span><span>Partener</span></div><div class="ph"><img src="/img/04-bani-pensii-700.jpg" alt="" loading="lazy"></div><h3>Cum îți refinanțezi creditul ${ed ? 'în ' + ed.city : 'acasă'} fără drumuri la bancă</h3><small>Prezentat de Banca Olteniei Credit (nume fictiv)</small></a>`
}

export function newsletter(ed: Reg | null): Safe {
  return h`<div class="nl" id="sustine">
  <h3 id="nlT">${ed ? `Cadranul ${ed.short}, la 7:00` : 'Cadranul de dimineață, la 7:00'}</h3>
  <p id="nlP">${ed ? `${ed.city} în 5 minute: avariile, drumurile, vremea, joburile noi și ora la care curentul e ieftin.` : 'Țara în 5 minute: ce s-a schimbat peste noapte, drumurile, vremea și ora la care curentul e ieftin.'}</p>
  <form id="nlForm"><label class="sr" for="nlE">Adresa de e-mail</label><input id="nlE" type="email" placeholder="adresa ta de e-mail" autocomplete="email" required><button>Abonează-mă</button></form>
  <small>Gratuit. Te dezabonezi cu un clic. Fără reclame în e-mail.</small>
</div>`
}

export function calcPensie(p: { pct: number; from: string }, val: number): Safe {
  const np = Math.round(val * (1 + p.pct / 100))
  return h`<div class="card calc">
  <h3 style="margin:0 0 4px;font-size:17px">Pensia ta din ianuarie</h3>
  <label for="pIn">Pensia de acum, în lei</label>
  <input id="pIn" type="number" inputmode="numeric" value="${val}" min="0" step="10">
  <div class="res"><small>Din ${p.from} (+${fmt(p.pct, 1)}%) primești</small><b class="num" id="pOut">${fmt(np)} lei</b><span id="pDiff">+${fmt(np - val)} lei pe lună, +${fmt((np - val) * 12)} lei pe an</span></div>
  <div class="demo" style="margin-top:8px">Calcul orientativ după proiectul de buget.</div>
</div>`
}

export function calcCurent(snap: Snap, id = ''): Safe {
  const has = !!snap.pret
  return h`<div class="card calc">
  <h3 style="margin:0 0 4px;font-size:17px">Cât economisești la curent</h3>
  <p class="calc-l">Ce muți de seara la prânz?</p>
  <div class="apps" id="apps${id}">
    <label><input type="checkbox" value="1" checked> Mașina de spălat <em>1 kWh/ciclu</em></label>
    <label><input type="checkbox" value="0.9"> Mașina de vase <em>0,9 kWh</em></label>
    <label><input type="checkbox" value="2.2"> Boilerul electric <em>2,2 kWh</em></label>
    <label><input type="checkbox" value="7"> Mașina electrică <em>7 kWh</em></label>
  </div>
  <div class="res"><small>Cu preț dinamic, pe an economisești</small><b class="num" id="eOut${id}">${has ? '…' : '–'}</b><span id="eDiff${id}"></span></div>
</div>`
}

export function calcPlin(snap: Snap, ed: Reg | null, f: [number, number, number]): Safe {
  const j = ed?.refCounty
  return h`<div class="card calc" data-fuel="${f.join(',')}">
  <h3 style="margin:0 0 4px;font-size:17px">Plinul la mașină</h3>
  <label for="fType">Combustibil</label>
  <select id="fType"><option value="b">Benzină standard</option><option value="m">Motorină standard</option><option value="g">GPL</option></select>
  <label for="fL">Litri: <span id="fLv">45</span></label>
  <input id="fL" type="range" min="10" max="80" value="45">
  <div class="res"><small id="fWhere">${j ? `La prețul mediu de azi în ${j.name}` : 'La prețul mediu de azi în țară'}</small><b class="num" id="fOut">${fmt(f[0] * 45, 2)} lei</b><span id="fDiff"></span></div>
</div>`
}

export { D }
