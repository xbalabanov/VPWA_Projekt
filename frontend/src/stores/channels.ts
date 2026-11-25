// src/stores/channels.ts
// kanaly, clenstva a pozvanky prihlaseneho pouzivatela (UC 2, 4, 5, 10)
// Data drzi server, store je iba ich kopia pre UI. Pravidla (kto smie co) overuje server,
// store len posle poziadavku a ulozi odpoved.
// Akcie vracaju null pri uspechu, inak text chyby, ktory UI ukaze userovi
import { defineStore } from 'pinia';
import { Notify } from 'quasar';
import type { Channel, ChannelMember, Invitation, Member } from '../types/models';
import type {
  ChannelDeletedEvent,
  InvitationRemovedEvent,
  MembershipChangedEvent,
} from '../types/api';
import { ApiError, apiRequest, jsonBody } from '../services/api.ts';
import { getSocket, onSocketConnect } from '../services/socket.ts';
import { useUsersStore } from './users.ts';

interface ChannelsState {
  channels: Channel[]; // iba kanaly, v ktorych som clenom
  members: ChannelMember[]; // clenovia nacitanych kanalov (aktivny kanal)
  invitations: Invitation[]; // moje pozvanky
  activeChannelId: number | null;
  membersOpen: boolean; //pravy panel so zoznamom clenov (otvori ho aj /list)
}

// Zmeny kanálov, pozvánok a členstva chodia cez osobný socket odber users/:id (A7).
// Celý stav obnovíme iba po (opätovnom) pripojení socketu a pri návrate do okna.
let onWindowFocus: (() => void) | null = null;
let stopUserEvents: (() => void) | null = null;

// Text notifikácie, keď som prišiel o kanál inak ako vlastnou akciou v tejto karte.
function removalText(event: ChannelDeletedEvent): string {
  const name = `#${event.channelName}`;
  switch (event.reason) {
    case 'kicked':
      return `Bol si vyhodený z kanála ${name}`;
    case 'revoked':
      return `Bol si odstránený z kanála ${name}`;
    case 'expired':
      return `Kanál ${name} zanikol, 30 dní v ňom nebola správa`;
    case 'deleted':
      return `Kanál ${name} bol zrušený správcom`;
    case 'left':
      return `Opustil si kanál ${name}`;
  }
}

// Text chyby pre používateľa. Server posiela slovenské hlášky (403, 404, 422).
function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Server je nedostupný, skús to znova';
}

export const useChannelsStore = defineStore('channels', {
  state: (): ChannelsState => ({
    channels: [],
    members: [],
    invitations: [],
    activeChannelId: null,
    membersOpen: false,
  }),

  getters: {
    // Kanály, v ktorých je prihlásený používateľ členom, podľa abecedy.
    myChannels(state): Channel[] {
      return [...state.channels].sort((a, b) => a.name.localeCompare(b.name));
    },

    activeChannel: (state): Channel | undefined =>
      state.channels.find((c) => c.id === state.activeChannelId),

    // Id členov kanála. Použitie: channelsStore.membersOf(1)
    membersOf:
      (state) =>
      (channelId: number): number[] =>
        state.members.filter((m) => m.channelId === channelId).map((m) => m.userId),

    // Pozvánky navrchu zoznamu, najnovšie prvé (poradie posiela server).
    myInvitations: (state): Invitation[] => state.invitations,

    channelByName:
      (state) =>
      (name: string): Channel | undefined =>
        state.channels.find((c) => c.name.toLowerCase() === name.toLowerCase()),

    isAdmin:
      (state) =>
      (channelId: number, userId: number): boolean =>
        state.channels.some((c) => c.id === channelId && c.adminId === userId),
  },

  actions: {
    // ---- nacitanie zo servera ----

    async fetchChannels(): Promise<void> {
      this.channels = await apiRequest<Channel[]>('/channels');
      // aktívny kanál mohol zaniknúť alebo ma z neho vyhodili
      if (!this.channels.some((c) => c.id === this.activeChannelId)) this.selectFirstChannel();
    },

    async fetchInvitations(): Promise<void> {
      this.invitations = await apiRequest<Invitation[]>('/invitations');
    },

    // Členovia kanála; ich mená si zapamätá users store (zoznam členov, autori správ).
    async fetchMembers(channelId: number): Promise<void> {
      const members = await apiRequest<Member[]>(`/channels/${channelId}/members`);
      const usersStore = useUsersStore();
      members.forEach((m) => usersStore.rememberUser(m));

      this.members = [
        ...this.members.filter((m) => m.channelId !== channelId),
        ...members.map((m) => ({ channelId, userId: m.id, joinedAt: '' })),
      ];
    },

    // Kanály, pozvánky a členovia aktívneho kanála naraz (po prihlásení, po pripojení socketu
    // a pri návrate do okna).
    async refresh(): Promise<void> {
      try {
        await Promise.all([this.fetchChannels(), this.fetchInvitations()]);
        if (this.activeChannelId !== null) await this.fetchMembers(this.activeChannelId);
      } catch {
        // výpadok servera: necháme posledné dáta, skúsi sa to pri ďalšom obnovení
      }
    },

    startSync(): void {
      this.stopSync();
      void this.refresh();
      this.subscribeUserEvents();
      onWindowFocus = () => void this.refresh();
      window.addEventListener('focus', onWindowFocus);
    },

    stopSync(): void {
      if (onWindowFocus) window.removeEventListener('focus', onWindowFocus);
      onWindowFocus = null;
      stopUserEvents?.();
      stopUserEvents = null;
    },

    // Osobný odber users/:id – server ho povolí iba pre moju identitu.
    // https://github.com/RomainLanz/socket#use-the-browser-client
    subscribeUserEvents(): void {
      const userId = useUsersStore().currentUserId;
      if (userId === null) return;

      const socket = getSocket();
      const name = `users/${userId}`;
      const channel = socket.channel(name);

      const handlers = {
        'invitation.created': (invitation: Invitation) => this.onInvitationCreated(invitation),
        'invitation.removed': (event: InvitationRemovedEvent) => this.onInvitationRemoved(event),
        'channel.updated': (updated: Channel) => this.onChannelUpdated(updated),
        'channel.deleted': (event: ChannelDeletedEvent) => this.onRemovedFromChannel(event),
        'membership.changed': (event: MembershipChangedEvent) =>
          void this.onMembershipChanged(event.channelId),
      };
      channel
        .listen('invitation.created', handlers['invitation.created'])
        .listen('invitation.removed', handlers['invitation.removed'])
        .listen('channel.updated', handlers['channel.updated'])
        .listen('channel.deleted', handlers['channel.deleted'])
        .listen('membership.changed', handlers['membership.changed']);

      // Po každom pripojení (aj po výpadku): odber + zosúladenie kanálov a pozvánok,
      // lebo udalosti počas výpadku sa stratili. Aktívny kanál, z ktorého ma medzitým
      // odstránili, fetchChannels zatvorí – ChatPage potom odber jeho správ zruší.
      const offConnect = onSocketConnect(() => {
        void channel.subscribe().catch(() => undefined);
        void this.refresh();
      });

      stopUserEvents = () => {
        offConnect();
        for (const [event, handler] of Object.entries(handlers)) {
          channel.stopListening(event, handler as (data: unknown) => void);
        }
        void socket.leave(name).catch(() => undefined);
      };
    },

    // ---- udalosti zo socketu (users/:id) ----

    // Niekto ma pozval – pozvánka sa objaví navrchu.
    onInvitationCreated(invitation: Invitation): void {
      if (!this.invitations.some((i) => i.id === invitation.id)) {
        this.invitations.unshift(invitation);
      }
    },

    // Pozvánku som odmietol v inej karte, správca ju zrušil (/revoke) alebo kanál zanikol.
    onInvitationRemoved(event: InvitationRemovedEvent): void {
      this.invitations = this.invitations.filter((i) => i.id !== event.invitationId);
    },

    // Pribudol mi kanál (vytvorenie, /join alebo prijatie pozvánky – aj v inej karte).
    onChannelUpdated(channel: Channel): void {
      const index = this.channels.findIndex((c) => c.id === channel.id);
      if (index === -1) this.channels.push(channel);
      else this.channels[index] = channel;
      this.invitations = this.invitations.filter((i) => i.channelId !== channel.id);
    },

    // Prišiel som o kanál. Ak ešte bol v zozname, nespravil som to v tejto karte – oznámime to.
    // (Vlastný /cancel alebo /quit už kanál zo zoznamu odobral, takže notifikácia nepríde.)
    onRemovedFromChannel(event: ChannelDeletedEvent): void {
      const known = this.channels.find((c) => c.id === event.channelId);
      const myAction =
        event.reason === 'left' ||
        (event.reason === 'deleted' && known?.adminId === useUsersStore().currentUserId);

      this.onChannelDeleted(event.channelId);
      if (known && !myAction) {
        Notify.create({ type: 'warning', message: removalText(event) });
      }
    },

    // Kanál zanikol alebo som z neho odišiel/bol vyhodený – zmizne zo zoznamu.
    onChannelDeleted(channelId: number): void {
      this.channels = this.channels.filter((c) => c.id !== channelId);
      this.members = this.members.filter((m) => m.channelId !== channelId);
      this.invitations = this.invitations.filter((i) => i.channelId !== channelId);
      if (this.activeChannelId === channelId) this.selectFirstChannel();
    },

    // Zmenili sa členovia kanála – znovu ich načítame (zoznam členov, /list).
    async onMembershipChanged(channelId: number): Promise<void> {
      if (!this.channels.some((c) => c.id === channelId)) return;
      try {
        await this.fetchMembers(channelId);
      } catch {
        // medzitým ma mohli odstrániť – príde channel.deleted
      }
    },

    // ---- akcie pouzivatela ----

    setActiveChannel(id: number) {
      this.activeChannelId = id;
      void this.fetchMembers(id).catch(() => undefined);
    },

    //otvori prvy kanal, kde som clenom (alebo ziadny). Vola sa po nacitani kanalov, a ked opustim/zrusim aktivny kanal
    selectFirstChannel(): void {
      const first = this.myChannels[0];
      if (first) this.setActiveChannel(first.id);
      else this.activeChannelId = null;
    },

    // Pridá kanál do zoznamu (ak tam nie je) a otvorí ho.
    openChannel(channel: Channel): void {
      if (!this.channels.some((c) => c.id === channel.id)) this.channels.push(channel);
      this.setActiveChannel(channel.id);
    },

    //novy kanal (UC 2), tvorca je zaroven admin aj prvy clen, kanal sa hned otvori
    async createChannel(name: string, isPrivate: boolean): Promise<string | null> {
      try {
        const channel = await apiRequest<Channel>(
          '/channels',
          jsonBody('POST', { name, isPrivate }),
        );
        this.openChannel(channel);
        return null;
      } catch (error) {
        return errorText(error);
      }
    },

    // /join nazov [private] (UC 4): neexistujuci kanal server vytvori, do verejneho prida,
    // do sukromneho iba cez pozvanku
    async joinChannel(name: string, isPrivate: boolean): Promise<string | null> {
      try {
        const channel = await apiRequest<Channel>(
          '/channels/join',
          jsonBody('POST', { name, isPrivate }),
        );
        this.openChannel(channel);
        return null;
      } catch (error) {
        return errorText(error);
      }
    },

    // zrusenie kanala adminom (UC 2, /quit)
    async deleteChannel(channelId: number): Promise<string | null> {
      try {
        await apiRequest(`/channels/${channelId}`, { method: 'DELETE' });
        this.onChannelDeleted(channelId);
        return null;
      } catch (error) {
        return errorText(error);
      }
    },

    //opustenie kanala (/cancel), ak odide admin -> kanal zanikne (rozhodne server)
    async leaveChannel(channelId: number): Promise<string | null> {
      try {
        await apiRequest(`/channels/${channelId}/membership`, { method: 'DELETE' });
        this.onChannelDeleted(channelId);
        return null;
      } catch (error) {
        return errorText(error);
      }
    },

    //prijatie pozvanky (UC2): z pozvanky sa stane clenstvo a kanal sa otvori
    async acceptInvitation(invitationId: number): Promise<string | null> {
      try {
        const channel = await apiRequest<Channel>(`/invitations/${invitationId}/accept`, {
          method: 'POST',
        });
        this.invitations = this.invitations.filter((i) => i.id !== invitationId);
        this.openChannel(channel);
        return null;
      } catch (error) {
        return errorText(error);
      }
    },

    //odmietnutie pozvanky: zmaze pozvanku a kanal zmizne zo zoznamu, clenom sa user nestane
    async declineInvitation(invitationId: number): Promise<string | null> {
      try {
        await apiRequest(`/invitations/${invitationId}`, { method: 'DELETE' });
        this.invitations = this.invitations.filter((i) => i.id !== invitationId);
        return null;
      } catch (error) {
        return errorText(error);
      }
    },

    // /invite nick (UC 4): kto smie pozvat (a ci sa tym rusi ban) rozhodne server
    async inviteUser(channelId: number, nickName: string): Promise<string | null> {
      try {
        await apiRequest(`/channels/${channelId}/invitations`, jsonBody('POST', { nickName }));
        return null;
      } catch (error) {
        return errorText(error);
      }
    },

    // /revoke nick (UC 4): spravca sukromneho kanala odoberie clena alebo zrusi pozvanku
    async revokeUser(channelId: number, nickName: string): Promise<string | null> {
      try {
        await apiRequest(`/channels/${channelId}/revoke`, jsonBody('POST', { nickName }));
        await this.fetchMembers(channelId);
        return null;
      } catch (error) {
        return errorText(error);
      }
    },

    // /kick nick (UC 4): spravca vyhodi hned, vo verejnom kanali 3 rozne hlasy clenov = ban.
    // Pocitanie hlasov a ban robi server v transakcii.
    async kickUser(channelId: number, nickName: string): Promise<string | null> {
      try {
        await apiRequest(`/channels/${channelId}/kick`, jsonBody('POST', { nickName }));
        await this.fetchMembers(channelId);
        return null;
      } catch (error) {
        return errorText(error);
      }
    },

    // /list (UC 10): otvori pravy panel so zoznamom clenov
    openMembersList(channelId: number): string | null {
      if (!this.channels.some((c) => c.id === channelId)) return 'Nie si členom tohto kanála';
      this.membersOpen = true;
      void this.fetchMembers(channelId).catch(() => undefined);
      return null;
    },
  },
});
