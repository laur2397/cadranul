// Paginile legale si de prezentare: MODELE scurte si oneste, de verificat de avocat inainte de lansare.
// Locurile [intre paranteze] se completeaza cand e stabilita firma editoare.
export const PAGINI: { slug: string; title: string; description: string; html: string }[] = [
  {
    slug: 'despre', title: 'Despre Cadranul', description: 'Cine suntem, cine ne finanțează, cum lucrăm.',
    html: `<p>Cadranul este o publicație de știri cu 8 ediții regionale, una pentru fiecare regiune de dezvoltare a României. Ne propunem un singur lucru: să afli repede ce contează azi, mai ales unde locuiești, și ce înseamnă pentru tine.</p>
<h2 id="cine">Cine suntem</h2><p>Cadranul este editat de [Denumire SRL], cu sediul în [adresa completă], CUI [RO…], înregistrată la Registrul Comerțului cu numărul [J…/…/…]. Redacția are birouri în [orașe].</p>
<h2 id="finantare">Cine ne finanțează</h2><p>Trăim din publicitate (marcată mereu „Publicitate”), din anunțuri de angajare promovate, din sponsorizarea edițiilor regionale și din susținerea cititorilor. Nu primim bani de la partide și nu publicăm publicitate politică. Lista finanțatorilor care depășesc [prag] lei pe an este publicată aici anual.</p>
<h2 id="deontologie">Cum lucrăm</h2><ul><li>Răspunsul la titlu apare în primele două rânduri.</li><li>Fiecare articol are un autor real și ora publicării și a actualizării.</li><li>Conținutul plătit este marcat „Conținut plătit” și nu apare printre știri fără etichetă.</li><li>Nu punem vorbe în gura nimănui: citatele sunt exacte și au sursă.</li><li>Greșelile se corectează public, cu data lor (vezi <a href="/pagina/corecturi">Cum corectăm greșelile</a>).</li></ul>
<h2 id="sustine">Susține Cadranul</h2><p>Dacă îți e util ce facem, ne poți susține cu o donație sau redirecționând 3,5% din impozit (posibil doar printr-o asociație; detaliile apar aici la lansare).</p>
<h2 id="contact">Contact</h2><p>Redacția: <a href="mailto:redactie@cadranul.ro">redactie@cadranul.ro</a>. Corecturi: <a href="mailto:corecturi@cadranul.ro">corecturi@cadranul.ro</a>. Publicitate: <a href="mailto:publicitate@cadranul.ro">publicitate@cadranul.ro</a>. Telefon: [+40 …].</p>`,
  },
  {
    slug: 'confidentialitate', title: 'Politica de confidențialitate', description: 'Ce date personale prelucrăm și ce drepturi ai.',
    html: `<p>Operatorul datelor este [Denumire SRL], CUI [RO…], [adresa]. Responsabilul cu protecția datelor: <a href="mailto:date@cadranul.ro">date@cadranul.ro</a>.</p>
<h2>Ce date prelucrăm</h2><ul><li><b>Fără cont și fără acord:</b> doar date tehnice necesare funcționării (adresa IP în jurnalele serverului, păstrate [30] de zile, pentru securitate).</li><li><b>Pe telefonul tău, nu la noi:</b> ediția aleasă, articolele citite și modul întunecat se țin în browserul tău (cookie-uri și memorie locală necesare).</li><li><b>Cu acordul tău:</b> statistici de citire (Google Analytics) și publicitate personalizată (Google, Meta). Poți retrage acordul oricând din „Setări cookie”.</li><li><b>Newsletter:</b> adresa de e-mail, doar dacă te abonezi; o ștergem când te dezabonezi.</li></ul>
<h2>Temeiul legal</h2><p>Consimțământul (art. 6 alin. 1 lit. a GDPR) pentru statistici, publicitate personalizată și newsletter; interesul legitim (lit. f) pentru securitatea site-ului.</p>
<h2>Cui transmitem date</h2><p>Furnizorului de găzduire [nume, țara], iar cu acordul tău: Google Ireland Limited și Meta Platforms Ireland Limited. Transferurile în afara UE se fac pe baza clauzelor contractuale standard.</p>
<h2>Drepturile tale</h2><p>Acces, rectificare, ștergere, restricționare, portabilitate, opoziție și retragerea consimțământului. Ne scrii la <a href="mailto:date@cadranul.ro">date@cadranul.ro</a>; răspundem în cel mult o lună. Poți depune plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (dataprotection.ro).</p>`,
  },
  {
    slug: 'cookie', title: 'Politica de cookie-uri', description: 'Ce cookie-uri folosim și cum le alegi.',
    html: `<p>Folosim cookie-uri pe față: întâi îți spunem ce sunt, apoi alegi. „Refuz tot” și „Accept tot” au aceeași mărime și aceeași culoare.</p>
<h2>Necesare (nu cer acord)</h2><ul><li><b>cad_ed</b>: ediția aleasă de tine (1 an).</li><li><b>cad_v</b>: ora ultimei vizite, ca să-ți arătăm ce e nou (1 an).</li><li>În memoria browserului: modul întunecat, articolele citite, alegerea de cookie-uri. Nu pleacă de pe telefonul tău.</li></ul>
<h2>Statistică (doar cu acord)</h2><p>Google Analytics 4, prin Google Tag Manager: ce pagini se citesc și cât, fără să știm cine ești.</p>
<h2>Publicitate (doar cu acord)</h2><p>Google Ad Manager / AdSense și Meta Pixel: reclame după interesele tale și măsurarea campaniilor. Dacă refuzi, nu încărcăm aceste scripturi; reclamele vândute direct de noi (marcate „Publicitate”) rămân, fără date personale.</p>
<h2 id="setari">Cum schimbi alegerea</h2><p>Oricând, din linkul „Setări cookie” din subsolul fiecărei pagini.</p>`,
  },
  {
    slug: 'termeni', title: 'Termeni și condiții', description: 'Regulile de folosire a site-ului.',
    html: `<p>Folosirea site-ului cadranul.ro înseamnă acceptarea acestor termeni.</p>
<h2>Conținutul</h2><p>Textele, fotografiile și graficele aparțin [Denumire SRL] sau autorilor lor. Poți cita până la [500] de caractere cu link către articol. Pentru preluări mai mari, ne scrii.</p>
<h2>Date utile</h2><p>Prețurile la energie și carburanți, starea drumurilor, avariile și farmaciile de gardă vin din surse publice și pot avea întârzieri. Verifică la sursă înainte de o decizie importantă.</p>
<h2>Anunțurile de angajare</h2><p>Angajatorii răspund pentru anunțurile lor. Anunțurile promovate sunt plătite și marcate „Promovat”.</p>
<h2>Litigii</h2><p>Se aplică legea română. Consumatorii se pot adresa ANPC sau platformei europene de soluționare online a litigiilor.</p>`,
  },
  {
    slug: 'publicitate', title: 'Publicitate în Cadranul', description: 'Formate, reguli și cum ne contactezi.',
    html: `<p>Avem puține reclame, toate marcate „Publicitate”. Nicio reclamă nu sare peste text, nu pornește cu sunet și nu stă înaintea titlului.</p>
<h2>Formate</h2><ul><li>Billboard 970×250 pe calculator (300×250 pe telefon), după știrile zilei.</li><li>300×250 în articol, după paragraful 3; al doilea abia după încă 350 de cuvinte.</li><li>300×600 în dreapta articolului, pe calculator.</li><li>Articol plătit, marcat „Conținut plătit de …”.</li><li>Sponsor de ediție regională: un singur rând, marcat „Publicitate”.</li><li>Susținerea rubricii „Farmacii de gardă” într-un județ.</li></ul>
<h2 id="joburi">Anunțuri de angajare promovate</h2><p>Anunțul tău, în ediția regiunii tale, marcat „Promovat”, de la 149 lei pe săptămână. Scrie-ne la <a href="mailto:joburi@cadranul.ro">joburi@cadranul.ro</a>.</p>
<h2 id="de-ce">De ce văd o reclamă</h2><p>Dacă nu ți-ai dat acordul, reclama ține doar de pagina pe care o citești și de ediția aleasă. Cu acord, poate ține cont și de interesele tale. Schimbi oricând din „Setări cookie”.</p>
<h2>Contact</h2><p><a href="mailto:publicitate@cadranul.ro">publicitate@cadranul.ro</a></p>`,
  },
  {
    slug: 'corecturi', title: 'Cum corectăm greșelile', description: 'Politica de corecturi a redacției.',
    html: `<p>Greșim și noi. Când se întâmplă, corectăm repede și la vedere.</p>
<ul><li>Corectura apare la finalul articolului, cu data ei și cu ce s-a schimbat.</li><li>Greșelile de tipar mărunte se corectează fără notă.</li><li>Dacă greșeala schimbă sensul articolului, o spunem și în titlu sau în șapou.</li><li>Nu ștergem articole ca să ascundem o greșeală.</li></ul>
<p>Ai găsit o greșeală? Scrie-ne la <a href="mailto:corecturi@cadranul.ro">corecturi@cadranul.ro</a>, cu linkul articolului. Răspundem în cel mult 48 de ore.</p>`,
  },
]
