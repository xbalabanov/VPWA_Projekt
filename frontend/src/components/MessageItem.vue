<!-- Jedna správa v zozname (UC 7).
     Vlastník: Maksym (B2). -->
<template>
  <li class="message" :class="{ 'message--compact': compact }">
    <q-avatar
      v-if="!compact"
      size="36px"
      font-size="13px"
      class="user-avatar"
      :style="{ '--hue': avatarHue(message.authorId) }"
    >
      {{ authorInitials }}
    </q-avatar>
    <!-- V kompaktnej správe je miesto avatara prázdne, aby text lícoval so skupinou.
         Pri prejdení myšou sa tam ukáže čas. -->
    <time v-else class="message-gutter-time" :datetime="message.createdAt">{{ time }}</time>

    <div class="message-body">
      <div v-if="!compact" class="message-meta">
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

    // true = pokračovanie skupiny: bez avatara a mena, len text.
    compact: {
      type: Boolean,
      default: false,
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

/* Pokračovanie skupiny: tesne pod predošlou správou. */
.message--compact {
  margin-top: 0;
  padding-top: 2px;
}
.message:hover {
  background: var(--surface);
}

/* Prázdne miesto namiesto avatara (rovnaká šírka 36px). Čas je skrytý, kým nie je hover. */
.message-gutter-time {
  width: 36px;
  flex-shrink: 0;
  padding-top: 4px;
  color: var(--text-subtle);
  font-size: 0.6875rem;
  text-align: center;
  visibility: hidden;
}
.message:hover .message-gutter-time {
  visibility: visible;
}

@media (max-width: 599px) {
  .message {
    gap: 10px;
  }
}
</style>
