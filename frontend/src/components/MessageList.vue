<!-- Správy aktívneho kanála, najnovšie dole (UC 7).
     Vlastník: Maksym (B2).
     Má vlastný posuvník (nie celé okno), aby sa naň dal neskôr napojiť infinite scroll. -->
<template>
  <div ref="scroller" class="chat-scroll" @scroll="onScroll">
    <div v-if="!channelsStore.activeChannel" class="empty-state">
      <q-icon name="forum" size="40px" />
      <div class="empty-title">Nie je vybraný žiadny kanál</div>
    </div>

    <div v-else-if="isLoading && !channelMessages.length" class="empty-state">
      <q-spinner size="32px" />
    </div>

    <div v-else-if="!channelMessages.length" class="empty-state">
      <q-icon :name="channelsStore.activeChannel.isPrivate ? 'lock' : 'tag'" size="40px" />
      <div class="empty-title">Zatiaľ žiadne správy</div>
    </div>

    <ol v-else class="message-list" aria-label="Správy">
      <li v-if="isLoading" class="history-status">
        <q-spinner size="24px" />
      </li>
      <!-- Začiatok histórie: úvod kanála, ako keď otvoríš nový kanál v Slacku. -->
      <li v-else-if="!hasMore" class="channel-intro">
        <div class="channel-intro-icon">
          <q-icon :name="channelsStore.activeChannel.isPrivate ? 'lock' : 'tag'" size="22px" />
        </div>
        <h2 class="channel-intro-title">{{ channelsStore.activeChannel.name }}</h2>
        <p class="channel-intro-text">
          Toto je úplný začiatok
          {{ channelsStore.activeChannel.isPrivate ? 'súkromného' : 'verejného' }} kanála
          <strong>#{{ channelsStore.activeChannel.name }}</strong
          >. Vytvoril ho <strong>{{ adminNick }}</strong
          >.
        </p>
      </li>
      <template v-for="(message, index) in channelMessages" :key="message.id">
        <li v-if="startsNewDay(index)" class="day-divider">
          <span>{{ dayLabel(message.createdAt) }}</span>
        </li>
        <MessageItem :message="message" :compact="isContinuation(index)" />
      </template>
    </ol>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import type { Message } from '../types/models';
import { useChannelsStore } from '../stores/channels';
import { useMessagesStore } from '../stores/messages';
import MessageItem from './MessageItem.vue';
import { useUsersStore } from '../stores/users';

// Správy toho istého autora do 5 minút od seba spojíme do jednej skupiny.
const GROUP_GAP_MS = 5 * 60 * 1000;

// Sú dva dátumy v ten istý kalendárny deň (v miestnom čase)?
function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

// Text oddeľovača dní: "Today", "Yesterday" alebo napr. "Thursday, 1 October".
function dayLabel(createdAt: string): string {
  const date = new Date(createdAt);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return 'Dnes';
  if (isSameDay(date, yesterday)) return 'Včera';
  return date.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default defineComponent({
  name: 'MessageList',
  components: { MessageItem },

  computed: {
    // Zdroj: https://pinia.vuejs.org/cookbook/options-api.html
    ...mapStores(useChannelsStore, useMessagesStore, useUsersStore),

    channelMessages(): Message[] {
      const channelId = this.channelsStore.activeChannelId;
      return channelId === null ? [] : this.messagesStore.messagesByChannel(channelId);
    },

    isLoading(): boolean {
      const channelId = this.channelsStore.activeChannelId;
      return channelId !== null && this.messagesStore.loading[channelId] === true;
    },

    adminNick(): string {
      const adminId = this.channelsStore.activeChannel?.adminId;
      return adminId === undefined ? '' : (this.usersStore.userById(adminId)?.nickName ?? '');
    },

    hasMore(): boolean {
      const channelId = this.channelsStore.activeChannelId;
      return channelId !== null && this.messagesStore.hasMoreFor(channelId);
    },

    // id najnovšej načítanej správy; mení sa len keď pribudne správa dole.
    lastMessageId(): number | null {
      return this.channelMessages[this.channelMessages.length - 1]?.id ?? null;
    },
  },

  watch: {
    'channelsStore.activeChannelId'() {
      void this.openChannel();
    },

    // Pribudla správa dole (odoslaná alebo prijatá).
    lastMessageId(newId: number | null, oldId: number | null) {
      if (newId === null || oldId === null || newId === oldId) return;

      const last = this.channelMessages[this.channelMessages.length - 1];
      const isMine = last?.authorId === this.usersStore.currentUserId;
      if (isMine || this.isNearBottom()) this.scrollToBottom();
    },
  },

  mounted() {
    void this.openChannel();
  },

  methods: {
    // Pri otvorení kanála: ak z neho ešte nič nemáme, načítaj prvú stránku.
    // Potom zobraz najnovšie správy (dole), ako v každom chate.
    async openChannel(): Promise<void> {
      const channelId = this.channelsStore.activeChannelId;
      if (channelId === null) return;

      if (this.messagesStore.messagesByChannel(channelId).length === 0) {
        await this.messagesStore.loadOlder(channelId);
      }
      this.scrollToBottom();
    },

    // Keď je používateľ blízko vrchu, dočítame staršie správy.
    onScroll(): void {
      const scroller = this.$refs.scroller as HTMLElement;
      if (scroller.scrollTop < 100) void this.loadOlderKeepingPosition();
    },

    // Načíta staršiu stránku a posunie scroll tak, aby obsah na obrazovke neposkočil.
    async loadOlderKeepingPosition(): Promise<void> {
      const channelId = this.channelsStore.activeChannelId;
      if (channelId === null) return;

      const scroller = this.$refs.scroller as HTMLElement;
      const heightBefore = scroller.scrollHeight;

      await this.messagesStore.loadOlder(channelId);
      await this.$nextTick(); // počkáme, kým Vue vykreslí nové správy

      scroller.scrollTop += scroller.scrollHeight - heightBefore;
    },

    scrollToBottom(): void {
      // Čakáme, kým Vue vykreslí správy nového kanála.
      void this.$nextTick(() => {
        const scroller = this.$refs.scroller as HTMLElement | undefined;
        if (scroller) scroller.scrollTop = scroller.scrollHeight;
      });
    },

    // Pokračuje správa na pozícii `index` skupinu predošlej správy?
    // (rovnaký autor a menej ako 5 minút od seba)
    isContinuation(index: number): boolean {
      const current = this.channelMessages[index];
      const previous = this.channelMessages[index - 1];
      if (!current || !previous) return false;

      const gap = new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime();
      return (
        current.authorId === previous.authorId && gap < GROUP_GAP_MS && !this.startsNewDay(index)
      );
    },

    dayLabel,

    // Začína správa na pozícii `index` nový deň? (prvá načítaná správa vždy áno)
    startsNewDay(index: number): boolean {
      const current = this.channelMessages[index];
      const previous = this.channelMessages[index - 1];
      if (!current) return false;
      if (!previous) return true;
      return !isSameDay(new Date(current.createdAt), new Date(previous.createdAt));
    },

    // Je používateľ (skoro) úplne dole? Tolerancia 150 px.
    isNearBottom(): boolean {
      const scroller = this.$refs.scroller as HTMLElement | undefined;
      if (!scroller) return true;
      return scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 150;
    },
  },
});
</script>

<style scoped>
.chat-scroll {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
  overflow-anchor: none; /* scroll po dočítaní starších správ posúvame sami */
}

.message-list {
  width: 100%;
  /* margin-top: auto odsunie pri málo správach zoznam dole k príkazovému riadku. */
  margin: auto 0 0;
  padding: 24px 16px 8px;
  list-style: none;
}

.history-status {
  display: flex;
  justify-content: center;
  padding: 12px 0 4px;
  color: var(--text-subtle);
}

.empty-state {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  padding: 24px;
  color: var(--text-subtle);
  text-align: center;
}
.empty-title {
  margin-top: 6px;
  color: var(--text);
  font-size: 1rem;
  font-weight: 650;
}

/* Oddeľovač dní: štítok v strede, čiara naľavo aj napravo. */
.day-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 8px 6px;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
}
.day-divider::before,
.day-divider::after {
  content: '';
  flex: 1;
  border-top: 1px solid var(--border);
}
.day-divider span {
  padding: 2px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
}

/* Úvod kanála na začiatku histórie. */
.channel-intro {
  padding: 8px 8px 16px;
}
.channel-intro-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  margin-bottom: 12px;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent);
}
.channel-intro-title {
  margin: 0 0 4px;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.015em;
}
.channel-intro-text {
  max-width: 60ch;
  margin: 0;
  color: var(--text-muted);
  line-height: 1.5;
}
.channel-intro-text strong {
  color: var(--text);
  font-weight: 600;
}

@media (max-width: 599px) {
  .message-list {
    padding: 12px 8px 8px;
  }
}
</style>
