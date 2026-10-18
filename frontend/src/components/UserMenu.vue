<!-- Prihlásený používateľ: zmena stavu (UC 9) a nastavenie notifikácií (UC 8).
     Vlastník: Maksym (B5, B6). -->
<template>
  <q-btn v-if="me" flat no-caps class="user-menu" aria-label="Stav a nastavenie notifikácií">
    <!-- Avatar + bodka stavu v obale (q-avatar orezáva obsah, bodka by sa nezmestila).
     Trieda bodky sa skladá zo stavu: status-dot--online / --dnd / --offline. -->
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

    <!-- Menu sa otvorí po kliknutí na tlačidlo, NAD ním (anchor/self), lebo tlačidlo je dole. -->
    <q-menu anchor="top left" self="bottom left" :offset="[0, 8]">
      <q-list dense class="user-menu-list">
        <!-- Kto som: rovnaké údaje, aké vidia ostatní (nick používajú v @zmienkach). -->
        <div class="user-menu-head">
          <q-avatar
            size="40px"
            font-size="14px"
            class="user-avatar"
            :style="{ '--hue': avatarHue(me.id) }"
          >
            {{ initials(me.firstName, me.lastName) }}
          </q-avatar>
          <div class="user-menu-head-text">
            <div class="user-menu-name">{{ me.firstName }} {{ me.lastName }}</div>
            <div class="user-menu-nick">@{{ me.nickName }}</div>
          </div>
        </div>

        <q-separator />

        <q-item-label header>Stav</q-item-label>
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
          <!-- Aktívny stav má aj fajku, nie len farbu (prístupnosť). -->
          <q-item-section v-if="me.status === option.value" side>
            <q-icon name="check" size="18px" class="user-menu-check" />
          </q-item-section>
        </q-item>

        <q-separator />

        <q-item-label header>Notifikácie</q-item-label>
        <!-- tag="label" = klik kamkoľvek na riadok prepne toggle; bez v-close-popup, menu ostane otvorené. -->
        <q-item tag="label">
          <q-item-section avatar>
            <q-icon name="alternate_email" size="18px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Iba adresované správy</q-item-label>
            <q-item-label caption>Len správy s @{{ me.nickName }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <!-- :model-value + @update:model-value namiesto v-model: zmena ide cez akciu store,
            nie priamym zápisom do cudzieho store (v-model je len skratka týchto dvoch). -->
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

// Stavy podľa UC 9 a čo pre používateľa znamenajú. value = čo sa ukladá (UserStatus),
// label = čo sa zobrazí, hint = vysvetlenie pod ním.
const STATUS_OPTIONS: { value: UserStatus; label: string; hint: string }[] = [
  { value: 'online', label: 'Online', hint: 'Správy aj notifikácie' },
  { value: 'dnd', label: 'Nerušiť', hint: 'Bez notifikácií' },
  { value: 'offline', label: 'Offline', hint: 'Neprichádzajú nové správy' },
];

export default defineComponent({
  name: 'UserMenu',

  // Konštantu zhora treba dať do data, inak ju šablóna (v-for) nevidí.
  data() {
    return {
      statusOptions: STATUS_OPTIONS,
    };
  },

  // Prihlásený používateľ (skratka pre šablónu).
  computed: {
    ...mapStores(useUsersStore),

    me(): User | undefined {
      return this.usersStore.currentUser;
    },
  },

  methods: {
    // Funkcie z utils treba pridať do methods, inak ich šablóna nevidí.
    avatarHue,
    initials,

    // 'dnd' → 'Nerušiť' (text pod menom); ?? status = poistka, keby stav v zozname nebol.
    statusLabel(status: UserStatus): string {
      return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
    },

    // Volá ju toggle s novou hodnotou; zmena ide cez akciu users store.
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
  min-width: 260px;
}
.user-menu-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px 12px;
}
.user-menu-head-text {
  min-width: 0;
}
.user-menu-nick {
  color: var(--text-subtle);
  font-size: 0.8125rem;
}
.user-menu-active {
  background: var(--accent-soft);
  color: var(--text);
}
.user-menu-check {
  color: var(--accent);
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
