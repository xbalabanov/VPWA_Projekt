<!-- "X is typing" nad príkazovým riadkom (UC 11). Klik na meno ukáže rozpísaný text naživo.
     Vlastník: Maksym (B4). -->
<template>
  <div class="typing">
    <div class="typing-line" aria-live="polite">
      <template v-if="drafts.length">
        <span class="typing-dots" aria-hidden="true"><span /><span /><span /></span>
        <template v-for="(draft, index) in drafts" :key="draft.userId">
          <button
            type="button"
            class="typing-name"
            :aria-expanded="openUserId === draft.userId"
            @click="toggle(draft.userId)"
          >
            {{ nickName(draft.userId) }}
          </button>
          <span v-if="index < drafts.length - 1">,</span>
        </template>
        <span>{{ drafts.length === 1 ? 'píše…' : 'píšu…' }}</span>
      </template>
    </div>

    <div v-if="openDraft" class="typing-preview">
      <div class="typing-preview-label">{{ nickName(openDraft.userId) }} práve píše:</div>
      <p class="typing-preview-text">
        {{ openDraft.text }}<span class="typing-caret" aria-hidden="true" />
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { useChannelsStore } from '../stores/channels';
import { useMessagesStore, type Draft } from '../stores/messages';
import { useUsersStore } from '../stores/users';

export default defineComponent({
  name: 'TypingIndicator',

  data() {
    return {
      openUserId: null as number | null, // koho rozpísaný text práve ukazujeme
    };
  },

  computed: {
    ...mapStores(useChannelsStore, useMessagesStore, useUsersStore),

    drafts(): Draft[] {
      const channelId = this.channelsStore.activeChannelId;
      return channelId === null ? [] : this.messagesStore.draftsIn(channelId);
    },

    // Keď človek správu odošle, jeho draft zmizne, a s ním aj náhľad.
    openDraft(): Draft | undefined {
      return this.drafts.find((d) => d.userId === this.openUserId);
    },
  },

  methods: {
    nickName(userId: number): string {
      return this.usersStore.userById(userId)?.nickName ?? 'Niekto';
    },

    toggle(userId: number): void {
      this.openUserId = this.openUserId === userId ? null : userId;
    },
  },
});
</script>

<style scoped>
/* Riadok má pevnú výšku aj keď nikto nepíše, aby príkazový riadok neposkakoval. */
.typing-line {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 20px;
  padding: 0 4px 4px;
  color: var(--text-subtle);
  font-size: 0.75rem;
}
.typing-name {
  padding: 0;
  border: 0;
  background: none;
  color: var(--text-muted);
  font: inherit;
  font-weight: 600;
  text-decoration: underline dotted;
  cursor: pointer;
}
.typing-name:hover {
  color: var(--accent);
}

/* Tri bodky, ktoré sa postupne rozsvecujú. */
.typing-dots {
  display: inline-flex;
  gap: 2px;
  margin-right: 2px;
}
.typing-dots span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  animation: typing-bounce 1.2s infinite ease-in-out;
}
.typing-dots span:nth-child(2) {
  animation-delay: 0.15s;
}
.typing-dots span:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes typing-bounce {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

/* Náhľad rozpísaného textu. */
.typing-preview {
  margin-bottom: 8px;
  padding: 8px 10px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  background: var(--surface);
}
.typing-preview-label {
  color: var(--text-subtle);
  font-size: 0.75rem;
}
.typing-preview-text {
  margin: 2px 0 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.typing-caret {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 1px;
  vertical-align: text-bottom;
  background: var(--accent);
  animation: typing-blink 1s steps(1) infinite;
}
@keyframes typing-blink {
  50% {
    opacity: 0;
  }
}
</style>
