<template>
  <section>
    <h1 class="auth-title">Create an account</h1>
    <p class="auth-subtitle">Pick a nickname others will use to reach you.</p>

    <!-- @submit sa zavolá iba ak prejdú všetky :rules -->
    <q-form @submit="onSubmit" class="q-gutter-xs">
      <!-- meno a priezvisko vedla seba, aby sa formular zmestil bez scrollovania -->
      <div class="name-row">
        <q-input
          v-model="firstName"
          label="Meno"
          outlined
          dense
          :rules="[(val) => !!val.trim() || 'Zadaj meno']"
        />

        <q-input
          v-model="lastName"
          label="Priezvisko"
          outlined
          dense
          :rules="[(val) => !!val.trim() || 'Zadaj priezvisko']"
        />
      </div>

      <q-input
        v-model="nickName"
        label="NickName"
        outlined
        dense
        :rules="[
          (val) => !!val || 'Zadaj nickName',
          // bez medzier a @, aby neskôr fungovalo @nickname aj /invite nickName
          (val) => /^[A-Za-z0-9_.-]+$/.test(val) || 'Iba písmená, čísla, _ . -',
          (val) => !usersStore.isNickNameTaken(val) || 'NickName je už obsadený',
        ]"
      />

      <q-input
        v-model="email"
        label="Email"
        type="email"
        outlined
        dense
        :rules="[
          (val) => !!val || 'Zadaj email',
          (val) => val.includes('@') || 'Email musi obsahovat @',
          (val) => !usersStore.isEmailTaken(val) || 'Email je už použitý',
        ]"
      />

      <q-input
        v-model="password"
        label="Heslo"
        type="password"
        outlined
        dense
        :rules="[(val) => val.length >= 6 || 'Aspoň 6 znakov']"
      />

      <q-input
        v-model="passwordAgain"
        label="Heslo znova"
        type="password"
        outlined
        dense
        :rules="[(val) => val === password || 'Heslá sa nezhodujú']"
      />

      <q-btn unelevated no-caps class="auth-submit" label="Create account" type="submit" />
    </q-form>

    <p class="auth-switch">
      Already have an account? <router-link to="/login">Log in</router-link>
    </p>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { useUsersStore } from '../stores/users';

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
