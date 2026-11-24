#!/bin/bash
# Porneste Cadranul pe un Mac (Intel sau Apple), fara Homebrew si fara parola de sistem.
# Tot ce descarca sta in ~/.cadranul-tools. Oprire: Ctrl+C. Data viitoare: bash porneste-mac.sh
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
const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'cadranul', password: 'cadranul', port: 5434, persistent: true })
if (!existsSync(dir + '/PG_VERSION')) await pg.initialise()
await pg.start()
try { await pg.createDatabase('cadranul') } catch {}
console.log('PG_GATA')
const stop = async () => { await pg.stop(); process.exit(0) }
process.on('SIGINT', stop); process.on('SIGTERM', stop)
setInterval(() => {}, 1 << 30)
JS
(cd "$T/pg" && node pg.mjs "$T/pg/data" > "$T/pg/log.txt" 2>&1) &
PGPID=$!
trap 'kill $PGPID 2>/dev/null; wait $PGPID 2>/dev/null' EXIT
for i in $(seq 1 60); do grep -q PG_GATA "$T/pg/log.txt" 2>/dev/null && break; sleep 1; done
grep -q PG_GATA "$T/pg/log.txt" || { echo "Baza de date nu a pornit:"; tail -20 "$T/pg/log.txt"; exit 1; }

# 3. Setari locale
if ! grep -q "5434/cadranul" .env 2>/dev/null; then
  cat > .env <<EOF
DATABASE_URI=postgres://cadranul:cadranul@localhost:5434/cadranul
PAYLOAD_SECRET=$(openssl rand -hex 32)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEMO=true
NEXT_PUBLIC_ADS_ON_REFUSAL=none
EOF
fi

# 4. Programe, tabele, continut demonstrativ (doar prima data: seed-ul sterge baza)
[ -d node_modules/next ] || npm ci --no-audit --no-fund
npx payload migrate
if [ ! -f "$T/pg/seed-facut" ]; then npm run seed && touch "$T/pg/seed-facut"; fi

# 5. Porneste
( sleep 20; open http://localhost:3000 ) &
echo "== Site: http://localhost:3000   Redactie: http://localhost:3000/admin   Oprire: Ctrl+C =="
npm run dev
