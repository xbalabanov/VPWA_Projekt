// src/stores/users.ts
// pouzivatelia (falosne data), prihlasenie a registracia (UC1), stav a notifikacie (UC 8, 9)
// prva faza - ziadny backend - vsetko zije v pamäti prehliadaca pomocou Pinia store
import { defineStore } from 'pinia';
import type { User, UserStatus } from '../types/models';

interface UsersState {
  users: User[];
  currentUserId: number | null; // prihlásený používateľ, null -> nikto nie je prihlásený
}

export const useUsersStore = defineStore('users', {
  state: (): UsersState => ({
    // Falošné dáta pre prototyp. Neskôr ich nahradí backend.
    users: [
      {
        id: 1,
        firstName: 'Ed',
        lastName: 'Novák',
        nickName: 'ed',
        email: 'ed@example.com',
        status: 'online',
        notifyMentionsOnly: false,
        password: '123456',
      },
      {
        id: 2,
        firstName: 'Jana',
        lastName: 'Kováčová',
        nickName: 'jana',
        email: 'jana@example.com',
        status: 'dnd',
        notifyMentionsOnly: false,
        password: '123456',
      },
      {
        id: 3,
        firstName: 'Peter',
        lastName: 'Horváth',
        nickName: 'peter',
        email: 'peter@example.com',
        status: 'offline',
        notifyMentionsOnly: false,
        password: '123456',
      },
      {
        id: 4,
        firstName: 'Mária',
        lastName: 'Szabová',
        nickName: 'maria',
        email: 'maria@example.com',
        status: 'online',
        notifyMentionsOnly: true,
        password: '123456',
      },
      {
        id: 5,
        firstName: 'Tomáš',
        lastName: 'Varga',
        nickName: 'tomas',
        email: 'tomas@example.com',
        status: 'online',
        notifyMentionsOnly: false,
        password: '123456',
      },
    ],
    currentUserId: null,
  }),

  getters: {
    currentUser: (state): User | undefined => state.users.find((u) => u.id === state.currentUserId),

    isLoggedIn: (state): boolean => state.currentUserId !== null,

    // Použitie: usersStore.userById(2)
    userById:
      (state) =>
      (id: number): User | undefined =>
        state.users.find((u) => u.id === id),

    // Unikátnosť bez ohľadu na veľké/malé písmená (Jana = jana).
    // RegisterPage ich volá v :rules, lazy-rules -> chyba je vidno az po opusteni pola
    isEmailTaken:
      (state) =>
      (email: string): boolean =>
        state.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase()),

    isNickNameTaken:
      (state) =>
      (nickName: string): boolean =>
        state.users.some((u) => u.nickName.toLowerCase() === nickName.toLowerCase()),

    userByNickName:
      (state) =>
      (nickName: string): User | undefined =>
        state.users.find((u) => u.nickName.toLowerCase() === nickName.toLowerCase()),
  },

  actions: {
    // Vráti true pri úspechu, aby LoginPage vedela, či má presmerovať alebo ukázať chybu.
    login(email: string, password: string): boolean {
      const user = this.users.find(
        (u) => u.email === email.trim().toLowerCase() && u.password === password,
      );
      if (!user) return false;
      this.currentUserId = user.id;
      return true;
    },

    register(data: {
      firstName: string;
      lastName: string;
      nickName: string;
      email: string;
      password: string;
    }): string | null {
      //email a nickname musia byt unikat (formular to kontroluje tiez, toto je poistka - store sa nemoze spoliehat len na UI)
      if (this.isEmailTaken(data.email)) return 'Email je už použitý';
      if (this.isNickNameTaken(data.nickName)) return 'NickName je už obsadený';
      const email = data.email.trim().toLowerCase();

      //nové id = najvacsie + 1 nez spravime databazu
      //kym nemame databazu, id pridelujeme sami
      const id = Math.max(0, ...this.users.map((u) => u.id)) + 1;

      // ...data skopiruje vsetky polia z formulara, email ukladame malymi pismenami, aby prihlasenie fungovalo bez ohladu na velkost pismen
      this.users.push({ ...data, email, id, status: 'online', notifyMentionsOnly: false });

      //po registracii rovno prihlasime (UC1)
      this.currentUserId = id;
      return null;
    },

    logout(): void {
      this.currentUserId = null;
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
