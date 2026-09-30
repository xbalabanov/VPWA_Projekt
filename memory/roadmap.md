# Roadmap – VPWA Chat

_Last updated: 2026-09-30_

## Deadlines

- **Phase 1:** 18. 10. 23:59 in AIS (12 pts). Clickable, responsive Quasar SPA for all 11 UCs on mock data + UML logical data model (JPG). **Frontend only, no backend.**
- Phase 1 presentation: week 6.
- Week 9 check: UC1–6 must work (5 pts).
- **Phase 2:** 6. 12. 23:59 (30 pts). AdonisJS backend, DB migrations, WebSockets, PWA, documentation.

## Done

- [x] Setup (commit `91de190`): npm only, `.gitattributes` (LF line endings), Pinia + `src/stores/index.ts`, Quasar plugins `AppVisibility`, `Notify`, `Dialog`, `lint:check` fixed.
- [x] Data model agreed + TypeScript types in `frontend/src/types/models.ts` (commit `3f2b8d9`).
- [x] Lucidchart prompt for the UML diagram written (see the chat; the types file lists the same classes).

## Decisions

- **npm** is the package manager; run everything inside `frontend/`.
- **Pinia** holds all data; components only read the stores and call store actions (makes the Phase 2 swap to API/WebSocket easy).
- **All fake realtime in one file** (e.g. `src/mock/simulator.ts`). Its timers call the same store actions a WebSocket will call later.
- **Messages:** one table + composite index `(channel_id, id)`, keyset pagination (`id < lastSeen`), not OFFSET. In the frontend store: `messagesByChannel: Record<channelId, Message[]>`.
- Ids reference other objects (`adminId`, not `admin: User`); dates are ISO strings.

## Next steps

1. [ ] Draw the UML diagram in Lucidchart → export JPG.
2. [ ] Mock data: A = users + channels, B = messages.
3. [ ] Empty stores: `auth`, `channels` (A), `messages`, `presence` (B).
4. [ ] Layout shell: A = drawer with channel list, B = message area + fixed command line in the footer.
5. [ ] Agree on the command interface: `runCommand(text)` (A implements, B calls it for input starting with `/`).
6. [ ] Delete the boilerplate (`IndexPage`, `SecondPage`, `EssentialLink`, demo links in `MainLayout`).
7. [ ] Implement the UCs (split below).
8. [ ] Responsive check on a phone-sized viewport, then submit a ZIP with `repo.txt` to AIS.

## Split

| Person A: users & channels | Person B: messages & realtime |
|---|---|
| UC1 register / login / logout | UC3 fixed command line |
| UC2 channel list, invites on top, create / leave / delete | UC6 `@nickname` mentions |
| UC4 `/join` `/invite` `/revoke` `/kick` `/quit` | UC7 history + infinite scroll |
| UC5 `/cancel` | UC8 notifications when hidden, mentions-only |
| UC10 `/list` | UC9 status online / DND / offline |
|  | UC11 "X is typing" + live draft preview |

Rule: change another person's store only through its actions.

## Rules from the assignment (readme)

- Public GitHub repo, even activity from both, code review of each other's work.
- Cite sources in code comments.
- Every part of LLM-generated code must be explainable, or the project is not accepted.
- Every added library must be justified in the Phase 2 documentation (Pinia so far).
