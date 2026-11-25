// Store pre históriu správ, odosielanie, zmienky a rozpísané správy.
import { defineStore } from 'pinia';
import { Notify } from 'quasar';
import type { Mention, Message } from '../types/models';
import type { MessageDto, MessagesPageDto } from '../types/api';
import { useUsersStore } from './users.ts';
import messageService from '../services/MessageService.ts';

const historyRequests = new Map<number, Promise<MessagesPageDto>>();

// Odosielanie vlastného draftu (UC11, B7): najviac raz za DRAFT_SEND_INTERVAL_MS na kanál,
// aby sa nepísal request pri každom písmene. Kľúč je ID kanála.
export const DRAFT_SEND_INTERVAL_MS = 300;
const draftTimers = new Map<number, ReturnType<typeof setTimeout>>(); // beží interval
const pendingDrafts = new Map<number, string>(); // posledný text z políčka
const sentDrafts = new Map<number, string>(); // čo už server dostal

// Pošle serveru posledný text kanála, ak sa od posledného odoslania zmenil.
function flushDraft(channelId: number): void {
  const draft = pendingDrafts.get(channelId) ?? '';
  const previous = sentDrafts.get(channelId) ?? '';
  if (draft === previous) return; //nic nove (aj prazdny text ked som nic nepisal)

  sentDrafts.set(channelId, draft);
  // Draft je iba doplnok - chybu (vypadok, 403 po vyhodeni) ticho ignor
  void messageService.sendTyping(channelId, draft).catch(() => undefined);
}

// Po odhlásení nesmie čakajúci časovač poslať draft za predošlého používateľa.
function resetDraftTimers(): void {
  draftTimers.forEach((timer) => clearTimeout(timer));
  draftTimers.clear();
  pendingDrafts.clear();
  sentDrafts.clear();
}

interface MessagesState {
  messages: Message[];
  hasMore: Record<number, boolean>;
  loading: Record<number, boolean>;
  mentions: Mention[];
  drafts: Draft[];
  sessionVersion: number;
  nextBeforeId: Record<number, number | null>;
  syncedThroughId: Partial<Record<number, number>>;
  loadErrors: Record<number, string | null>;
}

// Rozpísaná správa pre indikátor „X píše…“ (UC 11).
export interface Draft {
  channelId: number;
  userId: number;
  text: string;
}

export const useMessagesStore = defineStore('messages', {
  state: (): MessagesState => ({
    messages: [],
    hasMore: {},
    loading: {},
    mentions: [],
    drafts: [],
    sessionVersion: 0,
    nextBeforeId: {},
    syncedThroughId: {},
    loadErrors: {},
  }),

  getters: {
    // Správy kanála od najstaršej po najnovšiu.
    messagesByChannel:
      (state) =>
      (channelId: number): Message[] =>
        state.messages.filter((message) => message.channelId === channelId),

    // Pred prvým načítaním sa pokúsime stiahnuť históriu.
    hasMoreFor:
      (state) =>
      (channelId: number): boolean =>
        state.hasMore[channelId] !== false,

    isMentioned:
      (state) =>
      (messageId: number, userId: number): boolean =>
        state.mentions.some(
          (mention) => mention.messageId === messageId && mention.userId === userId,
        ),

    draftsIn:
      (state) =>
      (channelId: number): Draft[] =>
        state.drafts.filter((draft) => draft.channelId === channelId),

    loadErrorFor:
      (state) =>
      (channelId: number): string | null =>
        state.loadErrors[channelId] ?? null,
  },

  actions: {
    upsertApiMessages(incoming: MessageDto[]): void {
      const messagesById = new Map<number, Message>(
        this.messages.map((message) => [message.id, message]),
      );

      for (const dto of incoming) {
        const { mentionedUserIds, ...message } = dto;
        messagesById.set(message.id, message);

        // Adresátov správy nahradíme aktuálnymi údajmi zo servera.
        this.mentions = this.mentions.filter((mention) => mention.messageId !== message.id);

        for (const userId of new Set(mentionedUserIds)) {
          this.mentions.push({ messageId: message.id, userId });
        }
      }

      this.messages = [...messagesById.values()].sort((a, b) => a.id - b.id);
    },

    clearSession(): void {
      const nextVersion = this.sessionVersion + 1;
      historyRequests.clear();
      resetDraftTimers();
      this.$reset();
      this.sessionVersion = nextVersion;
    },

    // Pri prvom volaní načíta najnovšie správy, potom staršie stránky.
    async loadOlder(channelId: number): Promise<void> {
      if (this.loading[channelId] || !this.hasMoreFor(channelId)) return;

      const version = this.sessionVersion;
      const userId = useUsersStore().currentUserId;
      const beforeId = this.nextBeforeId[channelId] ?? null;

      this.loading[channelId] = true;
      this.loadErrors[channelId] = null;

      const request = messageService.loadMessages(channelId, beforeId);
      historyRequests.set(channelId, request);

      try {
        const page = await request;

        if (version !== this.sessionVersion || userId !== useUsersStore().currentUserId) {
          return;
        }

        this.upsertApiMessages(page.messages);

        if (beforeId === null) {
          this.syncedThroughId[channelId] ??= page.messages.at(-1)?.id ?? 0;
        }

        this.hasMore[channelId] = page.hasMore;
        this.nextBeforeId[channelId] = page.nextBeforeId;
      } catch (error: unknown) {
        if (version === this.sessionVersion && userId === useUsersStore().currentUserId) {
          this.loadErrors[channelId] =
            error instanceof Error ? error.message : 'Nepodarilo sa načítať správy.';
        }
      } finally {
        if (historyRequests.get(channelId) === request) {
          historyRequests.delete(channelId);
        }

        if (version === this.sessionVersion) {
          this.loading[channelId] = false;
        }
      }
    },

    async recoverMissed(channelId: number, isCurrent: () => boolean): Promise<void> {
      const version = this.sessionVersion;
      const userId = useUsersStore().currentUserId;
      const canApply = () =>
        isCurrent() && version === this.sessionVersion && userId === useUsersStore().currentUserId;

      try {
        if (this.syncedThroughId[channelId] === undefined) {
          await (historyRequests.get(channelId) ?? this.loadOlder(channelId));
        }

        let afterId = this.syncedThroughId[channelId];
        if (afterId === undefined) return;

        while (canApply()) {
          const page = await messageService.loadNewer(channelId, afterId);
          if (!canApply()) return;

          const last = page.messages.at(-1);
          if (!last || last.id <= afterId) return;

          this.upsertApiMessages(page.messages);
          afterId = last.id;
          this.syncedThroughId[channelId] = afterId;

          if (!page.hasMore) return;
        }
      } catch {
        // Ďalšie pripojenie pokračuje od poslednej úspešne načítanej stránky.
      }
    },

    // Vráti text chyby alebo null pri úspechu.
    async sendMessage(channelId: number, content: string): Promise<string | null> {
      const authorId = useUsersStore().currentUserId;
      if (authorId === null) return 'Nie si prihlásený';

      const text = content.trim();
      if (!text) return null;

      const version = this.sessionVersion;

      try {
        const message = await messageService.sendMessage(channelId, text);

        if (version !== this.sessionVersion || authorId !== useUsersStore().currentUserId) {
          return 'Prihlásenie sa počas odosielania zmenilo.';
        }

        this.upsertApiMessages([message]);
        return null;
      } catch (error: unknown) {
        return error instanceof Error ? error.message : 'Nepodarilo sa odoslať správu.';
      }
    },

    // Môj rozpísaný text v kanáli (volá CommandLine pri každej zmene). Prázdny text = prestal
    // som písať (odoslanie, vymazanie, príkaz, prepnutie kanála) – ten sa pošle hneď.
    setDraft(channelId: number, text: string): void {
      const draft = text.trim() ? text : '';
      pendingDrafts.set(channelId, draft);

      // Prestal som pisat: posleme hned a zrusime cakajuce odoslanie stareho textu
      if (draft === '') {
        clearTimeout(draftTimers.get(channelId));
        draftTimers.delete(channelId);
        flushDraft(channelId);
        return;
      }

      // Interval bezi: iba si zapamätame posledny text, odosle sa na jeho konci
      if (draftTimers.has(channelId)) return;

      // Prva zmena hned, dalsie najskor po DRAFT_SEND_INTERVAL_MS
      flushDraft(channelId);
      const timer = setTimeout(() => {
        draftTimers.delete(channelId);
        flushDraft(channelId);
      }, DRAFT_SEND_INTERVAL_MS);
      draftTimers.set(channelId, timer);
    },

    // ---- cudzie drafty zo socketu (typing.updated / typing.stopped) ----

    // Niekto v kanáli píše: nahradí jeho predošlý draft (náhľad sa mení naživo).
    onRemoteDraft(channelId: number, userId: number, text: string): void {
      if (userId === useUsersStore().currentUserId) return;
      this.removeDraft(channelId, userId);
      this.drafts.push({ channelId, userId, text });
    },

    // Prestal písať, odoslal správu, odišiel z kanála alebo sa odpojil.
    removeDraft(channelId: number, userId: number): void {
      this.drafts = this.drafts.filter((d) => !(d.channelId === channelId && d.userId === userId));
    },

    // Po (opätovnom) pripojení: drafty z obdobia výpadku už nemusia platiť.
    clearDraftsIn(channelId: number): void {
      this.drafts = this.drafts.filter((d) => d.channelId !== channelId);
    },

    // Notifikácia o zmienke pre správy prijaté cez socket (UC 8).
    notifyAboutMessage(message: Message): void {
      const me = useUsersStore().currentUser;
      if (!me || me.status === 'dnd') return;
      if (!this.isMentioned(message.id, me.id)) return;

      const author = useUsersStore().userById(message.authorId)?.nickName ?? 'Niekto';
      const snippet =
        message.content.length > 80 ? `${message.content.slice(0, 80)}…` : message.content;

      Notify.create({
        message: author,
        caption: snippet,
        icon: 'alternate_email',
        position: 'top-right',
      });
    },
  },
});
