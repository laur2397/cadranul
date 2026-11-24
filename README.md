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

## Verificări
```bash
npm run typecheck && npm test && npm run audit:registru
npm start &  npm run test:e2e   # coduri, consimțământ, accesibilitate, ecran de 390 px
npm run shots                   # capturi în shots/, de comparat cu referinta-design-d/shots/
```

## Unde e ce
- `src/collections`: ce editează redacția (articole, prima pagină, drumuri, avarii, vreme, energie, carburanți, farmacii, joburi)
- `src/site`: paginile publice (HTML randat pe server) · `src/client`: scriptul din browser · `public/css/cadranul.css`: stilul designului
- `docs/stare.md`: ce e gata și ce urmează · `docs/fluxuri-date.md`: de unde vor veni datele reale
