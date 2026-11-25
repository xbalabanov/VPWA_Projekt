// Úspešné odpovede backendu sú zabalené do objektu { data: ... }.
export interface ApiResponse<T> {
  data: T;
}

// Podoba správy prenášanej medzi backendom a frontendom.
export interface MessageDto {
  id: number;
  channelId: number;
  authorId: number;
  content: string;
  createdAt: string;
  mentionedUserIds: number[];
}

// Jedna stránka histórie správ.
export interface MessagesPageDto {
  messages: MessageDto[];
  nextBeforeId: number | null;
  hasMore: boolean;
}

// Pri odosielaní posielame iba obsah.
// Autora, ID a čas doplní server.
export interface SendMessagePayload {
  content: string;
}

// ---- realtime udalosti na osobnom odbere users/:id (A7) ----
// invitation.created posiela Invitation, channel.updated posiela Channel (types/models.ts).
// Kontrakt: backend/app/services/channel_events_service.ts

// Prečo som prišiel o kanál: odišiel som (iná karta), odobrali/vyhodili ma, kanál zrušil správca
// alebo zanikol po 30 dňoch bez správy.
export type ChannelRemovalReason = 'left' | 'revoked' | 'kicked' | 'deleted' | 'expired';

export interface ChannelDeletedEvent {
  channelId: number;
  channelName: string;
  reason: ChannelRemovalReason;
}

export interface InvitationRemovedEvent {
  invitationId: number;
  channelId: number;
}

export interface MembershipChangedEvent {
  channelId: number;
  userId: number;
  change: 'joined' | 'left' | 'revoked' | 'kicked';
}

// ---- živé drafty na odbere kanála channels/:id/:userId (UC11, B7) ----
export interface TypingUpdatedEvent {
  channelId: number;
  userId: number;
  text: string;
}

export interface TypingStoppedEvent {
  channelId: number;
  userId: number;
}
