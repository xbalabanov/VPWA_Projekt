import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import MemberTransformer from '#transformers/member_transformer'
import { userSearchValidator } from '#validators/channel'

export default class UsersController {
  /**
   * GET /api/v1/users/search?nick=ja – najviac 10 používateľov, ktorých nick začína textom.
   * Iba verejné údaje (bez emailu), slúži na dopĺňanie pri /invite.
   */
  async search({ request, serialize }: HttpContext) {
    const { nick } = await request.validateUsing(userSearchValidator)

    // Nicky sú v DB lowercase. % a _ v hľadanom texte escapujeme, aby neboli zástupné znaky.
    const prefix = nick.toLowerCase().replace(/[\\%_]/g, (char) => `\\${char}`)
    const users = await User.query()
      .whereRaw('nick_name LIKE ?', [`${prefix}%`])
      .orderBy('nick_name')
      .limit(10)

    return serialize(MemberTransformer.transform(users))
  }
}
