import socket from '@rlanz/socket/services/main'
import logger from '@adonisjs/core/services/logger'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type Channel from '#models/channel'
import type Invitation from '#models/invitation'
import ChannelMember from '#models/channel_member'
import InvitationModel from '#models/invitation'
import ChannelTransformer from '#transformers/channel_transformer'
import InvitationTransformer from '#transformers/invitation_transformer'

// Dôvod, prečo používateľ prišiel o kanál (frontend podľa neho zobrazí hlášku).
export type RemovalReason = 'left' | 'revoked' | 'kicked'
export type DeletionReason = 'deleted' | 'expired'

export type ChannelDto = ReturnType<ChannelTransformer['toObject']>
export type InvitationDto = ReturnType<InvitationTransformer['toObject']>

/**
 * Doménová zmena po úspešnom zápise do DB. Z nej sa určí, kto dostane ktorú udalosť.
 */
export type ChannelChange =
  | { type: 'invited'; invitation: InvitationDto }
  | { type: 'invitationRemoved'; invitationId: number; channelId: number; userId: number }
  | { type: 'joined'; channel: ChannelDto; userId: number }
  | { type: 'removed'; channel: ChannelDto; userId: number; reason: RemovalReason }
  | { type: 'deleted'; channel: ChannelDto; reason: DeletionReason }

/**
 * Kto je s kanálom spojený: aktuálni členovia a otvorené pozvánky.
 * Pri zrušení kanála ho treba zistiť PRED zmazaním (CASCADE ich zmaže).
 */
export interface Audience {
  memberIds: number[]
  invitations: { id: number; userId: number }[]
}

/**
 * Jedna udalosť pre jedného používateľa – pôjde na jeho odber users/:userId.
 */
export interface Delivery {
  userId: number
  event:
    | 'invitation.created'
    | 'invitation.removed'
    | 'channel.updated'
    | 'channel.deleted'
    | 'membership.changed'
  data: unknown
}

/**
 * Realtime udalosti pozvánok, kanálov a členstva (A7) na osobný odber users/:id.
 * Volá sa až po úspešnom zápise (po commite transakcie), aby klient nevidel zmenu,
 * ktorá sa nakoniec neuložila.
 *
 * Payloady (frontend/src/types/api.ts):
 * - invitation.created  → InvitationDto (iba adresátovi, bez obsahu kanála)
 * - invitation.removed  → { invitationId, channelId }
 * - channel.updated     → ChannelDto (kanál, ktorý mi pribudol)
 * - channel.deleted     → { channelId, channelName, reason: RemovalReason | DeletionReason }
 * - membership.changed  → { channelId, userId, change: 'joined' | RemovalReason }
 */
export default class ChannelEventsService {
  static channelDto(channel: Channel): ChannelDto {
    return new ChannelTransformer(channel).toObject()
  }

  static async invitationDto(invitation: Invitation): Promise<InvitationDto> {
    await invitation.load('channel')
    await invitation.load('invitedBy')
    return new InvitationTransformer(invitation).toObject()
  }

  /**
   * Čistá funkcia: kto dostane ktorú udalosť (bez DB a socketu, testuje sa priamo).
   */
  static plan(change: ChannelChange, audience: Audience): Delivery[] {
    switch (change.type) {
      case 'invited':
        return [
          {
            userId: change.invitation.invitedUserId,
            event: 'invitation.created',
            data: change.invitation,
          },
        ]

      case 'invitationRemoved':
        return [
          {
            userId: change.userId,
            event: 'invitation.removed',
            data: { invitationId: change.invitationId, channelId: change.channelId },
          },
        ]

      case 'joined':
      case 'removed': {
        const { channel, userId } = change
        const changeName = change.type === 'joined' ? 'joined' : change.reason

        //Doknuty pouzivatel: kanal mu pribudne alebo zmizne
        const own: Delivery =
          change.type === 'joined'
            ? { userId, event: 'channel.updated', data: channel }
            : {
                userId,
                event: 'channel.deleted',
                data: { channelId: channel.id, channelName: channel.name, reason: change.reason },
              }

        //Ostatni clenovia si obnovia zoznam clenov
        const others: Delivery[] = audience.memberIds
          .filter((memberId) => memberId !== userId)
          .map((memberId) => ({
            userId: memberId,
            event: 'membership.changed',
            data: { channelId: channel.id, userId, change: changeName },
          }))

        return [own, ...others]
      }

      case 'deleted': {
        const { channel, reason } = change
        const members: Delivery[] = audience.memberIds.map((memberId) => ({
          userId: memberId,
          event: 'channel.deleted',
          data: { channelId: channel.id, channelName: channel.name, reason },
        }))
        const invited: Delivery[] = audience.invitations.map((invitation) => ({
          userId: invitation.userId,
          event: 'invitation.removed',
          data: { invitationId: invitation.id, channelId: channel.id },
        }))
        return [...members, ...invited]
      }
    }
  }

  /**
   * Aktuálni členovia a pozvaní používatelia kanála. trx: volanie z transakcie.
   */
  static async audience(channelId: number, trx?: TransactionClientContract): Promise<Audience> {
    const members = await ChannelMember.query({ client: trx })
      .where('channel_id', channelId)
      .select('user_id')
    const invitations = await InvitationModel.query({ client: trx })
      .where('channel_id', channelId)
      .select('id', 'invited_user_id')

    return {
      memberIds: members.map((member) => member.userId),
      invitations: invitations.map((invitation) => ({
        id: invitation.id,
        userId: invitation.invitedUserId,
      })),
    }
  }

  /**
   * Odošle udalosti na osobné odbery users/:userId.
   */
  static send(deliveries: Delivery[]): void {
    // https://github.com/RomainLanz/socket#exchange-messages
    for (const delivery of deliveries) {
      socket.to(`users/${delivery.userId}`).emit(delivery.event, delivery.data)
    }
  }

  /**
   * Po zápise do DB: zistí publikum, naplánuje udalosti a odošle ich.
   * (Pri zrušení kanála sa nepoužije – publikum treba zistiť pred zmazaním.)
   */
  static async publish(change: ChannelChange): Promise<void> {
    const channelId =
      change.type === 'invited'
        ? change.invitation.channelId
        : change.type === 'invitationRemoved'
          ? change.channelId
          : change.channel.id

    // Zapis do DB uz prebehol - chyba dorucenia nesmie zmenit odpoved na chybu
    // Klient sa zosuladi pri reconnecte alebo navrate do okna
    try {
      this.send(this.plan(change, await this.audience(channelId)))
    } catch (error) {
      logger.error({ err: error, change: change.type }, 'Nepodarilo sa poslať udalosť kanála')
    }
  }
}
