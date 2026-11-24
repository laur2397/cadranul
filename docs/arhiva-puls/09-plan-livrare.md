# Planul de livrare PULS

Ordinea conteaza mai mult decat viteza. Sistemul de audit si registrul de proprietate se construiesc
**inainte** de functionalitati, nu dupa. Estimare realista pana la lansare: **4-6 luni**, cu un om
plus asistenta AI. Daca e nevoie de un site viu mai repede, decizia de arhitectura se revede onest
(docs/01-arhitectura.md, riscul 9).

Fiecare etapa se incheie cu: auditul rulat, rezultatul consemnat in `audit/registru.md`, si trecerea
pe la `auditor-sef`. Inainte de fiecare faza noua, planul ei trece pe la `avocatul-diavolului`.

---

## Faza 0 - Decizii ale proprietarului, inainte de orice cod

Nu le poate lua Claude Code. Fara ele, primul cont se deschide pe numele gresit si totul porneste
stramb, exact ca la site-ul anterior.

| # | Decizia | De ce blocheaza |
|---|---|---|
| 0.1 | **Ce firma este editorul PULS** | Primul camp din registru. Domeniul, gazduirea, Google, AdSense, banca, totul se deschide pe ea |
| 0.2 | Domeniul, verificat si cumparat pe firma, cu blocare de transfer | Rutele si `ads.txt` depind de el |
| 0.3 | Un cont Google de organizatie pe domeniul firmei, nu un Gmail personal | Toate serviciile Google se leaga de el |
| 0.4 | **A doua persoana de incredere cu acces de urgenta** | Altfel un singur om e punctul unic de esec |
| 0.5 | Avocatul roman pentru media, proprietate intelectuala si date | Punctele neverificate din docs/04 |
| 0.6 | Numele afisate ale celor 8 editii | docs/02, sectiunea 5.2 |
| 0.7 | **Ce regiuni se lanseaza** si cine este omul cu fata din fiecare | O regiune fara om nu se lanseaza |
| 0.8 | Redactorul-sef, cu nume | Semneaza politica AI si raspunde editorial |

Despre 0.7: studiul CMPF a gasit opt judete fara nicio publicatie locala. Pe regiuni de dezvoltare:
doua in Sud-Muntenia (Dambovita, Giurgiu), doua in Vest (Caras-Severin, Hunedoara), unul in Sud-Est
(Buzau), unul in Sud-Vest Oltenia (Gorj), unul in Nord-Vest (Bistrita-Nasaud), unul in Centru (Harghita). Acolo golul e real. Recomandarea
expertilor: incepi unde ai retea si oameni, nu peste tot deodata.

## Faza 1 - Fundatia (saptamanile 1-2)

1. Registrul de proprietate completat cu datele reale; depozit pe organizatia firmei; ramura
   principala protejata; aprobare obligatorie pe registru.
2. Scanarea de secrete inainte de fiecare livrare de cod; verificarile de dependente.
3. Scheletul Next.js + Payload, versiuni fixate in trei locuri.
4. Modelul de continut din docs/02 si docs/01, sectiunea 8, inclusiv colectia de provenienta.
5. **Scriptul de export Lexical in HTML, testat.** Ruta de iesire exista din prima saptamana.
6. **Pagina de articol, verde la toti indicatorii, fara reclame.** Linia de baza fata de care se
   masoara orice regresie de mai tarziu.
7. Teste explicite pentru codurile 404 si 410.
8. **Decizia modelului de cache Next.js** (modelul nou sau cel anterior), luata pe baza testelor de la
   punctul 7, consemnata in docs/01. De ea depinde regula care face build-ul sa esueze daca o pagina
   devine dinamica.
9. Uneltele de verificare din docs/10-specificatii-tehnice.md, sectiunea 6, instalate si rulate in
   integrarea continua.
10. `docs/stare.md` actualizat la finalul fiecarei sesiuni.

## Faza 2 - Portarea si ochii auditului (saptamanile 3-6)

1. Scriptul de import al continutului demonstrativ din `referinta/prototip/data/` in Payload
   (docs/10, sectiunea 4), ca portarea sa aiba pe ce lucra.
2. Portarea paginilor din `referinta/prototip/js/pages/`, in ordinea: articol, prima pagina, sectiune,
   regiune, autor, pagini legale si de incredere. **Nu se porteaza** `/admin` si `/redactie` (demonstratii
   inlocuite de administrarea Payload) si nici `/pontaj` si `/cont` in forma lor actuala: acestea se
   construiesc separat, dupa specificatia din docs/10, sectiunea 3.
3. Datele structurate randate pe server, integral.
4. Sitemap-urile, inclusiv cel de stiri fara advertoriale; RSS per regiune; `robots.txt` si politica
   pentru crawlerele AI.
5. Editiile regionale si **pragul automat pentru pagini subtiri**.
6. **Instrumentul de automatizare a browserului** care verifica paginile de productie: terti, ce se
   executa inainte de consimtamant, identificatori de publicitate, etichete. (docs/08, sectiunea 6, pasul 2)
7. Semnalele de viata pentru fiecare verificare si meta-auditul.

## Faza 3 - Redactia (saptamanile 7-10)

1. Rolurile si permisiunile pe regiune; doi factori obligatoriu pentru cine publica.
2. **Fluxul cu cele sase porti umane** si pista de provenienta imuabila (docs/06, sectiunea 2).
   Nicio cale de publicare fara om.
3. Plafonul zilnic de materiale asistate de AI care intra la editare.
4. Campul obligatoriu de verificare a titlului fata de primele trei paragrafe.
5. Registrul public de corecturi si blocul datat „Actualizat la / Rectificare".
6. Relatarea in direct.
7. Newsletterul: briefingul de dimineata, cu dubla confirmare la abonare.

## Faza 4 - Consimtamant, masurare, bani (saptamanile 11-14)

1. Platforma de consimtamant certificata Google, TCF v2.2, inainte de orice altceva.
2. Consent Mode v2, cu toate semnalele pe `denied`.
3. Plausible pentru analiza editoriala.
4. GA4 dupa consimtamant, cu grupurile de continut si evenimentele pe spatii de reclama.
5. Tag Manager doar pentru tertii care nu servesc reclame. Pixelul Meta dupa acordul pentru publicitate.
6. AdSense si Ad Manager pe contul firmei; `ads.txt` generat din registru, cu verificarea automata.
7. Spatiile de reclama din docs/03, sectiunea 6, cu inaltime rezervata si incarcare amanata.
8. **Remasurarea tuturor indicatorilor cu reclamele pornite.** Daca bugetul cade, se scot reclame,
   nu se relaxeaza bugetul.
9. Stratul care poate bloca o categorie de reclama si o poate opri pe interval orar (jocuri de noroc).

## Faza 5 - Inainte de lansare (saptamanile 15-18)

1. Paginile legale completate cu datele firmei si verificate de avocat.
2. Politica AI, standardele, metodologia de fact-check, proprietatea si finantarea, statutul editorial.
3. Paginile de autor reale, cu oameni reali.
4. Auditul complet, toate cele zece domenii. Zero constatari S1 si S2 deschise.
5. **Exercitiul de restaurare din backup**, pe un mediu separat, consemnat.
6. Pagina statica de urgenta, comutabila in 60 de secunde, testata.
7. Revizuirea intregului plan de catre `avocatul-diavolului`.
8. Auditul de securitate cu pluginul instalat, pana la poarta de aprobare.

## Lansarea

Doar regiunile cu om. `SITE.demo` devine fals si se permite indexarea. Apoi, in aceeasi saptamana:
Google Search Console, Google Publisher Center, inscrierea la BRAT/SATI.

## Primele 30 de zile dupa lansare

Declaratiile EMFA art. 18 catre platformele foarte mari; aderarea la un organism de autoreglementare;
sesiunea documentata de alfabetizare AI; registrul GDPR art. 30 si evaluarea de impact; acordurile cu
furnizorii care prelucreaza date; intrebarea scrisa catre ANCOM; autoevaluarea Journalism Trust
Initiative pana la 90 de zile.

## Dupa aceea

- **Monitorizarea pe registre** (Monitorul Oficial, SICAP, ONRC/ANAF, dosare, consilii judetene),
  construita de `inginer-redactie`, sursa cu sursa, fiecare cu jurnal si alarma cand tace.
- Rubrica regionala „unde se duc banii europeni".
- La 100.000-300.000 de afisari pe luna: partener de publicitate, strict cu conditiile din docs/03,
  sectiunea 4.
- Editii noi doar cand exista omul pentru ele.
- Migrarea la Payload 4.0, ca proiect separat, cu o saptamana bugetata.
