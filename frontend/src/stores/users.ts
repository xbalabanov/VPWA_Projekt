// src/stores/users.ts
// prihlasenie, registracia a odhlasenie cez backend (UC1), stav a notifikacie (UC 8, 9)
// Prihlasenie drzi server v session (HttpOnly cookie), store si pamata iba profil.
import { defineStore } from 'pinia';
import type { Member, User, UserStatus } from '../types/models';
import { ApiError, apiRequest, jsonBody } from '../services/api.ts';
import { useChannelsStore } from './channels.ts';
import { useMessagesStore } from './messages.ts';

interface UsersState {
  // Používatelia, ktorých poznáme (ja + členovia kanálov). Nie je to zoznam všetkých z DB.
  users: User[];
  currentUserId: number | null; // prihlásený používateľ, null -> nikto nie je prihlásený
  profileLoaded: boolean; // uz sme sa po starte appky (F5) spytali servera na session?
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  nickName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

// Text chyby pre používateľa. Server posiela slovenské hlášky validácie.
function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Server je nedostupný, skús to znova';
}

export const useUsersStore = defineStore('users', {
  state: (): UsersState => ({
    users: [],
    currentUserId: null,
    profileLoaded: false,
  }),

  getters: {
    currentUser: (state): User | undefined => state.users.find((u) => u.id === state.currentUserId),

    isLoggedIn: (state): boolean => state.currentUserId !== null,

    // Použitie: usersStore.userById(2)
    userById:
      (state) =>
      (id: number): User | undefined =>
        state.users.find((u) => u.id === id),

    userByNickName:
      (state) =>
      (nickName: string): User | undefined =>
        state.users.find((u) => u.nickName.toLowerCase() === nickName.toLowerCase()),
  },

  actions: {
    // Pridá alebo aktualizuje používateľa v zozname známych (napr. po načítaní členov kanála).
    // Člen kanála prichádza bez emailu a nastavení, preto údaje iba doplníme a už známe
    // (napr. môj email) neprepíšeme.
    rememberUser(user: Member | User): void {
      const index = this.users.findIndex((u) => u.id === user.id);
      const known = this.users[index];
      if (known) this.users[index] = { ...known, ...user };
      else this.users.push({ email: '', notifyMentionsOnly: false, ...user });
    },

    setCurrentUser(user: User): void {
      this.rememberUser(user);
      this.currentUserId = user.id;
      // Po prihlásení načítame kanály a pozvánky a začneme ich priebežne obnovovať.
      useChannelsStore().startSync();
    },

    // Po F5 je store prázdny. Spýtame sa servera, či session cookie ešte platí.
    // Volá ho router guard pred prvou navigáciou.
    async fetchProfile(): Promise<void> {
      try {
        this.setCurrentUser(await apiRequest<User>('/account/profile'));
      } catch {
        // 401 alebo nedostupný server -> nie sme prihlásení
        this.currentUserId = null;
      }
      this.profileLoaded = true;
    },

    // Vráti null pri úspechu, inak text chyby (LoginPage ho ukáže).
    async login(email: string, password: string): Promise<string | null> {
      try {
        const user = await apiRequest<User>('/auth/login', jsonBody('POST', { email, password }));
        this.setCurrentUser(user);
        return null;
      } catch (error) {
        // 400 = zlý email alebo heslo (server neprezradí, ktoré z toho)
        if (error instanceof ApiError && error.status === 400) return 'Nesprávny email alebo heslo';
        return errorText(error);
      }
    },

    // Registrácia, po nej je používateľ rovno prihlásený (UC1).
    // Unikátnosť nicku a emailu overuje server, chyba príde ako 422 so slovenskou hláškou.
    async register(data: RegisterData): Promise<string | null> {
      try {
        const user = await apiRequest<User>('/auth/signup', jsonBody('POST', data));
        this.setCurrentUser(user);
        return null;
      } catch (error) {
        return errorText(error);
      }
    },

    async logout(): Promise<void> {
      try {
        await apiRequest('/account/logout', { method: 'POST' });
      } catch {
        // aj keď server neodpovie, lokálne dáta nižšie zmažeme
      }
      this.clearLocalData();
    },

    // Po odhlásení alebo 401 nesmú v prehliadači ostať dáta predošlého používateľa.
    clearLocalData(): void {
      this.users = [];
      this.currentUserId = null;
      useChannelsStore().stopSync();
      useChannelsStore().$reset();
      useMessagesStore().clearSession();
    },

    // Zmena stavu prihláseného používateľa (UC 9). Ostatní ho uvidia v zozname členov.
    setStatus(status: UserStatus): void {
      const me = this.currentUser;
      if (me) me.status = status;
    },

    // UC 8: notifikácie iba pre správy, ktoré ma zmieňujú (@nickname).
    setNotifyMentionsOnly(value: boolean): void {
      const me = this.currentUser;
      if (me) me.notifyMentionsOnly = value;
    },
  },
});
