<!-- Prihlásený používateľ: zmena stavu (UC 9) a nastavenie notifikácií (UC 8).
     Vlastník: Maksym (B5, B6). -->
<template>
  <q-btn v-if="me" flat no-caps class="user-menu" aria-label="Status and notification settings">
    <span class="user-menu-avatar">
      <q-avatar
        size="34px"
        font-size="12px"
        class="user-avatar"
        :style="{ '--hue': avatarHue(me.id) }"
      >
        {{ initials(me.firstName, me.lastName) }}
      </q-avatar>
      <span class="status-dot" :class="'status-dot--' + me.status" aria-hidden="true" />
    </span>
    <span class="user-menu-text">
      <span class="user-menu-name">{{ me.firstName }} {{ me.lastName }}</span>
      <span class="user-menu-status">{{ statusLabel(me.status) }}</span>
    </span>

    <q-menu anchor="top left" self="bottom left" :offset="[0, 8]">
      <q-list dense class="user-menu-list">
        <q-item-label header>Status</q-item-label>
        <q-item
          v-for="option in statusOptions"
          :key="option.value"
          v-close-popup
          clickable
          :active="me.status === option.value"
          active-class="user-menu-active"
          @click="usersStore.setStatus(option.value)"
        >
          <q-item-section avatar>
            <span class="status-dot status-dot--inline" :class="'status-dot--' + option.value" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ option.label }}</q-item-label>
            <q-item-label caption>{{ option.hint }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator />

        <q-item tag="label">
          <q-item-section>
            <q-item-label>Notify only mentions</q-item-label>
            <q-item-label caption>Only messages with @{{ me.nickName }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle :model-value="me.notifyMentionsOnly" @update:model-value="setMentionsOnly" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { useUsersStore } from '../stores/users';
import type { User, UserStatus } from '../types/models';
import { avatarHue, initials } from '../utils/avatar';

// Stavy podľa UC 9 a čo pre používateľa znamenajú.
const STATUS_OPTIONS: { value: UserStatus; label: string; hint: string }[] = [
  { value: 'online', label: 'Online', hint: 'Messages and notifications' },
  { value: 'dnd', label: 'Do not disturb', hint: 'No notifications' },
  { value: 'offline', label: 'Offline', hint: 'No new messages' },
];

export default defineComponent({
  name: 'UserMenu',

  data() {
    return {
      statusOptions: STATUS_OPTIONS,
    };
  },

  computed: {
    ...mapStores(useUsersStore),

    me(): User | undefined {
      return this.usersStore.currentUser;
    },
  },

  methods: {
    avatarHue,
    initials,

    statusLabel(status: UserStatus): string {
      return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
    },

    setMentionsOnly(value: boolean): void {
      this.usersStore.setNotifyMentionsOnly(value);
    },
  },
});
</script>

<style scoped>
.user-menu {
  flex: 1;
  min-width: 0;
  padding: 4px 6px;
  border-radius: 8px;
  color: var(--text);
}
.user-menu :deep(.q-btn__content) {
  flex-wrap: nowrap;
  justify-content: flex-start;
  gap: 10px;
  text-align: left;
}
.user-menu-avatar {
  position: relative;
  flex-shrink: 0;
}
.user-menu-text {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.user-menu-name {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-menu-status {
  color: var(--text-subtle);
  font-size: 0.75rem;
}

.user-menu-list {
  min-width: 240px;
}
.user-menu-active {
  background: var(--accent-soft);
  color: var(--text);
}

/* Rovnaká bodka stavu ako v MembersList (okraj vo farbe panelu ju oddelí od avatara). */
.status-dot {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 12px;
  height: 12px;
  border: 2px solid var(--sidebar);
  border-radius: 50%;
}
.status-dot--inline {
  position: static;
  display: inline-block;
  border: 0;
}
.status-dot--online {
  background: var(--online);
}
.status-dot--dnd {
  background: var(--dnd);
}
.status-dot--offline {
  background: var(--offline);
}
</style>
