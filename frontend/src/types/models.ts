// Data model of the chat app (same as our UML class diagram).
// Phase 1: these describe the mock data held in the Pinia stores.
//
// Ids are numbers that point to other objects (e.g. Channel.adminId -> User.id),
// the same way foreign keys work in a database.
// Dates are ISO strings (e.g. '2026-10-01T12:00:00.000Z') instead of Date objects,
// because JSON has no Date type - this way the same types also fit data from an API later.

// A union of string literals instead of a TypeScript `enum`: simpler, and it is only
// a type (no extra JavaScript is generated).
export type UserStatus = 'online' | 'dnd' | 'offline';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  nickName: string; // unique
  email: string; // unique
  status: UserStatus;
  notifyMentionsOnly: boolean;

  password: string;
}

export interface Channel {
  id: number;
  name: string; // unique
  isPrivate: boolean;
  adminId: number; // -> User.id (creator of the channel)
  lastActivityAt: string; // time of the last message, used for the 30-day cleanup
}

// Who is a member of which channel (a user can be in many channels).
export interface ChannelMember {
  userId: number; // -> User.id
  channelId: number; // -> Channel.id
  joinedAt: string;
}

// A pending invitation; the invited channel is highlighted and pinned to the top.
export interface Invitation {
  id: number;
  channelId: number; // -> Channel.id
  invitedUserId: number; // -> User.id (who is invited)
  invitedById: number; // -> User.id (who sent the invite)
  createdAt: string;
}

// One member's /kick vote against another member (3 votes -> Ban).
export interface KickVote {
  channelId: number; // -> Channel.id
  targetUserId: number; // -> User.id (who is being kicked)
  voterId: number; // -> User.id (who voted)
}

// Permanent ban of a user from a channel.
export interface Ban {
  channelId: number; // -> Channel.id
  userId: number; // -> User.id
}

export interface Message {
  id: number;
  channelId: number; // -> Channel.id
  authorId: number; // -> User.id
  content: string;
  createdAt: string;
}

// A user mentioned in a message via @nickName.
export interface Mention {
  messageId: number; // -> Message.id
  userId: number; // -> User.id
}
