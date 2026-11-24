# Arhitectura tehnica PULS

Versiuni si preturi verificate la 24 noiembrie 2026. Ce nu s-a putut verifica este marcat.
O piesa a stivei nu se schimba fara actualizarea acestui document si fara aprobare.

---

## 1. Decizia

O singura aplicatie **Next.js 16.4** cu **Payload CMS 3.94** inclus in ea, pe **PostgreSQL 18**,
gazduita pe **Hetzner Cloud** (Helsinki sau Nuremberg) in spatele **Cloudflare**, cu imaginile pe
**Hetzner Object Storage** si **Bunny CDN**, publicata cu **Coolify** si **GitHub Actions**.

De ce: un singur depozit de cod, o singura publicare, panou de administrare inclus, licenta MIT,
fara cost pe utilizator, date integral in UE, si nimic ce un furnizor sau o agentie ar putea tine
ostatic. Tot sistemul este un depozit Git plus o copie a bazei de date.

Asta pastreaza exact modelul ales la prototip, „administrarea in aceeasi aplicatie", dar pe un
server real. Varianta din prototip, cu salvare in pagina publicata, nu poate fi folosita in
productie (vezi docs/04-conformitate.md, sectiunea 7).

## 2. Versiunile

| Componenta | Versiune | Observatie |
|---|---|---|
| Next.js | 16.4.6 | linia 16 e LTS activ; Payload accepta doar 16.4.5 si peste |
| React | 19.3.1 | |
| Node.js | **24.22.3, fixat exact** | acceptat si de Payload 3 si de Payload 4 beta. Pragurile sunt pe patch: 24.22.2 esueaza. Node 20 e la sfarsit de viata; Node 22 nu mai e acceptat de Payload 4 |
| PostgreSQL | 18.7 | **nu 19.0**, lansat acum cinci zile; mutare pe 19 la mijlocul lui 2027 |
| Payload | 3.94.1 | 4.0 e in beta; migrarea vine in prima jumatate a lui 2027 |
| TypeScript | **5.9.x, fixat exact** | atentie: versiunea `latest` din npm este acum 7.x; o instalare nefixata o aduce. Cerinta TypeScript pentru Payload 4 este neverificata |

Versiunea de Node se fixeaza in trei locuri: `.nvmrc`, imaginea Docker, integrarea continua.

## 3. Riscurile alegerii, spuse direct

1. **Cuplarea Payload-Next este o taxa recurenta.** Next scoate corecturi de securitate aproape
   lunar, iar Payload accepta un interval ingust de versiuni. Vor fi luni in care „aplic corectura"
   si „raman compatibil" intra in conflict. Masura: versiuni fixate exact, actualizari automate
   cu aprobare manuala, urmarirea ambelor jurnale de modificari.
2. **Migrarea la Payload 4.0 este inevitabila in 2027.** Editorul vechi Slate dispare, toti
   utilizatorii trebuie sa se autentifice din nou, se schimba nume de API. Masura: se foloseste
   **doar editorul Lexical** din prima zi, componentele administrative personalizate se tin la minim,
   si se bugeteaza o saptamana intreaga.
3. **Modelul nou de cache al Next impreuna cu Payload poate avea defecte de corectitudine**,
   inclusiv pagini 404 servite cu cod 200. Asta e o problema de indexare, nu cosmetica. Masura:
   teste explicite pe codurile 404 si 410 inainte de lansare; daca esueaza, se porneste cu modelul
   anterior, care e documentat si suportat.
4. **Un singur om intelege tot.** Masura: proceduri scrise, o pagina statica de urgenta comutabila
   in 60 de secunde, si **a doua persoana de incredere cu acces de urgenta din prima luna**.
5. **Codul scris cu AI poate face pagini statice dinamice fara sa se vada.** O componenta care
   citeste cookie-uri transforma fiecare articol in randare pe server. Masura: setarea care face
   build-ul sa esueze daca o pagina de articol sau de editie devine dinamica.
6. **Preturile Hetzner pot creste**; au crescut pana la 170% pe unele planuri in iunie 2026.
   Masura: totul in containere, portabil; mutarea pe OVH sau Scaleway e o lucrare de weekend.
7. **Patch-urile de securitate ale serverului sunt ale noastre.** Masura: actualizari automate
   pentru sistemul de operare, fereastra lunara de patch-uri in calendar.
8. **Riscul strategic depaseste orice risc tehnic.** Publicatiile mici au pierdut 60% din traficul
   din cautare in doi ani. Masura nu e tehnica: newsletter si public direct din prima zi, cautarea
   tratata ca bonus volatil, si acoperirea originala ca strategie reala.
9. **WordPress sau Ghost ajung mai repede la lansare.** Aceasta arhitectura e optimizata pentru
   orizontul de 18 luni si pentru proprietate, nu pentru viteza. **Estimare realista: 4-6 luni
   pana la lansare.** Daca e nevoie de site viu in 6 saptamani, decizia se revede onest.

## 4. Randarea pe tip de pagina

| Pagina | Strategie |
|---|---|
| Articol | cache pe articol cu eticheta proprie, ultimele 500-2.000 de articole pregenerate, invalidare la publicare. Vizibil in secunde dupa apasarea butonului |
| Prima pagina | cache 60-120 secunde plus invalidare la publicare. Nu se randeaza niciodata la cerere |
| Editie regionala | ca prima pagina, cu eticheta pe regiune |
| Sectiuni si arhive | cache de minute, paginate |
| Relatare in direct | invelis static, actualizarile incarcate separat la 10-20 secunde. Pagina nu devine dinamica |
| Cautare | dinamica, `noindex` |
| Administrare | dinamica, `noindex`, limitata ca rata, doi factori, restrictionata |

**Tinta: peste 95% din afisari servite din cache, fara nicio interogare a bazei de date.**

Pana in jur de un milion de afisari pe luna se ruleaza **o singura instanta** cu disc persistent.
Trecerea la mai multe instante aduce o clasa intreaga de defecte de cache si se amana cat se poate.

## 5. Bugetele de performanta

Praguri de esec in integrarea continua, nu tinte. Masurate cu reclamele si analiza pornite, pe
telefon de gama medie, conexiune 4G, la percentila 75.

| Indicator | Prag |
|---|---|
| LCP | ≤ 2,5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0,1 |
| HTML (invelis), comprimat | < 40 KB |
| JavaScript propriu total, comprimat | < 120 KB |
| JavaScript pe ruta, comprimat | < 60 KB |
| Imaginea LCP | < 90 KB AVIF |
| Timp de blocare pe Android mediu | < 200 ms |
| Deplasare cauzata de reclame | zero |
| JavaScript tert inainte de consimtamant | < 150 KB |

De ce conteaza in bani: Financial Times a masurat ca **o intarziere de o secunda reduce cu 4,9%
articolele citite in 7 zile**, iar efectul creste in timp si loveste exact sesiunile lungi, cele care
construiesc fidelitatea. Netzwelt a crescut veniturile din publicitate cu 18% doar prin
indicatorii de performanta.

Atentie: din 15 septembrie 2026 Chrome publica pe origine numarul de reclame, densitatea si greutatea
lor. Nu sunt praguri, dar sunt publice si le vor vedea si advertiserii.

## 6. Reclame fara pagini lente

1. Spatiu rezervat in CSS pentru fiecare slot, dimensionat pentru cea mai mare creatie posibila,
   randat pe server, cu `min-height` pe fiecare latime de ecran. **Niciodata rezervat din JavaScript.**
2. Toate etichetele asincrone, inclusiv biblioteca de reclame Google.
3. **Cel mult o reclama deasupra liniei de pliere**, niciodata deasupra sau peste elementul LCP.
   Elementul LCP al articolului este titlul sau imaginea principala, niciodata o reclama.
4. Incarcare amanata sub pliere, la 400-600 px de vizibilitate.
5. `content-visibility: auto` pe sectiunile lungi si pe containerele de reclama inferioare.
6. Biblioteca de reclame si licitatia **nu se incarca prin Tag Manager**; adauga un salt in fata
   celei mai valoroase cereri.
7. Conexiune anticipata doar catre 2-3 domenii de reclama care conteaza.
8. Analiza care nu aduce venit se incarca la final.

## 7. Structura adreselor

**Regula cea mai importanta: un articol are exact o adresa.** Regiunea si judetul sunt date
despre articol, nu segmente ale adresei. Nu exista doua adrese pentru acelasi text. Asa ajung
retelele regionale la zeci de mii de adrese duplicate si la retrogradarea intregului site.

Rutele din prototip raman (docs/02-model-continut.md, sectiunea 1). Decizie de luat in prima
saptamana, apoi inghetata la lansare: forma finala a identificatorului de articol. Recomandare:
un slug lizibil, stabil si unic, nu un numar.

Editiile regionale sunt **pe cale**, nu pe subdomeniu: un singur `ads.txt`, o singura reputatie de
domeniu, o singura inregistrare in Google Publisher Center si la BRAT.

Alegerea editiei de catre cititor se retine local dar **nu schimba niciodata ce se serveste la o
adresa**. Personalizarea dupa IP a unei pagini din cache strica si cache-ul, si indexarea. Modulul
„editia ta" se incarca in client, separat.

## 8. Modelul in Payload

Colectii: `regions` (8, cu redactor coordonator, introducere editoriala proprie de minimum 300 de
caractere, numele afisat), `counties` (41 + Bucuresti, legate de regiune), `sections`, `articles`,
`liveBlogs`, `authors`, `media`, `tags`, `redirects`, plus colectia de provenienta.

Campurile articolului sunt in docs/02-model-continut.md. Adaugiri tehnice: `primaryRegion`
(nula = national), `counties[]` pentru etichetare, `sponsored` setabil doar de editor,
`schemaType`, `sources[]`, stare de publicare.

Permisiunile se impart pe regiune: un jurnalist din Oltenia vede si editeaza continutul Olteniei,
editorul national vede tot. Doar editorul poate seta `sponsored` sau publica.

**Ruta de iesire, scrisa si testata inainte de lansare:** un script care exporta tot continutul
din formatul Lexical in HTML. Acela este adevaratul plan de iesire din Payload.

## 9. Pagini subtiri, pragul automat

Regula unica, in cod, nu in disciplina cuiva:
- **Regiunile lansate sunt mereu indexate.** O regiune se lanseaza doar cu om in spatele ei.
- **Regiunile nelansate raspund cu 404** si nu apar in meniu, sitemap sau selectorul de editie.
- **Pragul se aplica doar paginilor de judet** (`/judet/<slug>`): sub prag primesc `noindex, follow`,
  ies din sitemap si nu afiseaza reclame.

Prag initial: **10 articole originale locale in ultimele 30 de zile**. Se ajusteaza cu datele.

O pagina de judet subtire contine o **legatura** (nu o redirectionare) catre editia regiunii, nu catre stiri nationale generice.

## 10. Cautare si date structurate

Datele structurate existente in prototip se porteaza integral, randate pe server (docs/02, sectiunea 7).

Sitemap-uri: general, pe tip de pagina, plus **sitemap Google News** doar cu articolele din ultimele
48 de ore, **fara advertoriale**. RSS complet per regiune. AMP: nu, e o chestiune inchisa in 2026.

Discover a devenit sursa de trafic mai mare decat cautarea clasica pentru stiri. Cerinte: imagini de
minimum 1.200 px, marcaj corect de articol, inscriere in Google Publisher Center.

### Crawlerele AI

- Permise neconditionat: Googlebot, Googlebot-News, Bingbot, Applebot, YandexBot.
- Permise: crawlerele AI care citeaza cu legatura si trimit trafic (OAI-SearchBot, PerplexityBot,
  ChatGPT-User, Claude-SearchBot).
- Blocate: crawlerele care doar antreneaza modele (GPTBot, CCBot, ClaudeBot, Google-Extended,
  Meta-ExternalAgent, Bytespider, Applebot-Extended).
- **`robots.txt` este sursa de adevar** pentru crawlerele de antrenare. Google-Extended si
  Applebot-Extended sunt doar semnale in `robots.txt`, fara crawler separat, deci nu pot fi blocate
  altfel. Regulile Cloudflare se folosesc in plus, doar pentru crawlerele care ignora `robots.txt`.
- **Atentie: din 15 septembrie 2026 Cloudflare blocheaza implicit crawlerele de antrenare pe paginile
  cu reclame, pentru domeniile noi.** Se configureaza deliberat, nu se lasa pe implicit.
- `llms.txt`: se publica, nu se asteapta nimic de la el. 97% dintre aceste fisiere nu au primit nicio
  cerere intr-o luna.
- Se revede peste 12 luni. Blocarea crawlerelor de antrenare nu costa vizibilitate, pentru ca
  cele care citeaza si trimit trafic raman permise. Cu un corp de acoperire locala originala,
  argumentul de licentiere devine real.

## 11. Gazduire si cost lunar

Preturi fara TVA, verificate la 24 noiembrie 2026, cu exceptiile marcate.

| | 100.000 afisari/luna | 1 milion | 3 milioane |
|---|---|---|---|
| Servere aplicatie | €30 | €61 | €178 |
| Baza de date | inclusa | €30 | €90 |
| Cache si procesare | inclusa | €10 | €17 |
| Echilibrare de incarcare | - | ~€6 (neverificat) | ~€6 (neverificat) |
| Stocare imagini | €6,49 | €6,49 | ~€15 |
| CDN si optimizare imagini | €10 | €14 | €23 |
| Cloudflare | €0 | €19 | €19 |
| Backup, inclusiv copie in alta locatie | €10 | €24 | €40 |
| Monitorizare erori | €0 | €24 | €24 |
| Disponibilitate si jurnale | €0 | €0-25 | €25 |
| Analiza fara cookie-uri (de verificat: pretul public Plausible pare ~€19 la 100.000) | ~€19 | de verificat | de verificat |
| Newsletter | €8 | €15 | €30 |
| Domeniu | €2 | €2 | €2 |
| **Total** | **≈ €85-95** | **≈ €215-250** | **≈ €460-500** |

Comparatie la 3 milioane: aceeasi sarcina pe gazduire romaneasca costa aproximativ dublu doar pe
servere, cu prezenta doar in Bucuresti. Pe platforme cu plata pe consum costul nu are plafon, iar
varful de trafic vine exact cand se intampla o stire mare.

## 12. Rezidenta datelor

- Continutul, baza de date, imaginile si datele cititorilor stau **integral in UE**.
- Cloudflare si Sentry sunt companii americane. Cloudflare in fata e un compromis
  pragmatic: protectia la atacuri conteaza mai mult, si trateaza trafic, nu continut.
- **Analiza editoriala: Plausible**, gazduita in UE, fara cookie-uri, fara date personale. Nu cere
  consimtamant. Servit prin domeniul propriu, masoara practic tot traficul; altfel blocantele de reclame
  il opresc si pe el. Nu masoara Core Web Vitals. Vezi docs/03-monetizare.md pentru GA4 si pixel.
- **Protectia surselor ridica miza peste GDPR.** Jurnalele serverului, ale Cloudflare, analiza,
  metadatele de e-mail si istoricul din CMS pot identifica pe cineva. Retentie agresiva: 7 zile
  pentru jurnalele de acces, 30 pentru erori. Adresele IP trunchiate la intrare.
- Comentariile raman oprite la lansare. Cu ele vin obligatii DSA si moderare reala.

## 13. Operare pentru un om plus AI

Integrare continua cu publicare de previzualizare pe fiecare ramura; monitorizarea erorilor;
monitorizarea disponibilitatii la fiecare minut; jurnale centralizate; backup automat **cu exercitiu
de restaurare saptamanal**; mediu de test separat; secretele intr-un manager de secrete, niciodata in
depozit. Detaliile de audit sunt in docs/08-audit.md.

## 14. Ce nu s-a putut verifica

Preturile Scaleway si Contabo. Disponibilitatea si costul localizarii datelor la Cloudflare. Pretul
echilibrarii de incarcare Hetzner. Pozitia oficiala Payload privind noul model de cache. Suportul AVIF
in optimizatorul Bunny. Daca pragurile Core Web Vitals s-au schimbat dupa octombrie 2024. Gazduitori
romani in afara de ClausWeb. Licenta exacta Coolify.
