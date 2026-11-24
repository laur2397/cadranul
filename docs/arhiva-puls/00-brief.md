# PULS - brieful proiectului

## Ce este

O publicatie nationala de stiri din Romania, cu editii pentru cele 8 regiuni, construita sa fie
cea mai credibila si cea mai transparenta publicatie din tara, demonstrabil, cu documente.

## De ce poate reusi

- Increderea in presa romaneasca e la 23%, a cincea scadere anuala la rand. Credibilitatea
  demonstrabila este singura pozitie neocupata.
- Opt judete nu au nicio publicatie locala. Publicitatea online locala a crescut cu 19% in 2025.
  Nimeni nu are opt newslettere regionale.
- Nimeni nu urmareste sistematic registrele publice: Monitorul Oficial, achizitiile, firmele,
  dosarele, consiliile. AI face asta posibil pentru o echipa mica. Rezultatul e original prin
  constructie.
- Nimeni nu are mainile curate pe banii publici si nimeni nu publica un registru al lor.
- Asistentii AI devin un canal de descoperire, iar presa romaneasca lipseste din el.

## Ce nu este

Nu e o fabrica de continut. Nu publica nimic fara om. Nu agrega si nu rescrie munca altor redactii.
Nu foloseste tipare intunecate. Nu cumpara trafic. Nu lasa niciun cont pe numele altcuiva.

## Documentele

| Fisier | Ce contine |
|---|---|
| `CLAUDE.md` | Constitutia: regulile nenegociabile |
| `docs/01-arhitectura.md` | Stiva, versiuni, riscuri, bugete de performanta, costuri |
| `docs/02-model-continut.md` | Rutele, sectiunile, tipurile, regiunile, campurile, datele structurate |
| `docs/03-monetizare.md` | Reclame, `ads.txt`, masurare, alte venituri |
| `docs/04-conformitate.md` | Ce cere legea, pe site si in organizatie |
| `docs/05-audienta-retentie.md` | Ce aduce cititorul inapoi, si ce refuzam |
| `docs/06-editorial.md` | Fluxul cu porti umane, politica AI, diferentierea |
| `docs/07-design-system.md` | Regulile sistemului de design existent |
| `docs/08-audit.md` | Sistemul de audit continuu |
| `docs/09-plan-livrare.md` | Ordinea lucrului |
| `docs/10-specificatii-tehnice.md` | Deciziile tehnice pentru Fazele 1-2: campuri, provenienta, ce nu se porteaza, unelte, medii |
| `docs/stare.md` | Unde a ramas lucrul. Se actualizeaza la fiecare sesiune |
| `audit/registru-proprietate.yaml` | Cine detine ce. Sursa de adevar |
| `audit/registru.md` | Constatarile auditului |
| `referinta/prototip/` | Prototipul complet, de portat |

## Echipa de agenti

Fiecare agent din `.claude/agents/` este un specialist cu mandat, reguli si lucruri pe care le refuza.

| Agent | Cand il chemi |
|---|---|
| `auditor-sef` | Inainte de a declara terminata orice etapa; la orice cont, script tert, domeniu sau integrare noua. **Are drept de veto.** |
| `avocatul-diavolului` | Dupa ce un plan pare gata si inainte de a-l construi; cand toata lumea e de acord prea repede |
| `arhitect-platforma` | Inainte de o piesa noua de infrastructura, un tip de continut sau o ruta noua |
| `inginer-performanta` | Inainte de orice dependenta, script, font, imagine sau animatie noua |
| `specialist-seo-news` | Rute, titluri, date structurate, sitemap-uri, indexare, citare AI |
| `arhitect-monetizare` | Reclame, `ads.txt`, masurarea veniturilor, parteneri |
| `jurist-conformitate` | Date personale, consimtamant, etichetare AI, publicitate, texte legale |
| `psiholog-audienta` | Pagina de articol, recirculare, newsletter, notificari, editii |
| `editor-standarde` | Norme editoriale, politica AI, corecturi, semnale de incredere |
| `inginer-redactie` | Monitorizarea surselor, automatizari, panoul redactional |
| `inginer-securitate` | Autentificare, roluri, chei, formulare publice, integrari |
| `designer-produs` | Componente noi, culori, sabloane |
| `specialist-accesibilitate` | Inainte de a considera terminata orice interfata |

## Ce nu a putut fi confirmat independent

Pachetul a trecut printr-o revizie independenta, care a verificat in surse primare versiunile
software, data de aplicare a art. 50 AI Act, pragurile Better Ads si limita de 120 de caractere.
Urmatoarele vin din cercetarea expertilor, cu surse, dar **nu au fost reconfirmate** si se
reverifica inainte de a construi decizii pe ele:

- eliminarea din Discover a noua site-uri de stiri generate de AI, pe 3-4 noiembrie 2026;
- noile metrici Chrome despre reclame publicate pe origine, din 15 septembrie 2026;
- blocarea implicita de catre Cloudflare a crawlerelor de antrenare pe paginile cu reclame;
- data publicarii propunerii de Regulament privind echitatea digitala;
- cresterea preturilor Hetzner din iunie 2026;
- cifrele de incredere si evitare a stirilor pentru Romania (Reuters Institute, 2026);
- statistica sanctiunilor ANSPDCP pe 2026;
- cuantumul amenzilor din Legile 363/2007 si 365/2002;
- plafonul gratuit de 800.000 de afisari video in Ad Manager;
- pretul Plausible la 100.000 de afisari;
- data exacta de aplicare a art. 6(3) EMFA.

Toate estimarile de venit din docs/03 sunt estimari, nu masuratori.

## Pluginuri care se folosesc

Se instaleaza separat in Claude Code-ul local; sunt optionale (docs/08, sectiunea 7).

- Auditul de securitate (audit, reparare, verificare, poarta de aprobare): domeniul de securitate.
- Revizuirea exhaustiva a codului: revizuirea aprofundata trimestriala.
- Auditul de vizibilitate in cautarea AI: o parte din domeniul de cautare.
- Abilitatile de SEO existente: revizuirea umana lunara.
