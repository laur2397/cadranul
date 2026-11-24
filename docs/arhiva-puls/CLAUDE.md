# PULS - constitutia proiectului

Acest fisier este citit de Claude Code la fiecare sesiune. Regulile de aici au prioritate
fata de orice obicei general de programare. Daca o cerinta din conversatie intra in conflict
cu o regula marcata NENEGOCIABIL, opreste-te si semnaleaza conflictul inainte sa scrii cod.

---

## 1. Ce construim

PULS este o publicatie de stiri nationala din Romania, cu editii regionale pentru toate cele
8 regiuni de dezvoltare, 41 de judete si Bucuresti. Scopul declarat: sa depaseasca nivelul
tehnic si editorial al presei online romanesti actuale.

Exista deja un prototip front-end complet (HTML + CSS + module ES, fara dependente runtime),
cu circa 23 de tipuri de pagina, model de date separat, sistem de design, consimtamant si
accesibilitate. **Acest proiect nu reinventeaza prototipul. Il porteaza pe o stiva reala.**

Arhitectura informatiei, sistemul de design, modelul de continut, rutele canonice si deciziile
editoriale sunt deja luate si validate. Nu le reproiecta fara sa ceri aprobare explicita.

## 2. Contextul care a generat acest proiect

Proprietarul a preluat administrarea unui alt site de stiri si a descoperit, dupa o investigatie
tehnica, urmatoarele: un cont Google AdSense nedeclarat al unei agentii terte servea reclame pe
site; agentia detinea singurele conturi de administrator de doi ani si jumatate; fisierul ads.txt
avea o singura linie in timp ce concurenta avea intre 500 si 4.000; pluginul de backup era
licentiat pe contul unui tert cu acces de telecomanda la site; o parola era afisata in clar
intr-o pagina de administrare; si nimeni nu a observat nimic timp de ani de zile.

Acest proiect exista ca sa nu se mai repete. De aceea sistemul de audit (docs/08-audit.md) nu
este o anexa, este o componenta de prim rang, iar registrul de proprietate
(audit/registru-proprietate.yaml) se verifica automat.

Prototipul complet se afla in `referinta/prototip/` (cod, stiluri, date, fonturi). Fotografiile
de proba nu sunt incluse; sunt generice si se inlocuiesc la lansare. Este sursa de adevar pentru
design, structura si comportament. Nu se publica si nu se copiaza ca atare in aplicatie: se
porteaza.

## 3. Reguli nenegociabile

### 3.1 Proprietate - NENEGOCIABIL
Fiecare cont, domeniu, zona DNS, gazduire, cont de publicitate, proprietate de analiza,
depozit de cod si serviciu tert folosit de PULS este inregistrat in `audit/registru-proprietate.yaml`
cu titularul legal si persoanele cu acces. Codul nu introduce niciodata un identificator de
cont tert (cont de publicitate, pixel, marcaj de verificare) care nu exista in acel registru.
Auditul automat esueaza daca pagina publica incarca un identificator neinregistrat.

### 3.2 Fara tipare intunecate - NENEGOCIABIL
Nu implementam: derulare infinita care blocheaza iesirea, numaratori false de urgenta,
butoane de refuz ascunse sau mai greu accesibile decat cele de accept, abonare preselectata,
dezabonare ingreunata, titluri care promit altceva decat livreaza, notificari fara limita de
frecventa. Daca o cerinta suna a tipar intunecat, refuz-o si propune alternativa cinstita.

Temeiul, precis, ca sa nu fie citat gresit:
- In interfata de consimtamant, refuzul la fel de usor ca acceptul este o cerinta GDPR care
  **se aplica direct** publicatiei.
- Interdictia generala a tiparelor intunecate din DSA art. 25 **nu se aplica** PULS cat timp
  publica doar continut propriu; priveste platformele online. Nu o invoca drept temei.
- Propunerea de Regulament privind echitatea digitala (Digital Fairness Act), publicata in
  noiembrie 2026, ar interzice direct aceste practici, fara exceptie pentru firme mici. Nu e
  adoptata. Construim ca si cum ar fi, ca sa nu refacem interfata cand devine lege.
- Motivul principal nu e legal: increderea in presa din Romania este la 23 la suta. Intr-o
  asemenea piata, credibilitatea demonstrabila este singura pozitionare libera, iar orice
  tipar intunecat o distruge.

### 3.3 Publicitate separata de continut - NENEGOCIABIL
Orice spatiu publicitar este etichetat vizibil „Publicitate". Advertorialul este etichetat ca
atare si este exclus din sitemap-ul Google News. Reclama politica afiseaza „platit de",
perioada si sursa finantarii (Reg. UE 2024/900). Nicio reclama nu se incarca inainte de
decizia de consimtamant.

### 3.4 Consimtamant inainte de orice urmarire - NENEGOCIABIL
Google Consent Mode v2 in **modul Basic**: nicio eticheta Google nu se incarca inainte de decizia
utilizatorului (modul Advanced, care trimite semnale fara cookie-uri inainte de acord, este exclus
fara aviz scris de la avocat, pentru ca ghidurile EDPB 2/2023 trateaza si acele semnale ca necesitand
consimtamant). Niciun script de publicitate, analiza sau pixel nu se executa inainte de decizie.

Exista **o singura componenta de incarcare**, randata pe server, care emite in ordinea asta:
(1) bucata sincrona a platformei de consimtamant, (2) valorile implicite Consent Mode pe `denied`,
(3) o singura functie post-consimtamant. Doar acea functie incarca, separat, Tag Manager (pentru Meta
si etichetele care nu servesc reclame) si biblioteca de reclame. Platforma de consimtamant nu se
incarca niciodata prin Tag Manager. Nu se adauga scripturi terte in alta parte din cod.

### 3.5 Etichetarea continutului asistat de AI - NENEGOCIABIL
Orice material in care AI a avut **rol substantial in textul publicat**, si orice imagine, video,
audio sau grafic generat ori modificat de AI, poarta mentiunea vizibila, exact cum descrie politica
din docs/06-editorial.md, sectiunea 4. Folosirea AI pentru corectura, transcriere, traducerea
surselor, cautare in arhiva sau metadate nu se eticheteaza.
Fiecare articol are un camp de provenienta in modelul de continut; nu este optional.

### 3.6 Performanta ca buget, nu ca aspiratie
Bugetele din docs/01-arhitectura.md sunt praguri, nu tinte, pe doua niveluri:
- **in laborator**, in integrarea continua, pe articole de test cu profil de telefon incetinit:
  o modificare de cod care depaseste bugetul nu se integreaza;
- **in teren**, din datele reale ale cititorilor: o depasire la percentila 75 este constatare de audit.
Reclamele si analiza intra in buget; nu se exclud din masuratoare.

### 3.7 Accesibilitate
WCAG 2.2 nivel AA este pragul minim. Verificarile automate ruleaza in integrare continua.
Fiecare pagina are exact un `<h1>`, focus vizibil, navigare completa la tastatura si
contrast verificat in ambele teme.

## 4. Stiva

Vezi docs/01-arhitectura.md pentru versiuni exacte si justificare. Nu schimba o piesa din
stiva fara sa actualizezi acel document si fara sa ceri aprobare.

## 5. Limba

Interfata si continutul site-ului sunt in limba romana cu diacritice corecte. Comentariile din
cod si documentatia interna sunt in romana fara diacritice. Numele de variabile, functii,
fisiere si rute sunt in engleza sau in romana fara diacritice, niciodata amestecate in acelasi
modul.

## 6. Cum se lucreaza aici

- La inceputul fiecarei sesiuni citeste `docs/stare.md`; la final actualizeaza-l.
- Citeste `docs/09-plan-livrare.md` si `docs/10-specificatii-tehnice.md` inainte de a incepe o etapa noua.
- Pentru orice lucrare care atinge un domeniu de specialitate, foloseste agentul dedicat din
  `.claude/agents/`. Lista si rolul fiecaruia sunt in docs/00-brief.md.
- Orice modificare care atinge publicitatea, consimtamantul, datele personale, proprietatea
  conturilor sau etichetarea AI trece obligatoriu pe la agentul `auditor-sef` inainte de
  a fi considerata terminata.
- Nu scrie cod inainte sa existe o intrare in planul de livrare pentru ce scrii.
- Dupa orice etapa terminata, ruleaza auditul si consemneaza rezultatul in `audit/registru.md`.

## 7. Ce nu face acest proiect

Nu copiaza continut din alte publicatii. Nu genereaza articole in masa fara control editorial
uman. Nu cumpara trafic, urmaritori sau interactiuni. Nu publica advertoriale neetichetate.
Nu foloseste fotografii fara licenta si fara credit. Daca cineva cere oricare dintre acestea,
raspunsul este nu, iar motivul se consemneaza.
