import { ChannelMemberSchema } from '#database/schema'
import Channel from '#models/channel'
import User from '#models/user'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

// Jeden riadok channel_members. Primárny kľúč je dvojica (channel_id, user_id),
// Lucid však pozná iba jednostĺpcový kľúč. Preto záznamy mažeme cez query(),
// nie cez instance.delete().
export default class ChannelMember extends ChannelMemberSchema {
  static table = 'channel_members'

  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
