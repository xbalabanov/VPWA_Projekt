# VPWA Projekt 2026 - Maksym Balabanov, Stanislav Polak

# Semestrálny projekt: aplikácia na textovú komunikáciu v štýle IRC (Slack)

> **Pre agentov (AI asistentov):** tento súbor je zdrojom pravdy o projekte. Pred písaním kódu si prečítaj sekcie *Pravidlá pre agentov*, *Konvencie* a *Doménové pravidlá*. Ak je niečo nejednoznačné, spýtaj sa, nehádaj (pozri *Otvorené otázky*).

## Kontext predmetu

- Predmet: **Vývoj progresívnych webových aplikácií (VPWA)**, FIIT STU Bratislava.
- Repozitár predmetu: <https://github.com/kurice/vpwa27>. Obsahuje priečinky `zakladne-informacie` (základné informácie + harmonogram), `podmienky-absolvovania-a-hodnotenie`, `semestralny-projekt`, `cvicenia`, `prednasky`.
- Cieľ predmetu: pochopiť architektúru PWA, orientovať sa v aktuálnych technológiách, riešiť úlohy s webovými rámcami a poznať nasadzovanie v cloude.
- Termíny, konzultácie a prezentovania sú v sekcii *Termíny a harmonogram* nižšie. Podrobnosti hodnotenia celého predmetu (mimo projektu) sú v repozitári predmetu (`podmienky-absolvovania-a-hodnotenie`) a tu nie sú zapísané.

## Zadanie

Vytvoriť **progresívnu webovú aplikáciu (PWA) na textovú komunikáciu v štýle IRC (Slack)**, ktorá komplexne rieši všetky prípady použitia uvedené nižšie. Akékoľvek ďalšie vylepšenia nad rámec zadania sú vítané.

Projekt sa vypracováva **vo dvojici**, s rovnomerným rozdelením práce. Vypracovanie (takmer) celého projektu len jedným z dvojice je neprípustné. Každý člen tímu musí vedieť vysvetliť **ktorúkoľvek časť kódu** riešenia, vrátane častí, na ktorých sám nepracoval. Obaja členovia dostávajú rovnaký počet bodov.

## Technológie

| Vrstva | Technológia |
|---|---|
| Tučný klient (SPA/PWA) | rámec **Quasar** (Vue) |
| Služby biznis logiky (backend) | rámec **AdonisJS** |
| Databáza | relačný databázový systém (napr. PostgreSQL, MySQL) |

Technológie v tabuľke sú zadaním odporúčané. Iné **základné** technológie nie sú dovolené. Podporné knižnice sú povolené, ale **každú pridanú knižnicu treba zdôvodniť v dokumentácii** (sekcia *návrhové rozhodnutia*). Pri pridaní knižnice si preto poznač dôvod (čo rieši, prečo nestačí rámec).

## Konvencie implementácie

- Vue komponenty píšeme v **Options API** (`export default { data, computed, methods, ... }`), **nie** v Composition API (nepoužívať `<script setup>`, `ref`, `reactive`, `setup()`). Je jednoduchšie a prehľadnejšie na vysvetlenie pri obhajobe.
- Túto konvenciu dodržiavame jednotne v celom projekte, aby bol kód konzistentný a aby ho vedel vysvetliť ktorýkoľvek člen tímu.
- Dátový model sa vytvára **výhradne cez migrácie** AdonisJS (nie ručnými SQL zmenami v DB).
- Kód má byť čitateľný a vysvetliteľný. Uprednostni jednoduché riešenie pred "šikovným".

## Pravidlá pre agentov

1. **Options API vždy.** Nikdy negeneruj Composition API.
2. **Vysvetliteľnosť.** Každý vygenerovaný kus kódu musí vedieť vysvetliť obaja členovia tímu. Pri netriviálnom kóde pridaj krátky komentár *prečo*, nie len *čo*. Nepochopený kód = projekt nebude akceptovaný.
3. **Citovanie zdrojov.** Ak kód preberáš z dokumentácie, literatúry alebo internetu, pridaj do komentára odkaz na zdroj. Neuvedenie zdroja môže byť považované za plagiát.
4. **Žiadny cudzí kód.** Zakázané je používať programy alebo časti projektov iných študentov z minulých rokov (automaticky FX). Nekopíruj z verejných repozitárov iných tímov (napr. forkov a repozitárov typu `vpwa27-*`).
5. **Žiadne nové základné technológie.** Pred pridaním knižnice ju navrhni a uveď zdôvodnenie, ktoré pôjde do dokumentácie.
6. **Migrácie, nie ručné zmeny schémy.** Každá zmena modelu = nová migrácia + poznámka o zmene oproti diagramu z 1. fázy (do dokumentácie).
7. **Rovnomerná práca a code review.** Repo má mať priebežné commity oboch členov. Navrhuj malé, samostatné zmeny, ktoré sa dajú reviewovať.
8. **Nehádaj pri nejednoznačnosti.** Ak zadanie nepokrýva situáciu, pozri *Otvorené otázky* a spýtaj sa tímu.

## Fázy projektu

**1. fáza: responzívny klikateľný prototyp (12 bodov)**
Prototyp používateľského rozhrania vo forme **SPA v Quasare** pre *všetky* prípady použitia + návrh **logického dátového modelu** v UML notácii (odovzdáva sa ako JPG/JPEG obrázok UML class diagramu).

**Kontrolný bod: progres implementácie (5 bodov, binárne 0/5, 9. týždeň semestra)**
Letmé predvedenie funkčnosti cvičiacemu; očakáva sa implementovaná značná časť aplikácie. Ak aplikácia umožňuje realizovať prvých 6 z 11 prípadov použitia, každý člen tímu získa 5 bodov. Musí fungovať **prvých 6 z 11** prípadov použitia (UC 1 až 6). Riešenie sa neodovzdáva, kvalita kódu a robustnosť sa nehodnotia.

**2. (finálna) fáza: hotová PWA (30 bodov)**
Kompletná aplikácia podľa zadania + dokumentácia. Dátový model musí byť vytvorený prostredníctvom **migrácií**.

Bez akceptovanej 1. fázy nie je možné odovzdať 2. fázu.

> **Priorita implementácie:** kvôli kontrolnému bodu sa najprv robia UC 1 až 6 (registrácia/prihlásenie, zoznam kanálov, príkazový riadok, správa kanálov príkazmi, `/cancel`, `@nickname`). UC 7 až 11 nasledujú.

## Termíny a harmonogram

| Čo | Kedy |
|---|---|
| Odovzdanie 1. fázy (12 b) | koniec 5. týždňa semestra: **18. 10. do 23:59** v AIS |
| Konzultácie k 1. fáze (na cvičení) | 2. až 5. týždeň |
| Prezentovanie 1. fázy (na cvičení) | 6. týždeň |
| Konzultácie k 2. fáze (na cvičení) | 7. až 12. týždeň |
| Kontrolný bod progresu implementácie (5 b) | 9. týždeň |
| Odovzdanie 2. fázy (30 b) | koniec 12. týždňa semestra: **6. 12. do 23:59** v AIS |
| Prezentovanie finálneho projektu | 13. týždeň (prípadne individuálna dohoda s cvičiacim) |

- Na prezentáciách tím predvádza riešenie **na svojom počítači**.
- **Oneskorenie:** odovzdať možno najviac o 3 dni neskôr. Za každý deň oneskorenia sa odpočíta 25 % z pôvodného maxima (1 deň = 3/4 bodov, 2 dni = 1/2, atď.). Neskoršie odovzdanie nie je možné.
- **Neodovzdanie niektorej časti projektu = nesplnenie podmienok absolvovania predmetu.**
- Odovzdáva v AIS iba jeden člen tímu. Treba sa vopred dohodnúť, kto, aby neodovzdal nikto.

## Prípady použitia

1. **Registrácia, prihlásenie a odhlásenie** používateľa. Používateľ má meno a priezvisko, `nickName` a email.
2. **Zoznam kanálov**, v ktorých je používateľ členom.
   - Pri opustení kanála alebo trvalom vyhodení je kanál odobratý zo zoznamu.
   - Pri pozvánke do kanála je kanál **zvýraznený a topovaný**.
   - V zozname môže používateľ cez rozhranie kanál **vytvoriť, opustiť**, a ak je správcom aj **zrušiť**.
   - Dva typy kanálov: **súkromný** (private) a **verejný** (public).
   - **Správcom** kanála je používateľ, ktorý kanál vytvoril.
   - Ak nie je kanál aktívny (nepribudla nová správa) viac ako **30 dní**, kanál prestáva existovať, jeho `channelName` je následne možné použiť pre nový kanál.
3. **Príkazový riadok**: fixný prvok aplikácie, cez ktorý používateľ odosiela správy a príkazy. Správu môže odoslať v kanáli, ktorého je členom.
4. **Vytvorenie a správa kanála cez príkazový riadok** (prehľad príkazov nižšie). `nickName` aj `channelName` sú **unikátne**.
5. **Zrušenie členstva v kanáli** príkazom `/cancel`. Ak tak spraví správca, **kanál zaniká**.
6. **Adresovanie správy** konkrétnemu používateľovi cez `@nickname`: správa je mu **zvýraznená** v zozname správ.
7. **Kompletná história správ** s efektívnym **infinite scrollom**.
8. **Notifikácie o každej novej správe.**
   - Vystavujú sa **iba ak aplikácia nie je v stave "visible"** (Quasar, *App Visibility*).
   - Obsahujú **časť zo správy a odosielateľa**.
   - Používateľ si môže nastaviť notifikácie **iba pre správy, ktoré sú mu adresované**.
9. **Stav používateľa (online, DND, offline).**
   - Stav sa zobrazuje ostatným používateľom.
   - **DND** ⇒ neprichádzajú notifikácie.
   - **offline** ⇒ používateľovi neprichádzajú správy; po prepnutí do online sú kanály **automaticky aktualizované**.
10. **Zoznam členov kanála** príkazom `/list` (len ak je používateľ tiež členom kanála).
11. **Informácia o písaní správy**: pri aktívnom kanáli vidí používateľ v stavovej lište, kto práve píše správu (napr. *"Ed is typing"*). Po kliknutí na `nickName` si môže pozrieť **rozpísaný text v reálnom čase**, ešte pred odoslaním (každá zmena je viditeľná).

## Prehľad príkazov

| Príkaz | Význam |
|---|---|
| `/join channelName [private]` | Vytvorenie kanála (súkromného pri príznaku `private`). Kanál môže vytvoriť ľubovoľný používateľ. |
| `/join channelName` | Pridanie sa do verejného kanála; ak kanál neexistuje, automaticky sa vytvorí. |
| `/invite nickName` | Súkromný kanál: pridať používateľa môže **iba správca**. Verejný kanál: pozvať môže ľubovoľný člen. Správca ním tiež **obnovuje prístup** vyhodenému používateľovi. |
| `/revoke nickName` | Súkromný kanál: odobrať používateľa môže **iba správca**. |
| `/kick nickName` | Verejný kanál: člen môže "vyhodiť" iného člena. Ak tak spravia aspoň **3 členovia**, používateľ dostáva **trvalý ban** pre daný kanál. **Správca** môže vyhodiť natrvalo kedykoľvek. |
| `/cancel` | Zrušenie vlastného členstva v kanáli. Ak tak spraví správca, kanál zaniká. |
| `/quit` | **Iba správca**: zatvorenie/zrušenie kanála. |
| `/list` | Zobrazenie zoznamu členov kanála. |
| `@nickname` | Adresovanie správy konkrétnemu používateľovi. |

### Matica oprávnení (odvodená zo zadania)

| Príkaz | Verejný kanál | Súkromný kanál |
|---|---|---|
| `/join name` | ktokoľvek (kanál sa vytvorí, ak neexistuje) | len ak je pozvaný (pozri otvorené otázky) |
| `/join name private` | vytvorí súkromný kanál | vytvorí súkromný kanál |
| `/invite` | ktorýkoľvek člen | iba správca |
| `/revoke` | zadanie neuvádza (pozri otvorené otázky) | iba správca |
| `/kick` | člen (hlas, 3 hlasy = trvalý ban); správca okamžite | zadanie neuvádza |
| `/cancel` | člen; ak správca, kanál zaniká | člen; ak správca, kanál zaniká |
| `/quit` | iba správca | iba správca |
| `/list` | člen kanála | člen kanála |

## Doménové pravidlá a invarianty

- `nickName` je **globálne unikátny**. `channelName` je **unikátny** medzi existujúcimi kanálmi (po zániku kanála sa názov uvoľní).
- Správca = tvorca kanála. Správca nemôže byť vyhodený hlasovaním.
- **Trvalý ban** vo verejnom kanáli vznikne po `/kick` od aspoň 3 členov, alebo okamžite od správcu. Zrušiť ho môže správca cez `/invite`.
- **Zánik kanála**: po 30 dňoch bez novej správy, po `/quit` správcu, alebo po `/cancel` správcu. Po zániku je názov opäť voľný.
- Kanál, z ktorého bol používateľ odobratý (opustil, ban, `/revoke`), zmizne z jeho zoznamu.
- Pozvánka = kanál sa v zozname **zvýrazní a zobrazí navrchu**.
- Správy možno posielať iba do kanála, ktorého je používateľ členom.
- `@nickname` v správe zvýrazní správu adresátovi (a môže spustiť notifikáciu, ak má zapnuté "iba adresované").
- **Stav používateľa**: `online` (normálne správanie), `DND` (bez notifikácií), `offline` (nedostáva správy, po návrate do `online` sa kanály automaticky aktualizujú).
- **Notifikácie** sa vystavujú len keď aplikácia nie je viditeľná (Quasar App Visibility), obsahujú odosielateľa a úryvok správy.
- **Indikátor písania** (UC 11) vyžaduje prenos zmien rozpísaného textu v reálnom čase, nielen udalosť "píše".
- **História správ** sa načítava po stránkach (infinite scroll), nie celá naraz.

## Dátový model

- **1. fáza:** **JPG (JPEG) obrázok** logického dátového modelu (relačnej databázy) ako **UML class diagram**.
- **2. fáza:** dátový model vytvorený prostredníctvom **migrácií**. Pri zmenách oproti 1. fáze treba zmenu zdôvodniť v dokumentácii.

Entity, ktoré zadanie implicitne vyžaduje (východiskový zoznam pre návrh, nie hotová schéma): používateľ (meno, priezvisko, `nickName`, email, stav, nastavenie notifikácií), kanál (`channelName`, typ, správca, čas poslednej aktivity), členstvo v kanáli (vrátane stavu pozvánky/banu), hlasy za `/kick`, správa (autor, kanál, text, čas, adresáti cez `@nickname`).

## Priebeh prác (stav k 7. 10. 2026)

**UC 1 (registrácia/prihlásenie): rozpracované.**

- Hotové: `src/layouts/AuthLayout.vue`, `src/pages/LoginPage.vue` (formulár email + heslo s validáciou cez `rules`) a route `/login` v `src/router/routes.ts`.
- Chýba: `auth` store (`register`, `login`, `logout`, kontrola unikátneho `nickName` a emailu), `RegisterPage.vue` + route `/register`, mock používatelia, route guard (neprihlásený ⇒ `/login`), tlačidlo odhlásenia v `MainLayout`, odkaz na prihlásenie z aplikácie. Prihlásenie zatiaľ len vypíše notifikáciu, nič sa neukladá.

**Čo sme sa naučili (dôležité pre tím):**

- **Options API treba v Quasare zapnúť.** Quasar má `vueOptionsAPI: false` ako predvolenú hodnotu, takže Vue ignoruje `data()`, `methods` aj `computed`. Prejavilo sa to tak, že text v `q-input` po kliknutí mimo poľa "vrátil" starú hodnotu a v konzole bolo `Property "email" was accessed during render but is not defined on instance`. Oprava je `build.vueOptionsAPI: true` v `quasar.config.ts` (už pridané). Po `git pull` treba reštartovať `npm run dev`.
- **Importy cez alias `@/`**, napr. `import('@/pages/LoginPage.vue')`. Aliasy `pages/...` a `layouts/...` v tomto projekte nefungujú.
- **PowerShell blokuje `npm`** (execution policy). Riešenie: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, alebo `npm.cmd run dev`.
- Pri spustení dvoch dev serverov sa druhý presunie na port 9001. Staršie nechaj zatvoriť, nech nebežia dva naraz.
- Súbor `complete_task.md` (úplné zadanie z repozitára predmetu) je v `.gitignore` a necommituje sa.

**Ďalšie kroky:** pozri `memory/roadmap.md` (UML diagram, mock dáta, prázdne stores, layout shell) a dokončiť UC 1. Termín 1. fázy je 18. 10. 2026.

**Necommitnuté zmeny:** `quasar.config.ts`, `src/router/routes.ts`, `src/layouts/AuthLayout.vue`, `src/pages/LoginPage.vue`, `.gitignore`, `README.md`. Pred commitom skontroluj `frontend/package-lock.json` (zmenil sa po `npm install`).

## Otvorené otázky (zadanie ich neurčuje, treba rozhodnúť v tíme)

- Môže sa používateľ cez `/join channelName` pridať do **existujúceho súkromného** kanála bez pozvánky? (Pravdepodobne nie.)
- Platí `/revoke` aj vo verejnom kanáli? Platí `/kick` v súkromnom kanáli?
- Počíta sa 3-hlasový `/kick` ako 3 **rôzni** členovia? Čo sa stane s hlasmi, ak člen kanál opustí?
- Čo sa deje s `/join name private`, ak kanál `name` už existuje?
- Ako sa realizuje 30-dňové vypršanie kanála (plánovaná úloha na backende, alebo kontrola pri prístupe)? Ak ide o knižnicu, treba ju zdôvodniť.
- Aký mechanizmus real-time komunikácie (správy, stavy, indikátor písania)? Ak ide o externú knižnicu, treba ju zdôvodniť v dokumentácii.
- Ako sa zaobchádza so správami doručenými používateľovi počas `offline` (UC 9: "neprichádzajú správy", po návrate sa kanály aktualizujú z histórie)?

## Dokumentácia (2. fáza, minimálny obsah)

- **zadanie**
- diagram **fyzického dátového modelu**; pri zmenách oproti predchádzajúcej fáze zdôvodniť zmenu
- **diagram/diagramy architektúry** aplikácie
- **návrhové rozhodnutia** (pridanie externej knižnice, zdôvodnenie, ...)
- **snímky obrazoviek**: aspoň **5 kľúčových obrazoviek** (tie, ktoré by ste dali napr. do storu)

## Odovzdávanie

- Verejný **GitHub repozitár** s **priebežnými** commitmi a **rovnomernou aktivitou oboch členov** tímu; navzájom si robiť **code review**. Aktivita v repe slúži ako podklad k hodnoteniu.
- Odovzdáva sa **ZIP alebo RAR** archív do **AISu**, iba **jeden** člen tímu.
- Archív obsahuje **všetky zdrojové kódy** okrem rámcov a npm knižníc. Modifikovanú knižnicu treba priložiť a zmenu zdôvodniť v dokumentácii.
- Do archívu pridať súbor **`repo.txt`** s odkazom na verejný GitHub repozitár (po skončení kurzu je možné repozitár skryť).
- Výstupy všetkých kontrolných bodov sa odovzdávajú do AIS. Repozitár musí existovať počas celého semestra a priebežne sa doň odovzdávajú výstupy.

## Autorstvo

- Zakázané je používať programy alebo časti projektov od iných študentov z minulých rokov, automaticky **FX**.
- Všetky materiály z literatúry alebo internetu musia byť **citované** v komentároch v zdrojovom kóde s odkazom na zdroj. Neuvedenie zdroja môže byť považované za plagiát.
- Pri použití LLM (GPT-like služby) na generovanie kódu musí študent vedieť vysvetliť **každú jednu časť**. Nepochopený kód znamená, že projekt nebude akceptovaný.