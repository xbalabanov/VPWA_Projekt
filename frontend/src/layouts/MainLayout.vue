<template>
  <!-- Kostra aplikácie: hlavička nad správami, kanály vľavo, členovia vpravo
       a príkazový riadok cez celú šírku okna (príkazy nepatria iba k jednému kanálu).
       https://v2.quasar.dev/layout/layout#understanding-the-view-prop -->
  <q-layout view="lHr LpR fFf" class="app-shell">
    <q-header class="channel-bar">
      <q-toolbar class="channel-toolbar">
        <q-btn
          flat
          round
          icon="menu"
          class="lt-md"
          aria-label="Open channels"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <template v-if="channelsStore.activeChannel">
          <q-icon
            :name="channelsStore.activeChannel.isPrivate ? 'lock' : 'tag'"
            size="20px"
            class="channel-bar-icon"
          />
          <h1 class="channel-bar-name">{{ channelsStore.activeChannel.name }}</h1>
        </template>

        <q-space />

        <q-btn
          flat
          round
          icon="group"
          :aria-pressed="rightDrawerOpen"
          aria-label="Toggle member panel"
          @click="rightDrawerOpen = !rightDrawerOpen"
        />
        <q-btn
          flat
          round
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          :aria-label="$q.dark.isActive ? 'Switch to light theme' : 'Switch to dark theme'"
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
      <nav class="side-panel-content" aria-label="Channels">
        <div class="app-name">
          <span class="app-mark" aria-hidden="true">V</span>
          VPWA Chat
        </div>

        <div class="section-label">Channels</div>
        <ChannelList @select="onChannelSelected" />

        <q-space />

        <div v-if="usersStore.currentUser" class="me">
          <q-avatar
            size="34px"
            font-size="12px"
            class="user-avatar"
            :style="{ '--hue': avatarHue(usersStore.currentUser.id) }"
          >
            {{ initials(usersStore.currentUser.firstName, usersStore.currentUser.lastName) }}
          </q-avatar>
          <div class="me-name">
            {{ usersStore.currentUser.firstName }} {{ usersStore.currentUser.lastName }}
          </div>
          <q-btn flat round dense icon="logout" aria-label="Log out" @click="logout" />
        </div>
      </nav>
    </q-drawer>

    <q-drawer
      v-model="rightDrawerOpen"
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
import { avatarHue, initials } from '../utils/avatar';
import ChannelList from '../components/ChannelList.vue';
import CommandLine from '../components/CommandLine.vue';
import MembersList from '../components/MembersList.vue';

export default defineComponent({
  name: 'MainLayout',

  components: { ChannelList, CommandLine, MembersList },

  data() {
    return {
      leftDrawerOpen: false,
      rightDrawerOpen: false,
    };
  },

  computed: {
    // Sprístupní this.channelsStore a this.usersStore (názov = id store + "Store").
    // Zdroj: https://pinia.vuejs.org/cookbook/options-api.html
    ...mapStores(useChannelsStore, useUsersStore),
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

/* Hlavička s názvom aktívneho kanála */
.channel-bar {
  background: var(--bg);
  color: var(--text);
  border-bottom: 1px solid var(--border);
}
.channel-toolbar {
  min-height: 56px;
  gap: 6px;
  padding: 0 12px 0 20px;
}
.channel-bar-icon {
  color: var(--text-subtle);
}
.channel-bar-name {
  margin: 0;
  overflow: hidden;
  font-size: 1rem;
  font-weight: 650;
  line-height: 1.3;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.channel-toolbar .q-btn {
  color: var(--text-muted);
}

/* Bočné panely */
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
  padding: 12px 10px;
}
.app-name {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px 18px;
  font-size: 0.9375rem;
  font-weight: 700;
}
.app-mark {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 0.875rem;
  font-weight: 800;
}
.section-label {
  padding: 8px 10px 6px;
  color: var(--text-subtle);
  font-size: 0.75rem;
  font-weight: 600;
}

/* Prihlásený používateľ */
.me {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 8px 4px;
  border-top: 1px solid var(--border);
}
.me-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.me .q-btn {
  color: var(--text-muted);
}

/* Príkazový riadok */
.composer {
  border-top: 1px solid var(--border);
  background: var(--sidebar);
  color: var(--text);
}
@media (max-width: 599px) {
  .channel-toolbar {
    padding: 0 6px;
  }
}
</style>
