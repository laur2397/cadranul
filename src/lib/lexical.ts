// Conversia intre blocurile simple ale corpului articolului si formatul Lexical al Payload.
// - blocuriInLexical: la seed si la importuri (text simplu -> baza de date)
// - lexicalInBlocuri: la afisare (baza de date -> blocuri pe care le deseneaza src/site/articol.ts)
// Aceeasi pereche de functii este si ruta de iesire din Payload (export HTML).
import { urlSigur } from './rute'

export type BlocProto =
  | { t: 'p'; x: string } | { t: 'h2'; x: string } | { t: 'list'; items: string[] }
  | { t: 'quote'; x: string; by?: string }
  | { t: 'energie'; title?: string; sub?: string } | { t: 'calc'; kind: 'pensie' | 'curent' | 'plin'; title?: string }
  | { t: 'timeline'; title?: string; items: { when: string; x: string }[] }
  | { t: 'data'; title: string; cols: string[]; rows: (string | number)[][]; source?: string }
  | { t: 'chart'; title: string; kind?: string; unit?: string; labels: string[]; values: number[]; source?: string }
  | { t: 'related'; id: string }

type Nod = Record<string, unknown> & { type: string; children?: Nod[] }

const text = (t: string): Nod => ({ type: 'text', text: t, format: 0, style: '', mode: 'normal', detail: 0, version: 1 })
const baza = { direction: 'ltr', format: '', indent: 0, version: 1 }
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

// Paragraf cu legaturi <a href="..">..</a> (singura eticheta inline din prototip) -> noduri Lexical
function inline(html: string): Nod[] {
  const out: Nod[] = []
  const re = /<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g
  let last = 0, m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    if (m.index > last) out.push(text(decode(html.slice(last, m.index))))
    const href = urlSigur(decode(m[1]))
    out.push({ type: 'link', version: 3, direction: 'ltr', format: '', indent: 0,
      fields: { linkType: 'custom', url: href, newTab: /^https?:/.test(href) }, children: [text(decode(m[2].replace(/<[^>]+>/g, '')))] })
    last = re.lastIndex
  }
  if (last < html.length) out.push(text(decode(html.slice(last))))
  return out.length ? out : [text('')]
}

let n = 0
const bid = () => `b${Date.now().toString(36)}${(n++).toString(36)}`

export function blocuriInLexical(blocks: BlocProto[], idPentruSlug: (slug: string) => number | string | null = () => null) {
  const children: Nod[] = []
  for (const b of blocks || []) {
    switch (b.t) {
      case 'p': children.push({ type: 'paragraph', ...baza, textFormat: 0, textStyle: '', children: inline(b.x) }); break
      case 'h2': children.push({ type: 'heading', tag: 'h2', ...baza, children: [text(decode(b.x))] }); break
      case 'list': children.push({ type: 'list', listType: 'bullet', start: 1, tag: 'ul', ...baza,
        children: b.items.map((it, i) => ({ type: 'listitem', value: i + 1, ...baza, children: inline(it) })) }); break
      case 'quote': children.push(bloc('citat', { x: b.x, by: b.by || '' })); break
      case 'energie': children.push(bloc('energieAzi', { title: b.title || 'Curentul azi, oră de oră', sub: b.sub || 'Piața pentru ziua următoare, lei/MWh. Linia punctată arată ora la care citești.' })); break
      case 'calc': children.push(bloc('calculator', { kind: b.kind, title: b.title || '' })); break
      case 'timeline': children.push(bloc('cronologie', { title: b.title || 'Cum am ajuns aici', items: b.items.map((i) => ({ when: i.when, x: i.x })) })); break
      case 'data': children.push(bloc('date', { title: b.title, cols: b.cols.map((c) => ({ c })), rows: b.rows.map((r) => ({ cells: r.map((v) => ({ v: String(v) })) })), source: b.source || '' })); break
      case 'chart': children.push(bloc('grafic', { title: b.title, kind: b.kind === 'line' ? 'line' : 'bar', unit: b.unit || '', points: b.labels.map((l, i) => ({ label: String(l), value: Number(b.values[i] ?? 0) })), source: b.source || '' })); break
      case 'related': { const id = idPentruSlug(b.id); if (id) children.push(bloc('citesteSi', { article: id })); break }
    }
  }
  return { root: { type: 'root', ...baza, children } }
}
function bloc(blockType: string, fields: Record<string, unknown>): Nod {
  return { type: 'block', version: 2, format: '', fields: { id: bid(), blockName: '', blockType, ...fields } }
}

// ——— Directia inversa ———
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

function inlineHtml(nodes: Nod[] = []): string {
  return nodes.map((nd) => {
    if (nd.type === 'text') {
      let s = esc(String(nd.text || ''))
      const f = Number(nd.format || 0)
      if (f & 1) s = `<strong>${s}</strong>`
      if (f & 2) s = `<em>${s}</em>`
      return s
    }
    if (nd.type === 'link' || nd.type === 'autolink') {
      const url = urlSigur(String((nd.fields as { url?: string } | undefined)?.url || '#'))
      const ext = /^https?:/i.test(url)
      return `<a href="${esc(url)}"${ext ? ' rel="noopener"' : ''}>${inlineHtml(nd.children)}</a>`
    }
    if (nd.type === 'linebreak') return '<br>'
    return inlineHtml(nd.children)
  }).join('')
}

export type ArticolRef = { slug: string; title: string } | null

export function lexicalInBlocuri(json: unknown, rezolva: (id: unknown) => ArticolRef = () => null): BlocProto[] {
  const root = (json as { root?: Nod } | null)?.root
  const out: BlocProto[] = []
  for (const nd of root?.children || []) {
    if (nd.type === 'paragraph') { const x = inlineHtml(nd.children); if (x.trim()) out.push({ t: 'p', x }) }
    else if (nd.type === 'heading') out.push({ t: 'h2', x: esc((nd.children || []).map((c) => String(c.text || '')).join('')) })
    else if (nd.type === 'list') out.push({ t: 'list', items: (nd.children || []).map((li) => inlineHtml(li.children)) })
    else if (nd.type === 'quote') out.push({ t: 'quote', x: inlineHtml(nd.children) })
    else if (nd.type === 'block') {
      const f = nd.fields as Record<string, any>
      switch (f.blockType) {
        case 'citat': out.push({ t: 'quote', x: esc(f.x), by: f.by || undefined }); break
        case 'energieAzi': out.push({ t: 'energie', title: f.title, sub: f.sub }); break
        case 'calculator': out.push({ t: 'calc', kind: f.kind, title: f.title || undefined }); break
        case 'cronologie': out.push({ t: 'timeline', title: f.title, items: (f.items || []).map((i: { when: string; x: string }) => ({ when: i.when, x: i.x })) }); break
        case 'date': out.push({ t: 'data', title: f.title, cols: (f.cols || []).map((c: { c: string }) => c.c), rows: (f.rows || []).map((r: { cells?: { v: string }[] }) => (r.cells || []).map((c) => c.v)), source: f.source }); break
        case 'grafic': out.push({ t: 'chart', title: f.title, kind: f.kind, unit: f.unit, labels: (f.points || []).map((p: { label: string }) => p.label), values: (f.points || []).map((p: { value: number }) => Number(p.value)), source: f.source }); break
        case 'citesteSi': { const r = rezolva(f.article); if (r) out.push({ t: 'related', id: r.slug }); break }
      }
    }
  }
  return out
}
