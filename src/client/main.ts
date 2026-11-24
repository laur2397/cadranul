// Scriptul site-ului (singurul JavaScript propriu). Semnele de pe harta sunt doar pentru mouse/deget;
// pentru tastatura si cititoarele de ecran, aceleasi informatii sunt in lista de sub harta (#llist).
// Paginile vin gata desenate de server;
// aici sunt doar interactiunile din designul D: ceasul, straturile hartii si „zborul” spre regiune,
// bifele de citire (pe telefonul cititorului), cadranul curentului, calculatoarele, modul intunecat,
// alegerea editiei si bannerul de cookie. Construit cu esbuild in public/js/cadranul.js.
import { fmt, pad, esc, scurt } from '../shared/format'
import { D, RETEA, smooth, eAutostrada, type Punct } from '../shared/harta'
import { dialHTML, dialTextHTML, economieAnuala, plab, curbaHTML } from '../shared/energie'
import { initConsimtamant } from './consimtamant'
import { I } from '../shared/icons'

type Any = any
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector(s) as T | null
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll(s)] as T[]
const C: Any = (() => { try { return JSON.parse($('#cad-data')?.textContent || '{}') } catch { return {} } })()
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const isMobile = () => innerWidth <= 640
const ls = { get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* privat */ } } }
const ss = { get: (k: string) => { try { return sessionStorage.getItem(k) } catch { return null } }, set: (k: string, v: string) => { try { sessionStorage.setItem(k, v) } catch { /* */ } }, del: (k: string) => { try { sessionStorage.removeItem(k) } catch { /* */ } } }
const cookie = (k: string, v: string | null) => { document.cookie = `${k}=${v === null ? '' : encodeURIComponent(v)}; Path=/; SameSite=Lax; Max-Age=${v === null ? 0 : 31536000}` }

function toast(t: string) {
  const el = $('#toast'); if (!el) return
  el.textContent = t; el.classList.add('on')
  clearTimeout((toast as Any).t); (toast as Any).t = setTimeout(() => el.classList.remove('on'), 2800)
}

/* ============ ora Romaniei ============ */
function acum() {
  const p: Record<string, string> = {}
  for (const x of new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', minute: '2-digit', weekday: 'long', day: 'numeric', month: 'long', hourCycle: 'h23' }).formatToParts(new Date())) p[x.type] = x.value
  return { h: +p.hour, m: +p.minute, zi: `${p.weekday.charAt(0).toUpperCase() + p.weekday.slice(1)}, ${p.day} ${p.month}` }
}
function tick() {
  const { h, m, zi } = acum()
  const c = $('#clock'); if (c) c.textContent = `${pad(h)}:${pad(m)}`
  const d = $('#hDate'); if (d) d.textContent = `${zi}, ora ${pad(h)}:${pad(m)}`
  const a = (((h % 12) + m / 60) / 12) * Math.PI * 2
  const hand = $('#logoHand'); if (hand) { hand.setAttribute('x2', String(16 + Math.sin(a) * 9.5)); hand.setAttribute('y2', String(16 - Math.cos(a) * 9.5)) }
}

/* ============ ultima vizita (cookie functional) ============ */
// „De la ultima ta vizita” = de la sfarsitul sesiunii anterioare (o pauza de peste 30 de minute).
function vizita() {
  const now = Date.now(), seen = Number(ls.get('cad_seen') || 0)
  if (seen && now - seen > 30 * 60e3) cookie('cad_v', String(seen))
  ls.set('cad_seen', String(now))
  addEventListener('pagehide', () => ls.set('cad_seen', String(Date.now())))
}

/* ============ citite ============ */
const read = new Set<string>(JSON.parse(ls.get('cad_read') || '[]'))
const saveRead = () => ls.set('cad_read', JSON.stringify([...read].slice(-400)))
function markRead(id: string, on = true) { on ? read.add(id) : read.delete(id); saveRead(); renderProgress() }

function renderProgress() {
  const c: string[] = C.catch || [], s7: string[] = C.seven || []
  if ($('#catch')) {
    const n = c.filter((id) => read.has(id)).length
    const fg = $('#ringFg'); if (fg) fg.style.strokeDashoffset = String(119.4 * (1 - n / Math.max(1, c.length)))
    const rt = $('#ringTxt'); if (rt) rt.textContent = `${n}/${c.length}`
    $('#catch')!.classList.toggle('all', n === c.length && c.length > 0)
    const L = ['', 'Un lucru contează', 'Două lucruri contează', 'Trei lucruri contează', 'Patru lucruri contează', 'Cinci lucruri contează']
    const sub = $('#catchSub'); if (sub) sub.textContent = n === c.length ? 'Ai citit tot ce conta.' : `${$('#catch')!.dataset.prefix}. ${L[c.length - n] || `${c.length - n} lucruri contează`}.`
    $$('#catchList .citem').forEach((e) => { const on = read.has(e.dataset.id!); e.classList.toggle('done', on); $('.tick', e)?.setAttribute('aria-pressed', String(on)) })
  }
  if ($('#seven')) {
    const m = s7.filter((id) => read.has(id)).length
    const cnt = $('#s7Count'); if (cnt) cnt.textContent = m === s7.length ? `Ești la zi, ${m} din ${s7.length}` : `${m} din ${s7.length} citite`
    const bar = $('#s7Bar'); if (bar) bar.style.width = (m / Math.max(1, s7.length)) * 100 + '%'
    $$('#seven .s7').forEach((e) => e.classList.toggle('done', read.has(e.dataset.id!)))
  }
  if (H) { renderLayers(); if (st.layer === 'stiri') { renderOverlay(); renderLList() } }
}

/* ============ harta ============ */
const H: Any = C.harta || null
const st: Any = { layer: H?.layer || 'stiri', cty: '', vb: [0, 0, 1000, 704] as number[] }
const ED: string = C.ed || ''
const CITY: Record<string, Punct> = H?.cities || {}
const pos = (k: string | Punct): Punct => (Array.isArray(k) ? [(k[0] - 20.2) * 104.71, (48.3 - k[1]) * 150.47] : CITY[k])
const inScope = (r: string) => !ED || r === ED
const STRATURI: [string, string, string][] = [['stiri', 'Știri', 'news'], ['drumuri', 'Drumuri', 'road'], ['vreme', 'Vremea', 'weather'], ['avarii', 'Avarii', 'outage'], ['joburi', 'Joburi', 'jobs']]

function placeEl(el: HTMLElement) {
  const [x, y, w, h] = st.vb; const px = +el.dataset.x!, py = +el.dataset.y!
  const lx = ((px - x) / w) * 100, ly = ((py - y) / h) * 100
  el.style.left = lx + '%'; el.style.top = ly + '%'
  el.classList.toggle('hide', lx < -2 || lx > 102 || ly < -2 || ly > 102)
}
function placeAll() { $$('#ov > [data-x]').forEach(placeEl); drawLeads() }
function drawLeads() {
  $$('#ov .lead').forEach((l) => l.remove())
  const mb = $('#mapbox'); if (!mb) return
  const box = mb.getBoundingClientRect()
  $$('#ov .callout').forEach((c) => {
    const pin = $(`#ov .pin[data-id="${CSS.escape(c.dataset.id!)}"]`); if (!pin || pin.classList.contains('hide')) return
    const pr = pin.getBoundingClientRect(), cr = c.getBoundingClientRect()
    const x1 = pr.left + pr.width / 2 - box.left, y1 = pr.top + pr.height / 2 - box.top
    const cx = Math.max(cr.left, Math.min(x1 + box.left, cr.right)) - box.left, cy = Math.max(cr.top, Math.min(y1 + box.top, cr.bottom)) - box.top
    const dx = cx - x1, dy = cy - y1, len = Math.hypot(dx, dy); if (len < 16) return
    const l = document.createElement('div'); l.className = 'lead'
    l.style.left = x1 + (dx / len) * 12 + 'px'; l.style.top = y1 + (dy / len) * 12 + 'px'; l.style.width = len - 12 + 'px'
    l.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`; $('#ov')!.appendChild(l)
  })
}
function animateVB(to: number[]) {
  const from = st.vb.slice(); const t0 = performance.now(); const dur = reduce ? 0 : 750
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  return new Promise<void>((res) => {
    function f(t: number) {
      const k = dur ? Math.min(1, (t - t0) / dur) : 1; const e = ease(k)
      st.vb = from.map((v: number, i: number) => v + (to[i] - v) * e)
      $('#map')!.setAttribute('viewBox', st.vb.map((v: number) => v.toFixed(2)).join(' '))
      placeAll()
      if (k < 1) requestAnimationFrame(f); else res()
    }
    requestAnimationFrame(f)
  })
}
/** Pleaca spre o editie: tine minte cadrul de acum ca harta sa „zboare” pe pagina urmatoare */
function go(r: string) {
  const slug = r ? C.regs[r]?.slug : ''
  cookie('cad_ed', slug || null)
  if ($('#map')) ss.set('cad_fly', JSON.stringify(st.vb))
  location.href = slug ? `/editie/${slug}` : '/'
}

function stiri(): Any[] { return H?.stiri || [] }
function showTip(r: string) {
  if (ED === r) return
  const R = C.regs[r]; const t = H.tips[r] || [null, 0, 0]
  let tip = $('#mtip'); if (!tip) { tip = document.createElement('div'); tip.id = 'mtip'; tip.className = 'tip'; $('#ov')!.appendChild(tip) }
  tip.textContent = `${R.n}: ${t[0] === null ? '' : t[0] + '°C, '}${t[1]} ${t[1] === 1 ? 'avarie' : 'avarii'}${t[2] ? `, ${t[2]} știri noi` : ''}`
  tip.dataset.x = H.rp[r][0]; tip.dataset.y = H.rp[r][1]; tip.hidden = false; placeEl(tip)
}
function hideTip() { const t = $('#mtip'); if (t) t.hidden = true }
function hl(id: string, on: boolean) { $$(`[data-id="${CSS.escape(id)}"]`).forEach((e) => e.classList.toggle('hl', on)) }
function focusItem(id: string) {
  const li = $(`#llist [data-id="${CSS.escape(id)}"]`); $$('#llist .hl,#ov .hl').forEach((e) => e.classList.remove('hl'))
  if (li) { li.classList.add('hl'); li.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest', inline: 'start' }) }
  hl(id, true)
  if (!isMobile()) location.href = '/articol/' + id
}
function inRegionView(p: Punct) { const [x, y, w, h] = H.vb; return p && p[0] > x && p[0] < x + w && p[1] > y && p[1] < y + h }

function renderOverlay() {
  const ov = $('#ov'); if (!ov) return; ov.innerHTML = ''
  const zoomed = !!ED
  const add = (html: string, x: number, y: number) => { const t = document.createElement('template'); t.innerHTML = html.trim(); const el = t.content.firstChild as HTMLElement; el.dataset.x = String(x); el.dataset.y = String(y); ov.appendChild(el); return el }
  if (!zoomed) Object.keys(H.rp).forEach((r) => { if (r !== 'bi' && C.regs[r]) add(`<span class="regname">${esc(C.regs[r].n)}</span>`, H.rp[r][0], H.rp[r][1]) })
  else Object.entries(H.ctys as Record<string, Any[]>).filter(([, c]) => c[0] === ED).forEach(([n, c]) => add(`<span class="regname" style="display:block;font-style:italic">${esc(c[3])}</span>`, c[1], c[2] + (n === 'Dolj' ? 26 : 16)))
  ;[['Ungaria', 20.45, 46.75], ['Serbia', 20.8, 44.95], ['Republica Moldova', 28.95, 46.55], ['Ucraina', 29.2, 48.1], ['Bulgaria', 26.4, 43.7], ['Marea Neagră', 29.25, 44.4]].forEach(([n, lo, la]) => { const [x, y] = pos([lo as number, la as number]); add(`<span class="nb">${n}</span>`, x, y) })
  const tier1 = ['Bucuresti', 'Cluj-Napoca', 'Timisoara', 'Iasi', 'Constanta', 'Craiova', 'Brasov']
  const tier2 = ['Sibiu', 'Oradea', 'Galati', 'Pitesti', 'Ploiesti', 'Suceava', 'Targu Mures', 'Baia Mare', 'Arad', 'Bacau', 'Tulcea']
  const regPath = zoomed ? ($(`#regs [data-r="${ED}"]`) as unknown as SVGGeometryElement) : null
  const cities = zoomed ? Object.keys(CITY).filter((k) => { const c = CITY[k]; try { return regPath!.isPointInFill(new DOMPoint(c[0], c[1])) } catch { return true } }) : tier1.concat(tier2)
  const occupied: Punct[] = []
  if (st.layer === 'stiri') stiri().forEach((s) => occupied.push([s.x, s.y]))
  if (st.layer === 'avarii') H.out.filter((o: Any) => inScope(o.r)).forEach((o: Any) => occupied.push([o.x, o.y]))
  if (st.layer === 'joburi' && !zoomed) Object.keys(C.regs).forEach((r) => { const k = C.regs[r].ck || null; if (k && CITY[k]) occupied.push(CITY[k]) })
  const near = (c: Punct) => occupied.some((p) => Math.hypot(p[0] - c[0], p[1] - c[1]) < 16)
  const hideCity = st.layer === 'vreme' ? new Set(H.wx.map((w: Any) => w.c)) : new Set()
  const seats = new Set<string>(H.seats || [])
  cities.forEach((k) => {
    if (hideCity.has(k) || (['Curtea de Arges', 'Cartisoara', 'Predeal', 'Otopeni'].includes(k) && !zoomed)) return
    const big = zoomed ? seats.has(k) : tier1.includes(k)
    add(`<span class="city ${big ? 'big' : 'minor'} ${near(CITY[k]) ? 'shift' : ''} ${['Constanta', 'Tulcea'].includes(k) ? 'left' : ''}">${esc(D(k))}</span>`, CITY[k][0], CITY[k][1])
  })
  const L = st.layer
  if (L === 'stiri') {
    const list = stiri()
    const mb = $('#mapbox')!
    const k = (mb.clientWidth || 700) / H.vb[2]; const groups: Any[] = []
    list.forEach((s) => { const p = [s.x, s.y]; const g = groups.find((g) => Math.hypot(g.p[0] - p[0], g.p[1] - p[1]) * k < 24); if (g) g.items.push(s); else groups.push({ p, items: [s] }) })
    groups.forEach((g, i) => {
      const s = g.items[0], n = g.items.length, isNew = g.items.some((x: Any) => x.nw && !read.has(x.id)), allRead = g.items.every((x: Any) => read.has(x.id))
      const el = add(`<span class="pin ${isNew ? 'new' : ''} ${allRead ? 'read' : ''}" data-id="${esc(s.id)}" aria-hidden="true" title="${esc(n > 1 ? n + ' știri: ' + g.items.map((x: Any) => x.t).join('; ') : s.t)}" style="animation-delay:${500 + i * 70}ms"><i>${n > 1 ? n : ''}</i></span>`, g.p[0], g.p[1])
      el.addEventListener('click', () => focusItem(s.id)); el.addEventListener('mouseenter', () => g.items.forEach((x: Any) => hl(x.id, true))); el.addEventListener('mouseleave', () => g.items.forEach((x: Any) => hl(x.id, false)))
    })
    if (!isMobile()) (H.callouts || []).forEach(([id, dx, dy]: [string, number, number]) => {
      const s = list.find((x) => x.id === id); if (!s) return
      const el = add(`<a class="callout" href="/articol/${esc(s.id)}" data-id="${esc(s.id)}" style="margin-left:${dx}px;margin-top:${dy}px"><img src="${esc(s.img)}" alt=""><span>${s.nw ? `<em>Nou, ${esc(s.time)}</em>` : ''}${esc(s.t)}</span></a>`, s.x, s.y)
      el.style.transform = 'none'
    })
  }
  if (L === 'drumuri') {
    H.ev.filter((e: Any) => inScope(e.r) || !ED).forEach((e: Any) => { const el = add(`<span class="rmark ${e.st}" aria-hidden="true" title="${esc(`${e.road}, ${e.where}: ${e.what}`)}">${e.st === 'ok' ? '' : '!'}</span>`, e.x, e.y); el.addEventListener('click', () => toast(`${e.road}, ${e.where}: ${e.what}`)) })
    const seen = new Set<string>()
    const stari: Record<string, string> = {}
    $$('#roads .road.st').forEach((p, i) => { stari[RETEA[i]?.id] = p.getAttribute('class')!.replace(/road|st|\s/g, '') })
    RETEA.forEach((r) => { if (seen.has(r.n) || (stari[r.id] === 'ok' && !r.mw)) return; seen.add(r.n); const pts = r.p.map(pos); const m = pts[Math.floor((pts.length - 1) / 2)], m2 = pts[Math.ceil((pts.length - 1) / 2)]; add(`<span class="shield ${r.mw ? 'a' : 'd'} mshield" style="pointer-events:none">${r.n}</span>`, (m[0] + m2[0]) / 2, (m[1] + m2[1]) / 2 - 14) })
  }
  if (L === 'vreme') {
    H.wx.forEach((w: Any) => { if (zoomed ? w.lvl === 1 && !inRegionView([w.x, w.y]) : w.lvl === 2) return; if (zoomed && w.lvl === 2 && !inRegionView([w.x, w.y])) return; add(`<span class="temp ${w.t <= 0 ? 'cold' : ''} ${w.lvl ? 'minor' : ''}">${I[w.w] || I.cloud}${w.t}°${!w.lvl || zoomed ? `<small>${esc(w.city)}</small>` : ''}</span>`, w.x, w.y) })
  }
  if (L === 'avarii') {
    H.out.filter((o: Any) => inScope(o.r)).forEach((o: Any) => { const el = add(`<span class="ico ${o.k}" aria-hidden="true" title="${esc(`${o.city}: ${o.t}`)}">${I[o.k]}</span>`, o.x, o.y); el.addEventListener('click', () => toast(`${o.city}: ${o.t}. ${o.d}`)) })
  }
  if (L === 'joburi') {
    if (!zoomed) Object.keys(H.jobsReg).forEach((r) => { const n = H.jobsReg[r]; const s = Math.round(28 + Math.sqrt(n) * 0.7); const c = CITY[C.regs[r]?.ck]; if (!c) return; add(`<span class="bubble" style="width:${s}px;height:${s}px" aria-hidden="true" title="${esc(C.regs[r].n)}: ${fmt(n)} joburi">${scurt(n)}</span>`, c[0], c[1]).addEventListener('click', () => go(r)) })
    else Object.entries(H.ctys as Record<string, Any[]>).filter(([, c]) => c[0] === ED).forEach(([n, c]) => { const v = H.jobsCty[n] || 0; if (!v) return; const s = Math.round(26 + Math.sqrt(v) * 1.3); add(`<span class="bubble" style="width:${s}px;height:${s}px" aria-hidden="true" title="${esc(c[3])}: ${fmt(v)} joburi"><span>${fmt(v)}</span></span>`, c[1], c[2]).addEventListener('click', () => document.getElementById('joburi')?.scrollIntoView({ behavior: 'smooth' })) })
  }
  if (zoomed) { const b = document.createElement('button'); b.className = 'ctag'; b.style.cssText = 'left:10px;top:8px;transform:none;position:absolute;padding:6px 12px;font-size:13px'; b.textContent = 'Toată țara'; b.addEventListener('click', () => go('')); ov.appendChild(b) }
  placeAll()
}

function renderLegend() {
  const L = st.layer, lg = $('#legend'); if (!lg) return
  const m: Record<string, string> = {
    stiri: '<span><i class="sw dot" style="background:var(--live)"></i>Nou de la ultima vizită</span><span><i class="sw dot" style="background:var(--ink)"></i>Știre</span><span><i class="sw dot" style="background:var(--ink-3)"></i>Citită</span>',
    drumuri: '<span><i class="sw" style="background:var(--ok)"></i>Normal</span><span><i class="sw" style="background:var(--orange)"></i>Aglomerat sau lucrări</span><span><i class="sw" style="background:var(--red)"></i>Închis</span><span><span class="shield a">A1</span> autostradă</span><span><span class="shield d">DN1</span> drum național</span>',
    vreme: `<span><i class="sw" style="background:repeating-linear-gradient(45deg,#E2A800 0 3px,#FBEFC0 3px 7px);height:10px;width:22px"></i>${esc(H.legVreme)}</span>`,
    avarii: '<span><i class="sw dot" style="background:#1D7FD1"></i>Apă</span><span><i class="sw dot" style="background:#E59A00"></i>Curent</span><span><i class="sw dot" style="background:#E0542B"></i>Gaz</span>',
    joburi: `<span><i class="sw dot" style="background:var(--brand)"></i>Anunțuri active, pe ${ED ? 'județe' : 'regiuni'}</span>`,
  }
  lg.innerHTML = m[L] + `<span class="mapnote demo">Actualizat la ${esc($('#clock')?.textContent || '')}.${C.demo ? ' Date demonstrative.' : ''}</span>`
}
function renderLayers() {
  const el = $('#layers'); if (!el) return
  const counts: Record<string, number> = {
    stiri: stiri().filter((s) => s.nw && !read.has(s.id)).length,
    drumuri: H.ev.filter((e: Any) => inScope(e.r) && e.st !== 'ok').length,
    vreme: H.nVreme, avarii: H.out.filter((o: Any) => inScope(o.r)).length,
    joburi: ED ? H.jobsReg[ED] || 0 : Object.values(H.jobsReg as Record<string, number>).reduce((a, b) => a + b, 0),
  }
  el.innerHTML = STRATURI.map(([k, n, ic]) => `<button class="layer" role="tab" aria-selected="${st.layer === k}" data-l="${k}">${I[ic] || ''}${n}${counts[k] ? ` <span class="n">${k === 'joburi' ? scurt(counts[k]) : counts[k]}</span>` : ''}</button>`).join('')
  $$('#layers .layer').forEach((b) => b.addEventListener('click', () => setLayer(b.dataset.l!)))
}
function setLayer(l: string) {
  st.layer = l; const mb = $('#mapbox'); if (!mb) return
  mb.className = 'mapbox l-' + l + (ED ? ' zoomed dimmed' : '')
  renderLayers(); renderOverlay(); renderLegend(); renderLList()
}
function renderLList() {
  const L = st.layer, el = $('#llist'); if (!el) return
  let h = ''
  if (L === 'stiri') h = stiri().slice().sort((a, b) => (b.nw || 0) - (a.nw || 0)).map((s) => `<a class="litem" data-id="${esc(s.id)}" href="/articol/${esc(s.id)}"><img src="${esc(s.img)}" alt="" loading="lazy"><span><b>${esc(s.t)}</b><small>${s.at ? esc(s.at) + ', ' : ''}${esc(s.time)}${s.nw && !read.has(s.id) ? ' <span style="color:var(--live-ink);font-weight:700">nou</span>' : ''}</small></span></a>`).join('')
  if (L === 'drumuri') h = H.ev.filter((e: Any) => inScope(e.r)).sort((a: Any, b: Any) => +(a.st === 'ok') - +(b.st === 'ok')).map((e: Any) => `<div class="litem"><span class="lk" style="background:var(--${e.st === 'ok' ? 'ok' : e.st === 'closed' ? 'red' : 'orange'})">${I.road}</span><span><b><span class="shield ${e.a ? 'a' : 'd'}">${esc(e.road)}</span> ${esc(e.where)}</b><small>${esc(e.what)}</small></span></div>`).join('')
  if (L === 'vreme') h = H.wx.filter((w: Any) => (ED ? inRegionView([w.x, w.y]) : !w.lvl)).map((w: Any) => `<div class="litem" style="flex-basis:190px"><span class="lk" style="background:var(--surface-2)">${I[w.w] || I.cloud}</span><span><b>${esc(w.city)}: ${w.t}°C</b><small>${esc(w.cond)}</small></span></div>`).join('')
  if (L === 'avarii') h = H.out.filter((o: Any) => inScope(o.r)).map((o: Any) => `<div class="litem"><span class="lk ico ${o.k}" style="box-shadow:none">${I[o.k]}</span><span><b>${esc(o.city)}: ${esc(o.t)}</b><small>${esc(o.d)}</small></span></div>`).join('')
  if (L === 'joburi') h = H.jobs.map((j: Any) => `<a class="litem" href="${esc(j.href)}"><span class="lk" style="background:var(--brand)">${I.jobs}</span><span><b>${esc(j.t)}</b><small>${esc(j.co)}, ${esc(j.pay)}${j.pr ? ' <span class="promo-t">Promovat</span>' : ''}</small></span></a>`).join('')
  el.innerHTML = h
  $$('#llist .litem[data-id]').forEach((a) => { a.addEventListener('mouseenter', () => hl(a.dataset.id!, true)); a.addEventListener('mouseleave', () => hl(a.dataset.id!, false)) })
}

function initHarta() {
  const svg = $('#map'); if (!svg || !H) return
  const vbNow = (svg.getAttribute('viewBox') || '0 0 1000 704').split(/\s+/).map(Number)
  st.vb = vbNow
  for (const r of Object.keys(C.regs)) { const ck = H.cityKeys?.[r]; if (ck) C.regs[r].ck = ck }
  $$('#regs .reg').forEach((p) => {
    const r = p.dataset.r!
    p.addEventListener('click', () => { if (r !== ED) go(r) })
    p.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (r !== ED) go(r) } })
    p.addEventListener('mouseenter', () => showTip(r)); p.addEventListener('mouseleave', hideTip)
  })
  setLayer(st.layer)
  const to = (svg as HTMLElement).dataset.to
  ss.del('cad_fly')
  if (to) animateVB(to.split(/\s+/).map(Number))
  let rw: Any, lw = innerWidth
  addEventListener('resize', () => { if (innerWidth === lw) return; lw = innerWidth; clearTimeout(rw); rw = setTimeout(renderOverlay, 120) })
}

/* ============ cadranul curentului ============ */
function renderDial() {
  if (!C.pr) return
  const { h, m } = acum()
  const d = $('#dial'); if (d) d.innerHTML = dialHTML(C.pr, h, m)
  const t = $('#dialTxt'); if (t) t.innerHTML = dialTextHTML(C.pr, h, (t.querySelector('a') as HTMLAnchorElement | null)?.getAttribute('href') || '/energie', C.prMaine)
  const cv = $('#artCurve'); if (cv) cv.innerHTML = curbaHTML(C.pr, h, m)
  $$('#dial .bar').forEach((b) => { const i = +b.dataset.h!; b.addEventListener('mouseenter', () => { const tip = $('#dialTip'); if (tip) tip.textContent = `${pad(i)}:00–${pad((i + 1) % 24)}:00: ${fmt(C.pr[i])} lei/MWh, ${plab(C.pr[i], C.pr)}` }) })
}

/* ============ calculatoare ============ */
function calc() {
  const pIn = $<HTMLInputElement>('#pIn')
  if (pIn) { const p = +pIn.value || 0; const np = Math.round(p * (1 + (C.pensie || 0) / 100)); $('#pOut')!.textContent = fmt(np) + ' lei'; $('#pDiff')!.textContent = `+${fmt(np - p)} lei pe lună, +${fmt((np - p) * 12)} lei pe an` }
  for (const sfx of ['', '2']) {
    const box = $(`#apps${sfx}`); const out = $(`#eOut${sfx}`); if (!box || !out) continue
    if (!C.pr) { out.textContent = '–'; continue }
    const kwh = $$<HTMLInputElement>('input:checked', box).reduce((a, i) => a + +i.value, 0)
    out.textContent = fmt(economieAnuala(kwh, C.pr)) + ' lei'
    $(`#eDiff${sfx}`)!.textContent = kwh ? `${fmt(kwh, 1)} kWh mutați de 4 ori pe săptămână, de la 19:00 la ora cea mai ieftină` : 'Bifează ce poți porni la prânz.'
  }
  const fT = $<HTMLSelectElement>('#fType'), fL = $<HTMLInputElement>('#fL')
  if (fT && fL) {
    const f: number[] = C.fuel || ($('[data-fuel]')?.dataset.fuel || '0,0,0').split(',').map(Number)
    const i = ({ b: 0, m: 1, g: 2 } as Record<string, number>)[fT.value]; const L = +fL.value
    $('#fLv')!.textContent = String(L); $('#fOut')!.textContent = fmt(f[i] * L, 2) + ' lei'
    const nat: number[] | undefined = C.fuelNat
    const d = nat ? (f[i] - nat[i]) * L : 0
    $('#fDiff')!.textContent = nat && ED ? (Math.abs(d) < 0.01 ? 'Cât media țării' : `${d > 0 ? 'Cu ' + fmt(d, 2) + ' lei mai mult' : 'Cu ' + fmt(-d, 2) + ' lei mai puțin'} decât media țării`) : 'La prețul mediu, fără reduceri de card'
  }
}

/* ============ articol ============ */
function initArticol() {
  const id = C.id as string; if (!id) return
  markRead(id)
  const bar = $('#readbar'); if (bar) bar.hidden = false
  const onScroll = () => {
    const body = $('#artBody'); if (!body) return
    const r = body.getBoundingClientRect(); const total = r.height - innerHeight * 0.5; const done = Math.min(1, Math.max(0, -r.top / Math.max(1, total)))
    if (bar) bar.style.width = done * 100 + '%'
    const rem = $('#remain'); if (rem) { const m = Math.max(0, Math.ceil(+rem.dataset.min! * (1 - done))); rem.textContent = m ? `${m} min rămase` : 'Ai ajuns la final' }
    let cur: string | null = null; $$('.body h2').forEach((h) => { if (h.getBoundingClientRect().top < 140) cur = h.id }); $$('.toc a').forEach((a) => a.classList.toggle('on', a.dataset.t === cur))
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll()
  const end = $('#endTxt'); const s7: string[] = C.seven || []
  if (end && s7.length) { const n = s7.filter((x) => read.has(x) || x === id).length; end.textContent = `${n} din ${s7.length} subiecte azi. ${n >= s7.length ? 'Ești la zi.' : `Încă ${s7.length - n} și ești la zi.`}` }
  const saved = new Set<string>(JSON.parse(ls.get('cad_saved') || '[]'))
  const sb = $('#saveBtn'); if (sb) { sb.setAttribute('aria-pressed', String(saved.has(id))); sb.addEventListener('click', () => { const on = !saved.has(id); on ? saved.add(id) : saved.delete(id); ls.set('cad_saved', JSON.stringify([...saved])); sb.setAttribute('aria-pressed', String(on)); toast(on ? 'Salvat pe acest dispozitiv.' : 'Scos din salvate.') }) }
  const fb = $('#followBtn'); if (fb) { const fol = new Set<string>(JSON.parse(ls.get('cad_follow') || '[]')); const t = fb.dataset.topic!; fb.setAttribute('aria-pressed', String(fol.has(t))); fb.addEventListener('click', () => { const on = !fol.has(t); on ? fol.add(t) : fol.delete(t); ls.set('cad_follow', JSON.stringify([...fol])); fb.setAttribute('aria-pressed', String(on)); toast(on ? 'Urmărești subiectul. Notificările pornesc la lansare.' : 'Nu mai urmărești subiectul.') }) }
  $('#listenBtn')?.addEventListener('click', () => toast('Varianta audio, citită de un redactor, vine în curând.'))
  $('#shareBtn')?.addEventListener('click', async () => {
    const data = { title: document.title, url: location.href }
    try { if (navigator.share) { await navigator.share(data); return } await navigator.clipboard.writeText(location.href); toast('Link copiat. Îl poți trimite și pe WhatsApp.') } catch { /* anulat */ }
  })
  $$('[data-help]').forEach((b) => b.addEventListener('click', () => toast('Mulțumim. Ne ajută să scriem mai clar.')))
}

/* ============ editia, tema, diverse ============ */
function initSheet() {
  const sheet = $('#edSheet'), bg = $('#sheetBg'), btn = $('#edBtn'); if (!sheet || !btn) return
  const open = () => { sheet.classList.add('on'); bg!.classList.add('on'); btn.setAttribute('aria-expanded', 'true'); ($('.ed-card[aria-current="true"]', sheet) || $('.ed-card', sheet))?.focus() }
  const close = () => { if (!sheet.classList.contains('on')) return; sheet.classList.remove('on'); bg!.classList.remove('on'); btn.setAttribute('aria-expanded', 'false'); btn.focus() }
  btn.addEventListener('click', open); bg!.addEventListener('click', close)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
  $$('#edSheet [data-region], .foot a[href^="/editie/"], #ctyChips a[data-r]').forEach((a) => a.addEventListener('click', (e) => {
    const r = (a as HTMLElement).dataset.region ?? (a as HTMLElement).dataset.r ?? Object.keys(C.regs).find((k) => (a as HTMLAnchorElement).getAttribute('href') === `/editie/${C.regs[k].slug}`) ?? ''
    e.preventDefault(); go(r)
  }))
  $$('[data-open-sheet]').forEach((b) => b.addEventListener('click', open))
}

function initDiverse() {
  $('#themeBtn')?.addEventListener('click', () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; ls.set('cad_theme', t) })
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (t.closest('[data-why]')) { e.preventDefault(); toast(`Vezi reclama pentru că citești ${ED ? 'ediția ' + C.regs[ED].short : 'ediția națională'}. Fără date personale, dacă nu ți-ai dat acordul.`) }
    const l = t.closest('[data-layer]') as HTMLElement | null
    if (l && H) { e.preventDefault(); setLayer(l.dataset.layer!); if (isMobile() || l.tagName === 'A') $('#mapbox')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }) }
    const sc = t.closest('[data-scroll]') as HTMLElement | null
    if (sc) document.getElementById(sc.dataset.scroll!)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
    const tick = t.closest('#catchList .tick') as HTMLElement | null
    if (tick) { const id = tick.closest<HTMLElement>('.citem')!.dataset.id!; markRead(id, !read.has(id)) }
  })
  // filtrul pe judete din grila de stiri (editie)
  $$('#ctyChips button.ftag').forEach((b) => b.addEventListener('click', () => {
    const c = b.dataset.c || ''
    $$('#ctyChips button.ftag').forEach((x) => x.setAttribute('aria-pressed', String(x === b)))
    let n = 0
    $$('#grid .st-card').forEach((a) => { const on = !c || (a.dataset.cty || '').split(' ').includes(c); (a as HTMLElement).hidden = !on; if (on) n++ })
    $$('#grid .native').forEach((a) => ((a as HTMLElement).hidden = !!c))
    const g = $('#gridEmpty'); if (g) g.hidden = n > 0
  }))
  $('[data-c-reset]')?.addEventListener('click', (e) => { e.preventDefault(); ($('#ctyChips button.ftag[data-c=""]') as HTMLButtonElement | null)?.click() })
  $('#nlForm')?.addEventListener('submit', (e) => { e.preventDefault(); toast(C.demo ? 'În versiunea demonstrativă nu salvăm adrese. Abonarea pornește la lansare.' : 'Abonarea pornește în curând. Mulțumim!') })
  const pIn = $('#pIn'); pIn?.addEventListener('input', calc)
  $$('#apps input, #apps2 input').forEach((i) => i.addEventListener('change', calc))
  $('#fType')?.addEventListener('change', calc); $('#fL')?.addEventListener('input', calc)
}

/* ============ pornire ============ */
;(function init() {
  vizita(); tick(); setInterval(tick, 15000)
  initSheet(); initDiverse()
  if (C.pagina === 'articol') initArticol()
  initHarta(); renderProgress(); renderDial(); setInterval(renderDial, 60000); calc()
  initConsimtamant(toast)
  void smooth; void eAutostrada
})()
