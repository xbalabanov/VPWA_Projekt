# Druhá fáza — plán a rozdelenie práce

Plán vytvorený 7. 11. 2026, stav aktualizovaný 9. 11. Prvá fáza je podľa výsledku tímu akceptovaná za plný počet bodov.

**Priebežný stav:** Maksym pripravil základ backendu v `backend/`: AdonisJS 7, PostgreSQL, migrácie zo starter kitu, predvolený session guard a socket konfiguráciu. Overené: tabuľky v PostgreSQL, HTTP 401 pre neprihlásený socket, lint, typová kontrola a build. [Návod spustenia](../backend/README.md) je pripravený. K0 ešte potrebuje Stanislavovo review kontraktu a overenie spustenia na jeho počítači; A1–A9, B1–B9 a spoločné integračné úlohy ostávajú plánované. Existujúce users/token migrácie samy osebe neznamenajú dokončenie A1 ani session loginu A2.

**Kontrolný bod máme vo štvrtok 12. 11. 2026.** Finálne odovzdanie je podľa zadania **6. 12. o 23:59 v AIS**. Pracujeme s rokom 2026 podľa aktuálneho semestra; verejné zadanie uvádza deň a mesiac.

## Čo presne treba na kontrolný bod

[Oficiálne zadanie, sekcia Kontrolná fáza progresu implementácie](https://github.com/kurice/vpwa27/blob/main/semestralny-projekt/readme.md#kontrolná-fáza-progresu-implementácie) vyžaduje **prvých šesť prípadov použitia, UC1–UC6**. Hodnotenie je binárne 0/5 bodov na člena a predvádza sa funkčnosť. Staršie tvrdenie v `docs/index.html`, že stačí ľubovoľných šesť UC, je nepresné.

[Všeobecný harmonogram](https://github.com/kurice/vpwa27/blob/main/zakladne-informacie/readme.md) používa širšiu formuláciu o všetkých funkciách. Ako konkrétne minimum berieme UC1–UC6 z projektového zadania. UC7–UC11 tiež dokončíme vo finálnej fáze; ak cvičiaci oznámi prísnejšiu podmienku, upravíme priority.

Náš implementačný cieľ je prepojiť tieto UC s **AdonisJS, PostgreSQL a komunikáciou medzi nezávislými klientmi**. To je plán tímu pre prechod z prototypu na funkčnú aplikáciu; zadanie kontrolného bodu nepredpisuje konkrétny transport správ.

| UC  | Čo predvedieme 12. 11.                                                                                               | Hlavný vlastník |
| --- | -------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1   | Registrácia, login, logout; unikátny nick a email; účet uložený v DB.                                                | Stanislav       |
| 2   | Vlastné kanály, pozvánky navrchu, vytvorenie/odchod/zrušenie, public/private, zánik po viac ako 30 dňoch bez správy. | Stanislav       |
| 3   | Fixný editor odošle správu cez server; druhý prihlásený člen ju dostane; nečlen nemôže posielať.                     | Maksym          |
| 4   | `/join`, `/invite`, `/revoke`, `/kick`, `/quit`; oprávnenia, tri rôzne hlasy a obnovenie prístupu správcom.          | Stanislav       |
| 5   | `/cancel` zruší členstvo; pri správcovi zanikne celý kanál.                                                          | Stanislav       |
| 6   | `@nick` adresuje správu, príjemca ju vidí zvýraznenú aj po opätovnom načítaní.                                       | Maksym          |

Históriu potrebujeme načítať už pre UC3/UC6. Dokončenie efektívneho infinite scrollu UC7, notifikácií UC8, stavov UC9, `/list` UC10 a živých draftov UC11 plánujeme po kontrolnom bode. Základné realtime doručenie správ robíme už teraz.

## Na čo nadväzujeme z GitHubu

Overené cez lokálnu históriu vetvy `main`, zmenené súbory a `git ls-remote origin refs/heads/main`. K 7. 11. ukazuje aj vzdialený `main` na `cfeeafcbe5e39aba576626658c387ae7d1cfd3f0`. Aliasy `xbalabanov` / Maksym Balabanov patria Maksymovi; `StanislavPolak` / `xpolaks` majú rovnaký autorský email a patria Stanislavovi.

Vlastníctvo posudzujeme podľa implementačných commitov a ich obsahu. Samotné zlúčenie PR alebo počet riadkov nevyjadruje, kto napísal funkciu ani koľko práce zostáva.

| Kto       | Doterajšia práca                                                               | Doklady                                                                                                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stanislav | Login, registrácia, router guard, používatelia.                                | [`f6966d6`](https://github.com/xbalabanov/VPWA_Projekt/commit/f6966d6), [`f71e744`](https://github.com/xbalabanov/VPWA_Projekt/commit/f71e744)                                                                                                                         |
| Stanislav | Kanály, pozvánky, členstvo, príkazy, hlasovanie a bany, zoznam členov.         | [PR #1](https://github.com/xbalabanov/VPWA_Projekt/pull/1), [PR #5](https://github.com/xbalabanov/VPWA_Projekt/pull/5), [`89328be`](https://github.com/xbalabanov/VPWA_Projekt/commit/89328be), [`173aff8`](https://github.com/xbalabanov/VPWA_Projekt/commit/173aff8) |
| Maksym    | Správy, stránkovanie, infinite scroll, editor a dopĺňanie, parser, zmienky.    | [PR #2](https://github.com/xbalabanov/VPWA_Projekt/pull/2), [PR #3](https://github.com/xbalabanov/VPWA_Projekt/pull/3), [PR #4](https://github.com/xbalabanov/VPWA_Projekt/pull/4), [`0252d8f`](https://github.com/xbalabanov/VPWA_Projekt/commit/0252d8f)             |
| Maksym    | Stavy, notifikácie, typing a náhľad textu, spoločný vzhľad a základ aplikácie. | [PR #6](https://github.com/xbalabanov/VPWA_Projekt/pull/6), [PR #7](https://github.com/xbalabanov/VPWA_Projekt/pull/7), [`7931772`](https://github.com/xbalabanov/VPWA_Projekt/commit/7931772), [`5388bd8`](https://github.com/xbalabanov/VPWA_Projekt/commit/5388bd8) |

**Rozdelenie zachováme po funkčných oblastiach.** Každý spraví backend, napojenie existujúceho frontendu a testy svojich funkcií. Stanislav má viac doménových pravidiel; Maksym preto preberá aj základ backendu, realtime infraštruktúru, PWA a zostavenie vydania. Po kontrolnom bode porovnáme zostávajúcu náročnosť a podľa potreby presunieme samostatnú úlohu.

## Spoločný technický základ

Toto sú pracovné rozhodnutia pre implementáciu, nie opis už existujúceho backendu:

- Zachováme `frontend/`, Vue Options API, Pinia a existujúci vzhľad. Pridáme samostatný `backend/` v AdonisJS a PostgreSQL.
- Nadviažeme na [materiál predmetu Slek, časť 1](https://github.com/kurice/vpwa27/blob/main/prednasky/slek/part1/readme.md): Node 24+, AdonisJS 7, Lucid a `@rlanz/socket@0.2.4`. Presnú kompatibilitu overíme pri inicializácii a verzie uzamkneme v lockfile. PostgreSQL zachováva doterajší plán projektu; materiál používa SQLite.
- Autentifikácia cez serverovú session a HttpOnly cookie, podľa [časti 2](https://github.com/kurice/vpwa27/blob/main/prednasky/slek/part2/readme.md). Žiadne heslá ani session tokeny v Pinia dátach posielaných klientovi. Obnova prihlásenia cez profil pred vyhodnotením router guardu.
- HTTP API bude riešiť autentifikáciu, kanály, príkazy, ukladanie správ a stránkovanú históriu. WebSocket bude prenášať zmeny zo servera a dočasné drafty. Jedno miesto na zápis správy zabráni dvom odlišným implementáciám. Materiál predmetu ukazuje aj socketové RPC; náš transport je vlastné návrhové rozhodnutie.
- Socket používa rovnakú session ako HTTP. Prihlásenie nestačí: server kontroluje členstvo pri odbere aj pri práci s kanálom. Po vyhodení/odchode sa doručovanie do všetkých klientov daného používateľa zastaví; iba odhlásenie odberu na klientovi nestačí.
- Schéma vzniká migráciami; testovacie dáta seedermi. Konfigurácia bude v `.env.example`, skutočné tajomstvá mimo Gitu. Vývoj povoľuje iba potrebné origins; autentifikované zápisy musia mať zvolenú CSRF ochranu a cookie nastavenia.
- Oprávnenia a obchodné pravidlá budú v službách backendu, ktoré využijú HTTP aj socket handlery. `ChannelAccessService` vlastní Stanislav, Maksym ho používa pri správach, histórii a odberoch. Po doručení správy klient deduplikuje podľa serverového ID.
- Dôvody pre PostgreSQL driver, socketový balíček a každú ďalšiu pridanú knižnicu zapíšeme do návrhových rozhodnutí. Použité materiály citujeme pri prevzatom kóde.

### Rozhrania, ktoré uzavrieme ako prvé

Prefix API bude `/api/v1`. Nasledujúce cesty a udalosti sú navrhovaný kontrakt pre oba diely; najprv ich zosúladíme v jednom malom PR.

| Rozhranie                                                                                                             | Zodpovednosť                                                                     | Vlastník                                    |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------- |
| `POST /auth/signup`, `POST /auth/login`, `POST /account/logout`, `GET /account/profile`                               | Registrácia, session a obnova identity.                                          | Stanislav                                   |
| `GET/POST /channels`, `POST /channels/join`, `DELETE /channels/:id`, `DELETE /channels/:id/membership`                | Zoznam, vytvorenie/join, zrušenie a odchod.                                      | Stanislav                                   |
| `GET /invitations`, `POST /invitations/:id/accept`, `DELETE /invitations/:id`                                         | Pozvánky iba aktuálnemu adresátovi.                                              | Stanislav                                   |
| `POST /channels/:id/invitations`, `POST /channels/:id/revoke`, `POST /channels/:id/kick`, `GET /channels/:id/members` | Členstvo, moderovanie, `/list`.                                                  | Stanislav                                   |
| `GET /users/search?nick=…`                                                                                            | Verejné údaje potrebné na pozvanie/dopĺňanie; bez hesiel a súkromných nastavení. | Stanislav                                   |
| `GET /channels/:id/messages?beforeId=…&limit=20`, `POST /channels/:id/messages`                                       | História, uloženie správy a adresáti. Autor sa odvodí zo session.                | Maksym                                      |
| `PATCH /account/preferences`, `PATCH /account/status`                                                                 | Nastavenia notifikácií a stav, uložené na serveri.                               | Maksym                                      |
| Socket `users/:id`                                                                                                    | Vlastné pozvánky a zmeny dostupných kanálov; odber len vlastnej identity.        | Maksym: infra; Stanislav: doménové udalosti |
| Socket `channels/:id`                                                                                                 | Udalosti správ a členstva len oprávneným členom.                                 | Maksym: infra/správy; Stanislav: členstvo   |

Udalosti: `message.created`, `invitation.created`, `invitation.removed`, `channel.updated`, `channel.deleted`, `membership.changed`, `user.status.changed`, `typing.updated`, `typing.stopped`. Pozvánka obsahuje minimum údajov na zobrazenie, neotvára prístup k histórii. Osobný odber doručí aj informáciu o strate členstva; obsah kanála už nedoručuje.

DTO budú mať `camelCase`, číselné ID a ISO dátumy ako súčasný frontend. Správa vracia aj `mentionedUserIds`; klient nemusí znovu vytvárať databázové záznamy zmienok. Údaje verejného autora odlíšime od profilu prihláseného používateľa. Odpovede majú `{ data: … }`, chyby dohodnutý tvar s kódom, textom a prípadnými chybami polí. História vracia aj `nextBeforeId` a `hasMore`; maximálny limit vynúti server.

### Vlastníctvo schémy a spoločných súborov

| Časť                                                                                                             | Kto pripraví                                     |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Adonis scaffold, DB pripojenie, lokálne spustenie, socket konfigurácia, testovací základ                         | Maksym                                           |
| `users` vrátane polí status/notify, sessions, `channels`, `channel_members`, `invitations`, `kick_votes`, `bans` | Stanislav                                        |
| `messages`, `mentions`, indexy a cudzie kľúče týchto tabuliek                                                    | Maksym, po migráciách users/channels             |
| Celkový fyzický model, porovnanie s odovzdaným UML                                                               | Stanislav, review Maksym                         |
| DTO, API kontrakt, názvy udalostí                                                                                | Maksym pripraví, Stanislav review pred napojením |

Email, nick a názov kanála majú dohodnutú normalizáciu a DB unikátnosť. Dvojica `(channel_id, user_id)` je unikátna pre členstvo, pozvánku a ban; hlasovanie má unikátnu trojicu kanál/cieľ/hlasujúci; zmienka dvojicu správa/adresát. Opustenie alebo vyhodenie vyčistí neplatné hlasy. Cudzie kľúče a mazanie kanála musia odstrániť aj jeho správy a zmienky. Zápis správy aktualizuje `lastActivityAt` v rovnakej transakcii.

`frontend/src/stores/users.ts` bude spoločný bod: auth a lookupy vlastní Stanislav; status/preferences doplní Maksym v samostatnom PR po auth. Rovnako koordinujeme `types/models.ts`, `quasar.config.ts`, router a backendové routes. Do cudzej oblasti posielame malý PR s vysvetlením.

## Úlohy na kontrolný bod

Každý riadok znamená implementáciu, napojenie klienta, overenie a review druhým členom. Úloha je hotová až po spojení do funkčnej aplikácie.

| ID  | Kto                       | Výsledok a podmienka dokončenia                                                                                                                                                                               | Závisí od  |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| K0  | Maksym + review Stanislav | Kostra `backend/`, PostgreSQL (lokálne alebo cez Compose), `.env.example`, health check, verzie a kontrakt. Obaja spustia projekt podľa návodu.                                                               | —          |
| A1  | Stanislav                 | Migrácie používateľov, sessions a kanálových entít, modely a `ChannelAccessService`. Unikátnosť a väzby v DB.                                                                                                 | K0         |
| A2  | Stanislav                 | UC1 od formulára po DB: registrácia, session login/logout, profil po F5, async guard, validačné chyby a zmazanie lokálnych dát pri logout/401.                                                                | A1         |
| A3  | Stanislav                 | UC2: skutočné vlastné kanály a pozvánky, create/leave/delete, public/private, autorizácia prijatia/odmietnutia pozvánky.                                                                                      | A1, A2     |
| A4  | Stanislav                 | UC4/5: serverové `/join /invite /revoke /kick /quit /cancel`, async command handlers, transakčné tri rôzne hlasy, ban a admin unban. Žiadne obchádzanie cez priamy API request.                               | A3         |
| A5  | Stanislav                 | Expirácia v UC2: spoločná služba zneplatní kanál po viac ako 30 dňoch bez správy pri relevantnom prístupe. Kanál zmizne aj z klientov, názov je znovu voľný a história sa neprenesie. Aktívny kanál nevymaže. | A3, B1     |
| B1  | Maksym                    | Migrácie messages/mentions, API uloženia a načítania, kontrola členstva/banu/exspirácie cez spoločnú službu, serverové zmienky a aktualizácia aktivity.                                                       | A1         |
| B2  | Maksym                    | Overený socket, osobný aj kanálový odber; doručenie uloženej správy druhému klientovi, deduplikácia, odpojenie pri logout/401 a obnova po prerušení.                                                          | A2, B1     |
| B3  | Maksym                    | UC3/6: `CommandLine`, `messages` store a správy používajú backend; chyby sa zobrazia; zmienka sa zvýrazní adresátovi aj po F5. Mock server sa z produkčnej cesty odstráni.                                    | B1, B2     |
| K1  | Obaja, každý svoje dáta   | Seed pre šesť účtov a public/private/expiračné kanály; spoločný prechod scenára nižšie a oprava zistených chýb.                                                                                               | A4, A5, B3 |

**Kritická cesta:** K0 → A1 → A2 → A3/A4 a súbežne A1 → B1 → B2/B3 → spoločné overenie. Na začiatku prioritne spojíme scaffold a minimálnu schému, aby Maksym nečakal na hotovú správu kanálov. Expiračná služba potrebuje čas aktivity správy, ale jej základ môže Stanislav písať súbežne s B1.

### Rozpis do štvrtka

| Kedy       | Stanislav                                        | Maksym                                           | Spoločný výsledok                                             |
| ---------- | ------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------- |
| So 7. 11.  | A1: jadro schémy a prístupová služba.            | K0: backend, DB, kontrakt a prostredie.          | Spojený základ; obaja vedia spustiť backend.                  |
| Ne 8. 11.  | A2 a začiatok A3.                                | B1 a základ B2; socket po dostupnej session.     | Skutočný účet a prvá správa v DB.                             |
| Po 9. 11.  | A3 a A4.                                         | B2 a B3.                                         | Dvaja používatelia, kanály, pozvánky a správy cez server.     |
| Ut 10. 11. | Dokončiť A4/A5, testy oprávnení a hlasovania.    | Dokončiť B3, testy správ, zmienok a obnovy.      | UC1–UC6 sú do večera spojené na main.                         |
| St 11. 11. | Opravy vlastnej oblasti, review.                 | Opravy vlastnej oblasti, review.                 | Skúška od čistého spustenia, seed a demo; bez nových funkcií. |
| Št 12. 11. | Predvedenie svojej časti a vysvetlenie riešenia. | Predvedenie svojej časti a vysvetlenie riešenia. | Kontrolný bod.                                                |

Je to krátky termín. Ak sa omešká základ, prvé odkladáme prácu na UC7–UC11, vizuálne úpravy a doplnky. Povinné správanie UC1–UC6 zostáva v kontrolnom scenári; nedokončené body neoznačíme za hotové.

### Scenár kontroly UC1–UC6

Seed: Ed = správca verejného kanála; Jana, Peter a Mária = traja hlasujúci členovia; Tomáš = cieľ hlasovania; Lucia = nečlen. Zároveň pripraviť súkromný kanál, platnú pozvánku, kanál starší ako 30 dní a čerstvý kanál. Expiračné dáta sú samostatné, aby cleanup nezmazal hlavné demo.

Na dve súčasné identity použijeme rôzne profily/prehliadače alebo bežné a anonymné okno. Dve bežné karty rovnakého profilu zdieľajú session cookie. Tri hlasy možno predviesť postupným prihlásením troch účtov; hlasy zostávajú v DB.

- [ ] UC1: vytvoriť účet, odmietnuť duplicitný nick/email, overiť login, F5 a logout. Po logout je stará session aj socket nepoužiteľný.
- [ ] UC2: vytvoriť verejný aj súkromný kanál cez UI; správca je tvorca. Iný účet bez pozvania nevidí súkromnú históriu.
- [ ] UC2/4: odoslať pozvánku, druhému účtu sa zvýrazní navrchu; prijať aj odmietnuť. Cudzí používateľ nemôže vybaviť cudziu pozvánku.
- [ ] UC3/6: medzi dvoma klientmi poslať správu s `@nick`; iba adresát dostane zvýraznenie. Správa aj zmienka prežijú F5 a reštart backendu.
- [ ] UC4: `/join` existujúceho public a vytvorenie nového kanála; nečlen sa nedostane do private kanála. Opakovaný názov nevytvorí duplikát.
- [ ] UC4: v private kanáli admin vykoná `/invite` a `/revoke`; bežnému členovi sa neoprávnená operácia odmietne aj cez API.
- [ ] UC4: tri rôzne neadmin účty hlasujú za vyhodenie Tomáša. Opakovaný hlas sa nezapočíta; tretí znamená ban a kanál zmizne Tomášovi. Otestovať aj okamžitý kick správcom.
- [ ] UC4: zabanovaný účet sa nevie pridať, načítať históriu, poslať správu ani pokračovať v starom socket odbere. Admin cez `/invite` obnoví prístup; po prijatí pozvánky sa dá vstúpiť.
- [ ] UC5: člen dá `/cancel` a kanál mu zmizne. Správca dá `/cancel` alebo `/quit`; kanál zanikne pre všetkých a jeho názov možno použiť znovu, bez pôvodných správ.
- [ ] UC2: exspirovaný kanál zanikne, názov sa uvoľní. Čerstvá správa posunie aktivitu; kanál mladší než 30 dní zostane. Hraničné dátumy overiť testom bez čakania 30 dní.
- [ ] Obaja spustia projekt podľa README a vedia vysvetliť aj oblasť druhého člena.

Kontrolný bod je podľa projektovej sekcie krátke predvedenie. Všeobecná sekcia odovzdávania zároveň spomína AIS aj pri kontrolných bodoch; konkrétny spôsob pre tento termín overíme v AIS/u cvičiaceho a pripravíme spustiteľný checkout.

## Zvyšok celej druhej fázy

| ID  | Kto                      | Výsledok a podmienka dokončenia                                                                                                                                                                                | Kedy                                        |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| A6  | Stanislav                | UC10: `/list` a MembersList čítajú skutočných členov, admina a stav; nečlen zoznam nečíta.                                                                                                                     | 13.–15. 11.                                 |
| A7  | Stanislav                | Dokončenie kanálových udalostí: pozvánky a členstvo sa zosúladia vo všetkých klientoch, aj pri prerušenom spojení; odobratý člen už nedostáva obsah.                                                           | 13.–20. 11.                                 |
| A8  | Stanislav                | Pravidelné spúšťanie expiračnej služby aj bez prístupu používateľa, zdokumentované spustenie úlohy. Transakcie, DB obmedzenia a testy súbežného join/kick/pozvánky.                                            | 16.–22. 11.                                 |
| A9  | Stanislav                | Fyzický model, odchýlky od schváleného UML, popis doménových pravidiel a backendovej časti dokumentácie.                                                                                                       | Priebežne, dokončiť do 29. 11.              |
| B4  | Maksym                   | UC7: kurzorová história, index `(channel_id, id)`, konečné stránky, bez duplicít a poskakovania scrollu; zotavenie po výpadku aj pri viac než jednej stránke nových správ.                                     | 13.–15. 11.                                 |
| B5  | Maksym                   | UC8: cudzie nové správy oznamovať iba pri neviditeľnej appke; odosielateľ/úryvok, všetky vs. iba adresované, bez notifikácie v DND/offline a bez spätných notifikácií za načítanú históriu.                    | 16.–18. 11.                                 |
| B6  | Maksym                   | UC9: uložené online/DND/offline, stav ostatným, zastavenie doručovania správ offline, automatická synchronizácia kanálov a zmeškaných správ po návrate. Zohľadniť viac otvorených klientov.                    | 16.–22. 11.                                 |
| B7  | Maksym                   | UC11: cudzie živé drafty s klikateľným náhľadom, prenos každej zmeny, serverové overenie členstva, vyčistenie pri odoslaní/odchode/strate spojenia a timeout pre zaniknutého klienta. Drafty ostávajú dočasné. | 19.–22. 11.                                 |
| B8  | Maksym                   | PWA manifest, vlastné ikony, service worker, inštalácia, fallback pri strate siete, aktualizácia aplikácie; necachovať súkromné API odpovede bez určenej stratégie.                                            | 23.–26. 11.                                 |
| B9  | Maksym                   | Build frontend/backend/PWA, návod spustenia, architektonický diagram, návrhové rozhodnutia infraštruktúry, aspoň 5 kľúčových screenshotov, skript/príprava archívu a `repo.txt`.                               | Do 29. 11.                                  |
| F1  | Obaja                    | Kompletný priechod UC1–UC11, desktop/mobil, obe témy, samostatné identity, neplatné oprávnenia, výpadky, reštart a čerstvá DB vytvorená migráciami.                                                            | 23.–29. 11.                                 |
| F2  | Obaja                    | Opravy, review dokumentácie aj cudzieho kódu, skúška obhajoby a overenie finálneho ZIPu na čistom prostredí.                                                                                                   | 30. 11.–5. 12.                              |
| F3  | Stanislav, záloha Maksym | Odovzdanie finálneho archívu a dokumentácie do AIS, potvrdenie úspešného odovzdania obom. Je to navrhnuté organizačné rozdelenie.                                                                              | Interný cieľ 5. 12.; oficiálne 6. 12. 23:59 |

### Pravidlá, ktoré zachováme alebo spresníme

- `/join name private` pri existujúcom kanáli nemení jeho typ. Vstup do existujúceho private rieši prijatie pozvánky. Toto nadväzuje na prototyp.
- `/revoke` je pre private kanál; `/kick` vo verejnom funguje hlasovaním alebo zásahom správcu. Doterajší prototyp umožňuje admin kick aj v private; túto doplnkovú možnosť zdokumentujeme ako rozhodnutie tímu, nie ako výslovnú požiadavku zadania.
- Ban zostáva až do admin pozvánky. Odstránime aj staré pozvánky, ktoré by ban obišli. Pri obnovení cez admin pozvánku nevznikne členstvo automaticky.
- Po odchode/odobratí člena vyčistíme jeho neplatné hlasy. Počet platných rôznych hlasov a samotné vytvorenie banu sa vyhodnotia transakčne.
- Pri vytvorení kanála začne čas aktivity jeho vytvorením. Po viac ako 30 dňoch bez novej správy ho prístup už neoživí. Cleanup a odoslanie správy používajú rovnakú kontrolu, aby expirovaný kanál nesúťažil s novou správou.
- Offline znamená potlačené doručovanie nových správ, nie vymazanie histórie. Po návrate server doplní všetky chýbajúce stránky. Zmenu nastaveného stavu oddelíme od dočasného výpadku socketu.
- Pri notifikáciách odoberáme dostupné kanály aj mimo aktuálne otvoreného kanála. Zmena členstva musí upraviť odbery; po reconnecte sa členstvo znovu overí.

## Ako budeme spolupracovať

1. Jeden menší funkčný celok = jedna vetva a PR. Napríklad `codex/phase2-auth` alebo tímová vetva pomenovaná podľa dohody. Skutočný autor implementácie má vlastné commity; druhý člen robí review.
2. Do PR patrí stručný výsledok, spôsob overenia a prípadná zmena kontraktu/migrácie. Spoločný základ spojíme skoro, nečakáme na dve veľké hotové vetvy.
3. Každý píše testy vlastných pravidiel. Stanislav hlavne autorizáciu, pozvánky, tri hlasy, ban, mazanie a expiráciu; Maksym ukladanie/doručovanie správ, zmienky, stránkovanie, stavy, notifikácie a drafty.
4. Pred zlúčením prejdú existujúce `npm run lint:check`, `npm run typecheck` a `npm run build` vo frontende; po zavedení backendu aj jeho typové, testovacie a build kontroly. Deštruktívne obnovovanie schémy patrí iba do samostatnej testovacej DB.
5. Na finále každý vysvetlí druhému migrácie, autentifikáciu, socket odbery a pravidlá cudzej oblasti. Rovnomerné vlastníctvo neznamená, že druhú polovicu nemusíme poznať.

## Podmienky finálneho dokončenia

- [ ] UC1–UC11 fungujú medzi nezávislými klientmi so skutočným backendom a DB; produkčná cesta nepoužíva mock server.
- [ ] Schéma sa dá vytvoriť migráciami od nuly. Priložené seedery a návod umožňujú reprodukovať demo.
- [ ] PWA sa dá zostaviť a nainštalovať; po návrate spojenia sa dáta korektne zosúladia.
- [ ] Dokumentácia obsahuje zadanie, fyzický model so zdôvodnením zmien, diagram architektúry, návrhové rozhodnutia a aspoň päť kľúčových screenshotov.
- [ ] Repozitár je verejný, má priebežnú významnú aktivitu a vzájomné review oboch členov.
- [ ] ZIP/RAR obsahuje zdrojové kódy, dokumentáciu, návod, potrebné konfiguračné príklady a `repo.txt`; nezahŕňa `node_modules` ani tajné hodnoty.
- [ ] Archív bol overený mimo pracovného checkoutu a jeden člen potvrdil úspešné odovzdanie do AIS.

Požiadavky na finálne odovzdanie a dokumentáciu vychádzajú z [oficiálneho zadania](https://github.com/kurice/vpwa27/blob/main/semestralny-projekt/readme.md). Rozdelenie vlastníctva, interné termíny, HTTP/socket kontrakt a implementačný postup sú návrh tímového plánu v tomto dokumente.
