// src/stores/messages.ts
// Spoločný základ: falošné správy a jednoduché vyhľadávanie. Akcie (odoslanie,
// stránkovanie, @nickname, písanie) pribudnú v úlohách B2-B4 a B7.
import { defineStore } from 'pinia';
import type { Mention, Message } from '../types/models';
import { useUsersStore } from './users';
import { extractNickNames } from '../utils/mentions';

interface MessagesState {
  messages: Message[]; // načítané správy; v rámci kanála od najstaršej po najnovšiu
  hasMore: Record<number, boolean>; // channelId -> sú na serveri ešte staršie správy?
  loading: Record<number, boolean>; // channelId -> práve načítavame?
  mentions: Mention[]; // koho ktorá načítaná správa zmieňuje (@nickname)
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
    // Správy chodia v dávkach: jeden autor napíše 3 správy za sebou (1 min od seba),
    // medzi dávkami sú 3 hodiny. Vďaka tomu vidno zoskupovanie aj oddeľovače dní.
    const fromNewest = count - 1 - i; // 0 = najnovšia správa
    const burst = Math.floor(fromNewest / 3); // poradie dávky od najnovšej
    const authorId = pick(memberIds, burst);
    const minutesAgo = burst * 180 + (fromNewest % 3);

    let content = pick(SAMPLE_TEXTS, i + channelId);
    // Niektoré správy adresujeme (nie samému autorovi).
    if (i % 7 === 3 && authorId !== 1) content = `@ed ${content}`;
    if (i % 11 === 5 && authorId !== 2) content = `@jana ${content}`;
    result.push({
      id: firstId + i,
      channelId,
      authorId,
      content,
      createdAt: new Date(newest - minutesAgo * 60000).toISOString(),
    });
  }
  return result;
}

// Falošný server: celá história všetkých kanálov.
// Klient ju nevidí priamo, pýta si ju po kúskoch cez fetchMessages().
const SERVER_MESSAGES: Message[] = [
  ...makeMessages(1, [1, 2, 3, 4, 5], 60, 1), // general
  ...makeMessages(2, [2, 3], 25, 101), // vpwa-projekt
  ...makeMessages(3, [1, 3, 4], 15, 201), // random
  ...makeMessages(4, [1, 2], 8, 301), // ucenie
  ...makeMessages(5, [2, 5], 12, 401), // pokec
];

const PAGE_SIZE = 20; // koľko správ načítame naraz

// Simuluje API: GET /channels/:id/messages?before=:beforeId&limit=:limit
// Vráti najviac `limit` správ kanála starších ako beforeId (null = najnovšie),
// zoradené od najstaršej po najnovšiu.
function fetchMessages(
  channelId: number,
  beforeId: number | null,
  limit: number,
): Promise<Message[]> {
  // 1. Len správy daného kanála.
  let result = SERVER_MESSAGES.filter((m) => m.channelId === channelId);

  // 2. Ak máme kurzor, len správy staršie ako on.
  if (beforeId !== null) {
    result = result.filter((m) => m.id < beforeId);
  }

  // 3. Z konca (najnovšie) zober posledných `limit` správ.
  result = result.slice(-limit);

  // 4. Odpoveď príde s oneskorením, ako zo skutočného servera.
  return new Promise((resolve) => {
    setTimeout(() => resolve(result), 300);
  });
}

// Simuluje API: POST /channels/:id/messages
// Server pridelí id a čas, uloží správu a vráti ju hotovú.
function postMessage(channelId: number, authorId: number, content: string): Promise<Message> {
  const message: Message = {
    id: Math.max(0, ...SERVER_MESSAGES.map((m) => m.id)) + 1,
    channelId,
    authorId,
    content,
    createdAt: new Date().toISOString(),
  };
  SERVER_MESSAGES.push(message); // "uloží do databázy"

  return new Promise((resolve) => {
    setTimeout(() => resolve(message), 150);
  });
}

export const useMessagesStore = defineStore('messages', {
  state: (): MessagesState => ({
    messages: [], // len správy, ktoré si klient už stiahol zo "servera"
    hasMore: {},
    loading: {},
    mentions: [],
  }),

  getters: {
    // Všetky správy kanála, od najstaršej po najnovšiu.
    messagesByChannel:
      (state) =>
      (channelId: number): Message[] =>
        state.messages.filter((m) => m.channelId === channelId),

    // true, kým server nepovie, že staršie správy už nie sú.
    // Kanál, ktorý sme ešte nenačítavali (undefined), považujeme za "áno, sú".
    hasMoreFor:
      (state) =>
      (channelId: number): boolean =>
        state.hasMore[channelId] !== false,

    // Zmieňuje správa daného používateľa? (UC 6, neskôr aj notifikácie B6)
    isMentioned:
      (state) =>
      (messageId: number, userId: number): boolean =>
        state.mentions.some((m) => m.messageId === messageId && m.userId === userId),
  },

  actions: {
    // Načíta ďalšiu (staršiu) stránku správ kanála.
    // Prvé volanie (nič ešte nemáme) načíta najnovšie správy.
    async loadOlder(channelId: number): Promise<void> {
      // Poistka: už načítavame alebo už nič staršie nie je.
      if (this.loading[channelId] || !this.hasMoreFor(channelId)) return;

      this.loading[channelId] = true;
      try {
        // Kurzor = id najstaršej správy, ktorú už máme (alebo null).
        const loaded = this.messagesByChannel(channelId);
        const beforeId = loaded[0]?.id ?? null;

        const page = await fetchMessages(channelId, beforeId, PAGE_SIZE);

        // Staršie správy idú na začiatok poľa.
        this.messages.unshift(...page);
        this.rememberMentions(page);

        // Menej ako plná stránka = došli sme na začiatok histórie.
        this.hasMore[channelId] = page.length === PAGE_SIZE;
      } finally {
        this.loading[channelId] = false;
      }
    },

    // Odošle správu prihláseného používateľa do kanála (UC 3).
    // Vráti chybu ako text, alebo null pri úspechu.
    async sendMessage(channelId: number, content: string): Promise<string | null> {
      const authorId = useUsersStore().currentUserId;
      if (authorId === null) return 'You are not logged in';

      const text = content.trim();
      if (!text) return null; // prázdnu správu ticho ignorujeme

      const message = await postMessage(channelId, authorId, text);
      this.messages.push(message); // nová správa ide na koniec (je najnovšia)
      this.rememberMentions([message]);
      return null;
    },

    // Zapamätá si, koho správy zmieňujú. Skutočný server by Mention záznamy poslal sám,
    // tu ich dopočítame z textu. Iný store čítame podľa
    // https://pinia.vuejs.org/core-concepts/actions.html#Accessing-other-stores-actions
    rememberMentions(messages: Message[]): void {
      const usersStore = useUsersStore();

      for (const message of messages) {
        for (const nickName of extractNickNames(message.content)) {
          const user = usersStore.users.find(
            (u) => u.nickName.toLowerCase() === nickName.toLowerCase(),
          );
          // Neexistujúci nick (preklep) nie je chyba, len ho ignorujeme.
          if (user) this.mentions.push({ messageId: message.id, userId: user.id });
        }
      }
    },
  },
});
