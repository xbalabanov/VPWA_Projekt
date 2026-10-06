<template>
  <section>
    <h1 class="auth-title">Log in</h1>
    <p class="auth-subtitle">Welcome back. Your channels are waiting.</p>
    <q-btn unelevated no-caps class="auth-submit" label="Log in" to="/" />
    <p class="auth-switch">New here? <router-link to="/register">Create an account</router-link></p>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LoginPage',
});
</script>
