<template>
  <q-page class="chat-page" :style-fn="pageStyle">
    <MessageList />
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MessageList from '../components/MessageList.vue';

export default defineComponent({
  name: 'ChatPage',

  components: { MessageList },

  methods: {
    // Stránka má presne výšku medzi hlavičkou a príkazovým riadkom, takže sa posúvajú
    // iba správy (nie celé okno). offset = výška hlavičky + príkazového riadka.
    // https://v2.quasar.dev/layout/page#style-fn
    pageStyle(offset: number, height: number): Record<string, string> {
      return { height: `${height - offset}px` };
    },
  },
});
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  background: var(--bg);
}
</style>
