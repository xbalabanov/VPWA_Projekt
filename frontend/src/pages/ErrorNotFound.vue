<!-- Stránka pre neexistujúcu adresu (route catchAll v routes.ts).
     Rovnaké farby a písmo ako zvyšok aplikácie, nie predvolená modrá šablóna Quasaru. -->
<template>
  <main class="not-found">
    <div class="not-found-code" aria-hidden="true">404</div>
    <h1 class="not-found-title">Táto stránka neexistuje</h1>
    <p class="not-found-text">Adresa je zlá alebo stránka bola presunutá.</p>
    <q-btn unelevated no-caps color="primary" icon="arrow_back" label="Späť do chatu" to="/" />
  </main>
</template>

<style scoped>
.not-found {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  padding: 24px 16px;
  background: var(--bg);
  color: var(--text);
  text-align: center;
}
.not-found-code {
  color: var(--accent);
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
}
.not-found-title {
  margin: 8px 0 0;
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
}
.not-found-text {
  margin: 0 0 16px;
  color: var(--text-muted);
}
</style>
