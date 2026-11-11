import { defineRouter } from '#q-app';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';

import { useUsersStore } from '@/stores/users';
import { setUnauthorizedHandler } from '@/services/api';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  });

  // Server odmietol session (401): zmažeme lokálne dáta a z chránenej stránky ideme na login.
  // Na login/register nepresmerujeme, tam 401 nevadí.
  setUnauthorizedHandler(() => {
    useUsersStore().clearLocalData();
    if (Router.currentRoute.value.meta.requiresAuth) void Router.push('/login');
  });

  //neprihlaseny pouzivatel sa nedostane na chranene stranky
  // https://router.vuejs.org/guide/advanced/navigation-guards.html
  Router.beforeEach(async (to) => {
    const usersStore = useUsersStore();
    // Po F5 najprv overíme session na serveri, až potom rozhodneme o presmerovaní.
    if (!usersStore.profileLoaded) await usersStore.fetchProfile();

    if (to.meta.requiresAuth && !usersStore.isLoggedIn) return '/login';
    //prihlaseny nema dovod ist na login/register
    if ((to.path === '/login' || to.path === '/register') && usersStore.isLoggedIn) return '/';
  });

  return Router;
});
