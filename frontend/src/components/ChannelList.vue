<!-- Zoznam kanálov prihláseného používateľa (UC 2).
     Vlastník: Maksym (A2, A3), review: Stanislav. -->
<template>
  <q-list>
    <q-item
      v-for="channel in channelsStore.myChannels"
      :key="channel.id"
      clickable
      class="channel-item"
      :active="channel.id === channelsStore.activeChannelId"
      active-class="channel-item-active"
      @click="selectChannel(channel.id)"
    >
      <q-item-section avatar class="channel-item-icon">
        <q-icon :name="channel.isPrivate ? 'lock' : 'tag'" size="18px" />
      </q-item-section>
      <q-item-section class="channel-item-name">{{ channel.name }}</q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { useChannelsStore } from '../stores/channels';

export default defineComponent({
  name: 'ChannelList',

  // Layout na udalosť zavrie panel na mobile, aby bolo vidno správy.
  emits: ['select'],

  computed: {
    // Zdroj: https://pinia.vuejs.org/cookbook/options-api.html
    ...mapStores(useChannelsStore),
  },

  methods: {
    selectChannel(id: number): void {
      this.channelsStore.setActiveChannel(id);
      this.$emit('select', id);
    },
  },
});
</script>

<style scoped>
.channel-item {
  min-height: 34px;
  margin: 1px 0;
  padding: 0 10px;
  border-radius: 7px;
  color: var(--text-muted);
  transition: background-color 150ms cubic-bezier(0.25, 1, 0.5, 1);
}
.channel-item:hover {
  background: var(--hover);
  color: var(--text);
}
.channel-item-icon {
  min-width: 26px;
  padding-right: 0;
  color: inherit;
  opacity: 0.8;
}
.channel-item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.channel-item-active,
.channel-item-active:hover {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

@media (max-width: 599px) {
  .channel-item {
    min-height: 44px;
  }
}
</style>
