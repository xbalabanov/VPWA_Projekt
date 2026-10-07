VPWA Chat – definitívne rozdelenie práce

Tím: Maksym Balabanov, Stanislav Polak
Projekt: VPWA Chat – aplikácia na textovú komunikáciu v štýle IRC/Slack

1. Princíp rozdelenia

Práca je rozdelená podľa hlavných oblastí aplikácie:

* Maksym – používatelia, autentifikácia, kanály a ich správa
* Stanislav – správy, prítomnosť, notifikácie a realtime funkcionalita

Obaja členovia:

* pracujú na vlastnej vetve,
* robia malé samostatné commity,
* navzájom si robia code review,
* musia vedieť vysvetliť celý projekt vrátane časti, ktorú implementoval druhý člen,
* spoločne riešia architektúru, dátový model, integráciu a finálne odovzdanie.

⸻

2. FÁZA 1 – klikateľný frontendový prototyp

Cieľom je vytvoriť responzívnu Quasar SPA pre všetkých 11 UC na mock dátach a dokončiť UML class diagram.

Spoločné úlohy

Tieto veci nerobí výhradne jeden člen:

* kontrola zadania a všetkých 11 UC
* návrh a kontrola UML logického dátového modelu
* export UML diagramu do JPG/JPEG
* kontrola spoločných TypeScript modelov
* integrácia A a B častí
* kontrola responzivity na mobile, tablete a desktope
* kontrola npm run typecheck
* oprava npm run lint
* vzájomné code review
* kontrola, že UC1–UC6 fungujú pre kontrolný bod v 9. týždni
* finálna kontrola všetkých UC1–UC11
* príprava ZIP/RAR
* vytvorenie repo.txt
* dohoda, kto odovzdá projekt v AIS

⸻

3. Maksym – používatelia, autentifikácia a kanály

A1 – Registrácia, prihlásenie a odhlásenie

Implementovať:

* registračný formulár:
    * meno
    * priezvisko
    * nickName
    * email
* prihlasovanie
* odhlásenie
* základný auth stav v Pinia
* route guard pre chránené stránky
* správanie po prihlásení/odhlásení

UC: 1

⸻

A2 – Zoznam kanálov

Implementovať:

* ChannelList
* zoznam kanálov používateľa
* aktívny kanál
* zvýraznenie pozvaného kanála
* topovanie pozvaného kanála
* private/public ikonu
* tlačidlá:
    * vytvoriť
    * opustiť
    * zrušiť
* zrušenie kanála iba správcom

UC: 2

⸻

A3 – Vytvorenie kanála

Implementovať:

* dialóg vytvorenia kanála
* public/private kanál
* kontrolu unikátneho channelName
* nastavenie tvorcu ako správcu
* pridanie tvorcu medzi členov

UC: 2, 4

⸻

A4 – Správa členov a kanálov cez príkazy

Implementovať command handlers pre:

* /join
* /invite
* /revoke
* /kick
* /quit

Vrátane doménových pravidiel:

* správca private kanála
* člen public kanála
* 3 hlasy pre permanentný ban
* správca môže používateľa vyhodiť okamžite
* správca môže cez /invite obnoviť prístup
* odstránenie používateľa zo zoznamu kanálov

UC: 4

⸻

A5 – /cancel

Implementovať:

* zrušenie vlastného členstva
* odstránenie kanála zo zoznamu používateľa
* ak /cancel použije správca, kanál zanikne

UC: 5

⸻

A6 – Zoznam členov

Implementovať:

* MembersList
* /list
* zobrazenie členov aktuálneho kanála
* zobrazenie ich stavov
* /list iba pre člena kanála

UC: 10

⸻

A7 – Používateľský store a spoločné modely

Zodpovednosť za:

* stores/users.ts
* auth-related stav
* používateľské lookupy
* základné používateľské dáta
* spoločné pravidlá týkajúce sa používateľov

⸻

A8 – Channel store

Zodpovednosť za:

* stores/channels.ts
* členstvo
* pozvánky
* ban/revoke stav
* správcu
* channel actions

Druhý člen nemení channel store priamo, ale používa jeho actions.

⸻

4. Stanislav – správy, prítomnosť a realtime

B1 – CommandLine

Implementovať:

* fixný CommandLine v MainLayout
* odoslanie obyčajnej správy
* odoslanie príkazu
* napojenie na existujúci parser
* zobrazenie parser error
* správne správanie podľa aktívneho kanála

UC: 3

⸻

B2 – História správ

Implementovať:

* MessageList
* MessageItem
* zobrazovanie správ
* stránkové načítavanie mock dát
* infinite scroll
* správne radenie správ

Architektúra má zostať pripravená na neskoršie API/WebSocket riešenie.

UC: 7

⸻

B3 – @nickname

Implementovať:

* rozpoznanie @nickname
* isMentioned
* zvýraznenie správy adresátovi
* zachovanie informácie o adresátovi pre neskoršie notifikácie

UC: 6

⸻

B4 – Typing indicator

Implementovať:

* "X is typing"
* zobrazenie nickName
* kliknutie na nickName
* dialóg s rozpísaným textom
* aktualizáciu rozpísaného textu v reálnom čase

Nestačí iba boolean isTyping; prototyp má reprezentovať aj samotný draft.

UC: 11

⸻

B5 – Stav používateľa

Implementovať:

* online
* DND
* offline
* menu na zmenu stavu
* zobrazovanie stavu ostatným používateľom

Pravidlá:

* DND → bez notifikácií
* offline → používateľovi neprichádzajú správy
* po návrate online → kanály sa aktualizujú z histórie

UC: 9

⸻

B6 – Notifikácie

Implementovať:

* Quasar App Visibility
* notifikáciu iba keď aplikácia nie je visible
* odosielateľ
* časť správy
* nastavenie „iba adresované“
* rešpektovanie DND

UC: 8

⸻

B7 – Message store

Zodpovednosť za:

* stores/messages.ts
* správy podľa kanálov
* mock generovanie správ
* načítanie stránok
* mentions
* typing stav
* message actions

⸻

B8 – Realtime mock

Vytvoriť spoločný mechanizmus pre fake realtime, napr.:

src/mock/simulator.ts

Simulator bude neskôr možné nahradiť WebSocket vrstvou bez nutnosti meniť komponenty.

B bude primárne zodpovedný za jeho implementáciu, A pomôže s integráciou udalostí týkajúcich sa kanálov a členov.

⸻

5. Spoločná command architektúra

Použije sa existujúci parser:

CommandLine
      ↓
commandParser.ts
      ↓
rozpoznanie správy / príkazu
      ↓
commandHandlers.ts
      ↓
Pinia store actions

Stanislav

Zodpovedá za:

* CommandLine
* volanie parsera
* zobrazenie chýb
* odoslanie výsledku ďalej

Maksym

Zodpovedá za:

* command handlers pre správu kanálov a členov
* /join
* /invite
* /revoke
* /kick
* /quit
* /cancel
* /list

Takto sa parser a UI neprepisujú dvakrát a každý má jasnú časť.

⸻

6. FÁZA 1 – poradie implementácie

Kvôli kontrolnému bodu musíme prioritne dokončiť UC1–UC6.

Etapa 1 – základ

Spoločne:

* skontrolovať aktuálny working tree
* npm run lint
* npm run typecheck
* opraviť existujúce formatting chyby
* commitnúť aktuálny prototyp ako samostatný commit

⸻

Etapa 2 – UC1 až UC3

Maksym

* A1
* A2
* A3

Stanislav

* B1
* základ MessageList
* základ správy

Cieľ: používateľ sa vie prihlásiť, vidí kanály a vie cez CommandLine komunikovať.

⸻

Etapa 3 – UC4 až UC6

Maksym

* A4
* A5

Stanislav

* B3
* integrácia mentions

Spoločne:

* testovanie UC1–UC6
* opravy integračných problémov

Toto je najvyššia priorita pred kontrolným bodom v 9. týždni.

⸻

Etapa 4 – UC7 až UC11

Maksym

* A6
* dokončenie členstva a stavov
* integrácia channel actions

Stanislav

* B2
* B4
* B5
* B6
* B8

⸻

Etapa 5 – finálna Phase 1 integrácia

Spoločne:

* všetkých 11 UC
* responzívnosť
* oprava UI
* UML JPG/JPEG
* code review
* kontrola commitov
* kontrola verejného GitHubu
* repo.txt
* ZIP/RAR bez node_modules
* odovzdanie v AIS

⸻

7. FÁZA 2 – backend

Po akceptovaní Phase 1 pokračujeme backendom.

Maksym – backend: používateľská a kanálová doména

Primárna zodpovednosť:

* AdonisJS auth
* users
* authentication
* channels
* channel membership
* invitations
* bans
* kick votes
* channel permissions
* /join
* /invite
* /revoke
* /kick
* /cancel
* /quit
* /list
* 30-dňové vypršanie kanálov

Migrations pre entity, ktoré patria do tejto oblasti, pripravuje Maksym.

⸻

Stanislav – backend: správy a realtime

Primárna zodpovednosť:

* messages
* message history
* pagination
* mentions
* presence
* online/DND/offline
* notifications
* typing indicator
* WebSocket komunikácia
* realtime udalosti

Migrations pre entity, ktoré patria do tejto oblasti, pripravuje Stanislav.

⸻

8. Spoločná Phase 2 práca

Obaja spolu:

* API kontrakty
* integrácia frontend ↔ backend
* autentifikácia frontend ↔ backend
* WebSocket integrácia
* databázové testovanie
* error handling
* PWA konfigurácia
* responzívnosť
* finálne testovanie všetkých UC
* fyzický databázový model
* architektonické diagramy
* screenshoty
* návrhové rozhodnutia
* dokumentácia
* finálne code review

⸻

9. Dátový model

Spoločne navrhnúť

Model bude minimálne pokrývať:

* User
* Channel
* Channel Membership
* Kick Vote
* Message
* Message Recipient / mention
* stav používateľa
* nastavenie notifikácií

Phase 1

* UML class diagram
* export JPG/JPEG

Phase 2

Databáza sa vytvorí výhradne cez AdonisJS migrácie.

Každá zmena oproti Phase 1 diagramu musí byť zaznamenaná a odôvodnená v dokumentácii.

⸻

10. Git workflow

Používame:

main
├── feature/maksym-channels
└── feature/stanislav-messages

Pravidlá:

1. main je chránená.
2. Každý pracuje primárne na svojej vetve.
3. Väčšie zmeny idú cez Pull Request.
4. Druhý člen vykoná code review.
5. Preferujeme malé samostatné commity.
6. Každý člen musí mať priebežnú aktivitu.
7. Nesmie vzniknúť situácia, kde jeden člen urobí väčšinu projektu.
8. Zmeny v spoločných súboroch sa oznámia druhému členovi.

⸻

11. Pravidlá pre kód

V celom projekte:

* Vue Options API
* žiadne <script setup>
* žiadne ref, reactive, setup()
* Pinia pre stav
* jednoduché a vysvetliteľné riešenia
* žiadne zbytočné knižnice
* každá nová knižnica musí byť odôvodnená
* zdroje použité pri implementácii musia byť uvedené v komentároch
* žiadny kód z projektov iných študentov
* každý člen musí vedieť vysvetliť každý podstatný kus kódu

⸻

12. Kontrolné body

Pred 9. týždňom

Musí fungovať:

* UC1 – registrácia/prihlásenie/odhlásenie
* UC2 – zoznam a správa kanálov
* UC3 – command line
* UC4 – správa kanála cez príkazy
* UC5 – /cancel
* UC6 – @nickname

Pred Phase 1

Musí fungovať:

* UC1–UC11
* responzívny Quasar SPA prototyp
* mock dáta
* UML JPG/JPEG
* verejný GitHub
* repo.txt
* ZIP/RAR bez node_modules

Pred Phase 2

Musí byť hotové:

* AdonisJS backend
* migrácie
* databáza
* API
* WebSockets
* PWA
* dokumentácia
* všetkých 11 UC v kompletnej aplikácii

⸻

13. Finálne rozdelenie zodpovednosti

Oblasť	Maksym	Stanislav
Auth / registrácia / login	Owner	Review
Users	Owner	Review
Channels	Owner	Review
Channel membership	Owner	Review
Invites / bans / kick votes	Owner	Review
Command handlers	Owner	Review
CommandLine	Review	Owner
Messages	Review	Owner
Message history / infinite scroll	Review	Owner
Mentions	Review	Owner
Presence	Review	Owner
Notifications	Review	Owner
Typing / realtime draft	Review	Owner
Mock realtime simulator	Review	Owner
UML	Shared	Shared
Frontend integration	Shared	Shared
Backend integration	Shared	Shared
Database architecture	Shared	Shared
WebSocket architecture	Shared	Shared
Documentation	Shared	Shared
Testing	Shared	Shared
Code review	Shared	Shared
Final submission	Shared	Shared

Hlavné pravidlo

Owner neznamená, že druhý člen časť nepozná. Owner znamená, že danú časť primárne implementuje, udržiava a rieši problémy. Druhý člen ju musí počas code review pochopiť a vedieť vysvetliť.