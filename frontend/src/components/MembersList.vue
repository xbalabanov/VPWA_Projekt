<!-- Zoznam členov aktívneho kanála (UC 10).
       Vlastník: Stanislav (A6). -->
<template>
  <section aria-label="Members">
    <div class="section-label">Members – {{ members.length }}</div>
    <q-list>
      <q-item v-for="user in members" :key="user.id" class="member-item">
        <q-item-section avatar>
          <!-- obal kvôli bodke stavu: q-avatar orezáva svoj obsah -->
          <div class="member-avatar">
            <q-avatar
              size="30px"
              font-size="11px"
              class="user-avatar"
              :style="{ '--hue': avatarHue(user.id) }"
            >
              {{ initials(user.firstName, user.lastName) }}
            </q-avatar>
            <span class="status-dot" :class="'status-dot--' + user.status" aria-hidden="true" />
          </div>
        </q-item-section>
        <q-item-section>
          <q-item-label class="member-name">
            {{ user.nickName }}
            <q-icon
              v-if="user.id === adminId"
              name="star"
              size="14px"
              class="member-admin"
              aria-label="Admin"
            />
          </q-item-label>
          <q-item-label caption class="member-status">{{ statusLabel(user.status) }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { useChannelsStore } from '../stores/channels';
import { useUsersStore } from '../stores/users';
import type { User, UserStatus } from '../types/models';
import { avatarHue, initials } from '../utils/avatar';

const STATUS_LABELS: Record<UserStatus, string> = {
  online: 'Online',
  dnd: 'Do not disturb',
  offline: 'Offline',
};

// poradie v zozname: online navrchu, offline naspodku
const STATUS_ORDER: Record<UserStatus, number> = { online: 0, dnd: 1, offline: 2 };

export default defineComponent({
  name: 'MembersList',

  computed: {
    ...mapStores(useChannelsStore, useUsersStore),

    adminId(): number | null {
      return this.channelsStore.activeChannel?.adminId ?? null;
    },

    //clenovia aktivneho kanala zoradeni podla stavu, potom podla abecedy
    members(): User[] {
      const channelId = this.channelsStore.activeChannelId;
      if (channelId === null) return [];

      return this.channelsStore
        .membersOf(channelId)
        .map((id) => this.usersStore.userById(id))
        .filter((u): u is User => u !== undefined)
        .sort(
          (a, b) =>
            STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.nickName.localeCompare(b.nickName),
        );
    },
  },

  methods: {
    avatarHue,
    initials,

    statusLabel(status: UserStatus): string {
      return STATUS_LABELS[status];
    },
  },
});
</script>

<style scoped>
.section-label {
  padding: 8px 10px 6px;
  color: var(--text-subtle);
  font-size: 0.75rem;
  font-weight: 600;
}
.member-item {
  min-height: 44px;
  padding: 4px 10px;
  border-radius: 8px;
}
.member-avatar {
  position: relative;
}

/* Bodka stavu v rohu avatara; okraj vo farbe panelu ju oddelí od avatara. */
.status-dot {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 12px;
  height: 12px;
  border: 2px solid var(--sidebar);
  border-radius: 50%;
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
.member-name {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text);
  font-weight: 500;
}
.member-admin {
  color: var(--text-subtle);
}
.member-status {
  color: var(--text-subtle);
}
</style>
