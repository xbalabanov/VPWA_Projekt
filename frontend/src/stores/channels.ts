// src/stores/channels.ts
// Spoločný základ: falošné kanály, členstvá a pozvánky + jednoduché vyhľadávanie.
// Akcie kanálov (vytvorenie, pozvánky, /join, /kick, ...) pribudnú v úlohách A2-A8.
import { defineStore } from 'pinia';
import type { Ban, Channel, ChannelMember, Invitation, KickVote } from '../types/models';
import { useUsersStore } from './users';

interface ChannelsState {
  channels: Channel[];
  members: ChannelMember[];
  invitations: Invitation[];
  kickVotes: KickVote[];
  bans: Ban[];
  activeChannelId: number | null;
}

// Pevný dátum pre falošné členstvá, aby sa mock dáta nemenili pri každom spustení.
const JOINED_AT = '2026-09-25T10:00:00.000Z';

function member(channelId: number, userId: number): ChannelMember {
  return { channelId, userId, joinedAt: JOINED_AT };
}

export const useChannelsStore = defineStore('channels', {
  state: (): ChannelsState => ({
    // Falošné dáta pre prototyp. Neskôr ich nahradí volanie backendu v akcii.
    channels: [
      {
        id: 1,
        name: 'general',
        isPrivate: false,
        adminId: 1,
        lastActivityAt: '2026-10-01T10:00:00.000Z',
      },
      {
        id: 2,
        name: 'vpwa-projekt',
        isPrivate: true,
        adminId: 2,
        lastActivityAt: '2026-10-02T08:30:00.000Z',
      },
      {
        id: 3,
        name: 'random',
        isPrivate: false,
        adminId: 3,
        lastActivityAt: '2026-09-28T19:45:00.000Z',
      },
      {
        id: 4,
        name: 'ucenie',
        isPrivate: true,
        adminId: 1,
        lastActivityAt: '2026-09-30T14:20:00.000Z',
      },
      {
        id: 5,
        name: 'pokec',
        isPrivate: false,
        adminId: 2,
        lastActivityAt: '2026-10-02T09:10:00.000Z',
      },
    ],
    members: [
      // general: všetci
      member(1, 1),
      member(1, 2),
      member(1, 3),
      member(1, 4),
      member(1, 5),
      // vpwa-projekt (ed je zatiaľ iba pozvaný)
      member(2, 2),
      member(2, 3),
      // random
      member(3, 1),
      member(3, 3),
      member(3, 4),
      // ucenie
      member(4, 1),
      member(4, 2),
      // pokec (ed je zatiaľ iba pozvaný)
      member(5, 2),
      member(5, 5),
    ],
    // Pozvánky pre prihláseného používateľa (ed).
    invitations: [
      {
        id: 1,
        channelId: 2,
        invitedUserId: 1,
        invitedById: 2,
        createdAt: '2026-10-02T08:00:00.000Z',
      },
      {
        id: 2,
        channelId: 5,
        invitedUserId: 1,
        invitedById: 5,
        createdAt: '2026-10-02T09:00:00.000Z',
      },
    ],
    kickVotes: [],
    bans: [],
    activeChannelId: 1,
  }),

  getters: {
    // Kanály, v ktorých je prihlásený používateľ členom, podľa abecedy.
    myChannels(state): Channel[] {
      const userId = useUsersStore().currentUserId;
      return state.channels
        .filter((c) => state.members.some((m) => m.channelId === c.id && m.userId === userId))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    activeChannel: (state): Channel | undefined =>
      state.channels.find((c) => c.id === state.activeChannelId),

    // Id členov kanála. Použitie: channelsStore.membersOf(1)
    membersOf:
      (state) =>
      (channelId: number): number[] =>
        state.members.filter((m) => m.channelId === channelId).map((m) => m.userId),
  },

  actions: {
    setActiveChannel(id: number) {
      this.activeChannelId = id;
    },
  },
});
