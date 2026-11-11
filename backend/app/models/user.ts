import { UserSchema } from '#database/schema'
import Channel from '#models/channel'
import Invitation from '#models/invitation'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

export default class User extends compose(
  UserSchema,
  withAuthFinder(() => hash.use())
) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  // Kanály, v ktorých je používateľ členom (opačná strana Channel.members).
  // https://lucid.adonisjs.com/docs/many-to-many
  @manyToMany(() => Channel, {
    pivotTable: 'channel_members',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'channel_id',
    pivotColumns: ['joined_at'],
  })
  declare channels: ManyToMany<typeof Channel>

  // Pozvánky, ktoré používateľ dostal.
  @hasMany(() => Invitation, {
    foreignKey: 'invitedUserId',
  })
  declare invitations: HasMany<typeof Invitation>

  // Iniciály pre avatar z mena a priezviska (napr. Ed Novák -> EN).
  get initials() {
    return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase()
  }
}
