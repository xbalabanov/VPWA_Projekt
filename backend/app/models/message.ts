import { MessageSchema } from '#database/schema'
import User from '#models/user'
import { belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Message extends MessageSchema {
  // https://lucid.adonisjs.com/docs/belongs-to
  @belongsTo(() => User, {
    foreignKey: 'authorId',
  })
  declare author: BelongsTo<typeof User>

  // https://lucid.adonisjs.com/docs/many-to-many
  @manyToMany(() => User, {
    pivotTable: 'mentions',
    pivotForeignKey: 'message_id',
    pivotRelatedForeignKey: 'user_id',
  })
  declare mentionedUsers: ManyToMany<typeof User>
}
