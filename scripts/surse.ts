// Importurile automate de date (src/surse).
//   npm run surse -- <conector> [--dry-run]     un conector (ex. anm-avertizari, opcom-pzu)
//   npm run surse -- all [--dry-run]            toate sursele pornite
//   npm run surse:status                        registrul: ce e pornit, ultima rulare, ultima eroare
//   npm run surse:worker                        procesul permanent care le ruleaza dupa program (al doilea proces pe server)
import { completeazaLantulCA } from '../src/surse/ca'
import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import config from '../src/payload.config'
import { CONECTORI, conector } from '../src/surse/conectori'
import { asiguraRegistru, curataJurnal, eScadent, opritDinMediu, ruleazaConector, ruleazaToate, type Raport } from '../src/surse/rulare'
completeazaLantulCA()

const arg = process.argv.slice(2)
const dryRun = arg.includes('--dry-run')
const cmd = arg.find((a) => !a.startsWith('--')) || 'ajutor'

const ora = (s?: string | null) => (s ? new Intl.DateTimeFormat('ro-RO', { timeZone: 'Europe/Bucharest', dateStyle: 'short', timeStyle: 'short' }).format(new Date(s)) : '—')

async function status(payload: Payload) {
  const reg = await asiguraRegistru(payload)
  const rows = CONECTORI.map((c) => {
    const d = reg.get(c.key)!
    return {
      conector: c.key, pornit: d.enabled && !opritDinMediu(c.key) ? 'DA' : 'nu', legal: d.legalStatus, frecventa: c.frecventaText.split(' (')[0],
      ultima: ora(d.lastRun), succes: ora(d.lastSuccess), stare: d.lastStatus || '—', scrise: d.itemsWritten ?? '—', esecuri: d.consecutiveFailures || 0,
    }
  })
  console.table(rows)
  for (const c of CONECTORI) { const d = reg.get(c.key)!; if (d.lastError) console.log(`  ${c.key}: ultima eroare: ${d.lastError}`) }
  const faraAcord = CONECTORI.filter((c) => reg.get(c.key)!.legalStatus === 'needs_permission')
  if (faraAcord.length) console.log(`\nAșteaptă acordul sursei (cererile sunt în docs/cereri-acces/): ${faraAcord.map((c) => c.key).join(', ')}`)
}

function afiseaza(r: Raport) {
  console.log(`\n${r.key}: ${r.status}${dryRun ? ' (simulare, nu s-a scris nimic)' : ''}: ${r.mesaj}`)
  for (const s of r.schimbari.slice(0, 60)) console.log(`   ${s}`)
  if (r.schimbari.length > 60) console.log(`   … încă ${r.schimbari.length - 60}`)
}

async function worker(payload: Payload) {
  console.log(`[surse] worker pornit (${new Date().toISOString()}). Oprire: Ctrl+C. Surse: ${CONECTORI.map((c) => c.key).join(', ')}`)
  await asiguraRegistru(payload)
  let opreste = false, ultimaCuratenie = 0
  for (const s of ['SIGINT', 'SIGTERM'] as const) process.on(s, () => { console.log('[surse] opresc după rularea curentă…'); opreste = true })
  while (!opreste) {
    try {
      const reg = await asiguraRegistru(payload)
      const acum = new Date()
      for (const c of CONECTORI) {
        if (opreste) break
        const d = reg.get(c.key)!
        if (!d.enabled || opritDinMediu(c.key) || d.legalStatus === 'needs_permission') continue
        if (eScadent(c, d, acum)) await ruleazaConector(payload, c.key)
      }
      if (Date.now() - ultimaCuratenie > 24 * 3600e3) { await curataJurnal(payload); ultimaCuratenie = Date.now() }
    } catch (e) { console.error('[surse] eroare în bucla worker-ului:', (e as Error).message) }
    for (let i = 0; i < 30 && !opreste; i++) await new Promise((r) => setTimeout(r, 1000))
  }
  console.log('[surse] worker oprit.')
}

async function main() {
  if (cmd === 'ajutor' || cmd === 'help') {
    console.log('Folosire: npm run surse -- <conector|all|status|worker> [--dry-run]\nConectori:')
    for (const c of CONECTORI) console.log(`  ${c.key.padEnd(22)} ${c.name} (${c.frecventaText})`)
    return
  }
  if (!['status', 'worker', 'all'].includes(cmd) && !conector(cmd)) { console.error(`Conector necunoscut: ${cmd}. Vezi: npm run surse -- ajutor`); process.exitCode = 1; return }
  const payload = await getPayload({ config })
  if (cmd === 'status') await status(payload)
  else if (cmd === 'worker') await worker(payload)
  else {
    const l = cmd === 'all' ? await ruleazaToate(payload, { dryRun }) : [await ruleazaConector(payload, cmd, { dryRun })]
    l.forEach(afiseaza)
    if (l.some((r) => r.status === 'eroare')) process.exitCode = 1
  }
}

main().then(() => process.exit(process.exitCode || 0), (e) => { console.error(e); process.exit(1) })
