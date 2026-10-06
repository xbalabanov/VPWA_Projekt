<!-- Zoznam členov aktívneho kanála (UC 10).
     Vlastník: Maksym (A6), review: Stanislav. -->
<template>
  <section aria-label="Members">
    <div class="section-label">Members</div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MembersList',
});
</script>

<style scoped>
.section-label {
  padding: 8px 10px 6px;
  color: var(--text-subtle);
  font-size: 0.75rem;
  font-weight: 600;
}
</style>
