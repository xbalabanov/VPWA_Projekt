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
      <li v-for="message in channelMessages" :key="message.id" class="message">
        <q-avatar
          size="36px"
          font-size="13px"
          class="user-avatar"
          :style="{ '--hue': avatarHue(message.authorId) }"
        >
          {{ authorInitials(message.authorId) }}
        </q-avatar>
        <div class="message-body">
          <div class="message-meta">
            <span class="message-author">{{ authorName(message.authorId) }}</span>
            <time class="message-time" :datetime="message.createdAt">
              {{ formatTime(message.createdAt) }}
            </time>
          </div>
          <p class="message-text">{{ message.content }}</p>
        </div>
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import type { Message } from '../types/models';
import { useChannelsStore } from '../stores/channels';
import { useMessagesStore } from '../stores/messages';
import { useUsersStore } from '../stores/users';
import { avatarHue, initials } from '../utils/avatar';

export default defineComponent({
  name: 'MessageList',

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
    avatarHue,

    authorName(userId: number): string {
      return this.usersStore.userById(userId)?.nickName ?? 'Unknown user';
    },

    authorInitials(userId: number): string {
      const user = this.usersStore.userById(userId);
      return user ? initials(user.firstName, user.lastName) : '?';
    },

    formatTime(createdAt: string): string {
      return new Date(createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    },

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
.message {
  display: flex;
  gap: 12px;
  margin-top: 14px;
  padding: 6px 8px 2px;
  border-radius: 8px;
}
.message-body {
  min-width: 0;
  flex: 1;
}
.message-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.message-author {
  font-weight: 650;
}
.message-time {
  color: var(--text-subtle);
  font-size: 0.75rem;
}
.message-text {
  max-width: 72ch;
  margin: 1px 0 3px;
  font-size: 0.9375rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
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

@media (max-width: 599px) {
  .message-list {
    padding: 12px 8px 8px;
  }
  .message {
    gap: 10px;
  }
}
</style>
