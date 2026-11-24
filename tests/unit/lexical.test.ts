import { describe, it, expect } from 'vitest'
import { blocuriInLexical, lexicalInBlocuri, type BlocProto } from '../../src/lib/lexical'

describe('conversia corpului articolului <-> Lexical', () => {
  const corp: BlocProto[] = [
    { t: 'p', x: 'Text cu <a href="/articol/alt-articol">o legatura</a> si &amp; caractere.' },
    { t: 'h2', x: 'Subtitlu' },
    { t: 'list', items: ['unu', 'doi'] },
    { t: 'quote', x: 'Citat', by: 'Cineva' },
    { t: 'energie' },
    { t: 'calc', kind: 'pensie' },
    { t: 'timeline', items: [{ when: '2021', x: 'Liberalizare' }] },
    { t: 'data', title: 'Tabel', cols: ['A', 'B'], rows: [['1', '2']], source: 'INS' },
    { t: 'chart', title: 'Grafic', kind: 'bar', unit: '%', labels: ['x', 'y'], values: [1, 2], source: 'BNR' },
    { t: 'related', id: 'tinta' },
  ]
  const lex = blocuriInLexical(corp, (s) => (s === 'tinta' ? 7 : null))
  const inapoi = lexicalInBlocuri(lex, (id) => (id === 7 ? { slug: 'tinta', title: 'T' } : null))

  it('pastreaza ordinea si tipurile blocurilor', () => {
    expect(inapoi.map((b) => b.t)).toEqual(['p', 'h2', 'list', 'quote', 'energie', 'calc', 'timeline', 'data', 'chart', 'related'])
  })
  it('pastreaza legaturile interne si escaparea', () => {
    expect((inapoi[0] as any).x).toContain('href="/articol/alt-articol"')
    expect((inapoi[0] as any).x).toContain('&amp; caractere')
  })
  it('pastreaza datele tabelului, ale graficului si blocurile noi', () => {
    expect(inapoi[7]).toMatchObject({ cols: ['A', 'B'], rows: [['1', '2']], source: 'INS' })
    expect(inapoi[8]).toMatchObject({ labels: ['x', 'y'], values: [1, 2], unit: '%' })
    expect(inapoi[5]).toMatchObject({ kind: 'pensie' })
    expect(inapoi[6]).toMatchObject({ items: [{ when: '2021', x: 'Liberalizare' }] })
  })
  it('escapeaza textul (nu lasa HTML injectat)', () => {
    const l = blocuriInLexical([{ t: 'p', x: '&lt;script&gt;alert(1)&lt;/script&gt;' }])
    expect((lexicalInBlocuri(l)[0] as any).x).not.toContain('<script>')
  })
})
