<!-- Registracia (UC1), po nej je pouzivatel rovno prihlaseny. Vlastnik: Stanislav (A1). -->

<template>
  <section>
    <h1 class="auth-title">Vytvoriť účet</h1>
    <p class="auth-subtitle">Zvoľ si nick, cez ktorý ťa ostatní oslovia (@nick).</p>

    <!-- @submit sa zavolá iba ak prejdú všetky :rules -->
    <!-- lazy-rules: chyby sa ukazu az po opusteni pola, nie po kazdom characteri -> menej requestov. Zdroj: https://v2.quasar.dev/vue-components/input#internal-validation -->
    <q-form @submit="onSubmit" class="q-gutter-xs">
      <!-- meno a priezvisko vedla seba, aby sa formular zmestil bez scrollovania -->
      <div class="name-row">
        <q-input
          v-model="firstName"
          label="Meno"
          outlined
          lazy-rules
          dense
          :rules="[(val) => !!val.trim() || 'Zadaj meno']"
        />

        <q-input
          v-model="lastName"
          label="Priezvisko"
          outlined
          lazy-rules
          dense
          :rules="[(val) => !!val.trim() || 'Zadaj priezvisko']"
        />
      </div>

      <q-input
        v-model="nickName"
        label="Nick"
        outlined
        lazy-rules
        dense
        :rules="[
          (val) => !!val || 'Zadaj nick',
          // bez medzier a @, aby neskôr fungovalo @nickname aj /invite nickName
          (val) => isValidNickName(val) || 'Iba pismena, cisla, _ . - (nesmie koncit . ani -)',
          (val) => !usersStore.isNickNameTaken(val) || 'Tento nick je už obsadený',
        ]"
      />

      <q-input
        v-model="email"
        label="Email"
        type="email"
        outlined
        lazy-rules
        dense
        :rules="[
          (val) => !!val || 'Zadaj email',
          (val) => val.includes('@') || 'Email musí obsahovať @',
          (val) => !usersStore.isEmailTaken(val) || 'Email je už použitý',
        ]"
      />

      <q-input
        v-model="password"
        label="Heslo"
        type="password"
        outlined
        lazy-rules
        dense
        :rules="[(val) => val.length >= 6 || 'Aspoň 6 znakov']"
      />

      <q-input
        v-model="passwordAgain"
        label="Heslo znova"
        type="password"
        outlined
        lazy-rules
        dense
        :rules="[(val) => val === password || 'Heslá sa nezhodujú']"
      />

      <q-btn unelevated no-caps class="auth-submit" label="Vytvoriť účet" type="submit" />
    </q-form>

    <p class="auth-switch">Už máš účet? <router-link to="/login">Prihlás sa</router-link></p>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { useUsersStore } from '../stores/users';
import { useChannelsStore } from '../stores/channels';
import { NICK_NAME_PATTERN } from '../utils/mentions';

export default defineComponent({
  name: 'RegisterPage',

  computed: {
    // Sprístupní this.usersStore (aj v template ako usersStore), rovnako ako v MainLayout.
    ...mapStores(useUsersStore),
  },

  data() {
    return {
      firstName: '',
      lastName: '',
      nickName: '',
      email: '',
      password: '',
      passwordAgain: '',
    };
  },

  methods: {
    //rovnaky vzor ako pri @zmienkach, inak by sa niektori pouzivatelia nedali zmienit
    isValidNickName(val: string): boolean {
      return NICK_NAME_PATTERN.test(val);
    },

    onSubmit() {
      // passwordAgain do store neposielame, slúži iba na kontrolu vo formulári
      const error = this.usersStore.register({
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        nickName: this.nickName,
        email: this.email,
        password: this.password,
      });

      if (error) {
        this.$q.notify({ message: error, color: 'negative' });
        return;
      }

      this.$q.notify({ message: 'Účet vytvorený', color: 'positive' });
      useChannelsStore().selectFirstChannel();
      void this.$router.push('/');
    },
  },
});
</script>

<style scoped>
/* meno a priezvisko vedľa seba, rovnako široké, zarovnané s ostatnými poľami */
.name-row {
  display: flex;
  gap: 8px;
}
.name-row > * {
  flex: 1;
}
</style>
