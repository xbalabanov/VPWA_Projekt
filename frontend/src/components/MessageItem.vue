<!-- Jedna správa v zozname (UC 7).
     Vlastník: Maksym (B2). -->
<template>
  <li class="message">
    <q-avatar
      size="36px"
      font-size="13px"
      class="user-avatar"
      :style="{ '--hue': avatarHue(message.authorId) }"
    >
      {{ authorInitials }}
    </q-avatar>
    <div class="message-body">
      <div class="message-meta">
        <span class="message-author">{{ authorName }}</span>
        <time class="message-time" :datetime="message.createdAt">{{ time }}</time>
      </div>
      <p class="message-text">{{ message.content }}</p>
    </div>
  </li>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { mapStores } from 'pinia';
import type { Message, User } from '../types/models';
import { useUsersStore } from '../stores/users';
import { avatarHue, initials } from '../utils/avatar';

export default defineComponent({
  name: 'MessageItem',

  props: {
    message: {
      type: Object as PropType<Message>,
      required: true,
    },
  },

  computed: {
    ...mapStores(useUsersStore),

    author(): User | undefined {
      return this.usersStore.userById(this.message.authorId);
    },

    authorName(): string {
      return this.author?.nickName ?? 'Unknown user';
    },

    authorInitials(): string {
      return this.author ? initials(this.author.firstName, this.author.lastName) : '?';
    },

    time(): string {
      return new Date(this.message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    },
  },

  methods: {
    avatarHue,
  },
});
</script>

<style scoped>
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

@media (max-width: 599px) {
  .message {
    gap: 10px;
  }
}
</style>
