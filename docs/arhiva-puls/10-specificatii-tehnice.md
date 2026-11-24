# Specificatii tehnice pentru Fazele 1 si 2

Deciziile pe care Claude Code le-ar fi ghicit altfel. Adaugate dupa revizia independenta a
pachetului. Unde scrie „de decis", decizia se ia in Faza 1 si se consemneaza aici.

---

## 1. Campurile articolului: ce exista si ce se adauga

Campurile reale din prototip (`referinta/prototip/data/articles-*.js`), verificate:
`id, type, section, region, county, tags, title, seoTitle, dek, summary, body, authors, image,
sources, method, corrections, updates, agency, sponsor, priority, breaking, exclusive, video,
factcheck, aiAssisted, readMin, ago, updatedAgo`.

Decizii:

| Subiect | Decizie |
|---|---|
| Identificatorul | **Prototipul foloseste deja slug-uri lizibile** ca `id` (ex. `dolj-spital-regional-craiova-stadiu`). Se pastreaza: `/articol/<id>`, unic, stabil, inghetat la publicare |
| Regiune si judet | Se pastreaza un singur `region` si se transforma `county` in lista `counties[]` (un articol poate privi doua judete). Importul pune judetul existent ca unic element |
| Advertorial | **O singura reprezentare: `type = advertorial`**, plus campul existent `sponsor` (numele clientului). Nu se adauga un camp separat `sponsored` |
| Original sau derivat | **Camp nou obligatoriu `origin`**: `original` (reportaj PULS), `derivat` (pornit de la alta sursa, cu atribuire), `agentie`. De el depind pragul de 10 articole originale pe judet si regula de minimum 4 materiale originale pe zi |
| AI | `aiAssisted` din prototip devine derivat automat din provenienta (sectiunea 2), nu bifat de mana |
| „Pe scurt" | `summary` din prototip, obligatoriu pentru tipurile `stire`, `analiza`, `explicatie` |
| Verificarea titlului | Camp nou obligatoriu: confirmarea editorului ca tot ce promite titlul apare in primele trei paragrafe |

## 2. Provenienta: colectia care sustine exceptia legala AI

De ea depind exceptia din AI Act art. 50(4), eticheta publica si registrul de corecturi.

**Ce se inregistreaza**, ca evenimente separate, fiecare cu momentul, persoana sau sistemul, si
amprenta (hash) continutului in acel moment:

| Eveniment | Cine il produce |
|---|---|
| `sursa_atasata` | om sau sistem; ce sursa primara, cu legatura |
| `ai_folosit` | sistem; ce unealta, local sau extern, pentru ce sarcina (transcriere, extragere, ciorna, traducere, verificare) |
| `editare_umana` | om; diferenta fata de versiunea anterioara |
| `poarta_trecuta` | om numit; care poarta (1-6 din docs/06), cu decizia |
| `publicat` | om numit; amprenta exacta a textului publicat |
| `corectura` | om numit; textul corecturii publice |

**Imuabilitate:** tabel doar cu adaugare (fara actualizare sau stergere la nivelul permisiunilor
bazei de date), fiecare eveniment contine amprenta evenimentului anterior (lant), iar utilizatorul
aplicatiei nu are drept de modificare a tabelului.

**Regula de publicare, in cod:** butonul „publica" e blocat daca ultimul eveniment `ai_folosit` cu
efect asupra textului este ulterior ultimei `editare_umana` si ultimei `poarta_trecuta`. Asta impune
in cod principiul „nicio modificare automata substantiala dupa verificarea umana".

**Eticheta publica** se calculeaza din evenimente: daca exista `ai_folosit` cu sarcina de redactare
a textului, apare mentiunea de sub titlu din politica AI; daca exista media generata, apare eticheta
in legenda.

## 3. Ce nu se porteaza asa cum e

Prototipul depinde in cateva locuri de interfetele runtime ale artifactelor claude.ai
(`window.claude.use('db')` si `('user')`, in `js/lib/livedb.js` si `js/lib/reader.js`). Acestea nu
exista intr-o aplicatie proprie.

| Ruta | Ce face in prototip | Ce se intampla |
|---|---|---|
| `/admin` | panou care salveaza in pagina publicata | **nu se porteaza**; il inlocuieste administrarea Payload |
| `/redactie` | panou redactional demonstrativ | **nu se porteaza** ca atare; idei de interfata pentru Faza 3 |
| `/pontaj` | pontaje de la cititori, cu pana la 4 fotografii si 1 video, 20 MiB | **se reconstruieste separat**, cu specificatia de mai jos |
| `/cont` | cont de cititor, export si stergere GDPR | se reconstruieste in Faza 3 sau mai tarziu, cu `jurist-conformitate` |
| sondaje, reactii, abonati | stocate in baza artifactului | se reconstruiesc pe baza proprie |

**Pontajele sunt cea mai sensibila suprafata a publicatiei.** Pot identifica o sursa. Inainte de
orice cod, `inginer-securitate` si `jurist-conformitate` stabilesc: cine poate citi un pontaj;
cat timp se pastreaza; eliminarea metadatelor din fisiere (EXIF, locatie, dispozitiv); scanarea
fisierelor; limitarea ratei; ce **nu** se jurnalizeaza (adresa IP, agentul browserului); ce i se
spune cititorului, cinstit, despre ce se poate si ce nu se poate garanta. Pana atunci, ruta
afiseaza doar o adresa de e-mail de contact.

## 4. Importul continutului demonstrativ

Un script care citeste `referinta/prototip/data/*.js` si creeaza in Payload: regiunile, judetele,
sectiunile, autorii, articolele, relatarile in direct, verificarile. Ruleaza doar in mediul de
dezvoltare si in cel de previzualizare. **Nu ruleaza niciodata in productie**; continutul este fictiv.

Corpul articolelor se converteste in formatul Lexical. Fotografiile nu sunt incluse in pachet;
importul foloseste un substituent cu dimensiunile corecte.

## 5. Rute rezervate si coliziuni

- Rezervate de aplicatie: `/api`, `/admin`, `/_next`, `/og`.
- **Coliziune existenta in prototip:** sectiunea „Video & emisiuni" are slug-ul `video`, la fel ca
  pagina de serviciu `/video`, deci pagina de sectiune nu e accesibila. **De decis:** fie pagina de
  serviciu `/video` devine chiar pagina sectiunii, fie sectiunea primeste alt slug.
- `/editie/<slug>` randeaza prima pagina sub alta adresa. Se transforma intr-o setare a cititorului:
  redirectionare temporara catre `/` sau `/regiune/<slug>`, si `noindex`. Nu exista doua adrese
  pentru acelasi continut.
- O sectiune noua nu poate primi un slug deja folosit de o pagina de serviciu sau de o ruta rezervata;
  verificarea este automata.

## 6. Uneltele

| Scop | Unealta |
|---|---|
| Teste | Vitest pentru logica, Playwright pentru pagini |
| Scanare de secrete | gitleaks, la livrarea codului si in integrarea continua |
| Dependente | OSV-Scanner; actualizari prin Renovate cu aprobare manuala |
| Accesibilitate | axe-core prin Playwright |
| Performanta in laborator | Lighthouse CI pe un set fix de articole de test, profil de telefon incetinit |
| Performanta in teren | biblioteca `web-vitals` care trimite datele catre un punct propriu, plus CrUX |
| Registrul de proprietate | o schema JSON pentru `audit/registru-proprietate.yaml` si un script care o valideaza in integrarea continua |
| Previzualizare si publicare | Docker plus Coolify; migrari ale bazei de date prin mecanismul Payload, versionate |

**Testele de paritate cu prototipul:** README-ul prototipului mentioneaza `tests/run_tests.py`,
`tools/build-meta.mjs` si `tools/build-photos.mjs`. **Acestea nu sunt in pachet.** Testele de paritate
(320, 390 si 1440 px, banner de consimtamant, dialoguri, tema intunecata) se rescriu in Playwright
in Faza 2, cu prototipul ca referinta.

## 7. Mediile de previzualizare

Pentru fiecare ramura: baza de date separata, populata doar cu importul demonstrativ; **niciun
secret de productie**; acces protejat prin autentificare; `noindex` pe toate paginile si `robots.txt`
care blocheaza tot; nicio eticheta de publicitate reala si niciun cont de analiza real. Auditul ruleaza
pe aceste medii pana exista productie.

## 8. Limba in codul portat

Regula din CLAUDE.md, sectiunea 5, se aplica codului nou. Codul portat din prototip poate pastra
identificatorii existenti, chiar daca amesteca romana si engleza in acelasi modul, pana la prima
rescriere a acelui modul.

## 9. Termenele de corectura

Prototipul (`data/trust.js`) are: analiza in 24 de ore, confirmarea dreptului la replica in 2 zile,
decizia in 5 zile. docs/04 propune raspuns in 2 zile lucratoare si publicare in 7. **Se pastreaza
termenele din prototip**, care sunt mai stricte; textul public si politica interna trebuie sa fie
identice.
