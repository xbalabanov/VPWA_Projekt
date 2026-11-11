import { ChannelSchema } from '#database/schema'
import User from '#models/user'
import Invitation from '#models/invitation'
import KickVote from '#models/kick_vote'
import Ban from '#models/ban'
import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Channel extends ChannelSchema {
  // Správca kanála = jeho tvorca.
  // https://lucid.adonisjs.com/docs/belongs-to
  @belongsTo(() => User, {
    foreignKey: 'adminId',
  })
  declare admin: BelongsTo<typeof User>

  // Členovia cez spojovaciu tabuľku channel_members (vzťah M:N z UML).
  // https://lucid.adonisjs.com/docs/many-to-many
  @manyToMany(() => User, {
    pivotTable: 'channel_members',
    pivotForeignKey: 'channel_id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['joined_at'],
  })
  declare members: ManyToMany<typeof User>

  // https://lucid.adonisjs.com/docs/has-many
  @hasMany(() => Invitation)
  declare invitations: HasMany<typeof Invitation>

  @hasMany(() => KickVote)
  declare kickVotes: HasMany<typeof KickVote>

  @hasMany(() => Ban)
  declare bans: HasMany<typeof Ban>
}
