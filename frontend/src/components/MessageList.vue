<!-- Správy aktívneho kanála, najnovšie dole (UC 7).
     Vlastník: Stanislav (B2), review: Maksym.
     Má vlastný posuvník (nie celé okno), aby sa naň dal neskôr napojiť infinite scroll. -->
<template>
  <div ref="scroller" class="chat-scroll">
    <div v-if="!channelsStore.activeChannel" class="empty-state">
      <q-icon name="forum" size="40px" />
      <div class="empty-title">No channel selected</div>
    </div>

    <div v-else-if="!channelMessages.length" class="empty-state">
      <q-icon :name="channelsStore.activeChannel.isPrivate ? 'lock' : 'tag'" size="40px" />
      <div class="empty-title">No messages yet</div>
    </div>

    <ol v-else class="message-list" aria-label="Messages">
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
  },

  watch: {
    // Po otvorení kanála zobraz najnovšie správy (dole), ako v každom chate.
    'channelsStore.activeChannelId'() {
      this.scrollToBottom();
    },
  },

  mounted() {
    this.scrollToBottom();
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
