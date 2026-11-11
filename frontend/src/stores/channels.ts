// src/stores/channels.ts
// kanaly, clenstva a pozvanky prihlaseneho pouzivatela (UC 2, 4, 5, 10)
// Data drzi server, store je iba ich kopia pre UI. Pravidla (kto smie co) overuje server,
// store len posle poziadavku a ulozi odpoved.
// Akcie vracaju null pri uspechu, inak text chyby, ktory UI ukaze userovi
import { defineStore } from 'pinia';
import type { Channel, ChannelMember, Invitation, Member } from '../types/models';
import { ApiError, apiRequest, jsonBody } from '../services/api.ts';
import { useUsersStore } from './users.ts';

interface ChannelsState {
  channels: Channel[]; // iba kanaly, v ktorych som clenom
  members: ChannelMember[]; // clenovia nacitanych kanalov (aktivny kanal)
  invitations: Invitation[]; // moje pozvanky
  activeChannelId: number | null;
  membersOpen: boolean; //pravy panel so zoznamom clenov (otvori ho aj /list)
}

// Kým nie je socket (B2), obnovujeme kanály a pozvánky každých 5 s a pri návrate do okna.
// TODO socket (B2): po napojení socketu polling odstrániť a volať on* udalosti nižšie.
const SYNC_INTERVAL_MS = 5000;
let syncTimer: ReturnType<typeof setInterval> | null = null;
let onWindowFocus: (() => void) | null = null;

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

    // Kanály, pozvánky a členovia aktívneho kanála naraz (po prihlásení a pri pollingu).
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
      // TODO socket (B2): nahradiť udalosťami zo socketu
      syncTimer = setInterval(() => void this.refresh(), SYNC_INTERVAL_MS);
      onWindowFocus = () => void this.refresh();
      window.addEventListener('focus', onWindowFocus);
    },

    stopSync(): void {
      if (syncTimer !== null) clearInterval(syncTimer);
      if (onWindowFocus) window.removeEventListener('focus', onWindowFocus);
      syncTimer = null;
      onWindowFocus = null;
    },

    // ---- udalosti, ktore neskor zavola socket (B2) ----

    // Niekto ma pozval – pozvánka sa objaví navrchu.
    onInvitationCreated(invitation: Invitation): void {
      if (!this.invitations.some((i) => i.id === invitation.id)) {
        this.invitations.unshift(invitation);
      }
    },

    // Kanál zanikol alebo som z neho odišiel/bol vyhodený – zmizne zo zoznamu.
    onChannelDeleted(channelId: number): void {
      this.channels = this.channels.filter((c) => c.id !== channelId);
      this.members = this.members.filter((m) => m.channelId !== channelId);
      this.invitations = this.invitations.filter((i) => i.channelId !== channelId);
      if (this.activeChannelId === channelId) this.selectFirstChannel();
    },

    // Zmenili sa členovia kanála – znovu ich načítame.
    async onMembershipChanged(channelId: number): Promise<void> {
      await this.refresh();
      if (this.channels.some((c) => c.id === channelId)) await this.fetchMembers(channelId);
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
