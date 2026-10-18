<template>
  <!-- Kostra aplikácie: kanály vľavo a členovia vpravo idú cez celú výšku okna,
       hlavička a príkazový riadok sú len nad/pod správami ("lFr" v pätičke).
       https://v2.quasar.dev/layout/layout#understanding-the-view-prop -->
  <q-layout view="lHr LpR lFr" class="app-shell">
    <q-header class="channel-bar">
      <q-toolbar class="channel-toolbar">
        <q-btn
          flat
          round
          icon="menu"
          class="lt-md"
          aria-label="Otvoriť kanály"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <div v-if="activeChannel" class="channel-bar-title">
          <h1 class="channel-bar-name">
            <q-icon
              :name="activeChannel.isPrivate ? 'lock' : 'tag'"
              size="18px"
              class="channel-bar-icon"
            />
            {{ activeChannel.name }}
          </h1>
          <!-- Popis kanála: typ, počet členov a správca sú vidno bez otvárania čohokoľvek. -->
          <p class="channel-bar-meta">
            {{ activeChannel.isPrivate ? 'Súkromný' : 'Verejný' }} kanál
            <span class="channel-bar-dot" aria-hidden="true">·</span>
            správca {{ adminNick }}
          </p>
        </div>

        <q-space />

        <!-- Členovia: prvé tri avatary + počet. Klik otvorí/zavrie panel členov. -->
        <button
          v-if="activeChannel"
          type="button"
          class="members-button"
          :class="{ 'members-button--active': channelsStore.membersOpen }"
          :aria-pressed="channelsStore.membersOpen"
          aria-label="Zobraziť alebo skryť členov"
          @click="channelsStore.membersOpen = !channelsStore.membersOpen"
        >
          <span class="members-stack" aria-hidden="true">
            <q-avatar
              v-for="member in previewMembers"
              :key="member.id"
              size="24px"
              font-size="10px"
              class="user-avatar"
              :style="{ '--hue': avatarHue(member.id) }"
            >
              {{ initials(member.firstName, member.lastName) }}
            </q-avatar>
          </span>
          <span class="tabular">{{ memberCount }}</span>
        </button>
        <q-btn
          flat
          round
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          :aria-label="$q.dark.isActive ? 'Prepnúť na svetlú tému' : 'Prepnúť na tmavú tému'"
          @click="$q.dark.toggle()"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      class="side-panel"
      :width="264"
      :breakpoint="1024"
    >
      <nav class="side-panel-content" aria-label="Kanály">
        <div class="app-name">
          <span class="app-mark" aria-hidden="true">V</span>
          <span class="app-name-text">
            VPWA Chat
            <span class="app-name-sub">FIIT STU</span>
          </span>
        </div>

        <ChannelList @select="onChannelSelected" />

        <q-space />

        <div v-if="usersStore.currentUser" class="me">
          <UserMenu />
          <q-btn flat round dense icon="logout" aria-label="Odhlásiť sa" @click="logout" />
        </div>
      </nav>
    </q-drawer>

    <q-drawer
      v-model="channelsStore.membersOpen"
      side="right"
      show-if-above
      class="side-panel"
      :width="248"
      :breakpoint="1280"
    >
      <div class="side-panel-content">
        <MembersList />
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="composer">
      <CommandLine />
    </q-footer>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { useChannelsStore } from '../stores/channels';
import { useUsersStore } from '../stores/users';
import type { Channel, User } from '../types/models';
import { avatarHue, initials } from '../utils/avatar';
import ChannelList from '../components/ChannelList.vue';
import CommandLine from '../components/CommandLine.vue';
import MembersList from '../components/MembersList.vue';
import UserMenu from '../components/UserMenu.vue';

export default defineComponent({
  name: 'MainLayout',

  components: { ChannelList, CommandLine, MembersList, UserMenu },

  data() {
    return {
      leftDrawerOpen: false,
    };
  },

  computed: {
    // Sprístupní this.channelsStore a this.usersStore (názov = id store + "Store").
    // Zdroj: https://pinia.vuejs.org/cookbook/options-api.html
    ...mapStores(useChannelsStore, useUsersStore),

    activeChannel(): Channel | undefined {
      return this.channelsStore.activeChannel;
    },

    members(): User[] {
      const channelId = this.channelsStore.activeChannelId;
      if (channelId === null) return [];
      return this.channelsStore
        .membersOf(channelId)
        .map((id) => this.usersStore.userById(id))
        .filter((u): u is User => u !== undefined);
    },

    memberCount(): number {
      return this.members.length;
    },

    // Prvé tri avatary do hlavičky (viac by sa nezmestilo a nič by nepridalo).
    previewMembers(): User[] {
      return this.members.slice(0, 3);
    },

    adminNick(): string {
      const adminId = this.activeChannel?.adminId;
      return adminId === undefined ? '' : (this.usersStore.userById(adminId)?.nickName ?? '');
    },
  },

  methods: {
    avatarHue,
    initials,

    onChannelSelected(): void {
      // Na mobile sa panel s kanálmi po výbere zavrie, aby bolo vidno správy.
      if (this.$q.screen.lt.md) this.leftDrawerOpen = false;
    },

    logout(): void {
      this.usersStore.logout();
      void this.$router.push('/login');
    },
  },
});
</script>

<style scoped>
.app-shell {
  background: var(--bg);
}

/* Hlavička: názov kanála + popis pod ním, vpravo členovia a téma. */
.channel-bar {
  background: var(--bg);
  color: var(--text);
  border-bottom: 1px solid var(--border);
}
.channel-toolbar {
  min-height: 64px;
  gap: 10px;
  padding: 0 16px 0 24px;
}
.channel-bar-title {
  min-width: 0;
}
.channel-bar-name {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  overflow: hidden;
  font-size: 1.0625rem;
  font-weight: 650;
  line-height: 1.3;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.channel-bar-icon {
  color: var(--text-subtle);
}
.channel-bar-meta {
  margin: 2px 0 0;
  overflow: hidden;
  color: var(--text-subtle);
  font-size: 0.78125rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.channel-bar-dot {
  margin: 0 4px;
}
.channel-toolbar .q-btn {
  color: var(--text-muted);
}

/* Tlačidlo členov: prekrývajúce sa avatary + počet. */
.members-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 6px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-muted);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 150ms cubic-bezier(0.25, 1, 0.5, 1),
    background-color 150ms cubic-bezier(0.25, 1, 0.5, 1);
}
.members-button:hover {
  border-color: var(--text-subtle);
  color: var(--text);
}
.members-button--active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}
.members-stack {
  display: flex;
}
/* Každý ďalší avatar sa zasunie pod predošlý; okraj vo farbe pozadia ich oddelí. */
.members-stack .q-avatar {
  box-shadow: 0 0 0 2px var(--surface);
}
.members-stack .q-avatar + .q-avatar {
  margin-left: -7px;
}

/* Bočné panely: tmavšia vrstva ako plocha so správami. */
.side-panel {
  background: var(--sidebar);
  color: var(--text);
}
:deep(.q-drawer) {
  background: var(--sidebar);
}
:deep(.q-drawer--left) {
  border-right: 1px solid var(--border);
}
:deep(.q-drawer--right) {
  border-left: 1px solid var(--border);
}
.side-panel-content {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  padding: 16px 12px 12px;
}

.app-name {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 6px 20px;
}
.app-mark {
  display: grid;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 9px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 0.9375rem;
  font-weight: 800;
}
.app-name-text {
  display: flex;
  flex-direction: column;
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.2;
}
.app-name-sub {
  color: var(--text-subtle);
  font-size: 0.6875rem;
  font-weight: 500;
}

/* Prihlásený používateľ: plocha s rámikom na spodku panelu (bez tieňa). */
.me {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 16px;
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}
.me .q-btn {
  color: var(--text-muted);
}

/* Príkazový riadok: rovnaké pozadie ako správy, aby pôsobil ako ich súčasť. */
.composer {
  background: var(--bg);
  color: var(--text);
}

@media (max-width: 599px) {
  .channel-toolbar {
    padding: 0 8px;
  }
  .members-stack {
    display: none;
  }
}
</style>
