// src/stores/users.ts
// Spoločný základ: falošní používatelia a jednoduché vyhľadávanie. Akcie (prihlásenie,
// zmena stavu, nastavenie notifikácií) pribudnú v úlohách A1, A7, B5 a B6.
import { defineStore } from 'pinia';
import type { User } from '../types/models';

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
  },

  actions: {
    // Vráti true pri úspechu, aby LoginPage vedela, či má presmerovať alebo ukázať chybu.
    login(email: string, password: string): boolean {
      const user = this.users.find((u) => u.email === email && u.password === password);
      if (!user) return false;
      this.currentUserId = user.id;
      return true;
    },

    logout(): void {
      this.currentUserId = null;
    },
  },
});
