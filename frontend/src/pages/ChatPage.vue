<template>
  <q-page class="chat-page" :style-fn="pageStyle">
    <MessageList />
  </q-page>
</template>

<script lang="ts">
import { defineComponent, watch } from 'vue';
import { getSocket, onSocketConnect } from '../services/socket.ts';
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

        // Zdieľané pripojenie (services/socket.ts) – používa ho aj osobný odber users/:id (A7).
        const socket = getSocket();
        const name = `channels/${channelId}/${userId}`;
        const channel = socket.channel(name);
        let active = true;
        let connectionVersion = 0;

        const onMessage = (message: MessageDto) => {
          if (active && message.channelId === channelId) {
            messages.upsertApiMessages([message]);
          }
        };
        channel.listen('message.created', onMessage);

        const offConnect = onSocketConnect(() => {
          const version = ++connectionVersion;
          const isCurrent = () => active && version === connectionVersion;

          void channel
            .subscribe()
            .then(async () => {
              if (isCurrent()) await messages.recoverMissed(channelId, isCurrent);
            })
            .catch(() => undefined);
        });

        // Pri prepnutí kanála odídeme iba z jeho odberu; spojenie a users/:id ostávajú.
        onCleanup(() => {
          active = false;
          offConnect();
          channel.stopListening('message.created', onMessage);
          void socket.leave(name).catch(() => undefined);
        });
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
