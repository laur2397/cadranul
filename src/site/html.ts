// Sabloane HTML sigure: tot ce intra in ${...} se escapeaza, in afara de ce e marcat explicit cu raw()
// sau de rezultatul altui sablon h``. Asa, textele din baza de date nu pot injecta marcaj.
import { esc } from '../shared/format'

export class Safe {
  constructor(public readonly s: string) {}
  toString() { return this.s }
}
export const raw = (s: string) => new Safe(s)

function val(v: unknown): string {
  if (v === null || v === undefined || v === false) return ''
  if (v instanceof Safe) return v.s
  if (Array.isArray(v)) return v.map(val).join('')
  return esc(v)
}

export function h(strings: TemplateStringsArray, ...vals: unknown[]): Safe {
  let out = strings[0]
  for (let i = 0; i < vals.length; i++) out += val(vals[i]) + strings[i + 1]
  return new Safe(out)
}

/** JSON sigur in <script type="application/json"> si in JSON-LD */
export const jsonInScript = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
