import type { HttpContext } from '@adonisjs/core/http'
import ChannelAccessService from '#services/channel_access_service'
import ChannelModerationService from '#services/channel_moderation_service'
import ChannelEventsService from '#services/channel_events_service'
import { targetUserValidator } from '#validators/channel'

/**
 * Príkazy /invite, /revoke, /kick v aktívnom kanáli (UC4).
 * Controller iba overí, že volajúci je člen, nájde cieľ a zavolá službu s pravidlami.
 */
export default class ModerationController {
  /**
   * POST /api/v1/channels/:id/invitations { nickName }
   */
  async invite({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await ChannelAccessService.assertMember(Number(params.id), user.id)
    const { nickName } = await request.validateUsing(targetUserValidator)
    const target = await ChannelModerationService.findUserOrFail(nickName)

    const invitation = await ChannelModerationService.invite(channel, user.id, target)
    await ChannelEventsService.publish({
      type: 'invited',
      invitation: await ChannelEventsService.invitationDto(invitation),
    })

    response.status(201)
    return serialize({ invited: target.nickName })
  }

  /**
   * POST /api/v1/channels/:id/revoke { nickName }
   */
  async revoke({ auth, params, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await ChannelAccessService.assertMember(Number(params.id), user.id)
    const { nickName } = await request.validateUsing(targetUserValidator)
    const target = await ChannelModerationService.findUserOrFail(nickName)

    const result = await ChannelModerationService.revoke(channel, user.id, target)
    if (result.removed === 'member') {
      await ChannelEventsService.publish({
        type: 'removed',
        channel: ChannelEventsService.channelDto(channel),
        userId: target.id,
        reason: 'revoked',
      })
    } else {
      await ChannelEventsService.publish({
        type: 'invitationRemoved',
        invitationId: result.invitationId,
        channelId: channel.id,
        userId: target.id,
      })
    }
    return serialize({ revoked: target.nickName })
  }

  /**
   * POST /api/v1/channels/:id/kick { nickName } → { banned, votes }
   */
  async kick({ auth, params, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const channel = await ChannelAccessService.assertMember(Number(params.id), user.id)
    const { nickName } = await request.validateUsing(targetUserValidator)
    const target = await ChannelModerationService.findUserOrFail(nickName)

    const result = await ChannelModerationService.kick(channel, user.id, target)
    // Hlas bez banu nemení členstvo – udalosť iba pri bane (po commite hlasovania).
    if (result.banned) {
      await ChannelEventsService.publish({
        type: 'removed',
        channel: ChannelEventsService.channelDto(channel),
        userId: target.id,
        reason: 'kicked',
      })
    }
    return serialize({ nickName: target.nickName, ...result })
  }
}
