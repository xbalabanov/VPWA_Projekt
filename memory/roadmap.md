Stanislav – používatelia, autentifikácia a kanály

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

Maksym – správy, prítomnosť a realtime

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

⸻

Stav prác (14. 10. 2026)

Stanislav

* UC1 – hotové (na main)
    * login, logout, route guard
    * registrácia: kontrola obsadeného nickName a emailu už počas písania (bez ohľadu na veľké/malé písmená)
* UC2 – hotové (vetva feature/stanislav-channels, pushnutá, zatiaľ nezlúčená do main)
    * channel store gettery: myInvitations, channelByName, isMember, isAdmin, isBanned
    * channel store akcie: createChannel, deleteChannel, leaveChannel (správca → kanál zaniká), acceptInvitation, declineInvitation, selectFirstChannel
    * ChannelList: pozvánky zvýraznené a navrchu, menu opustiť / zrušiť (iba správca, s potvrdením), dialóg na vytvorenie kanála
    * 30-dňový zánik kanála odložený na backend (fáza 2)

Ďalej (Stanislav)

* UC4 – akcie joinChannel, inviteUser, revokeUser, kickUser (3 hlasy = ban, správca okamžite)
* UC4, UC5 – commandHandlers.ts pre /join, /invite, /revoke, /kick, /quit, /cancel
* dohodnúť s Maksymom rozhranie CommandLine → commandHandlers (napr. executeCommand(parsed) vracia null alebo text chyby)
* UC10 – MembersList a /list
* drobnosť: tlačidlo „Log in“ je o kúsok širšie ako polia (q-gutter-md)

⸻
