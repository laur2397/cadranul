#!/bin/bash
# Porneste Cadranul pe un Mac (Intel sau Apple), fara Homebrew si fara parola de sistem.
# Tot ce descarca sta in ~/.cadranul-tools. Oprire: Ctrl+C. Data viitoare: bash porneste-mac.sh
# Optional: bash porneste-mac.sh --cu-surse  porneste si importurile automate de date (ANM, OPCOM; docs/fluxuri-date.md)
set -e
cd "$(dirname "$0")"
T="$HOME/.cadranul-tools"; mkdir -p "$T"
echo "== Cadranul: pornire locala =="

# 1. Node 24.22.3 direct de pe nodejs.org
ARCH=$(uname -m); [ "$ARCH" = "x86_64" ] && ARCH=x64
NODE="$T/node-v24.22.3-darwin-$ARCH"
if [ ! -x "$NODE/bin/node" ]; then
  echo "Descarc Node..."
  curl -fL --progress-bar "https://nodejs.org/dist/v24.22.3/node-v24.22.3-darwin-$ARCH.tar.gz" | tar -xz -C "$T"
fi
export PATH="$NODE/bin:$PATH"

# 2. Baza de date PostgreSQL 18, portabila
if [ ! -d "$T/pg/node_modules/embedded-postgres" ]; then
  echo "Descarc baza de date..."
  mkdir -p "$T/pg"; (cd "$T/pg" && npm init -y >/dev/null && npm i --no-audit --no-fund embedded-postgres@18.7.0-beta.19)
fi
cat > "$T/pg/pg.mjs" <<'JS'
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
JS
PGPID=""; WPID=""
trap 'kill $WPID 2>/dev/null; [ -n "$PGPID" ] && kill $PGPID 2>/dev/null; wait $PGPID 2>/dev/null' EXIT
DBOK=""
if nc -z 127.0.0.1 5434 2>/dev/null; then
  # Ceva asculta deja pe portul bazei: verificam ca raspunde cu adevarat (o baza agatata blocheaza tot)
  if [ -d node_modules/pg ] && node scripts/verifica-db.mjs postgres://cadranul:cadranul@127.0.0.1:5434/cadranul; then
    echo "Baza de date era deja pornita si raspunde: o folosesc."; DBOK=1
  else
    echo "Opresc baza de date ramasa agatata de data trecuta..."
    pkill -f "$T/pg" 2>/dev/null || true; sleep 3
  fi
fi
if [ -z "$DBOK" ]; then
  rm -f "$T/pg/data-utf8/postmaster.pid"
  echo "Pornesc baza de date (prima data dureaza pana la un minut)..."
  (cd "$T/pg" && exec node pg.mjs "$T/pg/data-utf8" > "$T/pg/log.txt" 2>&1) &
  PGPID=$!
  for i in $(seq 1 90); do grep -q PG_GATA "$T/pg/log.txt" 2>/dev/null && break; [ $((i % 10)) -eq 0 ] && echo "  ... inca astept baza de date ($i s)"; sleep 1; done
  grep -q PG_GATA "$T/pg/log.txt" || { echo "Baza de date nu a pornit:"; tail -20 "$T/pg/log.txt"; exit 1; }
fi
echo "Baza de date pornita."

# 3. Setari locale
if ! grep -q "127.0.0.1:5434/cadranul" .env 2>/dev/null; then
  cat > .env <<EOF
DATABASE_URI=postgres://cadranul:cadranul@127.0.0.1:5434/cadranul
PAYLOAD_SECRET=$(openssl rand -hex 32)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEMO=true
NEXT_PUBLIC_ADS_ON_REFUSAL=none
EOF
fi

# 4. Programe, tabele, continut demonstrativ (doar prima data: seed-ul sterge baza)
[ -d node_modules/next ] || { echo "Instalez programele site-ului (prima data: 5-10 minute)..."; npm ci --no-audit --no-fund; }
echo "Actualizez tabelele bazei de date..."
npm run migreaza
if [ ! -f "$T/pg/seed-facut-utf8" ]; then echo "Incarc continutul demonstrativ (1-2 minute)..."; npm run seed && touch "$T/pg/seed-facut-utf8"; fi

# 5. Porneste (cu --cu-surse: si worker-ul importurilor automate, jurnal in ~/.cadranul-tools/surse.log)
if [ "$1" = "--cu-surse" ]; then
  # o rulare completa imediat (aduce datele reale de azi), apoi worker-ul dupa program
  ( npm run surse -- all; npm run surse:worker ) > "$T/surse.log" 2>&1 &
  WPID=$!
  echo "Importurile automate rulează (jurnal: $T/surse.log, stare: npm run surse:status)"
fi
( sleep 20; open http://localhost:3000 ) &
echo "== Site: http://localhost:3000   Redactie: http://localhost:3000/admin   Oprire: Ctrl+C =="
npm run dev
