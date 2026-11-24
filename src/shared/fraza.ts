// „Fraza momentului” de sub salut: text scris de redactie in /admin, cu butoane legate de harta.
// Marcaj simplu, usor de scris de un redactor:
//   {vreme|cod galben de ninsoare}       -> buton galben, deschide stratul Vremea
//   {drum|A1|spre Pitești}               -> buton cu indicator rutier, deschide stratul Drumuri
//   {avarii|Apa caldă se oprește joi}    -> buton cu punct albastru, deschide stratul Avarii
//   {joburi|180 de locuri noi}           -> buton, deschide stratul Joburi
//   {ieftin|12:00 și 15:00}              -> buton verde, duce la cadranul curentului
// Restul textului se escapeaza (nu se accepta HTML).
import { esc } from './format'
import { eAutostrada } from './harta'

const PUNCT: Record<string, string> = { avarii: '#1D7FD1', joburi: 'var(--brand)', stiri: 'var(--live)' }

export function frazaHTML(text: string): string {
  const s = String(text || '')
  let out = ''
  let last = 0
  const re = /\{([a-z]+)\|([^{}]+)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    out += esc(s.slice(last, m.index))
    out += buton(m[1], m[2].split('|').map((x) => x.trim()))
    last = re.lastIndex
  }
  return out + esc(s.slice(last))
}

function buton(tip: string, p: string[]): string {
  switch (tip) {
    case 'vreme': return `<button class="chip-in yellow" data-layer="vreme"><span class="dot" style="background:#F2B705"></span>${esc(p[0])}</button>`
    case 'drum': return `<button class="chip-in" data-layer="drumuri"><span class="shield ${eAutostrada(p[0]) ? 'a' : 'd'}">${esc(p[0])}</span> ${esc(p[1] || '')}</button>`
    case 'ieftin': return `<button class="chip-in cheap" data-scroll="energie">${esc(p[0])}</button>`
    case 'avarii': case 'joburi': case 'stiri':
      return `<button class="chip-in" data-layer="${tip}"><span class="dot" style="background:${PUNCT[tip]}"></span>${esc(p[0])}</button>`
    default: return esc(p.join(' '))
  }
}

/** Textul fara marcaj (pentru descrierea paginii si cititoarele de ecran) */
export const frazaText = (text: string) => String(text || '').replace(/\{[a-z]+\|([^{}]+)\}/g, (_, x: string) => x.split('|').join(' ')).replace(/\s+/g, ' ').trim()
