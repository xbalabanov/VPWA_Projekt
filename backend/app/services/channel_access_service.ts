import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import Ban from '#models/ban'
import { Exception } from '@adonisjs/core/exceptions'

/**
 * Spoločné overenie prístupu ku kanálu. Používajú ho kanálové controllery
 * (Stanislav) aj správy a socket odbery (Maksym), aby pravidlá boli na jednom mieste.
 *
 * Metódy is* iba odpovedajú áno/nie. Metódy assert* pri porušení pravidla
 * vyhodia výnimku, ktorú Adonis zmení na HTTP odpoveď (404 alebo 403).
 * https://docs.adonisjs.com/guides/basics/exception-handling
 */
export default class ChannelAccessService {
  /**
   * Nájde kanál podľa ID, inak vyhodí 404.
   */
  static async findChannelOrFail(channelId: number): Promise<Channel> {
    // https://lucid.adonisjs.com/docs/crud-operations#read
    const channel = await Channel.find(channelId)
    if (!channel) {
      throw new Exception('Kanál neexistuje', { status: 404 })
    }
    return channel
  }

  /**
   * Je používateľ členom kanála? (záznam v channel_members)
   */
  static async isMember(channelId: number, userId: number): Promise<boolean> {
    const member = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', userId)
      .first()
    return member !== null
  }

  /**
   * Je používateľ správcom kanála? Kanál už máme načítaný, netreba ďalší dotaz.
   */
  static isAdmin(channel: Channel, userId: number): boolean {
    return channel.adminId === userId
  }

  /**
   * Má používateľ v kanáli ban? (záznam v bans)
   */
  static async isBanned(channelId: number, userId: number): Promise<boolean> {
    const ban = await Ban.query().where('channel_id', channelId).where('user_id', userId).first()
    return ban !== null
  }

  /**
   * Vráti kanál, ak je používateľ jeho členom.
   * 404 = kanál neexistuje, 403 = používateľ nie je člen.
   * Toto volajú správy, história a socket odber kanála.
   */
  static async assertMember(channelId: number, userId: number): Promise<Channel> {
    const channel = await this.findChannelOrFail(channelId)
    if (!(await this.isMember(channelId, userId))) {
      throw new Exception('Nie si členom tohto kanála', { status: 403 })
    }
    return channel
  }

  /**
   * Vráti kanál, ak je používateľ jeho správcom.
   * 404 = kanál neexistuje, 403 = nie je správca.
   */
  static async assertAdmin(channelId: number, userId: number): Promise<Channel> {
    const channel = await this.findChannelOrFail(channelId)
    if (!this.isAdmin(channel, userId)) {
      throw new Exception('Túto akciu môže vykonať iba správca', { status: 403 })
    }
    return channel
  }
}
