import type { HttpContext } from '@adonisjs/core/http'
import ChannelAccessService from '#services/channel_access_service'
import TypingService from '#services/typing_service'
import { typingValidator } from '#validators/message'

/**
 * Živé drafty (UC11, B7). Klient posiela svoj rozpísaný text najviac raz za ~300 ms.
 */
export default class TypingController {
  /**
   * PUT /api/v1/channels/:id/typing { text } – prázdny text = prestal písať.
   * Draft smie poslať iba aktuálny člen kanála (403), neukladá sa.
   */
  async update({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params, text } = await request.validateUsing(typingValidator)
    await ChannelAccessService.assertMember(params.id, user.id)

    await TypingService.publish(params.id, user.id, text ?? '')
    // Odpoveď v tvare { data } ako ostatné endpointy (frontend apiRequest ho očakáva).
    return serialize({ ok: true })
  }
}
