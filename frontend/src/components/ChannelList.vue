<!-- Zoznam kanálov prihláseného používateľa (UC 2).
     Vlastník: Stanislav (A2, A3). -->
<template>
  <q-list>
    <!-- Pozvánky: zvýraznené a navrchu (UC 2), s jasnými tlačidlami prijať/odmietnuť. -->
    <template v-if="channelsStore.myInvitations.length">
      <div class="section-head">
        <span>Pozvánky</span>
        <span class="section-count tabular">{{ channelsStore.myInvitations.length }}</span>
      </div>
      <div
        v-for="invitation in channelsStore.myInvitations"
        :key="'inv-' + invitation.id"
        class="invite"
      >
        <div class="invite-title">
          <q-icon name="mail" size="16px" class="invite-icon" />
          <span class="invite-name">{{ channelName(invitation.channelId) }}</span>
        </div>
        <div class="invite-from">from {{ nickName(invitation.invitedById) }}</div>
        <div class="invite-actions">
          <q-btn
            unelevated
            dense
            no-caps
            size="sm"
            label="Pridať sa"
            class="invite-join"
            @click="accept(invitation.id)"
          />
          <q-btn
            flat
            dense
            no-caps
            size="sm"
            label="Odmietnuť"
            class="invite-decline"
            @click="decline(invitation.id)"
          />
        </div>
      </div>
    </template>

    <!-- Kanály, v ktorých je používateľ členom; + v hlavičke sekcie vytvorí nový (UC 2). -->
    <div class="section-head">
      <span>Kanály</span>
      <span class="section-count tabular">{{ channelsStore.myChannels.length }}</span>
      <q-space />
      <q-btn
        flat
        round
        dense
        size="sm"
        icon="add"
        class="section-add"
        aria-label="Vytvoriť kanál"
        @click="createOpen = true"
      >
        <q-tooltip>Vytvoriť kanál</q-tooltip>
      </q-btn>
    </div>
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
        <q-icon :name="channel.isPrivate ? 'lock' : 'tag'" size="16px" />
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
          aria-label="Možnosti kanála"
          @click.stop
        >
          <q-menu>
            <q-list dense>
              <q-item
                v-if="amAdmin(channel.id)"
                v-close-popup
                clickable
                class="item-danger"
                @click="remove(channel.id)"
              >
                <q-item-section avatar><q-icon name="delete_outline" size="18px" /></q-item-section>
                <q-item-section>Zrušiť kanál</q-item-section>
              </q-item>
              <q-item v-else v-close-popup clickable @click="leave(channel.id)">
                <q-item-section avatar><q-icon name="logout" size="18px" /></q-item-section>
                <q-item-section>Opustiť kanál</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-item-section>
    </q-item>

    <!-- Vytvorenie kanála (UC 2). Pravidlá názvu sú rovnaké ako pri /join channelName. -->
    <q-dialog v-model="createOpen">
      <q-card class="create-card">
        <q-form @submit="create">
          <q-card-section class="create-head">
            <div class="create-icon">
              <q-icon :name="newPrivate ? 'lock' : 'tag'" size="20px" />
            </div>
            <div>
              <div class="text-h6">Nový kanál</div>
              <p class="create-sub">Miesto na rozhovor o jednej téme.</p>
            </div>
          </q-card-section>

          <q-card-section class="create-body">
            <q-input
              v-model="newName"
              label="Názov"
              outlined
              autofocus
              prefix="#"
              hint="Písmená, čísla, _ . - (bez medzier)"
              :rules="[
                (val) => !!val.trim() || 'Zadaj názov',
                // bez medzier, aby fungovalo aj /join channelName
                (val) => /^[A-Za-z0-9_.-]+$/.test(val) || 'Iba písmená, čísla, _ . -',
                (val) => !channelsStore.channelByName(val) || 'Kanál s týmto názvom už existuje',
              ]"
            />

            <!-- Súkromný kanál ako riadok s vysvetlením; klik kamkoľvek prepne toggle. -->
            <q-item tag="label" class="create-private">
              <q-item-section>
                <q-item-label>Súkromný kanál</q-item-label>
                <q-item-label caption>Pridať sa môžu len pozvaní.</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle v-model="newPrivate" />
              </q-item-section>
            </q-item>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn v-close-popup flat no-caps label="Zrušiť" class="create-cancel" />
            <q-btn unelevated no-caps color="primary" label="Vytvoriť kanál" type="submit" />
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

    // Kto pozval (pozvánka má iba id používateľa).
    nickName(userId: number): string {
      return this.usersStore.userById(userId)?.nickName ?? 'someone';
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
          title: `Zrušiť #${this.channelName(channelId)}?`,
          message: 'Kanál aj s celou históriou zmizne pre všetkých členov.',
          cancel: { label: 'Späť', flat: true, noCaps: true },
          ok: { label: 'Zrušiť kanál', color: 'negative', unelevated: true, noCaps: true },
        })
        .onOk(() => this.showError(this.channelsStore.deleteChannel(channelId)));
    },

    create(): void {
      const error = this.channelsStore.createChannel(this.newName, this.newPrivate);
      if (error) {
        this.showError(error);
        return;
      }
      //zavriet a vycistit dialog, aby bol pri dalsom otvoreni prazdny
      this.createOpen = false;
      this.newName = '';
      this.newPrivate = false;
      this.$emit('select', this.channelsStore.activeChannelId);
    },
  },
});
</script>

<style scoped>
/* Hlavička sekcie: názov + počet, pri kanáloch aj tlačidlo + na vytvorenie. */
.section-head {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  margin-top: 14px;
  padding: 0 4px 4px 8px;
  color: var(--text-subtle);
  font-size: 0.75rem;
  font-weight: 600;
}
.section-head:first-child {
  margin-top: 0;
}
.section-count {
  padding: 0 6px;
  border-radius: 999px;
  background: var(--hover);
  font-size: 0.6875rem;
  line-height: 16px;
}
.section-add {
  color: var(--text-muted);
}

/* Pozvánka: malá karta v akcentovej farbe, aby sa nedala prehliadnuť. */
.invite {
  margin: 0 0 6px;
  padding: 10px 10px 8px;
  border: 1px solid color-mix(in oklch, var(--accent) 35%, var(--border));
  border-radius: var(--radius);
  background: var(--accent-soft);
}
.invite-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 650;
}
.invite-icon {
  color: var(--accent);
}
.invite-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.invite-from {
  margin: 1px 0 8px 22px;
  color: var(--text-muted);
  font-size: 0.75rem;
}
.invite-actions {
  display: flex;
  gap: 6px;
  margin-left: 22px;
}
.invite-join {
  padding: 0 12px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 600;
}
.invite-decline {
  padding: 0 10px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}

.channel-item {
  min-height: 34px;
  margin: 1px 0;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition:
    background-color 150ms cubic-bezier(0.25, 1, 0.5, 1),
    color 150ms cubic-bezier(0.25, 1, 0.5, 1);
}
.channel-item:hover {
  background: var(--hover);
  color: var(--text);
}
.channel-item-icon {
  min-width: 24px;
  padding-right: 0;
  color: inherit;
  opacity: 0.75;
}
.channel-item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Aktívny kanál: svetlejšia plocha s rámikom, bez tieňa. */
.channel-item-active,
.channel-item-active:hover {
  border-color: var(--border);
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
}
.channel-item-active .channel-item-icon {
  color: var(--accent);
  opacity: 1;
}

.channel-item-more {
  opacity: 0;
  transition: opacity 150ms cubic-bezier(0.25, 1, 0.5, 1);
}
/* Menu kanála sa ukáže pri prejdení myšou, pri aktívnom kanáli a pri fokuse klávesnicou. */
.channel-item:hover .channel-item-more,
.channel-item-active .channel-item-more,
.channel-item-more:focus-visible {
  opacity: 0.7;
}

/* Dialóg vytvorenia kanála (vzhľad karty, menu a polí je globálne v app.scss). */
.create-card {
  width: 100%;
  max-width: 420px;
}
.create-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 20px 4px;
}
.create-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  place-items: center;
  border-radius: var(--radius);
  background: var(--accent-soft);
  color: var(--accent);
}
.create-sub {
  margin: 2px 0 0;
  color: var(--text-muted);
}
.create-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 20px 4px;
}
.create-private {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.create-cancel {
  color: var(--text-muted);
}

@media (max-width: 599px) {
  .channel-item {
    min-height: 44px;
  }
  .channel-item-more {
    opacity: 0.7;
  }
}
</style>
