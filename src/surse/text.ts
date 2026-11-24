// Utilitare de text pentru parsere: HTML -> text, entitati, date romanesti.
import { laOraRO } from '../site/timp'
import { createHash } from 'node:crypto'

const NUMITE: Record<string, string> = {
  nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»', bdquo: '„', rdquo: '”', ldquo: '“',
  acirc: 'â', Acirc: 'Â', icirc: 'î', Icirc: 'Î', abreve: 'ă', Abreve: 'Ă', scedil: 'ş', Scedil: 'Ş', tcedil: 'ţ', Tcedil: 'Ţ', deg: '°',
}
export const decodeaza = (s: string) => String(s || '')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => NUMITE[n] ?? m)

/** HTML -> text pe randuri (blocurile devin randuri noi) */
export function textDinHtml(html: string) {
  // HTML escapat in atribute (ANM: mesaj="&lt;p&gt;V&amp;acirc;ntul…"): il decodam pana ajungem la marcaj
  let src = String(html || '')
  for (let i = 0; i < 3 && /&(lt|gt|amp);/.test(src) && !/<[a-z]/i.test(src); i++) src = decodeaza(src)
  src = src.replace(/&amp;([a-z]+|#x?[0-9a-f]+);/gi, '&$1;')
  return decodeaza(src
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|table)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim()
}

export const LUNI = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie']

/** „24 noiembrie, ora 10” (+ anul de referinta) -> Date (ora Romaniei) */
export function dataRomaneasca(s: string, an: number): Date | null {
  const m = String(s).toLowerCase().normalize('NFC').match(/(\d{1,2})\s+([a-zăâîșşțţ]+)\s*(\d{4})?[^\d]*?(?:ora|orele|ore)?\s*(\d{1,2})(?:[:.](\d{2}))?/)
  if (!m) return null
  const luna = LUNI.indexOf(m[2].replace(/ş/g, 'ș').replace(/ţ/g, 'ț'))
  if (luna < 0) return null
  const y = m[3] ? Number(m[3]) : an
  const zi = `${y}-${String(luna + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return laOraRO(zi, `${m[4].padStart(2, '0')}:${m[5] || '00'}`)
}

/** „26.11.2026” / „26.11” + „08:00” -> Date */
export function dataPunct(zi: string, ora: string, anImplicit: number): Date | null {
  const m = String(zi).match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/)
  const o = String(ora).match(/(\d{1,2})[:.](\d{2})/)
  if (!m || !o) return null
  const y = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : anImplicit
  return laOraRO(`${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`, `${o[1].padStart(2, '0')}:${o[2]}`)
}

export const amprenta = (...p: unknown[]) => createHash('sha1').update(p.map((x) => String(x ?? '')).join('|')).digest('hex').slice(0, 16)

/** „cod galben” etc. */
export const PRIMA_MAJUSCULA = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
