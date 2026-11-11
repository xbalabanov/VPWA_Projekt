import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

// Verejné údaje člena kanála (zoznam členov, /list, mená autorov správ).
// Bez emailu a nastavení – tie vidí iba sám používateľ v profile.
export default class MemberTransformer extends BaseTransformer<User> {
  toObject() {
    return this.pick(this.resource, ['id', 'firstName', 'lastName', 'nickName', 'status'])
  }
}
