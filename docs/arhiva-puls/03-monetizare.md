# Monetizarea PULS

Cercetat la 24 noiembrie 2026, cu masuratori directe pe 21 de publicatii romanesti. Cifrele de venit
pentru piata romaneasca sunt **estimari**, marcate ca atare, pentru ca piata nu publica date solide.
Se inlocuiesc cu datele proprii in primele 60 de zile.

---

## 1. Lectia, masurata

`ads.txt` inseamna lista publica a celor autorizati sa vanda spatiul publicitar al site-ului.

| Publicatie | Linii in ads.txt | Vanzatori unici | Administrat de |
|---|---|---|---|
| realitatea.net | 4.287 | 305 | - |
| ziare.com | 4.257 | 290 | thematicdigital.ro |
| antena3.ro | 2.261 | 241 | antenagroup.ro |
| adevarul.ro | 2.036 | 251 | pubpower.io |
| gandul, mediafax, g4media, economedia, cancan | 1.879 fiecare, fisiere identice | 216 | gandul.ro |
| spotmedia.ro | 1.589 | 220 | arbomedia.ro |
| libertatea.ro | 1.457 | 179 | ringier.ro |
| psnews.ro | **1** | **1** | - |

Google: daca identificatorul vanzatorului nu e in `ads.txt`, **nu se mai tine licitatie** pentru acea
cerere. `ads.txt` autorizeaza **vanzatori**, nu cumparatori. O singura linie Google inseamna un singur
vanzator autorizat: cererea Google putea licita, dar toate celelalte platforme de vanzare si toti
revanzatorii erau excluse, deci concurenta pentru fiecare afisare era mica.
psnews.ro nu are nici platforma de consimtamant certificata, deci tot traficul din SEE primeste doar
reclame nepersonalizate, ceea ce taie de regula peste jumatate din valoare.

**Estimare** pentru starea psnews.ro: 0,08-0,25 euro la mia de afisari. O stiva construita corect:
1,20-3,00 euro. Un ordin de marime diferenta, pe acelasi trafic. Ambele intervale sunt estimari, nu masuratori.

## 2. Piata in care intri

- Publicitatea digitala in Romania: 327 milioane euro in 2025, +10%. Digitalul e ~39% din piata,
  fata de peste 60% in Europa de Vest.
- **Programaticul e doar ~10% din digitalul romanesc**, jumatate fata de Vest. Concluzie: in Romania
  banii sunt in **vanzarea directa**, nu in licitatia automata.
- In raportul BRAT pe 2025, **publicitatea online locala a crescut cu 19%**, a doua cea mai mare
  crestere din piata. Editiile regionale tintesc exact segmentul care creste cel mai repede.
- Blocarea reclamelor in Romania: ~27%. Se bugeteaza 25-30% din afisari ca nemonetizabile prin
  reclama clasica.

## 3. Treptele stivei, pe masura cresterii

| Trafic lunar | Ce se foloseste |
|---|---|
| 0-100.000 afisari | AdSense, cont propriu. Efortul merge in continut si in platforma de consimtamant |
| 100.000-500.000 | **Google Ad Manager gratuit + AdSense ca rezerva**, plus un partener certificat Google sau o casa de reprezentare din Romania. Cel mai rentabil pas |
| 500.000-3 milioane | Licitatie in antet (Prebid) cu 6-10 ofertanti, Amazon, praguri de pret, incarcare amanata, reimprospatare declarata |
| peste 3 milioane | Licitatie pe server, contract AdX propriu, eventual Ad Manager 360 |

Ad Manager gratuit acopera tinta de 18 luni. Plafonul care se atinge primul e cel video:
800.000 de afisari video pe luna.

## 4. Regula care te protejeaza de ce s-a intamplat la PS News

Daca un partener monetizeaza site-ul, Google ofera doua forme. **Se accepta numai „Manage Account"**:
contul Ad Exchange e al tau, partenerul il administreaza, castigurile se impart automat, iar
identificatorul tau apare in `ads.txt` ca DIRECT. Forma „Manage Inventory" pune inventarul in contul
partenerului si, intr-una din variante, **toata plata merge la partener**.

Conditii obligatorii in orice contract: identificator propriu ca DIRECT, acces la `ads.txt` pe care il
intretine partenerul, si o clauza de incetare care iti returneaza `ads.txt`.

Parteneri de discutat, extrasi din fisierele concurentei: **ARBOmedia** (fuzionata cu ThinkDigital din
ianuarie 2026, cea mai puternica acoperire locala, deci cea mai potrivita pentru editii regionale),
Thematic Digital, PubPower, Project Agora (Historia.ro a raportat +25% eCPM cu ei), Yieldbird, R2B2.
Daca se poate, doi parteneri testati unul contra celuilalt.

## 5. ads.txt din prima zi

```
OWNERDOMAIN=puls.ro
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

Servit static, `text/plain`, cod 200, fara redirectionare care poate da 403. **hotnews.ro returneaza
azi 403 pe ads.txt**, un defect real care costa bani. O verificare automata confirma 200 si
`text/plain` continuu. Tinta cu un partener: ~200 de vanzatori unici, aproximativ 20% DIRECT si 80%
RESELLER. **Nu se adauga linii care nu se pot justifica**: un fisier umflat cu revanzatori necunoscuti
e semnal de site facut pentru reclame.

## 6. Formatele care aduc bani fara sa fie agresive

**Ce interzic standardele Better Ads, aplicate de Chrome.** Pe telefon: ferestre care acopera
continutul, reclame inainte de incarcare, **densitate peste 30%** din inaltimea continutului, animatii
care clipesc, video cu sunet pornit automat, reclame cu numaratoare inversa, reclame care acopera tot
ecranul la derulare, reclame fixe peste 30% din ecran. Pe desktop: aceleasi, cu **densitate maxima 50%**.

**Aranjamentul pentru pagina de articol, 4-6 spatii:**
- pe desktop, un banner sub titlu, **nu deasupra**, ca sa nu afecteze LCP, cu inaltime rezervata.
  **Pe telefon nu exista banner sub titlu**: singura reclama din primul ecran este banda fixa de jos,
  conform regulii „cel mult o reclama deasupra liniei de pliere" (docs/01, sectiunea 6), iar primul
  ecran ramane pentru titlu, „Pe scurt" si legaturile catre articolele inrudite.
- 3-4 dreptunghiuri in text, dupa fiecare ~4 paragrafe; locul cel mai bine platit si mai putin intruziv
- pe desktop, o singura reclama fixa laterala
- pe telefon, **o banda fixa jos de 320×50 sau 320×100**; unul dintre cele mai bune formate raportat la
  deranj. Nu se combina cu video fix sau cu reclame de 300×600
- **video in text**, fara sunet, cu sunet doar la apasare, oprit cand iese din ecran. Formatul cel mai
  bine platit intr-o piata cu preturi mici

**Ce nu se foloseste niciodata:** reclame interstitiale, ferestre, reclame inainte de continut, video
cu sunet automat. Nici reclamele automate de tip „vignette" ale AdSense; sunt interstitiale.

**Reimprospatarea:** doar banda fixa de jos si reclama laterala, declarate la 60 de secunde, doar
cand sunt vizibile si dupa actiunea utilizatorului. Nimic altceva. Declararea gresita a reimprospatarii
este incalcare de politica.

**Vizibilitatea:** tinta peste 70% pe fiecare spatiu. **Orice spatiu sub 40% vizibil se sterge**, pentru
ca trage in jos pretul intregului domeniu.

**Reclamele se suprima automat** pe paginile cu putin text: arhive de etichete, pagini de judet sub
prag, paginare. Reclamele pe pagini subtiri sunt cea mai mare expunere practica a unui site nou.

## 7. Masurare: GA4, Tag Manager, pixelul Meta

Le-ai cerut explicit. Intra toate, in ordinea corecta.

1. **Platforma de consimtamant certificata Google, cu TCF v2.2, inaintea oricarei etichete de
   reclama.** Varianta gratuita si certificata: mesajul „Privacy & messaging" al Google. Ordinea
   conteaza: bucata sincrona a platformei in `<head>`, bibliotecile de reclama dupa.
2. **Consent Mode v2 in modul Basic**, cu toate cele patru semnale. Nicio eticheta Google inainte de
   decizie. Consecinta asumata: dupa un refuz, GA4 nu modeleaza; masurarea editoriala completa vine
   din Plausible.
3. **Plausible** pentru analiza editoriala: fara cookie-uri, nu cere consimtamant, masoara tot traficul
   care nu il blocheaza. Servit prin domeniul propriu (proxy), se apropie de 100%; altfel blocantele de
   reclame (~27%) il opresc si pe el.
4. **GA4**, dupa consimtamant, cu grupuri de continut din prima zi: regiune, judet, sectiune, autor,
   tip de continut (stire, opinie, advertorial), varsta articolului, stare de consimtamant. Evenimente:
   adancimea de derulare, timpul de citire, articol terminat, abonare la newsletter, accept de
   notificari, si **evenimente pe spatiile de reclama**, ca venitul sa poata fi legat de continut.
5. **Tag Manager**, incarcat de functia unica post-consimtamant, pentru tertii care nu servesc reclame
   (Meta, analiza licitatiei). Niciodata pentru biblioteca de reclame si niciodata pentru platforma de
   consimtamant, care se incarca inaintea lui.
6. **Pixelul Meta**, strict dupa acordul pentru publicitate. Modelul Meta de consimtamant in UE este
   contestat juridic de organizatiile europene de consumatori in 2026. Datele lui se trateaza ca
   incomplete si **nu se construiesc produse de audienta pe el**. Valoarea lui reala pentru PULS:
   redirectionarea campaniilor proprii de atragere de cititori.
7. **Etichetarea pe server**: utila de la 1 milion de utilizatori in sus, nu la lansare. Nu scuteste de
   consimtamant.
8. **Rapoartele Ad Manager** din prima saptamana: eCPM pe tara, dispozitiv si spatiu; vizibilitate pe
   spatiu; afisari nevandute pe spatiu. Fara raport pe spatiu nu gasesti spatiul care iti distruge pretul.

## 8. Dincolo de reclame

Ce declara editorii ca surse importante in 2026: abonamente sau membri 76%, publicitate 68%,
**continut sponsorizat 64%**, evenimente 54%, donatii 19%, micro-plati 6%.

Pentru Romania, linie cu linie:
- **Sponsorizarea newsletterului regional**: marja cea mai mare. **Nimeni nu are opt newslettere
  regionale.** Inventar pe care nu il vinde altcineva. ARBOmedia vinde deja newslettere.
- **Advertorial**: principalii bani non-programatici din Romania; firmele locale, spitalele,
  universitatile il cumpara deja. **Etichetat obligatoriu** (docs/04-conformitate.md).
- **Evenimente regionale**: premii pentru firme locale, dezbateri, seminarii despre fonduri europene.
  Marja mare, fara tehnologie, vandute acelorasi clienti.
- **Membri, nu zid de plata.** Platesc pentru presa online 15% din romani, in crestere. Donatiile catre
  presa independenta au fost ~4,5 milioane euro in 2025; Recorder arata ca merge. Zidul de plata la
  lansare, fara marca, e sinucidere.
- **Micro-plati**: nu se construiesc.
- **Licentierea catre AI**: nu se planifica. Editorii locali si din tari mici se asteapta la zero.

**Estimare** de structura a veniturilor:

| Linie | Lunile 1-6 | Luna 18 | Matur |
|---|---|---|---|
| Programatic, display si video | 85% | 45% | 30% |
| Vanzare directa, regional si national | 5% | 25% | 25% |
| Continut sponsorizat | 5% | 15% | 18% |
| Newsletter sponsorizat | 0% | 5% | 8% |
| Evenimente | 0% | 4% | 10% |

## 9. BRAT si SATI: obligatoriu pentru vanzarea directa

Fara audit SATI nu poti vinde catre agentiile de media din Romania. **Nu exista prag minim de trafic**;
PULS se inscrie de la lansare. Cerinte: dovada dreptului asupra domeniului, eticheta de masurare SATI pe
toate paginile de continut, declararea traficului estimat. Taxa de membru: **neverificata**, se intreaba
direct.

## 10. Ce distruge venitul

1. **Reclame pe contul altcuiva.** Vezi sectiunea 4.
2. **Trafic invalid.** Esti raspunzator chiar daca l-a generat un tert fara stirea ta. Contul poate fi
   suspendat. **Nu se cumpara trafic niciodata.** Adresele interne se exclud. Rapoartele de trafic
   invalid se verifica saptamanal.
3. **Clasificarea drept site facut pentru reclame.** Criteriile: densitate de reclame mult peste medie,
   reimprospatare rapida, mult trafic platit, continut subtire sau preluat, sablon repetitiv. **O retea
   regionala care rescrie aceleasi stiri in mai multe editii bifeaza trei criterii deodata.** Odata
   blocat, deblocarea e extrem de grea.
4. **Politici AdSense:** mai multe reclame decat continut; reimprospatare nedeclarata; **continut socant
   la accidente si infractiuni**, problema clasica a presei romanesti, care demonetizeaza pagini;
   continut duplicat; reclame pe pagini fara continut.
5. **Blocarea reclamelor:** nu se pune zid anti-blocare. Cei cu blocare se inregistreaza pentru continut
   *mai des* decat ceilalti. Calea corecta e inregistrarea si statutul de membru.

## 11. Ordinea, dupa euro pe ora de efort

1. Cont propriu AdSense si Ad Manager, pe entitatea editoare, cu contul bancar al firmei.
2. Platforma de consimtamant certificata si Consent Mode v2, inainte de prima reclama.
3. `ads.txt` corect, cu verificare automata.
4. Editii pe cale, nu pe subdomeniu.
5. Spatiu rezervat si incarcare amanata din prima componenta.
6. Inscrierea la BRAT/SATI la lansare.
7. GA4 cu grupuri de continut si evenimente pe reclame.
8. La 100.000-300.000 de afisari: partener, cu conditiile din sectiunea 4.
9. Newsletter si notificari din prima zi.
10. Vanzare directa si advertorial catre firmele din regiuni, imediat.

## 12. Ce nu s-a putut verifica

In ce plafon de impresii gratuite intra Romania la Ad Manager. Pragurile oficiale pentru AdX si
Ad Manager 360 (doar estimari ale furnizorilor). **Orice cifra metodologic solida de eCPM sau RPM
pentru presa romaneasca.** Tarifele de sponsorizare de newsletter in Romania. Disponibilitatea Reader
Revenue Manager pentru editorii romani. Restrictiile tehnice concrete pe pixelul Meta in 2026.
Taxa SATI/BRAT. Starea achizitiei Profitshare de catre 2Performant.
