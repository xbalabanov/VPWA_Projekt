import Channel from '#models/channel'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import ChannelMembershipService from '#services/channel_membership_service'
import ChannelEventsService from '#services/channel_events_service'

// Kanál bez novej správy dlhšie ako 30 dní zaniká (UC2).
export const EXPIRATION_DAYS = 30

/**
 * Expirácia kanálov (A5). Kanál sa zmaže pri relevantnom prístupe:
 * zoznam kanálov, /join, vstup do kanála (ChannelAccessService.findChannelOrFail),
 * prijatie pozvánky a odoslanie správy.
 *
 * Pre B1 (správy, Maksym): pri odoslaní správy v jednej transakcii
 *   1. zamkni kanál: Channel.query({ client: trx }).where('id', id).forUpdate().first()
 *   2. ChannelExpirationService.isExpired(channel) → ak áno, kanál zmaž a vráť 404
 *   3. vlož správu a nastav channel.lastActivityAt = DateTime.now() (useTransaction(trx).save())
 * Tak expirovaný kanál "nesúťaží" s novou správou (docs/faza-2.md, Pravidlá).
 */
export default class ChannelExpirationService {
  /**
   * Je kanál expirovaný? Posledná aktivita je staršia ako 30 dní pred `now`.
   * `now` je parameter, aby sa dala hranica otestovať bez čakania 30 dní.
   */
  static isExpired(channel: Channel, now: DateTime = DateTime.now()): boolean {
    //Hranica = presne 30 dní pred teraz. Expirovaný je kanál,
    // kt. aktivita je staršia = menšia, ako táto hranica (presne 30 dní ešte nn)
    const limit = now.minus({ days: EXPIRATION_DAYS })
    return channel.lastActivityAt < limit
  }

  /**
   * Ak je kanál expirovaný, zmaže ho (aj s históriou) a vráti true. Inak vráti false.
   */
  static async deleteIfExpired(channel: Channel): Promise<boolean> {
    if (!this.isExpired(channel)) return false

    //Zmazanie kanála zmaže cez ON DELETE CASCADE aj členov, pozvánky, hlasy, bany a správy
    // Členovia dostanú channel.deleted s dôvodom 'expired' (A7).
    await ChannelMembershipService.deleteChannel(channel, 'expired')
    return true
  }

  /**
   * Pravidelné upratovanie (A8): zmaže všetky expirované kanály aj bez prístupu používateľa
   * a vráti ich počet. Spúšťa ho preload start/channel_cleanup.ts (server) a príkaz
   * `node ace channels:cleanup`.
   */
  static async cleanupExpired(now: DateTime = DateTime.now()): Promise<number> {
    const limit = now.minus({ days: EXPIRATION_DAYS })

    // Kandidati: posledna aktivita pred hranicou. Kazdeho overime pod zamkom
    const candidates = await Channel.query()
      .where('last_activity_at', '<', limit.toJSDate())
      .select('id')

    let deleted = 0
    for (const candidate of candidates) {
      if (await this.deleteExpiredChannel(candidate.id, now)) deleted++
    }
    return deleted
  }

  /**
   * Zmaže jeden kanál, ak je expirovaný, a jeho členom pošle channel.deleted (reason 'expired').
   * Kanál zamkne a expiráciu overí znova – medzitým doň mohla prísť správa (A8, súbežnosť).
   * Vráti true, ak kanál zmazal.
   */
  static async deleteExpiredChannel(
    channelId: number,
    now: DateTime = DateTime.now()
  ): Promise<boolean> {
    const removed = await db.transaction(async (trx) => {
      // Zamok riadku kanala - odoslanie spravy zamkya ten isty riadok, takze neprebehnu naraz
      const channel = await Channel.query({ client: trx })
        .where('id', channelId)
        .forUpdate()
        .first()

      // Kanal medzitym zanikol inak alebo don prisla sprava - nechame ho
      if (!channel || !this.isExpired(channel, now)) return null

      // Publikum pred zmazanim (CASCADE zmaze clenov aj pozvnaky)
      const audience = await ChannelEventsService.audience(channel.id, trx)
      await channel.delete()
      return { channel: ChannelEventsService.channelDto(channel), audience }
    })

    if (!removed) return false

    // Udalosti az po commite transakcie.
    const change = { type: 'deleted', channel: removed.channel, reason: 'expired' } as const
    ChannelEventsService.send(ChannelEventsService.plan(change, removed.audience))
    return true
  }
}
