# Backend VPWA Chat

AdonisJS 7, Lucid, PostgreSQL a `@rlanz/socket@0.2.4`. Vue frontend je v susednom priečinku `frontend/`.

## Aktuálny stav

Je pripravený základ servera, PostgreSQL pripojenie, migrácie zo starter kitu a konfigurácia socketu so session overovaním. `GET /` vracia `{"hello":"world"}`; overuje iba dostupnosť servera. Neprihlásené otvorenie `/socket` vracia HTTP 401.

Registrácia/login/logout zatiaľ obsahujú tokenové controllery zo starter kitu, hoci predvolený guard už je `web`. Stanislav doplní session controllery a používateľské/kanálové modely. Kanálové sockety, správy a napojenie frontendu ešte nie sú implementované. Účet `ed@example.com` z prototypu v databáze automaticky nevzniká.

## Prvé spustenie

Potrebujeme Node.js 24 alebo novší, npm 11 alebo novší a bežiaci PostgreSQL. Vývoj je aktuálne overený na Node 26.12.0, npm 12.2.2 a PostgreSQL 18.6. Docker nie je potrebný.

Z koreňa repozitára nainštaluj závislosti:

```bash
cd backend
npm ci
```

Vytvor vlastný `.env` podľa `.env.example`. Na macOS/Linux:

```bash
cp .env.example .env
```

V PowerShelli použi `Copy-Item .env.example .env`. Kopírovanie je len pre prvé nastavenie; existujúci `.env` si zachovaj.

Session je uložená v databáze (`SESSION_DRIVER=database`, tabuľka `sessions`), aby po odhlásení nefungovala ani skopírovaná stará cookie. Ak máš starší `.env` s `SESSION_DRIVER=cookie`, zmeň ho na `database`.

V `.env` uprav `DB_USER` na svojho PostgreSQL používateľa a podľa potreby `DB_PASSWORD`, `DB_HOST` a `DB_PORT`. Predvolený názov databázy je `vpwa_chat`. Lokálny Postgres.app môže fungovať bez hesla; vtedy ostane `DB_PASSWORD=` prázdne.

Databázu vytvor pod týmto používateľom cez pgAdmin alebo napríklad príkazom nižšie. `your_user` nahraď svojím používateľom; ak databáza už existuje, tento krok vynechaj.

```bash
createdb -h 127.0.0.1 -p 5432 -U your_user vpwa_chat
```

Pre prvé nastavenie vygeneruj vlastný aplikačný kľúč a spusti migrácie:

```bash
node ace generate:key
node ace migration:run
npm run dev
```

`generate:key` zapíše `APP_KEY` do lokálneho `.env`. Pri bežnom spúšťaní ho netreba opakovane generovať. `.env` nepatrí do Gitu; `.env.example` obsahuje iba šablónu.

Server je na [http://localhost:3333](http://localhost:3333). Frontend spusti v druhom termináli cez `npm run dev` v `frontend/`.

Súbory v `.adonisjs/` sa generujú pri inicializácii cez Ace, napríklad pri `node ace migration:run` alebo `npm run dev`. Pred prvou typovou kontrolou na čerstvom checkoute najprv vykonaj postup spustenia vyššie.

## Overenie

```bash
npm run lint
npm run typecheck
npm run build
```

Stav migrácií overíš cez `node ace migration:status`. Pri bežiacom serveri neprihlásené socketové spojenie otestuješ takto:

```bash
curl -i --max-time 5 \
  -H 'Connection: Upgrade' \
  -H 'Upgrade: websocket' \
  -H 'Sec-WebSocket-Version: 13' \
  -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
  -H 'Origin: http://localhost:9000' \
  http://localhost:3333/socket
```

Očakávame `401 Unauthorized`. Pozitívny test prihláseného spojenia doplníme po session autentifikácii. Lokálne socket origins povoľujú frontend na porte 9000; pri zmene portu uprav `config/socket.ts`.

## Ďalšia práca a rozhodnutia

Rozdelenie úloh a navrhnutý API/socket kontrakt sú v [pláne druhej fázy](../docs/faza-2.md). Základ ešte potrebuje Stanislavovo review a overenie spustenia na jeho počítači.

PostgreSQL je zvolená relačná databáza; balíček `pg` je jej ovládač pre Lucid. `@rlanz/socket` zabezpečí realtime komunikáciu a je pripnutý na verziu použitú v [materiáli predmetu](https://github.com/kurice/vpwa27/blob/main/prednasky/slek/part1/readme.md#websockety). HTTP aj socket budú používať rovnakú session cookie podľa [časti o autentifikácii](https://github.com/kurice/vpwa27/blob/main/prednasky/slek/part2/readme.md).

Pred nasadením treba dokončiť session autentifikáciu, oprávnenia kanálov, CSRF ochranu a produkčné origins. Súčasný stav slúži na lokálny vývoj.
