# Modelul de continut si rutele PULS

Acest document descrie ce exista deja, validat, in prototipul front-end. Este o **specificatie de
portare**, nu o propunere. Claude Code reimplementeaza acest model pe stiva reala. Orice abatere
se discuta explicit inainte de a fi codata.

---

## 1. Rutele canonice

Rutele de mai jos sunt deja definite in `publicPath()` din prototip si **nu se schimba**. De ele
depind indexarea, legaturile externe viitoare si sitemap-urile.

| Ruta | Continut |
|---|---|
| `/` | Prima pagina, editia nationala |
| `/articol/<id>` | Articol |
| `/live/<id>` | Relatare in direct |
| `/regiune/<slug>` | **Editie** regionala (8 regiuni) |
| `/judet/<slug>` | Pagina de eticheta pe judet (41 + Bucuresti); intra in index doar peste prag |
| `/editie/<slug>` | Selectorul de editie, inclusiv `editie/nationala` |
| `/autor/<slug>` | Pagina de autor |
| `/tema/<slug>` | Pagina de tema |
| `/<sectiune>` | Pagina de sectiune |
| `/pagina/<slug>` | Pagini legale si institutionale |
| `/cauta` | Cautare |
| `/newsletter`, `/briefing`, `/video`, `/standarde`, `/echipa`, `/publicitate`, `/pontaj`, `/cont` | Pagini de serviciu |

Orice adresa necunoscuta returneaza 404 real. O eroare de randare afiseaza pagina de eroare,
distincta de 404.

## 2. Sectiunile

Optsprezece sectiuni, dintre care paisprezece in meniul principal. Decizia editoriala explicita,
preluata din lectiile site-ului anterior: **nu exista categorie-sac de tip „Actualitate"**.
Fiecare sectiune are un domeniu real si o descriere proprie.

In meniu: Politică, Economie, Bani personali, Justiție, Social, Sănătate, Internațional,
România–Moldova, Regional, Tech & Știință, Sport, Cultură, Opinii, Fact-check.

In afara meniului: Mediu & Climă, Pe înțeles, Date & grafice, Video & emisiuni.

Fiecare sectiune are culoare proprie, definita o singura data in sistemul de design si folosita
prin variabila. Eticheta de sectiune poarta intotdeauna si text, niciodata doar culoare.

## 3. Tipurile de articol

Unsprezece tipuri, afisate cititorului ca eticheta cu explicatie la atingere, dupa standardul
Trust Project privind „tipul muncii":

`stire`, `analiza`, `explicatie` (Pe înțeles), `opinie`, `interviu`, `ancheta` (Investigație),
`factcheck`, `live`, `ghid`, `date`, `advertorial`.

Reguli legate de tip:
- `opinie` se desparte vizual de stire si poarta mentiunea ca nu reprezinta pozitia redactiei.
- `advertorial` este etichetat, arata diferit, **nu intra in sitemap-ul Google News**, nu se
  marcheaza ca stire in datele structurate si primeste `noindex, follow`, cum face deja prototipul
  (`js/pages/article.js`). Clientii trebuie sa stie asta inainte de a cumpara.
- `factcheck` foloseste obligatoriu scala publicata si produce marcaj `ClaimReview`. Google nu mai
  afiseaza rezultate imbogatite pentru `ClaimReview` din 2025, dar marcajul alimenteaza in continuare
  Fact Check Explorer. Nu se promit cititorilor sau clientilor efecte vizuale in cautare.

## 4. Scala de fact-check

Cinci trepte, publice si folosite uniform: **Adevărat**, **Parțial adevărat**, **Trunchiat**,
**Fals**, **Imposibil de verificat**. Fiecare are o definitie publicata. Metodologia este o
pagina publica, iar verdictul apare pe articol cu declaratia verificata si cine a facut-o.

## 5. Structura regionala

Opt regiuni de dezvoltare, fiecare cu oras de referinta si un coordonator de editie:

| Regiune | Oras | Judete |
|---|---|---|
| Nord-Est | Iași | Bacău, Botoșani, Iași, Neamț, Suceava, Vaslui |
| Sud-Est | Constanța | Brăila, Buzău, Constanța, Galați, Tulcea, Vrancea |
| Sud-Muntenia | Ploiești | Argeș, Călărași, Dâmbovița, Giurgiu, Ialomița, Prahova, Teleorman |
| Sud-Vest Oltenia | Craiova | Dolj, Gorj, Mehedinți, Olt, Vâlcea |
| Vest | Timișoara | Arad, Caraș-Severin, Hunedoara, Timiș |
| Nord-Vest | Cluj-Napoca | Bihor, Bistrița-Năsăud, Cluj, Maramureș, Satu Mare, Sălaj |
| Centru | Brașov | Alba, Brașov, Covasna, Harghita, Mureș, Sibiu |
| București-Ilfov | București | București, Ilfov |

### 5.1 Decizia de structura: 8 editii regionale, judetul ca eticheta

**Editia este regiunea. Judetul este eticheta.** Decizie luata explicit, cu urmatorul motiv.

O editie regionala functioneaza ca produs doar daca are adresa proprie, newsletter propriu,
categorie proprie de notificari, pachet propriu de publicitate si **un jurnalist cu nume si fata**.
In presa locala, perceptia pe care o vinzi este „omul acesta este din comunitatea mea". Numarul
de editii este deci limitat de numarul de oameni, nu de numarul de unitati administrative. Opt
editii cu opt jurnalisti identificabili se poate sustine. Patruzeci si doua nu, cu nicio
cantitate de automatizare, pentru ca nu automatizarea lipseste, ci persoana.

Consecinte tehnice:

- `/regiune/<slug>` este **editie**: pagina proprie, redactor coordonator vizibil, newsletter,
  categorie de notificari, pachet de publicitate. **O regiune lansata e mereu indexata; o regiune
  nelansata raspunde cu 404.** Regula completa: docs/01-arhitectura.md, sectiunea 9.
- `/judet/<slug>` este **pagina de eticheta**: exista ca adresa, agrega articolele etichetate cu
  acel judet, si **intra in index abia cand depaseste pragul de continut propriu** stabilit in
  `docs/01-arhitectura.md`. Pana atunci: `noindex, follow`.
- Fiecare articol regional poarta obligatoriu eticheta de judet si, unde are sens, de oras.
- Un judet care creste si primeste un om dedicat se promoveaza la editie. Cresterea e organica;
  nu se lanseaza 42 de promisiuni neacoperite.

### 5.2 Numele editiilor

Regiunile de dezvoltare sunt o impartire administrativa, nu o identitate. Nimeni nu spune „sunt
din Sud-Muntenia". Denumirea afisata cititorului foloseste numele cu care oamenii se identifica,
iar structura interna ramane pe regiunile de dezvoltare, pentru ca acelea se suprapun peste
structurile ADR, peste programele regionale si peste datele publice.

| Slug intern | Nume afisat propus | Observatie |
|---|---|---|
| `sud-vest-oltenia` | Oltenia | se suprapune curat |
| `nord-est` | Moldova | **aproximativ**: Moldova istorica include si Galati si Vrancea (Sud-Est). **Conflict**: slug-ul sectiunii „România–Moldova" este deja `moldova`, iar cititorii pot intelege Republica Moldova. De decis in Faza 0 (de exemplu „Moldova / Iași") |
| `sud-muntenia` | Muntenia | **aproximativ**: Braila, Buzau si Bucurestiul sunt istoric in Muntenia, dar nu in aceasta regiune |
| `bucuresti-ilfov` | București | se suprapune curat |
| `vest` | Banat | Hunedoara este exceptia istorica |
| `nord-vest` | Nord-Vest / Cluj | nu exista nume cultural exact |
| `centru` | Centru / Brașov | nu exista nume cultural exact |
| `sud-est` | Sud-Est / Constanța | nu exista nume cultural exact |

Denumirile finale se valideaza cu cititori reali. Slug-urile nu se schimba dupa lansare.

### 5.3 Selectia editiei de catre cititor

- Niciodata nu se blocheaza continutul in spatele alegerii regiunii. Fara fereastra modala la
  prima vizita.
- Regiunea se deduce aproximativ din adresa IP si se afiseaza ca eticheta vizibila si
  corectabila in antet, marcata ca presupunere. Nu se stocheaza locatie precisa si nu se cere
  niciodata permisiunea de localizare.
- Alegerea explicita se cere la momentul interesului demonstrat: dupa al doilea articol din
  aceeasi zona, sau la abonarea la newsletter, unde campul este natural.
- O alegere facuta sau refuzata se retine si **nu se mai cere a doua oara**. Reintrebarea unei
  alegeri deja facute este una dintre practicile vizate de propunerea de Regulament privind
  echitatea digitala; nu e inca lege, dar o tratam ca regula.
- Editia nationala ramane permanent accesibila, la aceeasi greutate vizuala. Regiunea este o
  adaugare, nu o inlocuire.

### 5.4 Ce se publica in editiile regionale

Obiceiul de consum zilnic se construieste din **continut de utilitate**, nu din stiri de impact:
vreme, trafic si starea drumurilor, liste de judecata, autorizatii de construire, rezultate
scolare, preturi locale. Toate se pot construi din surse publice si se pot automatiza partial.
Singurul domeniu la care cititorii se declara multumiti de presa locala este vremea; restul este
teren liber.

Rubrica permanenta diferentiatoare a fiecarei editii: **unde se duc banii europeni in regiune**,
construita din date publice verificabile. Regiunile de dezvoltare se suprapun exact peste
structurile ADR si peste programele regionale, iar aceasta acoperire nu exista serios in presa
romaneasca.

## 6. Campurile unui articol

Deduse din implementarea existenta a datelor structurate si a interfetei:

- identificator stabil, titlu, titlu pentru cautare (optional, diferit), supratitlu/descriere scurta
- tip (din lista de la punctul 3), sectiune, tema, etichete
- autori (unul sau mai multi, prin slug catre pagina de autor), agentie sursa daca e cazul
- data publicarii, data modificarii
- regiune si judet pentru continut local
- corp structurat, imagine principala cu credit si licenta, text alternativ descriptiv
- lista de corecturi, fiecare cu text si moment, afisate public
- bloc de fact-check cand tipul e `factcheck`: declaratia, cine a spus-o, cand, verdictul, probele
- bloc video cand e cazul, cu durata
- **provenienta**: ce a contribuit un sistem automat si ce a facut omul, la fiecare pas

Campul de provenienta nu este optional si nu se completeaza manual la final. Se construieste pe
masura ce materialul este lucrat, si din el rezulta eticheta publica.

## 7. Datele structurate

Prototipul implementeaza deja un set complet. Se porteaza integral, randat pe server:

- `NewsMediaOrganization` pentru editor, cu adresa, logo si datele firmei
- `WebSite` cu actiune de cautare
- articol, cu tip corect dupa natura materialului: `OpinionNewsArticle` pentru opinie,
  `AnalysisNewsArticle` pentru analiza, `ReportageNewsArticle` pentru investigatie,
  `NewsArticle` pentru restul
- `CorrectionComment` pentru fiecare corectura
- `sourceOrganization` cand materialul vine de la o agentie
- `contentLocation` pentru continut regional
- `ClaimReview` pentru fact-check, cu scala si valorile ei
- `LiveBlogPosting` cu actualizarile relatarii in direct
- `ProfilePage` pentru autor, cu domeniile pe care le acopera
- `CollectionPage` cu lista pentru sectiuni si editii
- `BreadcrumbList` pe paginile de adancime
- `VideoObject` unde exista video

Regula: marcajul descrie exact ce se afla pe pagina. Niciodata altceva.

## 8. Inventarul de publicitate

Cinci tipuri de reclama, fiecare cu regim propriu:

| Tip | Ce este | Consimtamant |
|---|---|---|
| `house` | Reclama proprie: newsletter, sustinere, pontaje. Umple spatiul nevandut. | Nu necesita |
| `direct` | Banner vandut direct unui client. Venitul cel mai bun. | De regula nu necesita |
| `programmatic` | Spatiu pentru retea. Fara acord se livreaza contextual, nu personalizat. | Personalizarea da |
| `affiliate` | Legatura de afiliere, comision la vanzare. | Nu necesita |
| `political` | Reclama politica. Afiseaza „platit de", perioada si finantarea. | Nu necesita |

Formate standard: billboard 970×250, MPU 300×250, half-page 300×600, mobil 320×100,
sticky 970×90, nativ in flux, discret in flux.

Fiecare spatiu este etichetat vizibil „Publicitate" si separat de continutul editorial.
Spatiul nevandut nu ramane gol: se umple cu reclama proprie.

## 9. Pagini de incredere, obligatorii la lansare

Exista deja ca pagini in prototip si se porteaza cu continut real:

standarde editoriale, politica de folosire a inteligentei artificiale, metodologia de fact-check,
politica de corecturi si drept la replica, proprietate si finantare, echipa cu pagini individuale
de autor, contact si sesizari, media kit pentru clienti de publicitate, politica de
confidentialitate, politica de cookie-uri, termeni.

## 10. Ce nu exista inca si trebuie construit

Din README-ul prototipului, lista a ce se inlocuieste la lansarea reala:

- baza de date si interfata redactionala reale, in locul fisierelor de date, cu roluri,
  flux de aprobare si jurnal de corecturi
- randare pe server pentru toate rutele, in locul ruterului pe fragment
- sitemap-uri reale, inclusiv sitemap Google News fara advertoriale; RSS; `robots.txt`
- imagini Open Graph generate real
- fotografii proprii sau de agentie, cu credit si licenta per imagine
- formulare conectate: newsletter cu dubla confirmare, sesizari, corecturi, drept la replica, pontaje
- furnizor meteo real, incarcat pe server
- player video real, fara cookie-uri inainte de acord
- texte legale completate cu datele firmei si verificate de un avocat
