<template>
  <section>
    <h1 class="auth-title">Create an account</h1>
    <p class="auth-subtitle">Pick a nickname others will use to reach you.</p>
    <q-btn unelevated no-caps class="auth-submit" label="Create account" to="/" />
    <p class="auth-switch">
      Already have an account? <router-link to="/login">Log in</router-link>
    </p>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'RegisterPage',
});
</script>
