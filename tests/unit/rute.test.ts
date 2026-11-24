import { describe, it, expect } from 'vitest'
import { rute, slugValid, urlSigur } from '../../src/lib/rute'

describe('rute', () => {
  it('adresele publice sunt stabile', () => {
    expect(rute.articol('x')).toBe('/articol/x')
    expect(rute.editie('sud-vest-oltenia')).toBe('/editie/sud-vest-oltenia')
    expect(rute.sectiune('energie')).toBe('/energie')
    expect(rute.sectiune('politica')).toBe('/politica')
    expect(rute.job('operator')).toBe('/joburi/operator')
  })
  it('valideaza slug-urile', () => {
    expect(slugValid('dn6-craiova')).toBe(true)
    expect(slugValid('Dn6')).toBe(false)
    expect(slugValid('a--b')).toBe(false)
    expect(slugValid('x.php')).toBe(false)
  })
  it('blocheaza legaturile periculoase', () => {
    expect(urlSigur('javascript:alert(1)')).toBe('#')
    expect(urlSigur('data:text/html,x')).toBe('#')
    expect(urlSigur('//evil.com')).toBe('#')
    expect(urlSigur('/articol/x')).toBe('/articol/x')
    expect(urlSigur('https://anpc.ro')).toBe('https://anpc.ro')
  })
})
