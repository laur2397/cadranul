# Site-ul PULS: cum e construit si cum se porneste

Stare: 24.11.2026. Primul site functional, cu continut demonstrativ. Nimic nu e public: nu exista
domeniu, server sau conturi (se deschid dupa decizia 0.1, firma editoare).

## Ce este
- **Next.js 16.4.6 + Payload CMS 3.94.1 + PostgreSQL**, Node 24.22.3 (versiuni fixate exact).
- `/admin` este panoul redactiei (Payload). Rolurile: admin, editor, reporter.
- Paginile publice sunt cele din prototip, randate **pe server** (bune pentru Google si pentru
  telefoane slabe): `src/proto/` contine codul prototipului, iar `src/proto/js/data.js` il alimenteaza
  din baza de date. Interactivitatea mica (tema, meniu, consimtamant, instrumentele articolului)
  este in `public/js/client.js`.

## Modelul de continut (src/collections)
Articole (ciorne, versiuni, tip, origine, surse, metoda, corecturi, actualizari, fact-check, sponsor),
Relatari LIVE, Autori, Sectiuni, Regiuni (cu bifa „lansata"), Judete, Teme, Pagini legale, Imagini
(cu licenta si bifa AI), Redirectionari, Provenienta, plus setarile Publicatiei (datele editorului).

## Regulile din CLAUDE.md puse in cod
| Regula | Unde |
|---|---|
| Provenienta doar cu adaugare | `collections/Provenance.ts` (lant de amprente) + migrarea `provenienta_imuabila` (trigger in baza de date care refuza UPDATE/DELETE) |
| Publicare blocata daca AI a lucrat dupa ultima verificare umana | `hooks/publicare.ts`, `verificaPublicarea` |
| Eticheta „asistat de AI" calculata, nu bifata de mana | acelasi hook; campul e doar-citire |
| Advertorial doar de catre editor; sponsor obligatoriu vizibil | `collections/Articles.ts` |
| Regiunile nelansate dau 404 | `lib/instantaneu.ts` incarca doar regiunile cu „lansata" |
| Judetele sub 10 articole originale in 30 de zile: noindex | `lib/pagina.ts`, `judetSubPrag` |
| Un singur incarcator de scripturi terte, dupa consimtamant (Basic) | `public/js/lib/consent.js`; validatorul pica integrarea daca apare un script tert in alta parte |
| Harta Google News fara advertoriale | `app/(frontend)/sitemap-news.xml` |
| Crawlerele de antrenare blocate, cele care citeaza permise | `app/(frontend)/robots.txt` |
| ads.txt text/plain, 200, fara linii nejustificate | `app/(frontend)/ads.txt` (liniile vin din `ADS_TXT_LINES`) |
| Mod demonstrativ: nimic indexat | `NEXT_PUBLIC_DEMO=true` -> noindex pe toate paginile si `Disallow: /` |

## Pornire locala
```
nvm use                       # Node 24.22.3
npm ci
cp .env.example .env          # completeaza DATABASE_URI si PAYLOAD_SECRET
npx payload migrate           # creeaza tabelele
npm run seed                  # importa cele 119 articole demonstrative (doar cu NEXT_PUBLIC_DEMO=true)
npm run dev                   # http://localhost:3000 si http://localhost:3000/admin
```
Primul cont de administrator se creeaza din `/admin` la prima deschidere.

## Verificari (ruleaza si in GitHub, la fiecare modificare)
`npm run audit:registru`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`,
plus gitleaks pentru secrete. Testele in browser verifica: coduri 200/404, ads.txt, harta News
fara advertoriale, **zero cereri catre terti inainte de consimtamant**, accesibilitate (axe, WCAG 2.2 AA).

## Ce NU e inca facut (constient)
- Fotografiile: sunt doar variantele de 700 px (cele de 1400 px raman in artefactul prototipului).
- Abonarea la newsletter, formularul „Ai o stire?", contul cititorului: asteapta alegerea furnizorilor.
- Imaginile pentru distribuire (Open Graph `/og/...png`) nu sunt generate inca.
- Briefingul, video si media kit-ul au inca date fixe din prototip, nu din panou.
- Gazduirea (Hetzner + Coolify), CDN, copiile de siguranta: dupa decizia 0.1 si dupa revizuirea B-urilor din `docs/analiza-initiala.md`.
