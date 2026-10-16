<!-- Jedna správa v zozname (UC 7).
     Vlastník: Maksym (B2). -->
<template>
  <li
    class="message"
    :class="{ 'message--compact': compact, 'message--own': isOwn, 'message--mention': mentionsMe }"
  >
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
    <time v-else class="message-gutter-time tabular" :datetime="message.createdAt">{{ time }}</time>

    <div class="message-body">
      <div v-if="!compact" class="message-meta">
        <span class="message-author">{{ authorName }}</span>
        <time class="message-time tabular" :datetime="message.createdAt">{{ time }}</time>
      </div>
      <p class="message-text">
        <template v-for="(part, index) in contentParts" :key="index">
          <span
            v-if="part.nickName"
            class="mention"
            :class="{ 'mention--me': isMyNick(part.nickName) }"
            >{{ part.text }}</span
          >
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
    </div>
  </li>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { mapStores } from 'pinia';
import type { Message, User } from '../types/models';
import { useUsersStore } from '../stores/users';
import { avatarHue, initials } from '../utils/avatar';
import { useMessagesStore } from '../stores/messages';
import { splitMentions, type ContentPart } from '../utils/mentions';

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
    ...mapStores(useUsersStore, useMessagesStore),

    author(): User | undefined {
      return this.usersStore.userById(this.message.authorId);
    },

    authorName(): string {
      return this.author?.nickName ?? 'Neznámy používateľ';
    },

    authorInitials(): string {
      return this.author ? initials(this.author.firstName, this.author.lastName) : '?';
    },

    time(): string {
      return new Date(this.message.createdAt).toLocaleTimeString('sk-SK', {
        hour: '2-digit',
        minute: '2-digit',
      });
    },

    // Napísal správu prihlásený používateľ?
    isOwn(): boolean {
      return this.message.authorId === this.usersStore.currentUserId;
    },

    // Je táto správa adresovaná prihlásenému používateľovi? (UC 6)
    mentionsMe(): boolean {
      const myId = this.usersStore.currentUserId;
      return myId !== null && this.messagesStore.isMentioned(this.message.id, myId);
    },

    // Text rozdelený na obyčajný text a zmienky @nickname.
    contentParts(): ContentPart[] {
      return splitMentions(this.message.content);
    },
  },

  methods: {
    avatarHue,

    // Je to zmienka prihláseného používateľa? (bez ohľadu na veľké/malé písmená)
    isMyNick(nickName: string): boolean {
      const me = this.usersStore.currentUser;
      return me !== undefined && me.nickName.toLowerCase() === nickName.toLowerCase();
    },
  },
});
</script>

<style scoped>
.message {
  display: flex;
  gap: 12px;
  margin-top: 14px;
  padding: 6px 12px 4px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  transition: background-color 150ms cubic-bezier(0.25, 1, 0.5, 1);
}
.message:hover {
  background: var(--hover);
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
  font-size: 0.875rem;
  font-weight: 650;
}
.message-time {
  color: var(--text-subtle);
  font-size: 0.71875rem;
}
.message-text {
  max-width: 72ch;
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

/* Pokračovanie skupiny: tesne pod predošlou správou. */
.message--compact {
  margin-top: 0;
  padding-top: 1px;
  padding-bottom: 1px;
}

/* Prázdne miesto namiesto avatara (rovnaká šírka 36px). Čas je skrytý, kým nie je hover. */
.message-gutter-time {
  width: 36px;
  flex-shrink: 0;
  padding-top: 3px;
  color: var(--text-subtle);
  font-size: 0.6875rem;
  text-align: center;
  visibility: hidden;
}
.message:hover .message-gutter-time {
  visibility: visible;
}

/* Moje správy: len jemné podfarbenie celého riadku (bez bočného pásika). */
.message--own {
  background: color-mix(in oklch, var(--accent-soft) 35%, transparent);
}

/* Zmienka @nickname v texte: moja vo farbe zmienok, cudzia v akcente, obe ako štítok. */
.mention {
  padding: 0 3px;
  border-radius: 4px;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}
.mention--me {
  background: color-mix(in oklch, var(--mention-text) 18%, transparent);
  color: var(--mention-text);
}

/* Celá správa adresovaná mne (UC 6): teplé pozadie a jemný rámik, aby sa nedala prehliadnuť. */
.message--mention {
  border-color: color-mix(in oklch, var(--mention-text) 25%, transparent);
  background: var(--mention-bg);
}

/* :hover pravidlá sú za základnými, pri rovnakej špecificite vyhrá neskoršie. */
.message--own:hover {
  background: color-mix(in oklch, var(--accent-soft) 60%, transparent);
}
.message--mention:hover {
  background: color-mix(in oklch, var(--mention-bg) 85%, var(--mention-text));
}

@media (max-width: 599px) {
  .message {
    gap: 10px;
    padding-right: 8px;
    padding-left: 8px;
  }
}
</style>
