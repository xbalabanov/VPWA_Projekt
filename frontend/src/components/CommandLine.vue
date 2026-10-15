<!-- Príkazový riadok: odoslanie správy alebo príkazu (UC 3).
     Vlastník: Maksym (B1).
     Príkazy rozpozná utils/commandParser.ts. -->
<template>
  <div class="command-line">
    <Transition name="command-error">
      <div v-if="error" class="command-error" role="alert">
        <q-icon name="error_outline" size="18px" />
        <span>{{ error }}</span>
      </div>
    </Transition>
    <q-input
      v-model="text"
      class="command-input"
      :class="{ 'command-input--error': error !== null }"
      borderless
      placeholder="Write a message or /command"
      aria-label="Message or command"
      @keydown.enter.prevent="submit"
    >
      <template #append>
        <q-btn
          round
          flat
          dense
          icon="send"
          class="command-send"
          aria-label="Send"
          :loading="sending"
          @click="submit"
        />
      </template>
    </q-input>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { useChannelsStore } from '../stores/channels';
import { useMessagesStore } from '../stores/messages';
import { parseInput } from '../utils/commandParser';

export default defineComponent({
  name: 'CommandLine',

  data() {
    return {
      text: '',
      error: null as string | null, // hláška pod políčkom (chyba parsera, servera...)
      sending: false, // práve čakáme na server
    };
  },

  computed: {
    ...mapStores(useChannelsStore, useMessagesStore),
  },

  watch: {
    // Keď používateľ začne písať, stará chyba už neplatí.
    text() {
      this.error = null;
    },
  },

  methods: {
    async submit(): Promise<void> {
      if (this.sending) return; // poistka proti dvojitému Enteru

      const parsed = parseInput(this.text);
      if (!parsed.text) return; // prázdny vstup

      if (parsed.error) {
        this.error = parsed.error;
        return;
      }

      if (parsed.kind === 'command') {
        // Vykonanie príkazov patrí osobe A (commandHandlers.ts), zatiaľ len oznam.
        this.error = `/${parsed.command} is not implemented yet`;
        return;
      }

      const channelId = this.channelsStore.activeChannelId;
      if (channelId === null) {
        this.error = 'Select a channel first';
        return;
      }

      this.sending = true;
      try {
        const error = await this.messagesStore.sendMessage(channelId, parsed.text);
        if (error) this.error = error;
        else this.text = '';
      } finally {
        this.sending = false;
      }
    },
  },
});
</script>

<style scoped>
.command-line {
  padding: 10px 16px;
}
.command-input {
  padding: 0 6px 0 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  transition: border-color 150ms cubic-bezier(0.25, 1, 0.5, 1);
}
.command-input:focus-within {
  border-color: var(--accent);
}

/* Chyba: červený rámik, aj keď je políčko vo fokuse. */
.command-input--error,
.command-input--error:focus-within {
  border-color: var(--danger);
}
.command-input :deep(.q-field__native) {
  color: var(--text);
}
.command-input :deep(.q-field__native::placeholder) {
  color: var(--text-subtle);
  opacity: 1;
}
.command-send {
  color: var(--accent);
}

/* Chybová hláška nad políčkom (chyba parsera, servera...). */
.command-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.8125rem;
  font-weight: 500;
}

/* Animácia objavenia/zmiznutia hlášky (<Transition name="command-error">).
   https://vuejs.org/guide/built-ins/transition.html */
.command-error-enter-active,
.command-error-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.command-error-enter-from,
.command-error-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
@media (prefers-reduced-motion: reduce) {
  .command-error-enter-active,
  .command-error-leave-active {
    transition: none;
  }
}

@media (max-width: 599px) {
  .command-line {
    padding: 8px;
  }
}
</style>
