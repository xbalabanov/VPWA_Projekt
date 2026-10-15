<!-- Správy aktívneho kanála, najnovšie dole (UC 7).
     Vlastník: Maksym (B2).
     Má vlastný posuvník (nie celé okno), aby sa naň dal neskôr napojiť infinite scroll. -->
<template>
  <div ref="scroller" class="chat-scroll" @scroll="onScroll">
    <div v-if="!channelsStore.activeChannel" class="empty-state">
      <q-icon name="forum" size="40px" />
      <div class="empty-title">No channel selected</div>
    </div>

    <div v-else-if="isLoading && !channelMessages.length" class="empty-state">
      <q-spinner size="32px" />
    </div>

    <div v-else-if="!channelMessages.length" class="empty-state">
      <q-icon :name="channelsStore.activeChannel.isPrivate ? 'lock' : 'tag'" size="40px" />
      <div class="empty-title">No messages yet</div>
    </div>

    <ol v-else class="message-list" aria-label="Messages">
      <li v-if="isLoading" class="history-status">
        <q-spinner size="24px" />
      </li>
      <li v-else-if="!hasMore" class="history-status">
        This is the start of #{{ channelsStore.activeChannel.name }}
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

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
}

export default defineComponent({
  name: 'MessageList',
  components: { MessageItem },

  computed: {
    // Zdroj: https://pinia.vuejs.org/cookbook/options-api.html
    ...mapStores(useChannelsStore, useMessagesStore),

    channelMessages(): Message[] {
      const channelId = this.channelsStore.activeChannelId;
      return channelId === null ? [] : this.messagesStore.messagesByChannel(channelId);
    },

    isLoading(): boolean {
      const channelId = this.channelsStore.activeChannelId;
      return channelId !== null && this.messagesStore.loading[channelId] === true;
    },

    hasMore(): boolean {
      const channelId = this.channelsStore.activeChannelId;
      return channelId !== null && this.messagesStore.hasMoreFor(channelId);
    },
  },

  watch: {
    'channelsStore.activeChannelId'() {
      void this.openChannel();
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
  max-width: 880px;
  /* margin-top: auto odsunie pri málo správach zoznam dole k príkazovému riadku. */
  margin: auto auto 0;
  padding: 20px 20px 12px;
  list-style: none;
}

.history-status {
  display: flex;
  justify-content: center;
  padding: 12px 0 4px;
  color: var(--text-subtle);
  font-size: 0.8125rem;
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

/* Oddeľovač dní: text v strede, čiara naľavo aj napravo. */
.day-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 4px;
  color: var(--text-subtle);
  font-size: 0.75rem;
  font-weight: 600;
}
.day-divider::before,
.day-divider::after {
  content: '';
  flex: 1;
  border-top: 1px solid var(--border);
}

@media (max-width: 599px) {
  .message-list {
    padding: 12px 8px 8px;
  }
}
</style>
