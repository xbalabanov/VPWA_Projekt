import { InvitationSchema } from '#database/schema'
import Channel from '#models/channel'
import User from '#models/user'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

// Čakajúca pozvánka do kanála. Vybaviť ju môže iba adresát (invitedUserId).
export default class Invitation extends InvitationSchema {
  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, {
    foreignKey: 'invitedUserId',
  })
  declare invitedUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'invitedById',
  })
  declare invitedBy: BelongsTo<typeof User>
}
