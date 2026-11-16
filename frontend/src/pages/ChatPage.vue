<template>
  <q-page class="chat-page" :style-fn="pageStyle">
    <MessageList />
  </q-page>
</template>

<script lang="ts">
import { Socket } from '@rlanz/socket/client';
import { defineComponent, watch } from 'vue';
import { API_BASE_URL } from '../services/api.ts';
import { useChannelsStore } from '../stores/channels.ts';
import { useMessagesStore } from '../stores/messages.ts';
import { useUsersStore } from '../stores/users.ts';
import type { MessageDto } from '../types/api';
import MessageList from '../components/MessageList.vue';

export default defineComponent({
  name: 'ChatPage',

  components: { MessageList },

  setup() {
    const channels = useChannelsStore();
    const messages = useMessagesStore();
    const users = useUsersStore();

    watch(
      [() => channels.activeChannelId, () => users.currentUserId],
      ([channelId, userId], _, onCleanup) => {
        if (channelId === null || userId === null) return;

        const socket = new Socket({ url: new URL(API_BASE_URL).origin });
        const channel = socket.channel(`channels/${channelId}/${userId}`);
        let active = true;

        channel.listen<MessageDto>('message.created', (message) => {
          if (active && message.channelId === channelId) {
            messages.upsertApiMessages([message]);
          }
        });

        const offConnect = socket.on('connect', () => {
          void channel
            .subscribe()
            .then(async () => {
              if (active) await messages.loadNewest(channelId);
            })
            .catch(() => undefined);
        });

        onCleanup(() => {
          active = false;
          offConnect();
          socket.disconnect();
        });

        void socket.connect().catch(() => undefined);
      },
      { immediate: true, flush: 'sync' },
    );
  },

  methods: {
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
