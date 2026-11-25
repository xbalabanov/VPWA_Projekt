import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import Invitation from '#models/invitation'
import KickVote from '#models/kick_vote'
import { DateTime } from 'luxon'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import ChannelEventsService, { type DeletionReason } from '#services/channel_events_service'

/**
 * Zmeny členstva v kanáli, ktoré používajú controllery kanálov a pozvánok (A3)
 * aj príkazy /invite, /revoke, /kick (A4). Na jednom mieste, aby sa pri každom
 * vstupe a odchode upratali rovnaké veci (pozvánky, hlasy).
 */
export default class ChannelMembershipService {
  /**
   * Nájde kanál podľa názvu bez ohľadu na veľkosť písmen (#General = #general).
   */
  static async findByName(name: string): Promise<Channel | null> {
    return Channel.query().whereRaw('LOWER(name) = LOWER(?)', [name]).first()
  }

  /**
   * Vytvorí kanál; tvorca je správca aj prvý člen (UC2, /join).
   */
  static async createChannel(name: string, isPrivate: boolean, adminId: number): Promise<Channel> {
    // Čas aktivity začína vytvorením kanála (pravidlo expirácie po 30 dňoch).
    const channel = await Channel.create({
      name,
      isPrivate,
      adminId,
      lastActivityAt: DateTime.now(),
    })
    await this.addMember(channel, adminId)
    return channel
  }

  /**
   * Pridá člena. Jeho pozvánka do kanála už nie je potrebná, zmažeme ju.
   * https://lucid.adonisjs.com/docs/many-to-many#attach
   */
  static async addMember(
    channel: Channel,
    userId: number,
    trx?: TransactionClientContract
  ): Promise<void> {
    await channel.related('members').attach([userId], trx)
    await Invitation.query({ client: trx })
      .where('channel_id', channel.id)
      .where('invited_user_id', userId)
      .delete()
    // Udalosti (channel.updated, membership.changed) posiela volajúci po zápise (A7).
  }

  /**
   * Odoberie člena (odchod, /revoke, /kick). Jeho hlasy v kanáli a hlasy proti nemu
   * už neplatia, preto ich zmažeme.
   * trx: ak voláme z transakcie (ban pri /kick), dotazy musia ísť cez ňu.
   * https://lucid.adonisjs.com/docs/transactions#using-transactions-with-models
   */
  static async removeMember(
    channelId: number,
    userId: number,
    trx?: TransactionClientContract
  ): Promise<void> {
    await ChannelMember.query({ client: trx })
      .where('channel_id', channelId)
      .where('user_id', userId)
      .delete()
    await KickVote.query({ client: trx })
      .where('channel_id', channelId)
      .where((query) => {
        query.where('voter_id', userId).orWhere('target_user_id', userId)
      })
      .delete()
    // Udalosti posiela volajúci až po commite – removeMember môže bežať v transakcii (A7).
  }

  /**
   * Zruší kanál. Členstvá, pozvánky, hlasy, bany aj správy zmaže DB cez ON DELETE CASCADE,
   * takže názov je hneď voľný a história sa neprenesie.
   * Členom pošle channel.deleted a pozvaným invitation.removed (A7).
   */
  static async deleteChannel(channel: Channel, reason: DeletionReason = 'deleted'): Promise<void> {
    //Publikum zistíme pred zmazaním - CASCADE zmaze clenstva aj pozvanky
    const audience = await ChannelEventsService.audience(channel.id)
    await channel.delete()

    const change = {
      type: 'deleted',
      channel: ChannelEventsService.channelDto(channel),
      reason,
    } as const
    ChannelEventsService.send(ChannelEventsService.plan(change, audience))
  }
}
