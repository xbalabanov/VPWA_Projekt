<template>
  <section>
    <h1 class="auth-title">Log in</h1>
    <p class="auth-subtitle">Welcome back. Your channels are waiting.</p>

    <q-form @submit="onSubmit" class="q-gutter-md">
      <q-input
        v-model="email"
        label="Email"
        type="email"
        outlined
        :rules="[
          (val) => !!val || 'Zadaj email',
          (val) => val.includes('@') || 'Email musi obsahovat @',
        ]"
      />

      <q-input
        v-model="password"
        label="Heslo"
        type="password"
        outlined
        :rules="[(val) => val.length >= 6 || 'Aspoň 6 znakov']"
      />

      <q-btn unelevated no-caps class="auth-submit" label="Log in" type="submit" />
    </q-form>

    <p class="auth-switch">New here? <router-link to="/register">Create an account</router-link></p>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useUsersStore } from '../stores/users';

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
        this.$q.notify({ message: 'Invalid name or password', color: 'negative' });
        return;
      }
      this.$q.notify({ message: 'Prihlásený', color: 'positive' });
      void this.$router.push('/');
    },
  },
});
</script>
