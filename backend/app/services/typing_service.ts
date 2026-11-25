import socket from '@rlanz/socket/services/main'
import ChannelMember from '#models/channel_member'

/**
 * Živé drafty – „X píše…“ s náhľadom textu (UC11, B7).
 * Draft je dočasný: neukladá sa do DB, iba sa prepošle ostatným aktuálnym členom kanála
 * na ich odber správ channels/:channelId/:userId.
 *
 * Udalosti (frontend/src/types/api.ts):
 * - typing.updated → { channelId, userId, text }  (rozpísaný text)
 * - typing.stopped → { channelId, userId }        (odoslal, vymazal, odišiel, odpojil sa)
 */
export default class TypingService {
  /**
   * Pošle draft autora ostatným členom kanála. Prázdny text (aj iba medzery) = typing.stopped.
   * Členstvo autora overí volajúci (TypingController cez assertMember, onLeave pri odchode).
   */
  static async publish(channelId: number, authorId: number, text: string): Promise<void> {
    // Ostatni aktualni clenovia - autor svoj draft nepotrebuje, neclen ho nedostane
    const members = await ChannelMember.query()
      .where('channel_id', channelId)
      .whereNot('user_id', authorId)
      .select('user_id')

    // Iba medzery su ako prazdny text - nepise nic
    const stopped = text.trim() === ''

    for (const member of members) {
      const room = socket.to(`channels/${channelId}/${member.userId}`)
      if (stopped) room.emit('typing.stopped', { channelId, userId: authorId })
      else room.emit('typing.updated', { channelId, userId: authorId, text })
    }
  }
}
