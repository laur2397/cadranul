import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Testele ruleaza pe un server pornit (npm start) cu baza umpluta de `npm run seed`.
const ARTICOL = '/articol/curentul-cel-mai-ieftin-la-pranz'
const EDITIE = '/editie/sud-vest-oltenia'
const PAGINI_200 = [
  '/', EDITIE, '/editie/nord-est', '/editie/bucuresti-ilfov', ARTICOL, '/articol/bugetul-pe-2027-intra-in-parlament', '/articol/cum-alegi-o-centrala-in-condensare',
  '/judet/dolj', '/judet/cluj', '/politica', '/bani', '/trafic', '/drumuri', '/energie', '/joburi', '/joburi?judet=dolj', '/farmacii', '/farmacii?judet=gorj',
  '/live/ninsoare-la-munte-dn1-dn7', '/pagina/despre', '/pagina/confidentialitate', '/pagina/cookie', '/pagina/termeni', '/pagina/publicitate', '/pagina/corecturi',
  '/cauta', '/cauta?q=pensii', '/autor/ana-mitrea', '/rss.xml', '/editie/sud-vest-oltenia/rss.xml', '/sitemap.xml', '/sitemap-news.xml', '/robots.txt', '/ads.txt',
]
const PAGINI_404 = ['/nu-exista', '/editie/inexistenta', '/articol/inexistent', '/judet/atlantida', '/joburi/nu-exista', '/live/x', '/pagina/x', '/autor/x', '/a/b/c', '/articol/Majuscule']

// fara banner de cookie in capturi si teste de interfata (decizia „refuz”)
async function faraBanner(page: Page, tema: 'light' | 'dark' = 'light') {
  await page.addInitScript((t) => { localStorage.setItem('cad_ck', 'deny'); localStorage.setItem('cad_theme', t) }, tema)
}

test.describe('coduri de raspuns', () => {
  test.skip(({ viewport }) => (viewport?.width || 0) > 500, 'o singura data')
  for (const p of PAGINI_200) test(`200 ${p}`, async ({ request }) => expect((await request.get(p)).status()).toBe(200))
  for (const p of PAGINI_404) test(`404 ${p}`, async ({ request }) => expect((await request.get(p)).status()).toBe(404))
  test('/admin raspunde', async ({ request }) => expect((await request.get('/admin')).status()).toBeLessThan(400))
  test('ads.txt e text/plain, 200, fara redirectionare', async ({ request }) => {
    const r = await request.get('/ads.txt', { maxRedirects: 0 })
    expect(r.status()).toBe(200)
    expect(r.headers()['content-type']).toContain('text/plain')
  })
  test('harta Google News nu contine continut platit', async ({ request }) => {
    const x = await (await request.get('/sitemap-news.xml')).text()
    expect(x).toContain('<news:news>')
    expect(x).not.toContain('cum-alegi-o-centrala-in-condensare')
  })
  test('in modul demonstrativ nu se indexeaza nimic', async ({ request }) => {
    expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /')
    const r = await request.get('/')
    expect(r.headers()['x-robots-tag']).toContain('noindex')
    expect(await r.text()).toContain('<meta name="robots" content="noindex, nofollow">')
  })
  test('articolul are NewsArticle si BreadcrumbList', async ({ request }) => {
    const x = await (await request.get(ARTICOL)).text()
    expect(x).toContain('"@type":"NewsArticle"')
    expect(x).toContain('"@type":"BreadcrumbList"')
  })
  test('cookie-ul de editie randeaza editia aleasa pe prima pagina', async ({ request }) => {
    const x = await (await request.get('/', { headers: { cookie: 'cad_ed=sud-vest-oltenia' } })).text()
    expect(x).toContain('Craiova.</h1>')
  })
})

test.describe('consimtamant', () => {
  test('nicio cerere catre terti inainte de alegere; bannerul are Refuz si Accept la fel de mari', async ({ page }) => {
    const terti: string[] = []
    page.on('request', (r) => { const u = new URL(r.url()); if (!/^(localhost|127\.0\.0\.1)$/.test(u.hostname) && u.protocol.startsWith('http')) terti.push(u.hostname) })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('#cookie')).toBeVisible()
    const [a, b] = await Promise.all([page.locator('[data-ck="deny"]').boundingBox(), page.locator('[data-ck="accept"]').boundingBox()])
    expect(Math.round(a!.width)).toBe(Math.round(b!.width))
    expect(Math.round(a!.height)).toBe(Math.round(b!.height))
    await page.goto(ARTICOL)
    await page.waitForLoadState('networkidle')
    expect(terti).toEqual([])
  })
  test('dupa „Refuz tot” bannerul dispare si tot nu pleaca nimic la terti', async ({ page }) => {
    const terti: string[] = []
    page.on('request', (r) => { const u = new URL(r.url()); if (!/^(localhost|127\.0\.0\.1)$/.test(u.hostname) && u.protocol.startsWith('http')) terti.push(u.hostname) })
    await page.goto('/')
    await page.click('[data-ck="deny"]')
    await expect(page.locator('#cookie')).toBeHidden()
    await page.reload(); await page.waitForLoadState('networkidle')
    await expect(page.locator('#cookie')).toBeHidden()
    expect(terti).toEqual([])
  })
})

test.describe('interactiuni', () => {
  test('straturile hartii si bifele de citire', async ({ page }) => {
    await faraBanner(page)
    await page.goto('/')
    await expect(page.locator('#ov .pin').first()).toBeVisible()
    await page.click('#layers [data-l="drumuri"]')
    await expect(page.locator('#mapbox')).toHaveClass(/l-drumuri/)
    await expect(page.locator('#ov .rmark').first()).toBeVisible()
    await page.click('#layers [data-l="avarii"]')
    await expect(page.locator('#ov .ico').first()).toBeVisible()
    await page.locator('#catchList .tick').first().click()
    await expect(page.locator('#ringTxt')).toHaveText(/^1\//)
  })
  test('alegerea editiei duce la editie si o tine minte', async ({ page }) => {
    await faraBanner(page)
    await page.goto('/')
    await page.click('#edBtn')
    await page.click('#edSheet [data-region="sv"]')
    await page.waitForURL('**/editie/sud-vest-oltenia')
    await expect(page.locator('#greet')).toContainText('Craiova')
    await page.goto('/')
    await expect(page.locator('#greet')).toContainText('Craiova')
    await page.click('#edBtn'); await page.click('#edSheet .ed-nat')
    await page.waitForURL((u) => u.pathname === '/')
    await expect(page.locator('#greet')).toContainText('România')
  })
  test('modul intunecat se pastreaza', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cad_ck', 'deny'))
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto(ARTICOL)
    await page.click('#themeBtn')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
})

test.describe('fara depasire pe orizontala la 390 px', () => {
  test.skip(({ viewport }) => (viewport?.width || 0) > 500, 'doar pe telefon')
  for (const p of ['/', EDITIE, ARTICOL, '/drumuri', '/energie', '/joburi', '/joburi/operator-productie-filiasi', '/farmacii', '/judet/dolj', '/live/ninsoare-la-munte-dn1-dn7', '/pagina/despre', '/politica', '/cauta?q=apa']) {
    test(p, async ({ page }) => {
      await faraBanner(page)
      const r = await page.goto(p)
      expect(r?.status()).toBeLessThan(400)
      await page.waitForTimeout(300)
      const w = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(w).toBeLessThanOrEqual(390)
    })
  }
})

test.describe('accesibilitate (axe, WCAG 2.2 AA)', () => {
  for (const tema of ['light', 'dark'] as const) {
    for (const p of ['/', EDITIE, ARTICOL]) {
      test(`fara incalcari grave ${p} (${tema})`, async ({ page }) => {
        await faraBanner(page, tema)
        await page.goto(p)
        await page.waitForTimeout(900)
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
        const grave = r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
        expect(grave.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
      })
    }
  }
})
