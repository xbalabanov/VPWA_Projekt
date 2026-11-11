import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import Invitation from '#models/invitation'
import ChannelAccessService from '#services/channel_access_service'
import ChannelExpirationService from '#services/channel_expiration_service'
import ChannelMembershipService from '#services/channel_membership_service'
import ChannelTransformer from '#transformers/channel_transformer'
import InvitationTransformer from '#transformers/invitation_transformer'

/**
 * Pozvánky prihláseného používateľa (UC2). Vybaviť ich smie iba adresát.
 */
export default class InvitationsController {
  /**
   * GET /api/v1/invitations – moje pozvánky, najnovšie navrchu.
   */
  async index({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const invitations = await Invitation.query()
      .where('invited_user_id', user.id)
      .preload('channel')
      .preload('invitedBy')
      .orderBy('created_at', 'desc')

    return serialize(InvitationTransformer.transform(invitations))
  }

  /**
   * POST /api/v1/invitations/:id/accept – prijatie: z pozvánky sa stane členstvo.
   */
  async accept({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const invitation = await this.findMyInvitation(Number(params.id), user.id)

    await invitation.load('channel')
    // Expirovaný kanál (A5) zanikne aj s pozvánkou (CASCADE).
    if (await ChannelExpirationService.deleteIfExpired(invitation.channel)) {
      throw new Exception('Kanál zanikol, viac ako 30 dní v ňom nebola správa', { status: 404 })
    }
    if (await ChannelAccessService.isBanned(invitation.channelId, user.id)) {
      await invitation.delete()
      throw new Exception('Máš zakázaný prístup do tohto kanála', { status: 403 })
    }

    // addMember zmaže aj samotnú pozvánku.
    await ChannelMembershipService.addMember(invitation.channel, user.id)
    return serialize(ChannelTransformer.transform(invitation.channel))
  }

  /**
   * DELETE /api/v1/invitations/:id – odmietnutie pozvánky.
   */
  async destroy({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const invitation = await this.findMyInvitation(Number(params.id), user.id)

    await invitation.delete()
    return serialize({ deleted: true })
  }

  /**
   * Cudziu pozvánku hlásime rovnako ako neexistujúcu (404), aby sa nedalo zisťovať,
   * aké pozvánky majú iní používatelia.
   */
  private async findMyInvitation(invitationId: number, userId: number): Promise<Invitation> {
    const invitation = await Invitation.find(invitationId)
    if (!invitation || invitation.invitedUserId !== userId) {
      throw new Exception('Pozvánka neexistuje', { status: 404 })
    }
    return invitation
  }
}
