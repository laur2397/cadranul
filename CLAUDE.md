# Cadranul: instructiuni pentru agenti

## Ce vrea proprietarul (in ordinea asta) — docs/brief-constructie.md
1. Site-ul arata si se comporta EXACT ca designul aprobat D (`referinta-design-d/index.html`, `shots/`): harta cu relief,
   straturile, tipografia (Mona Sans + Newsreader), culorile, animatiile, modul intunecat. Orice schimbare vizuala se
   compara cu capturile de referinta (`npm run shots` -> `shots/`).
2. Cele 6 elemente: „De la ultima vizita / Esti la zi”, „Ziua in 7 subiecte” + calculatoare, „Buna dimineata, <oras>”
   cu carduri locale, pretul energiei ora cu ora + carburanti, starea drumurilor, joburi (cu „Promovat” platit).
3. Bani din reclame fara agresivitate. 4. Redactia lucreaza simplu din /admin. Nu adauga proceduri inutile.

## Stiva
Next.js 16.4.6 (App Router) + Payload 3.94.1 + PostgreSQL, Node 24.22.3. Versiuni fixe (fara ^).
- Paginile publice sunt **route handlers** in `src/app/(frontend)/**/route.ts` care intorc HTML randat pe server din
  sabloanele din `src/site/*` (helper `h```, escapeaza tot implicit). Fara React in browser: un singur script mic,
  `src/client/main.ts` -> `public/js/cadranul.js` (esbuild, `npm run build:js`). Codul comun server/browser: `src/shared/`.
- Datele vin dintr-un instantaneu in memorie (`src/site/date.ts`), golit la orice salvare din /admin.
- CSS-ul este cel din design (`public/css/cadranul.css`), adaugirile sunt la final.
- Colectii: `src/collections` (articole, prima pagina, LIVE, date utile: drumuri, avarii, vreme, energie, carburanti,
  farmacii, joburi). Fluxurile reale viitoare: `docs/fluxuri-date.md`.

## Comenzi
`npm run dev` · `npm run build` · `npm start` · `npm run seed` (DOAR demo: sterge baza!) · `npm run typecheck` ·
`npm test` · `npm run test:e2e` (server pornit) · `npm run audit:registru` · `npm run shots` · `npx payload migrate:create <nume>`

## Reguli legale care nu se negociaza
- Orice reclama, articol platit, sponsor sau job promovat este marcat vizibil („Publicitate”, „Continut platit”, „Promovat”).
- Niciun script tert (Google, Meta) nu se incarca inainte de acord; Consent Mode v2 porneste refuzat. Adresele
  scripturilor terte apar DOAR in `src/client/consimtamant.ts` (verificat de `npm run audit:registru`).
- Bannerul de cookie: „Refuz tot” si „Accept tot” la fel de mari si vizibile, plus „Aleg eu”.
- Continutul demo este fictiv; nu punem vorbe in gura oamenilor reali. Cifrele demo sunt marcate discret.
- Pista de proveniență e doar cu adaugare (trigger in baza de date). Paginile legale sunt modele de verificat de avocat.
