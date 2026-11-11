import type Channel from '#models/channel'
import { DateTime } from 'luxon'
import ChannelMembershipService from '#services/channel_membership_service'

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
    await ChannelMembershipService.deleteChannel(channel)
    return true
  }
}
