// Citirea tabelelor simple (CSV cu „;” sau „,”, sau JSON cu o lista de obiecte) intr-o lista de randuri cu chei normalizate.
import { cheie } from '../geo'

export function randuriCsv(text: string): Record<string, string>[] {
  const linii = String(text || '').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim())
  if (!linii.length) return []
  const sep = (linii[0].match(/;/g) || []).length >= (linii[0].match(/,/g) || []).length ? ';' : ','
  const camp = (l: string) => {
    const o: string[] = []; let c = '', q = false
    for (let i = 0; i < l.length; i++) {
      const ch = l[i]
      if (q) { if (ch === '"') { if (l[i + 1] === '"') { c += '"'; i++ } else q = false } else c += ch }
      else if (ch === '"') q = true
      else if (ch === sep) { o.push(c.trim()); c = '' }
      else c += ch
    }
    o.push(c.trim()); return o
  }
  const ant = camp(linii[0]).map((x) => cheie(x).replace(/ /g, '_'))
  return linii.slice(1).map((l) => { const c = camp(l); return Object.fromEntries(ant.map((a, i) => [a, c[i] ?? ''])) })
}

/** CSV sau JSON (lista de obiecte, sau { items | data | rows: [...] }) */
export function randuri(text: string): Record<string, string>[] {
  const t = String(text || '').trim()
  if (t.startsWith('[') || t.startsWith('{')) {
    const j = JSON.parse(t)
    const l: unknown[] = Array.isArray(j) ? j : j.items || j.data || j.rows || j.stations || []
    return l.map((o) => Object.fromEntries(Object.entries(o as Record<string, unknown>).map(([k, v]) => [cheie(k).replace(/ /g, '_'), v == null ? '' : String(v)])))
  }
  return randuriCsv(t)
}

/** primul camp care exista din lista de nume posibile */
export const camp = (r: Record<string, string>, ...n: string[]) => { for (const k of n) if (r[k] != null && r[k] !== '') return r[k]; return '' }
