import type Channel from '#models/channel'
import { BaseTransformer } from '@adonisjs/core/transformers'

// Kanál pre frontend (typ Channel vo frontend/src/types/models.ts).
export default class ChannelTransformer extends BaseTransformer<Channel> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'isPrivate', 'adminId']),
      lastActivityAt: this.resource.lastActivityAt.toISO(),
    }
  }
}
