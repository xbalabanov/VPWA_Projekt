<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="auth-page">
        <main class="auth-panel">
          <div class="auth-brand">
            <span class="auth-mark" aria-hidden="true">V</span>
            VPWA Chat
          </div>
          <router-view />
        </main>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AuthLayout',
});
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: var(--bg);
}
.auth-panel {
  width: 100%;
  max-width: 380px;
  padding: 32px 28px 28px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  color: var(--text);
}
.auth-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  font-size: 0.9375rem;
  font-weight: 700;
}
.auth-mark {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 0.875rem;
  font-weight: 800;
}

/* Spoločné štýly pre LoginPage a RegisterPage (vnorené stránky v tomto layoute). */
.auth-panel :deep(.auth-title) {
  margin: 0 0 4px;
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0;
}
.auth-panel :deep(.auth-subtitle) {
  margin: 0 0 24px;
  color: var(--text-muted);
}
.auth-panel :deep(.auth-submit) {
  width: 100%;
  min-height: 42px;
  border-radius: 9px;
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 600;
}
.auth-panel :deep(.auth-switch) {
  margin: 20px 0 0;
  color: var(--text-muted);
  text-align: center;
}
.auth-panel :deep(.auth-switch a) {
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}
.auth-panel :deep(.auth-switch a:hover) {
  text-decoration: underline;
}
</style>
