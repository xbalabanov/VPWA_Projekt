# VPWA Projekt 2026 - Maksym Balabanov, Stanislav Polak

# Semestrálny projekt: aplikácia na textovú komunikáciu v štýle IRC (Slack)

## Zadanie

Vytvoriť **progresívnu webovú aplikáciu (PWA) na textovú komunikáciu v štýle IRC (Slack)**, ktorá komplexne rieši všetky prípady použitia uvedené nižšie. Akékoľvek ďalšie vylepšenia nad rámec zadania sú vítané.

Projekt sa vypracováva **vo dvojici**, s rovnomerným rozdelením práce. Každý člen tímu musí vedieť vysvetliť **ktorúkoľvek časť kódu** riešenia, vrátane častí, na ktorých sám nepracoval.

## Technológie

| Vrstva | Technológia |
|---|---|
| Tučný klient (SPA/PWA) | rámec **Quasar** (Vue) |
| Služby biznis logiky (backend) | rámec **AdonisJS** |
| Databáza | relačný databázový systém (napr. PostgreSQL, MySQL) |

Iné **základné** technológie nie sú dovolené. Podporné knižnice sú povolené — ich pridanie treba zdôvodniť v dokumentácii.

### Konvencie implementácie

- Vue komponenty píšeme v **Options API** (`export default { data, computed, methods, ... }`), nie v Composition API — je jednoduchšie a prehľadnejšie na vysvetlenie pri obhajobe.
- Túto konvenciu dodržiavame jednotne v celom projekte, aby bol kód konzistentný a aby ho vedel vysvetliť ktorýkoľvek člen tímu.

## Fázy projektu

**1. fáza — responzívny klikateľný prototyp (12 bodov)**
Prototyp používateľského rozhrania vo forme **SPA v Quasare** pre *všetky* prípady použitia + návrh **logického dátového modelu** v UML notácii (odovzdáva sa ako JPG/JPEG obrázok UML class diagramu).

**Kontrolný bod — progres implementácie (5 bodov, binárne 0/5)**
Letmé predvedenie funkčnosti. Musí fungovať **prvých 6 z 11** prípadov použitia. Riešenie sa neodovzdáva, kvalita kódu a robustnosť sa nehodnotia.

**2. (finálna) fáza — hotová PWA (30 bodov)**
Kompletná aplikácia podľa zadania + dokumentácia. Dátový model musí byť vytvorený prostredníctvom **migrácií**.

Bez akceptovanej 1. fázy nie je možné odovzdať 2. fázu.

## Prípady použitia

1. **Registrácia, prihlásenie a odhlásenie** používateľa. Používateľ má meno a priezvisko, `nickName` a email.
2. **Zoznam kanálov**, v ktorých je používateľ členom.
   - Pri opustení kanála alebo trvalom vyhodení je kanál odobratý zo zoznamu.
   - Pri pozvánke do kanála je kanál **zvýraznený a topovaný**.
   - V zozname môže používateľ cez rozhranie kanál **vytvoriť, opustiť**, a ak je správcom aj **zrušiť**.
   - Dva typy kanálov — **súkromný** (private) a **verejný** (public).
   - **Správcom** kanála je používateľ, ktorý kanál vytvoril.
   - Ak nie je kanál aktívny (nepribudla nová správa) viac ako **30 dní**, kanál prestáva existovať — jeho `channelName` je následne možné použiť pre nový kanál.
3. **Príkazový riadok** — fixný prvok aplikácie, cez ktorý používateľ odosiela správy a príkazy. Správu môže odoslať v kanáli, ktorého je členom.
4. **Vytvorenie a správa kanála cez príkazový riadok** (prehľad príkazov nižšie). `nickName` aj `channelName` sú **unikátne**.
5. **Zrušenie členstva v kanáli** príkazom `/cancel`. Ak tak spraví správca, **kanál zaniká**.
6. **Adresovanie správy** konkrétnemu používateľovi cez `@nickname` — správa je mu **zvýraznená** v zozname správ.
7. **Kompletná história správ** s efektívnym **infinite scrollom**.
8. **Notifikácie o každej novej správe.**
   - Vystavujú sa **iba ak aplikácia nie je v stave „visible"** (Quasar — *App Visibility*).
   - Obsahujú **časť zo správy a odosielateľa**.
   - Používateľ si môže nastaviť notifikácie **iba pre správy, ktoré sú mu adresované**.
9. **Stav používateľa (online, DND, offline).**
   - Stav sa zobrazuje ostatným používateľom.
   - **DND** ⇒ neprichádzajú notifikácie.
   - **offline** ⇒ používateľovi neprichádzajú správy; po prepnutí do online sú kanály **automaticky aktualizované**.
10. **Zoznam členov kanála** príkazom `/list` (len ak je používateľ tiež členom kanála).
11. **Informácia o písaní správy** — pri aktívnom kanáli vidí používateľ v stavovej lište, kto práve píše správu (napr. *„Ed is typing"*). Po kliknutí na `nickName` si môže pozrieť **rozpísaný text v reálnom čase**, ešte pred odoslaním (každá zmena je viditeľná).

## Prehľad príkazov

| Príkaz | Význam |
|---|---|
| `/join channelName [private]` | Vytvorenie kanála (súkromného pri príznaku `private`). Kanál môže vytvoriť ľubovoľný používateľ. |
| `/join channelName` | Pridanie sa do verejného kanála; ak kanál neexistuje, automaticky sa vytvorí. |
| `/invite nickName` | Súkromný kanál: pridať používateľa môže **iba správca**. Verejný kanál: pozvať môže ľubovoľný člen. Správca ním tiež **obnovuje prístup** vyhodenému používateľovi. |
| `/revoke nickName` | Súkromný kanál: odobrať používateľa môže **iba správca**. |
| `/kick nickName` | Verejný kanál: člen môže „vyhodiť" iného člena — ak tak spravia aspoň **3 členovia**, používateľ dostáva **trvalý ban** pre daný kanál. **Správca** môže vyhodiť natrvalo kedykoľvek. |
| `/cancel` | Zrušenie vlastného členstva v kanáli. Ak tak spraví správca, kanál zaniká. |
| `/quit` | **Iba správca** — zatvorenie/zrušenie kanála. |
| `/list` | Zobrazenie zoznamu členov kanála. |
| `@nickname` | Adresovanie správy konkrétnemu používateľovi. |

## Dátový model

- **1. fáza:** **JPG (JPEG) obrázok** logického dátového modelu (relačnej databázy) ako **UML class diagram**.
- **2. fáza:** dátový model vytvorený prostredníctvom **migrácií**.

## Dokumentácia (2. fáza, minimálny obsah)

- **zadanie**
- diagram **fyzického dátového modelu**; pri zmenách oproti predchádzajúcej fáze zdôvodniť zmenu
- **diagram/diagramy architektúry** aplikácie
- **návrhové rozhodnutia** (pridanie externej knižnice — zdôvodnenie, …)
- **snímky obrazoviek** — aspoň **5 kľúčových obrazoviek** (tie, ktoré by ste dali napr. do storu)

## Odovzdávanie

- Verejný **GitHub repozitár** s **priebežnými** commitmi a **rovnomernou aktivitou oboch členov** tímu; navzájom si robiť **code review**. Aktivita v repe slúži ako podklad k hodnoteniu.
- Odovzdáva sa **ZIP alebo RAR** archív do **AISu** — iba **jeden** člen tímu.
- Archív obsahuje **všetky zdrojové kódy** okrem rámcov a npm knižníc. Modifikovanú knižnicu treba priložiť a zmenu zdôvodniť v dokumentácii.
- Do archívu pridať súbor **`repo.txt`** s odkazom na verejný GitHub repozitár.

## Autorstvo

- Zakázané je používať programy alebo časti projektov od iných študentov z minulých rokov — automaticky **FX**.
- Všetky materiály z literatúry alebo internetu musia byť **citované** v komentároch v zdrojovom kóde s odkazom na zdroj. Neuvedenie zdroja môže byť považované za plagiát.
- Pri použití LLM (GPT-like služby) na generovanie kódu musí študent vedieť vysvetliť **každú jednu časť**. Nepochopený kód znamená, že projekt nebude akceptovaný.
