import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

// Profil používateľa pre frontend (typ User vo frontend/src/types/models.ts).
// Heslo sa nikdy neposiela.
export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'firstName',
      'lastName',
      'nickName',
      'email',
      'status',
      'notifyMentionsOnly',
      'initials',
    ])
  }
}
