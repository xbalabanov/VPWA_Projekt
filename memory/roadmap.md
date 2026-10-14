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
