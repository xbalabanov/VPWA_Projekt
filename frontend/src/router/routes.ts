// src/router/routes.ts
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    // Chat (hlavná aplikácia). requiresAuth použije route guard (osoba A, UC 1).
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [{ path: '', component: () => import('../pages/ChatPage.vue') }],
  },
  {
    path: '/login',
    component: () => import('../layouts/AuthLayout.vue'),
    children: [{ path: '', component: () => import('../pages/LoginPage.vue') }],
  },
  {
    path: '/register',
    component: () => import('../layouts/AuthLayout.vue'),
    children: [{ path: '', component: () => import('../pages/RegisterPage.vue') }],
  },

  // Vždy ako posledná.
  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound.vue'),
  },
];

export default routes;
