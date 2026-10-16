<template>
  <section>
    <h1 class="auth-title">Prihlásenie</h1>
    <p class="auth-subtitle">Prihlás sa a pokračuj v rozhovoroch.</p>

    <q-form @submit="onSubmit" class="q-gutter-md">
      <q-input
        v-model="email"
        label="Email"
        type="email"
        outlined
        :rules="[
          (val) => !!val || 'Zadaj email',
          (val) => val.includes('@') || 'Email musí obsahovať @',
        ]"
      />

      <q-input
        v-model="password"
        label="Heslo"
        type="password"
        outlined
        :rules="[(val) => val.length >= 6 || 'Aspoň 6 znakov']"
      />

      <q-btn unelevated no-caps class="auth-submit" label="Prihlásiť sa" type="submit" />
    </q-form>

    <p class="auth-switch">Nemáš účet? <router-link to="/register">Zaregistruj sa</router-link></p>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useUsersStore } from '../stores/users';
import { useChannelsStore } from '../stores/channels';

export default defineComponent({
  name: 'LoginPage',

  data() {
    return {
      email: '',
      password: '',
    };
  },

  methods: {
    onSubmit() {
      const ok = useUsersStore().login(this.email, this.password);
      if (!ok) {
        this.$q.notify({ message: 'Nesprávny email alebo heslo', color: 'negative' });
        return;
      }
      this.$q.notify({ message: 'Prihlásený', color: 'positive' });
      useChannelsStore().selectFirstChannel();
      void this.$router.push('/');
    },
  },
});
</script>
