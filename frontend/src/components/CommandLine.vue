<!-- Príkazový riadok: odoslanie správy alebo príkazu (UC 3).
     Vlastník: Stanislav (B1), review: Maksym.
     Príkazy rozpozná utils/commandParser.ts. -->
<template>
  <div class="command-line">
    <q-input
      v-model="text"
      class="command-input"
      borderless
      placeholder="Write a message or /command"
      aria-label="Message or command"
    >
      <template #append>
        <q-btn round flat dense icon="send" class="command-send" aria-label="Send" />
      </template>
    </q-input>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CommandLine',

  data() {
    return {
      text: '',
    };
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

@media (max-width: 599px) {
  .command-line {
    padding: 8px;
  }
}
</style>
