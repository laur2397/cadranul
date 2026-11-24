# Starea proiectului (24.11.2026)

## Gata
- Site-ul public după designul D: prima pagină națională și 8 ediții (`/editie/<regiune>`, cu „zborul” hărții),
  harta cu relief și 5 straturi (Știri, Drumuri, Vremea, Avarii, Joburi), fraza momentului cu butoane, „De la ultima
  ta vizită” cu bife și cerc de progres, „Ziua în 7 subiecte”, cadranul curentului, carburanți, utile (vreme, trafic,
  avarii, farmacii), drumuri, știri pe județe, billboard, calculatoare, joburi, cele mai citite, newsletter, subsol.
- Articol ca în design: pe scurt, „ce înseamnă pentru tine”, grafic live peste fotografie, grafic în text, calculator,
  cronologie, reclame puse automat (după paragraful 3 și după încă 350 de cuvinte), cuprins, „Ai terminat” + următorul subiect.
- Pagini: `/drumuri`, `/energie`, `/joburi` (+ anunț), `/farmacii`, `/judet/<județ>`, `/<secțiune>`, `/live/<slug>`,
  `/pagina/<slug>`, `/autor/<slug>`, `/cauta`, 404, RSS (național + pe ediții), sitemap, sitemap Google News (fără conținut plătit),
  robots, ads.txt, JSON-LD (NewsArticle, Organization, BreadcrumbList, JobPosting, LiveBlogPosting).
- /admin: articole, prima pagină pe ediții, fraza momentului, LIVE, toate datele utile, sponsor de ediție, pagini legale.
- Consimțământ: banner corect, Consent Mode v2 refuzat implicit, un singur încărcător pentru GTM/GA4/Ad Manager/AdSense/Meta
  (gol = nu se încarcă nimic). Ediția aleasă se ține în cookie, deci serverul o desenează direct.
- Verificări: tipuri, teste unitare, build, teste în browser (coduri 200/404, zero cereri terțe înainte de acord, axe WCAG 2.2 AA
  pe prima pagină, ediție și articol, luminos și întunecat, fără depășire la 390 px).

## Doar demonstrativ
- Tot conținutul (45 de articole, autori, firme, joburi, farmacii, reclame) este fictiv. Orele sunt relative la momentul
  `npm run seed`; după o zi, rulează din nou seed-ul ca demo-ul să pară „de azi”. Seed-ul ȘTERGE baza.
- Cifrele de energie, carburanți, drumuri, vreme, avarii sunt de probă (vezi `docs/fluxuri-date.md`).
- Reclamele afișate sunt machete; în producție locurile se umplu doar din Ad Manager/AdSense, după acord.
- Newsletter, „Urmărește subiectul”, „Ascultă”: butoanele există, serviciile nu (spun cinstit „vine la lansare”).
- „Cele mai citite” se alege manual până la conectarea statisticilor.

## Ce urmează
1. Importurile reale de date (docs/fluxuri-date.md), începând cu OPCOM și ANM.
2. Furnizor de e-mail pentru newsletter; stocare imagini (S3/R2) pentru încărcările din /admin.
3. Platformă de consimțământ certificată Google (TCF) înainte de AdSense/Ad Manager în UE.
4. Găzduire, domeniu, conturi pe firma editoare (registrul `audit/registru-proprietate.yaml`).

## Decizii ale proprietarului
- Firma editoare și datele ei (subsol, pagini legale, JSON-LD, registrul de proprietate).
- Reclame ne-personalizate și după „Refuz tot”? (`NEXT_PUBLIC_ADS_ON_REFUSAL`, implicit „nu”), de hotărât cu avocatul.
- Verificarea paginilor legale de către avocat (bifa „Verificată de avocat” în /admin scoate nota de model).
- Autorii reali ai fiecărei ediții (cei din demo sunt fictivi).
