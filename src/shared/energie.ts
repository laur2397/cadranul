// Cadranul curentului, curba pe ore si curba peste fotografie (designul D), ca functii pure.
// Le folosesc atat serverul (prima randare) cat si scriptul din browser (actualizare la fiecare minut).
import { fmt, pad } from './format'
import { smooth, type Punct } from './harta'

// Culoarea si eticheta unei ore se dau FATA DE RESTUL ZILEI (sfertul cel mai ieftin al intervalului zilei = ieftin).
// Pragurile fixe (400/700/950 lei) facusera ca, la preturile reale din noiembrie 2026 (760-1800 lei), aproape
// toata ziua sa iasa „foarte scump”, adica fara nicio informatie. Fara ziua intreaga, raman pragurile fixe.
const treapta = (p: number, pr?: number[]) => {
  if (pr && pr.length) {
    const mn = Math.min(...pr), mx = Math.max(...pr)
    if (mx - mn > 1) { const f = (p - mn) / (mx - mn); return f < 0.25 ? 0 : f < 0.5 ? 1 : f < 0.75 ? 2 : 3 }
  }
  return p < 400 ? 0 : p < 700 ? 1 : p < 950 ? 2 : 3
}
export const pcol = (p: number, pr?: number[]) => ['var(--ok)', '#7FA4C8', 'var(--orange)', 'var(--red)'][treapta(p, pr)]
export const plab = (p: number, pr?: number[]) => ['ieftin', 'mediu', 'scump', 'foarte scump'][treapta(p, pr)]
const BADGE: Record<string, string> = { 'var(--ok)': '#08734E', '#7FA4C8': '#3D6A94', 'var(--orange)': '#B04F00', 'var(--red)': '#B81D23' }
const SOLID: Record<string, string> = { 'var(--ok)': '#0B9A68', '#7FA4C8': '#7FA4C8', 'var(--orange)': '#EE7A0C', 'var(--red)': '#D3242B' }

/** Fereastra cea mai ieftina de 3 ore consecutive (ora de inceput) */
export function fereastraIeftina(pr: number[]): number {
  let best = 0, bv = Infinity
  for (let i = 0; i + 2 < pr.length; i++) { const v = pr[i] + pr[i + 1] + pr[i + 2]; if (v < bv) { bv = v; best = i } }
  return best
}

export function extreme(pr: number[]) {
  const minP = Math.min(...pr), maxP = Math.max(...pr)
  return { minP, maxP, ieftin: pr.indexOf(minP), scump: pr.indexOf(maxP) }
}

/** SVG-ul cadranului de 24 de ore + centrul + tabelul accesibil */
export function dialHTML(pr: number[], h: number, m: number): string {
  const p = pr[h]
  const { maxP } = extreme(pr)
  const f = fereastraIeftina(pr)
  const arc = (a0: number, a1: number, r: number) => {
    const p0 = [Math.sin(a0) * r, -Math.cos(a0) * r], p1 = [Math.sin(a1) * r, -Math.cos(a1) * r]
    return `M${p0[0].toFixed(2)},${p0[1].toFixed(2)}A${r},${r} 0 0 1 ${p1[0].toFixed(2)},${p1[1].toFixed(2)}`
  }
  let g = `<circle r="51" fill="none" stroke="var(--line)" stroke-width="1"/>`
  g += `<path d="${arc((f / 24) * Math.PI * 2, ((f + 3) / 24) * Math.PI * 2, 96)}" stroke="var(--ok)" stroke-width="3" fill="none" stroke-linecap="round"/>`
  pr.forEach((v, i) => {
    const a = ((i + 0.5) / 24) * Math.PI * 2, r0 = 57, r1 = 57 + 6 + ((v - 200) / (maxP - 200 || 1)) * 32
    g += `<line class="bar" data-h="${i}" x1="${(Math.sin(a) * r0).toFixed(2)}" y1="${(-Math.cos(a) * r0).toFixed(2)}" x2="${(Math.sin(a) * r1).toFixed(2)}" y2="${(-Math.cos(a) * r1).toFixed(2)}" stroke="${pcol(v, pr)}" stroke-width="${i === h ? 8 : 6}" opacity="${i === h ? 1 : 0.9}"><title>${pad(i)}:00–${pad((i + 1) % 24)}:00: ${fmt(v)} lei/MWh</title></line>`
  })
  ;[0, 6, 12, 18].forEach((x) => { const a = (x / 24) * Math.PI * 2; g += `<text class="hl" x="${(Math.sin(a) * 108).toFixed(2)}" y="${(-Math.cos(a) * 108).toFixed(2)}">${x}</text>` })
  const a = ((h + m / 60) / 24) * Math.PI * 2
  g += `<line x1="${(Math.sin(a) * 53).toFixed(2)}" y1="${(-Math.cos(a) * 53).toFixed(2)}" x2="${(Math.sin(a) * 92).toFixed(2)}" y2="${(-Math.cos(a) * 92).toFixed(2)}" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/><circle cx="${(Math.sin(a) * 92).toFixed(2)}" cy="${(-Math.cos(a) * 92).toFixed(2)}" r="4" fill="var(--live)" stroke="var(--surface)" stroke-width="2"/>`
  const tbl = `<table class="sr"><caption>Prețul curentului pe ore, lei/MWh</caption>${pr.map((v, i) => `<tr><th>${pad(i)}:00</th><td>${v}</td></tr>`).join('')}</table>`
  return `<svg viewBox="-115 -115 230 230" role="img" aria-label="Cadranul zilei: prețul curentului pentru fiecare oră. Acum ${fmt(p)} lei pe MWh.">${g}</svg><div class="ctr"><b class="num">${fmt(p)}</b><small>lei/MWh, acum</small></div>${tbl}`
}

/** Textul de langa cadran (cel mai ieftin / scump, recomandarea). `maine`: preturile publicate pentru maine, daca exista. */
export function dialTextHTML(pr: number[], h: number, link = '/energie', maine?: number[] | null): string {
  const p = pr[h]
  const { minP, maxP, ieftin, scump } = extreme(pr)
  const m = maine && maine.length === 24 ? extreme(maine) : null
  const sfat = h < ieftin ? `Pornește mașina de spălat la ${ieftin}:00, nu seara.`
    : h <= ieftin + 2 ? 'E un moment bun pentru mașina de spălat.'
    : m ? `Mâine, cel mai ieftin la ${m.ieftin}:00 (${fmt(m.minP)} lei).`
    : 'Prețurile pentru mâine apar după ora 14:00.'
  const pranz = ieftin >= 10 && ieftin <= 15
  return `<div class="minmax"><div><small>Cel mai ieftin</small><b class="num" style="color:var(--ok)">${ieftin}:00</b> <span>${fmt(minP)} lei</span></div><div><small>Cel mai scump</small><b class="num" style="color:var(--red)">${scump}:00</b> <span>${fmt(maxP)} lei</span></div></div><p class="big">Acum e <span class="pricebadge" style="background:${BADGE[pcol(p, pr)]}">${plab(p, pr)}</span> față de restul zilei. ${sfat}</p><a href="${link}" style="font-size:13.5px;font-weight:650;color:var(--brand)">${pranz ? 'De ce e prânzul ieftin' : 'De ce se schimbă prețul de la o oră la alta'}</a>`
}

/** Graficul pe ore din articol si din pagina /energie */
export function curbaHTML(pr: number[], h: number, m: number): string {
  const W = 680, H = 200, pl = 34, pb = 26, pt = 12
  const max = Math.max(1200, Math.ceil(Math.max(...pr) / 400) * 400)
  const x = (i: number) => pl + (i / 23) * (W - pl - 8), y = (v: number) => pt + (1 - v / max) * (H - pt - pb)
  const pts: Punct[] = pr.map((v, i) => [x(i), y(v)])
  const line = smooth(pts)
  const stops = pr.map((v, i) => `<stop offset="${((i / 23) * 100).toFixed(1)}%" stop-color="${SOLID[pcol(v, pr)]}"/>`).join('')
  const nx = x(h + m / 60)
  const f = fereastraIeftina(pr)
  const { minP, maxP, ieftin, scump } = extreme(pr)
  let grid = ''
  for (let v = 0; v <= max; v += 400) grid += `<line x1="${pl}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`
  ;[0, 6, 12, 18, 23].forEach((i) => (grid += `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 23 ? 'end' : i === 0 ? 'start' : 'middle'}">${i}:00</text>`))
  return `<svg class="curve" viewBox="0 0 ${W} ${H}" role="img" aria-label="Prețul curentului pe ore: minim ${fmt(minP)} lei pe MWh la ora ${ieftin}, maxim ${fmt(maxP)} la ora ${scump}."><defs><linearGradient id="cg" x1="${pl}" x2="${W - 8}" gradientUnits="userSpaceOnUse">${stops}</linearGradient><linearGradient id="cf" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7FA4C8" stop-opacity=".25"/><stop offset="1" stop-color="#7FA4C8" stop-opacity="0"/></linearGradient></defs>${grid}<rect x="${x(f)}" y="${pt}" width="${x(f + 3) - x(f)}" height="${H - pt - pb}" fill="#0B9A68" opacity=".09"/><text x="${(x(f) + x(f + 3)) / 2}" y="${pt + 12}" text-anchor="middle" style="fill:#0B9A68;font-weight:750">ieftin</text><path d="${line}L${x(23)},${H - pb}L${pl},${H - pb}Z" fill="url(#cf)"/><path d="${line}" fill="none" stroke="url(#cg)" stroke-width="4" stroke-linecap="round"/><line x1="${nx}" x2="${nx}" y1="${pt}" y2="${H - pb}" stroke="var(--ink)" stroke-dasharray="3 3"/><circle cx="${nx}" cy="${y(pr[h])}" r="6" fill="var(--live)" stroke="var(--surface)" stroke-width="2.5"/><text x="${nx + 8}" y="${pt + 12}" style="fill:var(--ink);font-weight:750">acum</text></svg>`
}

/** Curba alba desenata peste fotografia articolului („graficul peste fotografie”) */
export function curbaFotoHTML(pr: number[], h: number, m: number): string {
  const W = 700, H = 394, top = H * 0.42, bot = H * 0.9, max = Math.max(1200, Math.max(...pr))
  const x = (i: number) => 24 + (i / 23) * (W - 48), y = (v: number) => bot - (v / max) * (bot - top)
  const line = smooth(pr.map((v, i) => [x(i), y(v)] as Punct))
  const nx = x(h + m / 60), ny = y(pr[h])
  const { ieftin: mi, scump: ma } = extreme(pr)
  return `<svg class="herocurve" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="hcg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><path d="${line}L${x(23)},${bot}L${x(0)},${bot}Z" fill="url(#hcg)"/><path d="${line}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
  <span class="hc-lab${Math.abs(h + m / 60 - mi) <= 1.5 ? ' low' : ''}${nx / W > 0.55 ? ' end' : ''}" style="left:${(nx / W) * 100}%;top:${(ny / H) * 100}%"><i class="hc-dot"></i><b>Acum ${fmt(pr[h])}${Math.abs(h + m / 60 - mi) <= 1.5 ? ', cel mai ieftin' : ''}</b></span>
  ${Math.abs(h + m / 60 - mi) > 1.5 ? `<span class="hc-lab low${x(mi) / W > 0.55 ? ' end' : ''}" style="left:${(x(mi) / W) * 100}%;top:${(y(pr[mi]) / H) * 100}%"><i class="hc-dot g"></i><b>${mi}:00, cel mai ieftin</b></span>` : ''}
  ${Math.abs(h + m / 60 - ma) > 1.5 ? `<span class="hc-lab${x(ma) / W > 0.45 ? ' end' : ''}" style="left:${(x(ma) / W) * 100}%;top:${(y(pr[ma]) / H) * 100}%"><i class="hc-dot r"></i><b>${ma}:00, ${fmt(pr[ma])}</b></span>` : ''}
  <span class="hc-live"><i></i>Prețul curentului azi, lei/MWh. Live.</span>`
}

/** Economia anuala daca muti consumul (kWh) de la ora scumpa de seara la cea ieftina */
export function economieAnuala(kwh: number, pr: number[]): number {
  const { ieftin } = extreme(pr)
  const seara = pr[19] ?? Math.max(...pr)
  return Math.round(((kwh * (seara - pr[ieftin])) / 1000) * 4 * 52)
}
