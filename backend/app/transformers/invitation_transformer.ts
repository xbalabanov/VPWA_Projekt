import type Invitation from '#models/invitation'
import { BaseTransformer } from '@adonisjs/core/transformers'

// Pozvánka pre adresáta. Okrem ID posielame aj názov kanála a nick pozývajúceho,
// lebo do kanála ešte nie je členom a inak by ich frontend nevedel zobraziť.
// Obsah kanála (správy, členov) pozvánka neprezradí.
export default class InvitationTransformer extends BaseTransformer<Invitation> {
  toObject() {
    if (!this.resource.$preloaded.channel || !this.resource.$preloaded.invitedBy) {
      throw new Error('Pred transformáciou pozvánky načítaj channel a invitedBy.')
    }

    return {
      ...this.pick(this.resource, ['id', 'channelId', 'invitedUserId', 'invitedById']),
      createdAt: this.resource.createdAt.toISO(),
      channelName: this.resource.channel.name,
      channelIsPrivate: this.resource.channel.isPrivate,
      invitedByNickName: this.resource.invitedBy.nickName,
    }
  }
}
