import { describe, it, expect } from 'vitest'
import { frazaHTML, frazaText } from '../../src/shared/fraza'
import { P, invP, fitVB, eAutostrada, fara } from '../../src/shared/harta'
import { extreme, fereastraIeftina, economieAnuala, dialHTML } from '../../src/shared/energie'
import { h, raw } from '../../src/site/html'
import { laOraRO, ziRO, cand, salut, ziPlus } from '../../src/site/timp'

const PR = [520, 480, 455, 440, 450, 510, 640, 780, 812, 690, 520, 390, 310, 268, 290, 380, 560, 820, 1045, 1120, 980, 760, 640, 580]

describe('fraza momentului', () => {
  it('transforma marcajul in butoane legate de harta', () => {
    const x = frazaHTML('Pe {drum|A1|spre Pitești} se merge greu, {vreme|cod galben}, {ieftin|12:00 și 15:00}.')
    expect(x).toContain('data-layer="drumuri"')
    expect(x).toContain('<span class="shield a">A1</span>')
    expect(x).toContain('class="chip-in yellow" data-layer="vreme"')
    expect(x).toContain('data-scroll="energie"')
  })
  it('escapeaza textul redactorului', () => {
    expect(frazaHTML('<script>x</script> {avarii|<b>y</b>}')).not.toMatch(/<script>|<b>/)
  })
  it('textul simplu nu are marcaj', () => expect(frazaText('Pe {drum|DN6|spre Caracal} azi')).toBe('Pe DN6 spre Caracal azi'))
})

describe('sabloane HTML', () => {
  it('escapeaza implicit, lasa doar raw()', () => {
    expect(h`<p>${'<img onerror=x>'}</p>`.s).toBe('<p>&lt;img onerror=x&gt;</p>')
    expect(h`<p>${raw('<b>ok</b>')}</p>`.s).toBe('<p><b>ok</b></p>')
    expect(h`<ul>${['a', '<b>'].map((x) => h`<li>${x}</li>`)}</ul>`.s).toBe('<ul><li>a</li><li>&lt;b&gt;</li></ul>')
  })
})

describe('harta', () => {
  it('proiectia se inverseaza', () => { const [x, y] = P(23.8, 44.32); const [lo, la] = invP(x, y); expect(lo).toBeCloseTo(23.8, 6); expect(la).toBeCloseTo(44.32, 6) })
  it('cadrul regiunii pastreaza proportia hartii', () => { const [, , w, hh] = fitVB([189, 408, 299, 287], 'sv'); expect(w / hh).toBeCloseTo(1000 / 704, 3) })
  it('scuturile: autostrada si drum expres sunt verzi', () => { expect(eAutostrada('A1')).toBe(true); expect(eAutostrada('DX12')).toBe(true); expect(eAutostrada('DN6')).toBe(false) })
  it('cheile fara diacritice', () => expect(fara('Râmnicu Vâlcea')).toBe('Ramnicu Valcea'))
})

describe('energie', () => {
  it('gaseste ora cea mai ieftina si cea mai scumpa', () => expect(extreme(PR)).toMatchObject({ ieftin: 13, scump: 19, minP: 268, maxP: 1120 }))
  it('fereastra ieftina de 3 ore incepe la 12', () => expect(fereastraIeftina(PR)).toBe(12))
  it('economia anuala pentru masina de spalat', () => expect(economieAnuala(1, PR)).toBe(177))
  it('cadranul are 24 de bare si tabel accesibil', () => { const x = dialHTML(PR, 8, 42); expect(x.match(/class="bar"/g)?.length).toBe(24); expect(x).toContain('<caption>') })
})

describe('ora Romaniei', () => {
  it('laOraRO respecta fusul orar (iarna UTC+2, vara UTC+3)', () => {
    expect(laOraRO('2026-11-24', '08:42').toISOString()).toBe('2026-11-24T06:42:00.000Z')
    expect(laOraRO('2026-07-01', '08:42').toISOString()).toBe('2026-07-01T05:42:00.000Z')
  })
  it('ziua si „ieri”', () => {
    const acum = laOraRO('2026-11-24', '08:42')
    expect(ziRO(acum)).toBe('2026-11-24')
    expect(cand(laOraRO('2026-11-24', '07:58'), acum)).toBe('07:58')
    expect(cand(laOraRO('2026-11-23', '22:14'), acum)).toBe('ieri')
    expect(ziPlus('2026-12-31', 1)).toBe('2027-01-01')
  })
  it('salutul dupa ora', () => { expect(salut(8)).toBe('Bună dimineața'); expect(salut(13)).toBe('Bună ziua'); expect(salut(20)).toBe('Bună seara') })
})
