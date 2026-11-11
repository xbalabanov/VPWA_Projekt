// Store pre históriu správ, odosielanie, zmienky a rozpísané správy.
import { defineStore } from 'pinia';
import { Notify } from 'quasar';
import type { Mention, Message } from '../types/models';
import type { MessageDto } from '../types/api';
import { useUsersStore } from './users.ts';
import messageService from '../services/MessageService.ts';

interface MessagesState {
  messages: Message[];
  hasMore: Record<number, boolean>;
  loading: Record<number, boolean>;
  mentions: Mention[];
  drafts: Draft[];
  sessionVersion: number;
  nextBeforeId: Record<number, number | null>;
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

      try {
        const page = await messageService.loadMessages(channelId, beforeId);

        if (version !== this.sessionVersion || userId !== useUsersStore().currentUserId) {
          return;
        }

        this.upsertApiMessages(page.messages);
        this.hasMore[channelId] = page.hasMore;
        this.nextBeforeId[channelId] = page.nextBeforeId;
      } catch (error: unknown) {
        if (version === this.sessionVersion && userId === useUsersStore().currentUserId) {
          this.loadErrors[channelId] =
            error instanceof Error ? error.message : 'Nepodarilo sa načítať správy.';
        }
      } finally {
        if (version === this.sessionVersion) {
          this.loading[channelId] = false;
        }
      }
    },

    //načíta najnovšie správy kanála a zlúči ich podľa ID (žiadne duplikáty)
    // TODO socket (B2): kým nie je socket, volá ju polling v channels store
    async loadNewest(channelId: number): Promise<void> {
      const version = this.sessionVersion;
      try {
        const page = await messageService.loadMessages(channelId, null);
        //medzitým sa user mohol odhlásiť - zahodíme starú odpoveď
        if (version !== this.sessionVersion) return;
        this.upsertApiMessages(page.messages);
      } catch {
        //výpadok servera: skúsi pri ďalšom obnovení
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

    // Prázdny text odstráni rozpísanú správu z indikátora.
    setDraft(channelId: number, text: string): void {
      const userId = useUsersStore().currentUserId;
      if (userId === null) return;

      this.drafts = this.drafts.filter((d) => !(d.channelId === channelId && d.userId === userId));
      if (text.trim()) this.drafts.push({ channelId, userId, text });
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
