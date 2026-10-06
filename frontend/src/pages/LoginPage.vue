<template>
  <q-page class="flex flex-center">
    <q-form @submit="onSubmit" class="q-gutter-md" style="width: 320px">
      <q-input
        v-model="email"
        label="Email"
        type="email"
        outlined
        :rules="[(val) => !!val || 'Zadaj email', (val) => val.includes('@') || 'Email musi obsahovat @']"
      />

    <p>Email v data: "{{ email }}"</p>
    
      <q-input
        v-model="password"
        label="Heslo"
        type="password"
        outlined
        :rules="[(val) => val.length >= 6 || 'Aspoň 6 znakov']"
      />

      <q-btn label="Prihlásiť" type="submit" color="primary" />
    </q-form>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

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
      console.log('Formulár je platný', this.email);
      this.$q.notify({ message: 'Prihlásený', color: 'positive' })
    },
  },
});
</script>