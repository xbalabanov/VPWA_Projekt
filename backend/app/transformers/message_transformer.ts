import type Message from '#models/message'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class MessageTransformer extends BaseTransformer<Message> {
  toObject() {
    if (!this.resource.$preloaded.mentionedUsers) {
      throw new Error('Pred transformáciou správy načítaj mentionedUsers.')
    }

    const createdAt = this.resource.createdAt.toISO()

    if (createdAt === null) {
      throw new Error('Správa obsahuje neplatný dátum vytvorenia.')
    }

    return {
      ...this.pick(this.resource, ['id', 'channelId', 'authorId', 'content']),
      createdAt,
      mentionedUserIds: this.resource.mentionedUsers.map((user) => user.id),
    }
  }
}
