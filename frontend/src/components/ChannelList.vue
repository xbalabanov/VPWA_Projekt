<!-- Zoznam kanálov prihláseného používateľa (UC 2).
     Vlastník: Stanislav (A2, A3). -->
<template>
  <q-list>
    <!-- Pozvánky: zvýraznené a navrchu (UC 2) -->
    <q-item
      v-for="invitation in channelsStore.myInvitations"
      :key="'inv-' + invitation.id"
      class="channel-item channel-item-invite"
    >
      <q-item-section avatar class="channel-item-icon">
        <q-icon name="mail" size="18px" />
      </q-item-section>
      <q-item-section class="channel-item-name">
        {{ channelName(invitation.channelId) }}
      </q-item-section>
      <q-item-section side>
        <div class="row no-wrap">
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="check"
            aria-label="Accept invitation"
            @click="accept(invitation.id)"
          />
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="close"
            aria-label="Decline invitation"
            @click="decline(invitation.id)"
          />
        </div>
      </q-item-section>
    </q-item>

    <!-- Kanály, v ktorých je používateľ členom -->
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
      <q-item-section side>
        <!-- .stop: klik na tlačidlo nemá zároveň vybrať kanál  -->
        <q-btn
          flat
          round
          dense
          size="sm"
          icon="more_horiz"
          class="channel-item-more"
          aria-label="Channel options"
          @click.stop
        >
          <q-menu>
            <q-list dense>
              <q-item
                v-if="amAdmin(channel.id)"
                v-close-popup
                clickable
                @click="remove(channel.id)"
              >
                <q-item-section>Zrušiť kanál</q-item-section>
              </q-item>
              <q-item v-else v-close-popup clickable @click="leave(channel.id)">
                <q-item-section>Opustiť kanál</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-item-section>
    </q-item>

    <!-- Vytvorenie kanála (UC 2): otvorí dialóg nižšie -->
    <q-item clickable class="channel-item" @click="createOpen = true">
      <q-item-section avatar class="channel-item-icon">
        <q-icon name="add" size="18px" />
      </q-item-section>
      <q-item-section>Vytvoriť kanál</q-item-section>
    </q-item>

    <q-dialog v-model="createOpen">
      <q-card class="create-card">
        <q-form @submit="create">
          <q-card-section class="text-h6">Nový kanál</q-card-section>
          <q-card-section>
            <q-input
              v-model="newName"
              label="Názov kanála"
              outlined
              dense
              autofocus
              :rules="[
                (val) => !!val.trim() || 'Zadaj názov',
                // bez medzier, aby fungovalo aj /join channelName
                (val) => /^[A-Za-z0-9_.-]+$/.test(val) || 'Iba písmená, čísla, _ . -',
                (val) => !channelsStore.channelByName(val) || 'Kanál už existuje',
              ]"
            />
            <q-toggle v-model="newPrivate" label="Súkromný kanál" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn v-close-popup flat no-caps label="Zrušiť" />
            <q-btn unelevated no-caps color="primary" label="Vytvoriť" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-list>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { useChannelsStore } from '../stores/channels';
import { useUsersStore } from '../stores/users';

export default defineComponent({
  name: 'ChannelList',

  // Layout na udalosť zavrie panel na mobile, aby bolo vidno správy.
  emits: ['select'],

  computed: {
    // Zdroj: https://pinia.vuejs.org/cookbook/options-api.html
    ...mapStores(useChannelsStore, useUsersStore),
  },

  data() {
    return {
      createOpen: false,
      newName: '',
      newPrivate: false,
    };
  },

  methods: {
    selectChannel(id: number): void {
      this.channelsStore.setActiveChannel(id);
      this.$emit('select', id);
    },

    // Pozvánka má iba channelId, názov si dohľadáme.
    channelName(channelId: number): string {
      return this.channelsStore.channels.find((c) => c.id === channelId)?.name ?? '';
    },

    amAdmin(channelId: number): boolean {
      const userId = this.usersStore.currentUserId;
      return userId !== null && this.channelsStore.isAdmin(channelId, userId);
    },

    // Akcie vracajú null alebo text chyby, chybu ukážeme ako notifikáciu.
    showError(error: string | null): void {
      if (error) this.$q.notify({ message: error, color: 'negative' });
    },

    accept(invitationId: number): void {
      this.showError(this.channelsStore.acceptInvitation(invitationId));
    },

    decline(invitationId: number): void {
      this.showError(this.channelsStore.declineInvitation(invitationId));
    },

    leave(channelId: number): void {
      this.showError(this.channelsStore.leaveChannel(channelId));
    },

    // Zrušenie je nevratné, preto sa najprv opýtame (Quasar Dialog plugin).
    remove(channelId: number): void {
      this.$q
        .dialog({
          title: 'Zrušiť kanál?',
          message: `Kanál ${this.channelName(channelId)} zanikne pre všetkých členov.`,
          cancel: true,
          ok: { label: 'Zrušiť', color: 'negative' },
        })
        .onOk(() => this.showError(this.channelsStore.deleteChannel(channelId)));
    },

    create(): void {
      const error = this.channelsStore.createChannel(this.newName, this.newPrivate);
      if (error) {
        this.showError(error);
        return;
      }
      //zavriet a vycistit dialog pre dalsie pouzitie
      this.createOpen = false;
      this.newName = '';
      this.newPrivate = false;
      this.$emit('select', this.channelsStore.activeChannelId);
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

.channel-item-invite {
  background: var(--accent-soft);
  color: var(--text);
  font-weight: 600;
}

.channel-item-more {
  opacity: 0.6;
}

.create-card {
  width: 100%;
  max-width: 360px;
}

@media (max-width: 599px) {
  .channel-item {
    min-height: 44px;
  }
}
</style>
