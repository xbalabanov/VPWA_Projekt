import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import ChannelAccessService from '#services/channel_access_service'
import ChannelMembershipService from '#services/channel_membership_service'
import ChannelTransformer from '#transformers/channel_transformer'
import MemberTransformer from '#transformers/member_transformer'
import { createChannelValidator, joinChannelValidator } from '#validators/channel'

/**
 * Kanály prihláseného používateľa (UC2) a vstup cez /join (UC4).
 * Všetky routes sú za middleware auth, takže auth.user je vždy nastavený.
 */
export default class ChannelsController {
  /**
   * GET /api/v1/channels – kanály, v ktorých som členom.
   */
  async index({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channels = await user.related('channels').query().orderBy('name')
    return serialize(ChannelTransformer.transform(channels))
  }

  /**
   * POST /api/v1/channels – vytvorenie kanála cez UI. Tvorca je správca.
   */
  async store({ auth, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { name, isPrivate } = await request.validateUsing(createChannelValidator)

    const channel = await ChannelMembershipService.createChannel(name, isPrivate ?? false, user.id)

    response.status(201)
    return serialize(ChannelTransformer.transform(channel))
  }

  /**
   * POST /api/v1/channels/join – príkaz /join nazov [private].
   * Neexistujúci kanál sa vytvorí, do verejného sa vstúpi, do súkromného iba cez pozvánku.
   * Pri existujúcom kanáli "private" nemení jeho typ (docs/faza-2.md, Pravidlá).
   */
  async join({ auth, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { name, isPrivate } = await request.validateUsing(joinChannelValidator)

    const existing = await ChannelMembershipService.findByName(name)
    if (!existing) {
      const created = await ChannelMembershipService.createChannel(
        name,
        isPrivate ?? false,
        user.id
      )
      response.status(201)
      return serialize(ChannelTransformer.transform(created))
    }

    // Už som členom – iba ho otvoríme, nič sa nemení.
    if (await ChannelAccessService.isMember(existing.id, user.id)) {
      return serialize(ChannelTransformer.transform(existing))
    }
    if (existing.isPrivate) {
      throw new Exception('Kanál je súkromný, potrebuješ pozvánku', { status: 403 })
    }
    if (await ChannelAccessService.isBanned(existing.id, user.id)) {
      throw new Exception('Máš zakázaný prístup do tohto kanála', { status: 403 })
    }

    await ChannelMembershipService.addMember(existing, user.id)
    return serialize(ChannelTransformer.transform(existing))
  }

  /**
   * DELETE /api/v1/channels/:id – zrušenie kanála (iba správca, aj /quit).
   */
  async destroy({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await ChannelAccessService.assertAdmin(Number(params.id), user.id)

    await ChannelMembershipService.deleteChannel(channel)
    return serialize({ deleted: true })
  }

  /**
   * DELETE /api/v1/channels/:id/membership – odchod z kanála (/cancel).
   * Ak odchádza správca, kanál zaniká pre všetkých.
   */
  async leave({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await ChannelAccessService.assertMember(Number(params.id), user.id)

    if (ChannelAccessService.isAdmin(channel, user.id)) {
      await ChannelMembershipService.deleteChannel(channel)
      return serialize({ deleted: true })
    }

    await ChannelMembershipService.removeMember(channel.id, user.id)
    return serialize({ deleted: false })
  }

  /**
   * GET /api/v1/channels/:id/members – členovia kanála (zoznam členov, /list, mená autorov).
   * Nečlen zoznam nedostane (403).
   */
  async members({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await ChannelAccessService.assertMember(Number(params.id), user.id)

    const members = await channel.related('members').query().orderBy('nick_name')
    return serialize(MemberTransformer.transform(members))
  }
}
