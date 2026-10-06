// src/stores/messages.ts
// Spoločný základ: falošné správy a jednoduché vyhľadávanie. Akcie (odoslanie,
// stránkovanie, @nickname, písanie) pribudnú v úlohách B2-B4 a B7.
import { defineStore } from 'pinia';
import type { Message } from '../types/models';

interface MessagesState {
  messages: Message[]; // zoradené od najstaršej po najnovšiu
}

// --- Generovanie falošnej histórie (dosť správ aj na neskorší infinite scroll) ---

const SAMPLE_TEXTS = [
  'Ahoj, ako sa máte?',
  'Zajtra máme cvičenie z VPWA.',
  'Niekto už robil UML diagram?',
  'Poslal som commit do repa, pozrite sa na to.',
  'Quasar je celkom fajn, len treba zvyknúť na Options API.',
  'Kto ide dnes na obed?',
  'Notifikácie fungujú iba keď aplikácia nie je viditeľná.',
  'Ďakujem za pomoc!',
  'Máme už hotový prototyp obrazovky so zoznamom kanálov?',
  'Tú chybu v TypeScripte som opravil.',
  'Pošlem vám screenshot.',
  'Ok, súhlasím.',
  'Neviem, skúsim sa na to pozrieť večer.',
  'Dlhšia správa na testovanie zalamovania riadkov: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
];

function pick<T>(items: T[], index: number): T {
  const item = items[index % items.length];
  if (item === undefined) throw new Error('Prázdne pole');
  return item;
}

function makeMessages(
  channelId: number,
  memberIds: number[],
  count: number,
  firstId: number,
): Message[] {
  const newest = new Date('2026-10-02T09:00:00').getTime();
  const result: Message[] = [];
  for (let i = 0; i < count; i++) {
    const authorId = pick(memberIds, i);
    let content = pick(SAMPLE_TEXTS, i + channelId);
    // Niektoré správy adresujeme (nie samému autorovi).
    if (i % 7 === 3 && authorId !== 1) content = `@ed ${content}`;
    if (i % 11 === 5 && authorId !== 2) content = `@jana ${content}`;
    result.push({
      id: firstId + i,
      channelId,
      authorId,
      content,
      createdAt: new Date(newest - (count - i) * 17 * 60000).toISOString(),
    });
  }
  return result;
}

export const useMessagesStore = defineStore('messages', {
  state: (): MessagesState => ({
    messages: [
      ...makeMessages(1, [1, 2, 3, 4, 5], 60, 1), // general
      ...makeMessages(2, [2, 3], 25, 101), // vpwa-projekt
      ...makeMessages(3, [1, 3, 4], 15, 201), // random
      ...makeMessages(4, [1, 2], 8, 301), // ucenie
      ...makeMessages(5, [2, 5], 12, 401), // pokec
    ],
  }),

  getters: {
    // Všetky správy kanála, od najstaršej po najnovšiu.
    messagesByChannel:
      (state) =>
      (channelId: number): Message[] =>
        state.messages.filter((m) => m.channelId === channelId),
  },
});
