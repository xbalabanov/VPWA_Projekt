// src/stores/channels.ts
// kanaly, clenstva, pozvanky, hlasovanie o vyhodeni a zakazy (UC 2, 4, 5, 10)
// Akcie vracaju null pri uspechu, inak text chyby, ktory UI ukaze userovi
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
  membersOpen: boolean; //pravy panel so zoznamom clenov (otvori ho aj /list)
}

// Pevný dátum pre falošné členstvá, aby sa mock dáta nemenili pri každom spustení.
const JOINED_AT = '2026-09-25T10:00:00.000Z';
//kolko roznych memberov musi dat /kick, kym sa odstrani user vo verejnom kanali (UC 4)
const KICK_VOTES_FOR_BAN = 3;

//skratka pre zaznam o clenstve (v mock datach aj akciach)
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
    membersOpen: false,
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

    //novy kanal (UC 2), tvorca je zaroven admin aj prvy clen, kanal sa hned otvori
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

    // zrusenie kanala adminom (UC 2, /quit)
    deleteChannel(channelId: number): string | null {
      const userId = useUsersStore().currentUserId;
      if (userId === null) return 'Nie si prihlásený';
      if (!this.isAdmin(channelId, userId)) return 'Kanál môže zmazať iba admin';

      //filter necha iba prvky kde je podmienka true -> tuto nechaj vsetko okrem tohoto kanala
      //spolu s kanalom zmazeme vsetko, co nan odkazuje, aby v store nezostali zaznamy bez kanala
      this.channels = this.channels.filter((c) => c.id !== channelId);
      this.members = this.members.filter((m) => m.channelId !== channelId);
      this.invitations = this.invitations.filter((i) => i.channelId !== channelId);
      this.kickVotes = this.kickVotes.filter((v) => v.channelId !== channelId);
      this.bans = this.bans.filter((b) => b.channelId !== channelId);

      if (this.activeChannelId === channelId) this.selectFirstChannel();
      return null;
    },

    //opustenie kanala (/cancel), ak odide admin -> kanal zanikne
    leaveChannel(channelId: number): string | null {
      const userId = useUsersStore().currentUserId;
      if (userId === null) return 'Nie si prihlásený';
      if (!this.isMember(channelId, userId)) return 'Nie si členom tohto kanála';

      if (this.isAdmin(channelId, userId)) return this.deleteChannel(channelId);

      //odstranime iba svoje clenstvo, ostatni clenovia ostanu
      this.members = this.members.filter(
        (m) => !(m.channelId === channelId && m.userId === userId),
      );

      if (this.activeChannelId === channelId) this.selectFirstChannel();
      return null;
    },

    //prijatie pozvanky (UC2): z pozvanky sa stane clenstvo a kanal sa otvori
    acceptInvitation(invitationId: number): string | null {
      const invitation = this.invitations.find((i) => i.id === invitationId);
      if (!invitation) return 'Pozvánka neexistuje';

      this.members.push(member(invitation.channelId, invitation.invitedUserId));
      this.invitations = this.invitations.filter((i) => i.id !== invitationId);

      this.activeChannelId = invitation.channelId;
      return null;
    },

    //odmietnutie pozvanky: zmaze pozvanku a kanal zmizne zo zoznamu, clenom sa user nestane
    declineInvitation(invitationId: number): string | null {
      if (!this.invitations.some((i) => i.id === invitationId)) return 'Pozvánka neexistuje';

      this.invitations = this.invitations.filter((i) => i.id !== invitationId);
      return null;
    },

    //bez kontrol, tie robi akcia co tuto vola (revokeUser, banUser)
    removeMember(channelId: number, userId: number): void {
      this.members = this.members.filter(
        (m) => !(m.channelId === channelId && m.userId === userId),
      );
    },

    //BAN (UC 4): vyhodi membera, zmaze hlasy proti nemu a zapise ban. Zrusit ho vie admin cez /invite
    banUser(channelId: number, userId: number): void {
      this.removeMember(channelId, userId);
      this.kickVotes = this.kickVotes.filter(
        (v) => !(v.channelId === channelId && v.targetUserId === userId),
      );
      if (!this.isBanned(channelId, userId)) this.bans.push({ channelId, userId });
    },

    //otvori prvy kanal, kde som clenom (alebo ziadny). Vola sa po prihlaseni a registracii, a ked opustim/zrusim aktivny kanal
    selectFirstChannel(): void {
      this.activeChannelId = this.myChannels[0]?.id ?? null;
      //?. -> ak neexistuje [0], vrati undefined
      //?? null -> ak undefined, pouzi null
    },

    // /join nazov [private] (UC 4): neexistujuci kanal sa vytvori, do verejneho sa volajuci prida, do sukromneho iba cez pozvanku
    joinChannel(name: string, isPrivate: boolean): string | null {
      const userId = useUsersStore().currentUserId;
      if (userId === null) return 'Nie si prihlásený';

      const channel = this.channelByName(name);
      if (!channel) return this.createChannel(name, isPrivate);

      if (this.isMember(channel.id, userId)) {
        this.activeChannelId = channel.id;
        return null;
      }
      if (channel.isPrivate) return 'Kanál je súkromný, potrebuješ pozvánku';
      if (this.isBanned(channel.id, userId)) return 'Máš zakázaný prístup do tohto kanála';

      this.members.push(member(channel.id, userId));

      //ak som mal do kanala pozvanku, uz nie je potrebna
      this.invitations = this.invitations.filter(
        (i) => !(i.channelId === channel.id && i.invitedUserId === userId),
      );
      this.activeChannelId = channel.id;
      return null;
    },

    // /invite nick (UC 5): do sukromneho channelu pozyva len admin, jeho pozvanka rusi aj ban
    inviteUser(channelId: number, nickName: string): string | null {
      const usersStore = useUsersStore();
      const userId = usersStore.currentUserId;
      if (userId === null) return 'Nie si prihlásený';

      const channel = this.channels.find((c) => c.id === channelId);
      if (!channel) return 'Kanál neexistuje';
      const target = usersStore.userByNickName(nickName);
      if (!target) return `Používateľ ${nickName} neexistuje`;

      const admin = this.isAdmin(channelId, userId);
      if (!this.isMember(channelId, userId)) return 'Nie si členom tohto kanála';
      if (channel.isPrivate && !admin) return 'Do súkromného kanála vie pozývať iba admin';
      if (this.isMember(channelId, target.id)) return `${target.nickName} už je členom kanála`;

      if (this.isBanned(channelId, target.id)) {
        if (!admin) return `${target.nickName} má zakázaný prístup, môže ho pozývať iba správca`;
        this.bans = this.bans.filter((b) => !(b.channelId === channelId && b.userId === target.id));
      }

      if (this.invitations.some((i) => i.channelId === channelId && i.invitedUserId === target.id))
        return `${target.nickName} je už pozvaný`;

      const id = Math.max(0, ...this.invitations.map((i) => i.id)) + 1;
      this.invitations.push({
        id,
        channelId,
        invitedUserId: target.id,
        invitedById: userId,
        createdAt: new Date().toISOString(),
      });
      return null;
    },

    // /revoke nick (UC 5): spravca sukromneho kanala odoberie clena alebo zrusi pozvanku
    revokeUser(channelId: number, nickName: string): string | null {
      const usersStore = useUsersStore();
      const userId = usersStore.currentUserId;
      if (userId === null) return 'Nie si prihlásený';

      const channel = this.channels.find((c) => c.id === channelId);
      if (!channel) return 'Kanál neexistuje';
      if (!channel.isPrivate) return 'Príkaz /revoke je iba pre súkromné kanály, použi /kick';
      if (!this.isAdmin(channelId, userId)) return 'Používateľa môže odobrať iba správca';

      const target = usersStore.userByNickName(nickName);
      if (!target) return `Používateľ ${nickName} neexistuje`;
      if (target.id === userId) return 'Nemôžeš odobrať sám seba, použi /cancel';

      if (this.isMember(channelId, target.id)) {
        this.removeMember(channelId, target.id);
        return null;
      }

      const invited = this.invitations.some(
        (i) => i.channelId === channelId && i.invitedUserId === target.id,
      );
      if (!invited) return `${target.nickName} nie je členom kanála`;

      this.invitations = this.invitations.filter(
        (i) => !(i.channelId === channelId && i.invitedUserId === target.id),
      );
      return null;
    },

    // /kick nick (to sa rymuje) (UC 4): spravca vyhodi hned, vo verejnom kanali rozhodne demokracia (hlasy memberov)
    kickUser(channelId: number, nickName: string): string | null {
      const usersStore = useUsersStore();
      const userId = usersStore.currentUserId;
      if (userId === null) return 'Nie si prihlásený';

      const channel = this.channels.find((c) => c.id === channelId);
      if (!channel) return 'Kanál neexistuje';
      if (!this.isMember(channelId, userId)) return 'Nie si členom tohto kanála';

      const target = usersStore.userByNickName(nickName);
      if (!target) return `Používateľ ${nickName} neexistuje`;
      if (target.id === userId) return 'Nemôžeš vyhodiť sám seba, použi /cancel';
      if (!this.isMember(channelId, target.id)) return `${target.nickName} nie je členom kanála`;

      if (this.isAdmin(channelId, userId)) {
        this.banUser(channelId, target.id);
        return null;
      }
      if (channel.isPrivate) return 'V súkromnom kanály môže vyhadzovať iba správca';
      if (this.isAdmin(channelId, target.id)) return 'Admina nemožno vyhodiť';

      const votes = this.kickVotes.filter(
        (v) => v.channelId === channelId && v.targetUserId === target.id,
      );
      if (votes.some((v) => v.voterId === userId))
        return `Za vyhodenie ${target.nickName} si už zahlasoval`;

      this.kickVotes.push({ channelId, targetUserId: target.id, voterId: userId });
      if (votes.length + 1 >= KICK_VOTES_FOR_BAN) this.banUser(channelId, target.id);
      return null;
    },

    // /list (UC 10): otvori pravy panel so zoznamom clenov
    openMembersList(channelId: number): string | null {
      const userId = useUsersStore().currentUserId;
      if (userId === null) return 'Nie si prihlásený';
      if (!this.isMember(channelId, userId)) return 'Nie si členom tohto kanála';

      this.membersOpen = true;
      return null;
    },
  },
});
