// src/stores/users.ts
// Spoločný základ: falošní používatelia a jednoduché vyhľadávanie. Akcie (prihlásenie,
// zmena stavu, nastavenie notifikácií) pribudnú v úlohách A1, A7, B5 a B6.
import { defineStore } from 'pinia';
import type { User } from '../types/models';

interface UsersState {
  users: User[];
  currentUserId: number; // prihlásený používateľ (v prototype pevne 1)
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
      },
      {
        id: 2,
        firstName: 'Jana',
        lastName: 'Kováčová',
        nickName: 'jana',
        email: 'jana@example.com',
        status: 'dnd',
        notifyMentionsOnly: false,
      },
      {
        id: 3,
        firstName: 'Peter',
        lastName: 'Horváth',
        nickName: 'peter',
        email: 'peter@example.com',
        status: 'offline',
        notifyMentionsOnly: false,
      },
      {
        id: 4,
        firstName: 'Mária',
        lastName: 'Szabová',
        nickName: 'maria',
        email: 'maria@example.com',
        status: 'online',
        notifyMentionsOnly: true,
      },
      {
        id: 5,
        firstName: 'Tomáš',
        lastName: 'Varga',
        nickName: 'tomas',
        email: 'tomas@example.com',
        status: 'online',
        notifyMentionsOnly: false,
      },
    ],
    currentUserId: 1,
  }),

  getters: {
    currentUser: (state): User | undefined => state.users.find((u) => u.id === state.currentUserId),

    // Použitie: usersStore.userById(2)
    userById:
      (state) =>
      (id: number): User | undefined =>
        state.users.find((u) => u.id === id),
  },
});
