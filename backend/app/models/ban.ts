import { BanSchema } from '#database/schema'
import Channel from '#models/channel'
import User from '#models/user'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

// Trvalý zákaz vstupu do kanála. Zruší ho iba správca cez /invite.
export default class Ban extends BanSchema {
  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
