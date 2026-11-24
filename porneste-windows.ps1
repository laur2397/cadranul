# Porneste Cadranul pe Windows, fara instalari in sistem si fara drepturi de administrator.
# Tot ce descarca sta in %USERPROFILE%\.cadranul-tools. Oprire: Ctrl+C sau inchizi fereastra.
# Optional: porneste-windows.cmd -CuSurse  porneste si importurile automate de date (ANM, OPCOM; docs/fluxuri-date.md)
param([switch]$CuSurse)
$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot
$T = Join-Path $env:USERPROFILE '.cadranul-tools'
New-Item -ItemType Directory -Force -Path $T | Out-Null
Write-Host '== Cadranul: pornire locala ==' -ForegroundColor Cyan

# 1. Node 24.22.3, direct de pe nodejs.org
$NodeDir = Join-Path $T 'node-v24.22.3-win-x64'
if (-not (Test-Path (Join-Path $NodeDir 'node.exe'))) {
  Write-Host 'Descarc Node...'
  $zip = Join-Path $T 'node.zip'
  Invoke-WebRequest -UseBasicParsing 'https://nodejs.org/dist/v24.22.3/node-v24.22.3-win-x64.zip' -OutFile $zip
  Expand-Archive -Force $zip -DestinationPath $T
  Remove-Item $zip
}
$env:Path = "$NodeDir;$env:Path"
Write-Host ("Node " + (& node -v))

# 2. Baza de date PostgreSQL 18 portabila
$Pg = Join-Path $T 'pg'
New-Item -ItemType Directory -Force -Path $Pg | Out-Null
if (-not (Test-Path (Join-Path $Pg 'node_modules\embedded-postgres'))) {
  Write-Host 'Descarc baza de date...'
  Push-Location $Pg
  & npm init -y | Out-Null
  & npm i --no-audit --no-fund embedded-postgres@18.7.0-beta.19
  Pop-Location
}
@'
import EmbeddedPostgres from 'embedded-postgres'
import { existsSync } from 'node:fs'
const dir = process.argv[2]
const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'cadranul', password: 'cadranul', port: 5434, persistent: true, initdbFlags: ['--encoding=UTF8', '--locale=C'] })
if (!existsSync(dir + '/PG_VERSION')) await pg.initialise()
await pg.start()
try { await pg.createDatabase('cadranul') } catch {}
console.log('PG_GATA')
const stop = async () => { await pg.stop(); process.exit(0) }
process.on('SIGINT', stop); process.on('SIGTERM', stop)
setInterval(() => {}, 1 << 30)
'@ | Set-Content -Encoding UTF8 (Join-Path $Pg 'pg.mjs')
$Log = Join-Path $Pg 'log.txt'
# Daca o pornire anterioara a lasat baza de date deschisa (fereastra inchisa), o oprim intai
Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like '*pg.mjs*' -or $_.CommandLine -like '*cadranul-tools*postgres*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Get-Process -Name postgres -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$T*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2
if (Test-Path $Log) { Remove-Item $Log -Force -ErrorAction SilentlyContinue }
$pgProc = Start-Process -FilePath (Join-Path $NodeDir 'node.exe') -ArgumentList @('pg.mjs', (Join-Path $Pg 'data-utf8')) `
  -WorkingDirectory $Pg -RedirectStandardOutput $Log -RedirectStandardError (Join-Path $Pg 'err.txt') -WindowStyle Hidden -PassThru
try {
  $ok = $false
  for ($i = 0; $i -lt 90; $i++) { if ((Test-Path $Log) -and (Select-String -Path $Log -Pattern 'PG_GATA' -Quiet)) { $ok = $true; break }; Start-Sleep 1 }
  if (-not $ok) { Write-Host 'Baza de date nu a pornit:' -ForegroundColor Red; Get-Content (Join-Path $Pg 'err.txt') -Tail 20; exit 1 }
  Write-Host 'Baza de date pornita.'

  # 3. Setari locale
  if (-not ((Test-Path .env) -and (Select-String -Path .env -Pattern '5434/cadranul' -Quiet))) {
    $bytes = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = -join ($bytes | ForEach-Object { $_.ToString('x2') })
    @"
DATABASE_URI=postgres://cadranul:cadranul@localhost:5434/cadranul
PAYLOAD_SECRET=$secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEMO=true
NEXT_PUBLIC_ADS_ON_REFUSAL=none
"@ | Set-Content -Encoding ASCII .env
  }

  # 4. Programe, tabele, continut demonstrativ (doar prima data: seed-ul sterge baza)
  if (-not (Test-Path 'node_modules\next')) { & npm ci --no-audit --no-fund; if ($LASTEXITCODE) { throw 'npm ci a esuat' } }
  & npx payload migrate; if ($LASTEXITCODE) { throw 'migrarea a esuat' }
  $marker = Join-Path $Pg 'seed-facut-utf8'
  if (-not (Test-Path $marker)) { & npm run seed; if ($LASTEXITCODE) { throw 'seed a esuat' }; New-Item $marker | Out-Null }

  # 5. Porneste site-ul (cu -CuSurse: si worker-ul importurilor automate, jurnal in .cadranul-tools\surse.log)
  if ($CuSurse) {
    $wProc = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', 'npm run surse:worker > "' + (Join-Path $T 'surse.log') + '" 2>&1') -WindowStyle Hidden -PassThru
    Write-Host 'Importurile automate ruleaza (stare: npm run surse:status)' -ForegroundColor Green
  }
  Start-Job { Start-Sleep 25; Start-Process 'http://localhost:3000' } | Out-Null
  Write-Host '== Site: http://localhost:3000   Redactie: http://localhost:3000/admin   Oprire: Ctrl+C ==' -ForegroundColor Green
  & npm run dev
}
finally {
  if ($wProc -and -not $wProc.HasExited) { & taskkill /T /F /PID $wProc.Id 2>&1 | Out-Null }
  if ($pgProc -and -not $pgProc.HasExited) { & taskkill /T /F /PID $pgProc.Id 2>&1 | Out-Null }
}
