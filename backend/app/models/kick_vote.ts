import { KickVoteSchema } from '#database/schema'
import Channel from '#models/channel'
import User from '#models/user'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

// Hlas za vyhodenie vo verejnom kanáli. Trojica (kanál, cieľ, hlasujúci) je
// v DB unikátna, takže ten istý člen nemôže hlasovať dvakrát.
export default class KickVote extends KickVoteSchema {
  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, {
    foreignKey: 'targetUserId',
  })
  declare targetUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'voterId',
  })
  declare voter: BelongsTo<typeof User>
}
