# VPWA Chat

Maksym Balabanov, Stanislav Polák · VPWA, FIIT STU

Progresívna webová aplikácia na textovú komunikáciu v štýle IRC/Slack: verejné a súkromné kanály, správy s infinite scrollom, príkazy (`/join`, `/invite`, `/kick`…), `@zmienky`, notifikácie, stav používateľa a „X píše…“.

**Technológie:** Quasar (Vue 3, Options API), Pinia · AdonisJS 7, PostgreSQL, WebSockety.

**Stav:** 1. fáza je akceptovaná za plný počet bodov. Frontend zatiaľ používa mock dáta. Druhá fáza má pripravený základ backendu: PostgreSQL, počiatočné migrácie a socket s overovaním cez session. Autentifikácia a doménové funkcie ešte nie sú napojené.

**Ďalší cieľ:** kontrolný bod 12. 11. 2026 — funkčné UC 1–6. [Plán druhej fázy, rozdelenie práce a scenár kontroly](docs/faza-2.md).

## Spustenie

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Testovací účet prototypu: `ed@example.com` / `123456`. Tento účet sa zatiaľ nevytvára v PostgreSQL.

Backend sa spúšťa samostatne podľa [návodu v backend/README.md](backend/README.md). Frontend a backend ešte nie sú prepojené.

---

_Pri tvorbe projektu sme používali nástroj Claude (Anthropic) ako pomoc pri návrhu, vysvetľovaní konceptov, kontrole kódu a ako pomocný nástroj pri písaní kódu. Celý kód sme ručne skontrolovali a otestovali, rozumieme mu a vieme ho vysvetliť._
