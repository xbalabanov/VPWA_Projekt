import Channel from '#models/channel'
import Invitation from '#models/invitation'
import User from '#models/user'
import Ban from '#models/ban'
import KickVote from '#models/kick_vote'
import db from '@adonisjs/lucid/services/db'
import ChannelAccessService from '#services/channel_access_service'
import ChannelMembershipService from '#services/channel_membership_service'
import { Exception } from '@adonisjs/core/exceptions'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

// Koľko rôznych členov musí dať /kick, kým je používateľ vo verejnom kanáli zabanovaný (UC4).
export const KICK_VOTES_FOR_BAN = 3

export interface KickResult {
  banned: boolean // bol používateľ vyhodený (ban)?
  votes: number // počet platných hlasov proti nemu (pri admin kicku 0)
}

/**
 * Príkazy /invite, /revoke, /kick (UC4). Všetko overuje server, takže pravidlá sa nedajú
 * obísť priamym API requestom. Pravidlá: zadanie + docs/faza-2.md (Pravidlá, ktoré zachováme).
 */
export default class ChannelModerationService {
  /**
   * Nájde používateľa podľa nicku (nicky sú v DB lowercase), inak 404.
   */
  static async findUserOrFail(nickName: string): Promise<User> {
    const user = await User.findBy('nick_name', nickName.toLowerCase())
    if (!user) {
      throw new Exception(`Používateľ ${nickName} neexistuje`, { status: 404 })
    }
    return user
  }

  /**
   * /invite nick
   * - súkromný kanál: pozýva iba správca; verejný: ktorýkoľvek člen
   * - zabanovaného môže pozvať iba správca a tým mu ban zruší (+ dostane pozvánku,
   *   členom sa stane až po prijatí)
   */
  static async invite(channel: Channel, actorId: number, target: User): Promise<void> {
    const isAdmin = ChannelAccessService.isAdmin(channel, actorId)

    if (channel.isPrivate && !isAdmin) {
      throw new Exception('Do súkromného kanála môže pozývať iba správca', { status: 403 })
    }
    if (await ChannelAccessService.isMember(channel.id, target.id)) {
      throw new Exception(`${target.nickName} už je členom kanála`, { status: 422 })
    }

    if (await ChannelAccessService.isBanned(channel.id, target.id)) {
      if (!isAdmin) {
        throw new Exception(`${target.nickName} má zakázaný prístup, pozvať ho môže iba správca`, {
          status: 403,
        })
      }
      await this.unban(channel.id, target.id)
    }

    const existing = await Invitation.query()
      .where('channel_id', channel.id)
      .where('invited_user_id', target.id)
      .first()
    if (existing) {
      throw new Exception(`${target.nickName} je už pozvaný`, { status: 422 })
    }

    await Invitation.create({
      channelId: channel.id,
      invitedUserId: target.id,
      invitedById: actorId,
    })
    // udalosť pre socket (B2): invitation.created (adresátovi)
  }

  /**
   * /revoke nick – iba v súkromnom kanáli a iba správca. Odoberie člena alebo zruší pozvánku.
   */
  static async revoke(channel: Channel, actorId: number, target: User): Promise<void> {
    if (!channel.isPrivate) {
      throw new Exception('Príkaz /revoke je iba pre súkromné kanály, použi /kick', { status: 422 })
    }
    if (!ChannelAccessService.isAdmin(channel, actorId)) {
      throw new Exception('Používateľa môže odobrať iba správca', { status: 403 })
    }
    if (target.id === actorId) {
      throw new Exception('Nemôžeš odobrať sám seba, použi /cancel', { status: 422 })
    }

    if (await ChannelAccessService.isMember(channel.id, target.id)) {
      await ChannelMembershipService.removeMember(channel.id, target.id)
      return
    }

    const deleted = await Invitation.query()
      .where('channel_id', channel.id)
      .where('invited_user_id', target.id)
      .delete()
    // delete() vráti pole s počtom zmazaných riadkov
    if (Number(deleted[0]) === 0) {
      throw new Exception(`${target.nickName} nie je členom kanála`, { status: 404 })
    }
  }

  /**
   * /kick nick
   * - správca: okamžitý ban (aj v súkromnom kanáli – rozhodnutie tímu, docs/faza-2.md)
   * - člen vo verejnom kanáli: hlas; 3 rôzne hlasy = ban
   * - člen v súkromnom kanáli: nesmie (na to je /revoke správcu)
   */
  static async kick(channel: Channel, actorId: number, target: User): Promise<KickResult> {
    if (target.id === actorId) {
      throw new Exception('Nemôžeš vyhodiť sám seba, použi /cancel', { status: 422 })
    }
    if (!(await ChannelAccessService.isMember(channel.id, target.id))) {
      throw new Exception(`${target.nickName} nie je členom kanála`, { status: 404 })
    }

    if (ChannelAccessService.isAdmin(channel, actorId)) {
      await this.ban(channel.id, target.id)
      return { banned: true, votes: 0 }
    }

    if (channel.isPrivate) {
      throw new Exception('V súkromnom kanáli môže vyhadzovať iba správca', { status: 403 })
    }
    if (ChannelAccessService.isAdmin(channel, target.id)) {
      throw new Exception('Správcu nemožno vyhodiť', { status: 403 })
    }

    return this.vote(channel.id, actorId, target.id)
  }

  /**
   * Ban: odobratie z kanála + zákaz návratu. Zmaže aj staré pozvánky, aby ban neobišli.
   * trx: keď ban vzniká v rámci hlasovania, musí byť v tej istej transakcii.
   */
  static async ban(channelId: number, userId: number, trx?: TransactionClientContract) {
    // Odoberie člena a zmaže jeho hlasy aj hlasy proti nemu.
    await ChannelMembershipService.removeMember(channelId, userId, trx)

    //Stará pozvánka by ban obišla (acceptne -> vráti sa)
    await Invitation.query({ client: trx })
      .where('channel_id', channelId)
      .where('invited_user_id', userId)
      .delete()

    //Zápis banu; firstOrCreate nevytvorí duplikát, ak ban už jestvuje.
    await Ban.firstOrCreate({ channelId, userId }, {}, { client: trx })
    //udaost pre socket (B2): channel.deleted vyhodenému, membership.changed ostatným
  }

  /**
   * Hlas za vyhodenie vo verejnom kanáli. Opakovaný hlas toho istého člena sa nezapočíta.
   * Tretí rôzny hlas = ban. Celé v transakcii, aby dva súčasné hlasy nespravili chybu.
   */
  static async vote(channelId: number, voterId: number, targetId: number): Promise<KickResult> {
    //Všetko v jeden transakcii: prejde celé alebo nič
    // https://lucid.adonisjs.com/docs/transactions
    return db.transaction(async (trx) => {
      //Zamkneme riadok kanála, aby súćasné hlasy v tom istom kanáli išli po jednom
      //a dvaja "tretí" hlasujúci nespravili 2x ban
      await Channel.query({ client: trx }).where('id', channelId).forUpdate().first()

      //Hlas zapíšeme iba raz - opakovaný hlas toho istého člena nič nepridá
      await KickVote.firstOrCreate(
        { channelId, targetUserId: targetId, voterId },
        {},
        { client: trx }
      )

      //spočítma rôznych hlasujúcich voči targetu
      const votes = await KickVote.query({ client: trx })
        .where('channel_id', channelId)
        .where('target_user_id', targetId)

      if (votes.length >= KICK_VOTES_FOR_BAN) {
        await this.ban(channelId, targetId, trx)
        return { banned: true, votes: votes.length }
      }
      return { banned: false, votes: votes.length }
    })
  }

  /**
   * Zrušenie banu správcom (cez /invite).
   */
  static async unban(channelId: number, userId: number): Promise<void> {
    await Ban.query().where('channel_id', channelId).where('user_id', userId).delete()
  }
}
