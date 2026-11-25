import { BaseChannel, SocketResponseError, type AuthenticatedSocket } from '@rlanz/socket'
import type User from '#models/user'

/**
 * Osobný odber prihláseného používateľa (A7): pozvánky a zmeny dostupných kanálov
 * (invitation.created/removed, channel.updated/deleted, membership.changed).
 * Udalosti posiela ChannelEventsService cez socket.to(`users/${id}`).emit(...).
 * Kontrakt: docs/faza-2.md, „Socket users/:id – odber len vlastnej identity“.
 */
export default class UserEventsChannel extends BaseChannel<User> {
  static pattern = 'users/:userId'

  // https://github.com/RomainLanz/socket#define-channels (onJoin – autorizácia odberu)
  async onJoin(socket: AuthenticatedSocket<User>, userId: string) {
    const user = socket.getUserOrFail()

    // users/5 smie odoberat iba pouzivatel s ID 5, porovnanie stringov odmietnej aj 05 ci abc
    if (String(user.id) !== userId) {
      throw new SocketResponseError('Tento odber ti nepatrí')
    }
  }
}
