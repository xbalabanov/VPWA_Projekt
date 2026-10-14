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

    myInvitations(state): Invitation[] {
      const userId = useUsersStore().currentUserId;
      return state.invitations.filter((i) => i.invitedUserId === userId);
    },

    channelByName:
      (state) =>
      (name: string): Channel | undefined =>
        state.channels.find((c) => c.name.toLowerCase() === name.toLowerCase()),

    isMember:
      (state) =>
      (channelId: number, userId: number): boolean =>
        state.members.some((m) => m.channelId === channelId && m.userId === userId),

    isAdmin:
      (state) =>
      (channelId: number, userId: number): boolean =>
        state.channels.some((c) => c.id === channelId && c.adminId === userId),

    isBanned:
      (state) =>
      (channelId: number, userId: number): boolean =>
        state.bans.some((b) => b.channelId === channelId && b.userId === userId),
  },

  actions: {
    setActiveChannel(id: number) {
      this.activeChannelId = id;
    },

    //vrati null pri uspechu, inak text chyby
    //tvorca je admin aj clen naraz
    createChannel(name: string, isPrivate: boolean): string | null {
      const userId = useUsersStore().currentUserId;
      if (userId === null) return 'Nie si prihlásený';
      if (this.channelByName(name)) return 'Kanál s týmto názvom už existuje';

      const id = Math.max(0, ...this.channels.map((c) => c.id)) + 1;
      this.channels.push({
        id,
        name,
        isPrivate,
        adminId: userId,
        lastActivityAt: new Date().toISOString(),
      });
      this.members.push(member(id, userId));

      this.activeChannelId = id;
      return null;
    },

    deleteChannel(channelId: number): string | null {
      const userId = useUsersStore().currentUserId;
      if (userId === null) return 'Nie si prihlásený';
      if (!this.isAdmin(channelId, userId)) return 'Kanál môže zmazať iba admin';

      //filter necha iba prvky kde je podmienka true -> tuto nechaj vsetko okrem tohoto kanala
      this.channels = this.channels.filter((c) => c.id !== channelId);
      this.members = this.members.filter((m) => m.channelId !== channelId);
      this.invitations = this.invitations.filter((i) => i.channelId !== channelId);
      this.kickVotes = this.kickVotes.filter((v) => v.channelId !== channelId);
      this.bans = this.bans.filter((b) => b.channelId !== channelId);

      if (this.activeChannelId === channelId) this.selectFirstChannel();
      return null;
    },

    leaveChannel(channelId: number): string | null {
      const userId = useUsersStore().currentUserId;
      if (userId === null) return 'Nie si prihlásený';
      if (!this.isMember(channelId, userId)) return 'Nie si členom tohto kanála';

      if (this.isAdmin(channelId, userId)) return this.deleteChannel(channelId);

      //zo clenstiev odstrani zaznam, kde sedi kanal aj pouzivatel a ostantni pouzivatelia ostanu
      this.members = this.members.filter(
        (m) => !(m.channelId === channelId && m.userId === userId),
      );

      if (this.activeChannelId === channelId) this.selectFirstChannel();
      return null;
    },

    //accept invite - pozvanka sa despawne a pozuzivatel sa stane clenom kanala
    acceptInvitation(invitationId: number): string | null {
      const invitation = this.invitations.find((i) => i.id === invitationId);
      if (!invitation) return 'Pozvánka neexistuje';

      this.members.push(member(invitation.channelId, invitation.invitedUserId));
      this.invitations = this.invitations.filter((i) => i.id !== invitationId);

      this.activeChannelId = invitation.channelId;
      return null;
    },

    //odmietnutie pozvanky: zmaze pozvanku a kanal zmizne zo zoznamu
    declineInvitation(invitationId: number): string | null {
      if (!this.invitations.some((i) => i.id === invitationId)) return 'Pozvánka neexistuje';

      this.invitations = this.invitations.filter((i) => i.id !== invitationId);
      return null;
    },

    //otvor privy kanel, kde je pouzivatel clenom (alebo nic) - vola sa po logine, registracii,
    // a ked pouzivatel opusti alebo zrusi aktivny channel
    selectFirstChannel(): void {
      this.activeChannelId = this.myChannels[0]?.id ?? null;
      //?. -> ak neexistuje [0], vrati undefined
      //?? null -> ak undefined, pouzi null
    },
  },
});
