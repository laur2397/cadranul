# Sistemul de design PULS

Sistemul exista deja, a fost ales dintre trei variante si este implementat in
`referinta/prototip/css/app.css`. Acest document fixeaza regulile, nu il reproiecteaza.
Gardianul lui este agentul `designer-produs`.

## Identitatea

Varianta „portal energic": antet violet, banda galbena, culoare proprie pe fiecare sectiune,
fotografii reale in locul ilustratiilor, tema deschisa implicita si tema intunecata la alegere.

## Unde se afla fiecare decizie in prototip

| Ce | Unde |
|---|---|
| Culorile de baza | variabilele de la inceputul `css/app.css`: `--brand`, `--brand-bar`, `--yellow`, `--night`, `--ink`, `--paper` si varianta `[data-theme="dark"]` |
| Culoarea fiecarei sectiuni | o singura data, in blocul `[data-sec="…"]`; componentele o folosesc prin `var(--sc)` si `var(--sc-on)` |
| Fonturile | `css/fonts.css`; Barlow Condensed 700/800 pentru titluri (`--cond`), Inter variabil pentru interfata si text (`--sans`) |
| Componentele | `js/ui/components.js`: carduri, etichete de sectiune, etichete de tip cu explicatie, semnatura, verdict de fact-check, spatii de publicitate, casete de newsletter |
| Dialogurile accesibile | `js/ui/modal.js` |
| Stilurile media kit si redactie | `css/faza2.css`, incarcate doar pe acele rute |

Valori in tema deschisa: brand violet `#4A1FD0` (contrast 8,8:1 pe alb), galben `#FFD60A`,
cerneala `#0F1426`, hartie `#FFFFFF`, noapte `#141A33`. In tema intunecata brandul devine
`#B9A6FF` (7,6:1), hartia `#171C33`, iar antetul violet ramane inchis (`#2B1580`). Culoarea
`#0C1022` apare doar ca `theme-color` pentru bara browserului in modul intunecat.

## Regulile, pe scurt

- Culoarea nu poarta niciodata singura informatia. Eticheta are intotdeauna si text.
- Culoarea de sectiune se defineste intr-un loc si se foloseste prin variabila.
- Ierarhia se face cu spatiu si marime, nu cu chenare.
- Fontul condensat de titlu este semnatura vizuala si nu se inlocuieste.
- Fonturile se gazduiesc local, subsetate latin si latin-ext, pentru diacriticele romanesti.
- Fiecare imagine are dimensiuni declarate si text alternativ care descrie ce se vede.
- O singura miscare orchestrata, nu efecte pe fiecare element. Preferinta de miscare redusa
  se respecta.
- Fiecare componenta se verifica la 320, 390 si 1440 de pixeli si in ambele teme, cu contrast
  masurat, inclusiv starea goala si textul prea lung.

## Portarea in Next.js

Variabilele CSS si structura de clase se pastreaza. Nu se introduce o biblioteca de componente.
Daca se adopta Tailwind, el se configureaza sa citeasca variabilele existente, nu sa le inlocuiasca.
Fonturile se servesc din aplicatie, nu dintr-un CDN extern.
