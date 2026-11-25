import { BaseChannel, SocketResponseError, type AuthenticatedSocket } from '@rlanz/socket'
import type User from '#models/user'
import ChannelAccessService from '#services/channel_access_service'
import { Exception } from '@adonisjs/core/exceptions'

export default class ChannelMessagesChannel extends BaseChannel<User> {
  static pattern = 'channels/:channelId/:userId'

  async onJoin(socket: AuthenticatedSocket<User>, channel: string, userId: string) {
    const user = socket.getUserOrFail()
    const channelId = Number(channel)

    if (!Number.isSafeInteger(channelId) || channelId < 1 || String(channelId) !== channel) {
      throw new SocketResponseError('Neplatný kanál')
    }

    if (String(user.id) !== userId) {
      throw new SocketResponseError('Tento odber ti nepatrí')
    }

    try {
      await ChannelAccessService.assertMember(channelId, user.id)
    } catch (error) {
      if (error instanceof Exception && (error.status === 403 || error.status === 404)) {
        throw new SocketResponseError(error.message)
      }
      throw error
    }
  }
}
