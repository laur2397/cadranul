# Cadranul - concept de design (varianta D)

## Numele si de ce
**Cadranul** (cadranul.ro, de verificat la cumparare). Cadranul ceasului spune "ce ora e acum", cadranul busolei spune "unde esti". Exact asta face site-ul: iti arata tara ta acum, ora de ora, si te pune pe harta. Sigla e un cadran cu 8 semne (cele 8 regiuni) si un ac rosu care arata ora reala. Pe editii suna firesc: "Cadranul Oltenia", "Cadranul Cluj". Slogan: *Romania, ora de ora.*

## Ce simte cititorul in 3 secunde
"Tara asta e vie si eu sunt in ea." Prima pagina nu incepe cu o lista de titluri, ci cu Romania adevarata: harta cu relieful real (Carpatii se vad in umbra), Dunarea, marea, drumurile, iar peste ea stirile care pulseaza acolo unde s-au intamplat. Deasupra: "Buna dimineata, Romania." si o fraza care rezuma tara in acest moment (ceata in sud, cod galben la munte, A1 merge greu, curentul e ieftin la pranz). Apesi pe regiunea ta si harta zboara spre ea: "Buna dimineata, Craiova.", iar tot site-ul se intoarce spre tine.

## Ce nu are nimeni in Romania
1. **Harta vie ca prima pagina.** 5 straturi pe aceeasi harta: Stiri, Drumuri (cu circulatia care curge, rosu = inchis, portocaliu = lucrari), Vremea (coduri galbene hasurate), Avarii (apa, curent, gaz), Joburi (cate anunturi are fiecare judet). Indicatoarele sunt ca pe sosea: verde pentru autostrada, albastru pentru DN.
2. **Cadranul curentului.** Pretul energiei ora de ora, desenat ca un ceas de 24 de ore: vezi dintr-o privire ca acum e scump si ca la 13:00 e cel mai ieftin. "Porneste masina de spalat la 13:00." In articol, aceeasi curba e desenata direct peste fotografie, live.
3. **Totul e legat.** Fraza de sus are butoane: apesi "cod galben" si harta trece pe Vremea; apesi "A1" si vezi drumul. Stirile "De la ultima ta vizita" sunt aceleasi puncte rosii de pe harta; cand le citesti, se sting si apare "Esti la zi."
4. **Toate cele 6 elemente pastrate**, reinventate: De la ultima vizita (cu bife si cerc de progres), Ziua in 7 subiecte (banda cu fotografii, bifate pe masura ce citesti) plus calculatoarele "Cat primesti tu" (pensie, curent, plinul), "Buna dimineata, Craiova" cu vreme, trafic, avarii si farmacii de garda, pretul energiei si carburantii pe judet, starea drumurilor cu timpi "cat stai azi pe drum", joburile din regiune.

## Cum face bani (fara sa enerveze)
- **Reclame putine si bine platite**, toate marcate "Publicitate" cu link "De ce vad asta?": un billboard 970x250 dupa stiri (300x250 pe telefon), un articol nativ in grila de stiri, in articol 300x250 dupa paragraful 3 si al doilea abia dupa ~500 de cuvinte, 300x600 lipit in dreapta pe desktop, recomandari de la parteneri la final. Nimic deasupra hartii, nimic care sare peste text.
- **Vanzare directa locala** (cea mai scumpa): "Rubrica Farmacii de garda sustinuta de...", anunturi de joburi "Promovat" (de la 149 lei/saptamana), reclame de la firme din judet in editia regionala. Harta face fiecare editie un loc unde firma locala vrea sa fie vazuta.
- **Obiceiul zilnic**: oamenii intra dimineata pentru drumuri, vreme, avarii si pretul curentului. Asta inseamna afisari zilnice, deci bani constanti. Plus newsletter "Cadranul Oltenia, la 7:00" si sustinere voluntara (3,5% si donatii).
- **Cookie corect**: "Refuz tot" si "Accept tot" sunt identice ca marime si culoare, plus "Aleg eu". Cine refuza vede reclame dupa subiectul paginii, deci tot aduce bani.

## Paleta si fonturi
Albastru de indicator rutier #1747C9 (marca), cerneala #0E1E2C, fundal rece #F2F5F8, rosu "live" #D02B1D, verde autostrada #0B7A4A, galbenul codurilor meteo #F2B705. Mod intunecat complet: noaptea harta devine un relief albastru-inchis, cu orasele ca niste lumini. Fonturi: **Mona Sans** (titluri si cifre, latimea se schimba de la stransa la lata) si **Newsreader** (textul articolelor). Ambele sunt incluse in fisier, fara cereri externe.

*Fisiere: `index.html` (prototip clicabil: prima pagina, editia Oltenia completa, celelalte 7 editii, articol), `shots/` (capturi 390 si 1440 px). Continutul e fictiv, cifrele sunt demonstrative. Relieful e calculat din date publice de altitudine si inclus in pagina.*
