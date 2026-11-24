// Capturi de ecran pentru verificarea fidelitatii fata de designul aprobat (referinta-design-d/shots).
// Ruleaza pe un server pornit (npm start). BASE_URL implicit http://localhost:3000. Rezultatul: shots/.
import { chromium, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const OUT = 'shots'
mkdirSync(OUT, { recursive: true })

type Cap = { nume: string; cale: string; w: number; h: number; dark?: boolean; full?: boolean; strat?: string; ed?: string }
const CAPTURI: Cap[] = [
  { nume: 'home-390', cale: '/', w: 390, h: 844 },
  { nume: 'home-1440', cale: '/', w: 1440, h: 900 },
  { nume: 'home-1440-dark', cale: '/', w: 1440, h: 900, dark: true },
  { nume: 'home-1440-full', cale: '/', w: 1440, h: 900, full: true },
  { nume: 'home-390-full', cale: '/', w: 390, h: 844, full: true },
  { nume: 'oltenia-390', cale: '/editie/sud-vest-oltenia', w: 390, h: 844 },
  { nume: 'oltenia-1440', cale: '/editie/sud-vest-oltenia', w: 1440, h: 900 },
  { nume: 'oltenia-1440-full', cale: '/editie/sud-vest-oltenia', w: 1440, h: 900, full: true },
  { nume: 'oltenia-1440-drumuri', cale: '/editie/sud-vest-oltenia', w: 1440, h: 900, strat: 'drumuri' },
  { nume: 'home-1440-vreme-dark', cale: '/', w: 1440, h: 900, dark: true, strat: 'vreme' },
  { nume: 'article-390', cale: '/articol/curentul-cel-mai-ieftin-la-pranz', w: 390, h: 844 },
  { nume: 'article-390-dark', cale: '/articol/curentul-cel-mai-ieftin-la-pranz', w: 390, h: 844, dark: true },
  { nume: 'article-1440', cale: '/articol/curentul-cel-mai-ieftin-la-pranz', w: 1440, h: 900 },
  { nume: 'article-1440-full', cale: '/articol/curentul-cel-mai-ieftin-la-pranz', w: 1440, h: 900, full: true },
  { nume: 'drumuri-390', cale: '/drumuri', w: 390, h: 844 },
  { nume: 'drumuri-1440', cale: '/drumuri', w: 1440, h: 900 },
  { nume: 'joburi-390', cale: '/joburi', w: 390, h: 844 },
  { nume: 'joburi-1440', cale: '/joburi', w: 1440, h: 900 },
  { nume: 'energie-1440', cale: '/energie', w: 1440, h: 900 },
]

async function pregateste(page: Page, c: Cap) {
  await page.addInitScript((dark) => {
    localStorage.setItem('cad_ck', 'deny')
    localStorage.setItem('cad_theme', dark ? 'dark' : 'light')
  }, !!c.dark)
}

;(async () => {
  const b = await chromium.launch()
  for (const c of CAPTURI) {
    const ctx = await b.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: c.w < 500 && !c.full ? 2 : 1, locale: 'ro-RO', timezoneId: 'Europe/Bucharest' })
    const page = await ctx.newPage()
    await pregateste(page, c)
    await page.goto(BASE + c.cale, { waitUntil: 'networkidle' })
    if (c.strat) await page.click(`#layers [data-l="${c.strat}"]`)
    await page.waitForTimeout(1600)
    await page.screenshot({ path: `${OUT}/${c.nume}.png`, fullPage: !!c.full })
    await ctx.close()
    console.log(c.nume)
  }
  await b.close()
})()
