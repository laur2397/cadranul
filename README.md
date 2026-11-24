# Cadranul

România, oră de oră. Publicație de știri cu 8 ediții regionale, construită după designul aprobat D
(`referinta-design-d/`). Prima pagină este harta vie a României.

## Ce îți trebuie
- Node.js 24.22.3 (vezi `.nvmrc`)
- PostgreSQL 16 cu o bază goală (ex. `createdb cadranul`)

## Pornire locală
```bash
cp .env.example .env          # completează PAYLOAD_SECRET și DATABASE_URI
npm ci
npx payload migrate           # creează tabelele
npm run seed                  # conținut demonstrativ (ȘTERGE tot ce e în bază!)
npm run dev                   # http://localhost:3000
```
Redacția: http://localhost:3000/admin. La prima vizită îți creezi contul; primul cont devine administrator.
Poți crea contul și din seed: `SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run seed`.

## Versiunea de producție
```bash
npm run build && npm start
```

## Importurile automate de date (ANM, OPCOM, …)
Datele utile (coduri meteo, prețul curentului, apoi drumuri, carburanți, avarii) vin automat din surse oficiale printr-un
al doilea proces, lângă site, cu același `.env` (detalii și statutul legal al fiecărei surse: `docs/fluxuri-date.md`).
```bash
npm run surse:status                  # ce surse sunt pornite, ultima rulare, ultima eroare
npm run surse -- all --dry-run        # ce s-ar schimba acum, fără să scrie nimic
npm run surse -- opcom-pzu            # o sursă, acum
npm run surse:worker                  # procesul permanent (programul fiecărei surse)
```
Pe server, worker-ul rulează ca serviciu separat de `npm start`, de exemplu cu systemd:
```ini
# /etc/systemd/system/cadranul-surse.service
[Unit]
Description=Cadranul: importurile automate de date
After=network-online.target postgresql.service
[Service]
WorkingDirectory=/srv/cadranul
ExecStart=/usr/bin/npm run surse:worker
Restart=always
RestartSec=30
User=cadranul
[Install]
WantedBy=multi-user.target
```
sau cu pm2: `pm2 start npm --name cadranul-surse -- run surse:worker`. Un singur worker pe bază de date.
Setează `SURSE_CONTACT` (apare în User-Agent) și, opțional, `SURSE_ALERT_WEBHOOK` (alertă după 3 eșecuri la rând).
Oprire de urgență: /admin › Surse de date (debifezi „Pornit”) sau `SURSE_OPRITE=all`.
Local: `bash porneste-mac.sh --cu-surse` sau `porneste-windows.cmd -CuSurse`.

## Verificări
```bash
npm run typecheck && npm test && npm run audit:registru
npm start &  npm run test:e2e   # coduri, consimțământ, accesibilitate, ecran de 390 px
npm run shots                   # capturi în shots/, de comparat cu referinta-design-d/shots/
```

## Unde e ce
- `src/collections`: ce editează redacția (articole, prima pagină, drumuri, avarii, vreme, energie, carburanți, farmacii, joburi)
- `src/site`: paginile publice (HTML randat pe server) · `src/client`: scriptul din browser · `public/css/cadranul.css`: stilul designului
- `src/surse`: importurile automate (conectori, parsere, motor, registru) · `docs/cereri-acces/`: cererile de acces către surse
- `docs/stare.md`: ce e gata și ce urmează · `docs/fluxuri-date.md`: sursele reale, formate, frecvențe, statut legal
