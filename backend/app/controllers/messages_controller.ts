import type { HttpContext } from '@adonisjs/core/http'
import Message from '#models/message'
import ChannelAccessService from '#services/channel_access_service'
import ChannelExpirationService from '#services/channel_expiration_service'
import MessageTransformer from '#transformers/message_transformer'
import { listMessagesValidator, sendMessageValidator } from '#validators/message'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import { extractMentionedNickNames } from '../utils/mentions.js'
import socket from '@rlanz/socket/services/main'

export default class MessagesController {
  async index({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params, beforeId, limit = 20 } = await request.validateUsing(listMessagesValidator)

    await ChannelAccessService.assertMember(params.id, user.id)

    const query = Message.query()
      .where('channel_id', params.id)
      .preload('mentionedUsers')
      .orderBy('id', 'desc')
      .limit(limit + 1)

    if (beforeId !== undefined) {
      query.where('id', '<', beforeId)
    }

    const rows = await query
    const hasMore = rows.length > limit
    const messages = rows.slice(0, limit).reverse()

    return serialize({
      messages: MessageTransformer.transform(messages),
      nextBeforeId: hasMore ? (messages[0]?.id ?? null) : null,
      hasMore,
    })
  }

  async store({ auth, request, response, serialize, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params, content } = await request.validateUsing(sendMessageValidator)
    const { id: channelId } = await ChannelAccessService.assertMember(params.id, user.id)
    const nickNames = extractMentionedNickNames(content)

    const message = await db.transaction(async (trx) => {
      const channel = await Channel.query({ client: trx })
        .where('id', channelId)
        .forUpdate()
        .firstOrFail()

      // Kanál mohol medzičasom expirovať (A5). Pod zámkom ho zmažeme a správu neuložíme,
      // aby nová správa neoživila zaniknutý kanál. Výnimku vyhodíme až po commite,
      // inak by rollback vrátil späť aj zmazanie.
      if (ChannelExpirationService.isExpired(channel)) {
        await channel.delete()
        return null
      }

      // Členstvo sa mohlo zmeniť od prvej kontroly. Zámok ho podrží do commitu.
      const membership = await ChannelMember.query({ client: trx })
        .where('channel_id', channel.id)
        .where('user_id', user.id)
        .forShare()
        .first()

      if (!membership) {
        throw new Exception('Nie si členom tohto kanála', { status: 403 })
      }

      const saved = await Message.create(
        { channelId: channel.id, authorId: user.id, content },
        { client: trx }
      )

      if (nickNames.length > 0) {
        const mentionedUsers = await channel
          .related('members')
          .query()
          .whereRaw('LOWER(users.nick_name) = ANY(?::text[])', [nickNames])

        await saved.related('mentionedUsers').attach(
          mentionedUsers.map((member) => member.id),
          trx
        )
      }

      channel.lastActivityAt = saved.createdAt
      await channel.save()
      await saved.load('mentionedUsers')

      return saved
    })

    if (!message) {
      throw new Exception('Kanál zanikol, viac ako 30 dní v ňom nebola správa', { status: 404 })
    }

    const result = await serialize(MessageTransformer.transform(message))

    try {
      const members = await ChannelMember.query().where('channel_id', channelId).select('user_id')

      for (const member of members) {
        socket.to(`channels/${channelId}/${member.userId}`).emit('message.created', result.data)
      }
    } catch (error) {
      logger.error({ err: error, messageId: message.id }, 'Nepodarilo sa doručiť správu cez socket')
    }

    response.status(201)
    return result
  }
}
