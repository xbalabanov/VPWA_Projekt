import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Ban from '#models/ban'
import Invitation from '#models/invitation'
import KickVote from '#models/kick_vote'
import ChannelAccessService from '#services/channel_access_service'
import ChannelMembershipService from '#services/channel_membership_service'
import ChannelModerationService from '#services/channel_moderation_service'

// Pravidlá UC4 (/invite, /revoke, /kick) priamo nad službou a skutočnou DB.
// Každý test beží v transakcii, ktorá sa na konci vráti späť.
test.group('ChannelModerationService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // Predpona t_, aby testy nekolidovali s demo účtami zo seedu (ed, jana…).
  async function createUser(name: string) {
    const nickName = `t_${name}`
    return User.create({
      firstName: name,
      lastName: 'Test',
      nickName,
      email: `${nickName}@test.sk`,
      password: 'heslo1234',
    })
  }

  // Ed = správca, Jana, Peter, Mária = hlasujúci, Tomáš = cieľ (ako v seed scenári).
  async function publicChannelWithMembers() {
    const [ed, jana, peter, maria, tomas] = await Promise.all(
      ['ed', 'jana', 'peter', 'maria', 'tomas'].map(createUser)
    )
    const channel = await ChannelMembershipService.createChannel('verejny', false, ed.id)
    for (const user of [jana, peter, maria, tomas]) {
      await ChannelMembershipService.addMember(channel, user.id)
    }
    return { channel, ed, jana, peter, maria, tomas }
  }

  test('tri rôzne hlasy = ban, opakovaný hlas sa nezapočíta', async ({ assert }) => {
    const { channel, jana, peter, maria, tomas } = await publicChannelWithMembers()

    const first = await ChannelModerationService.kick(channel, jana.id, tomas)
    assert.deepEqual(first, { banned: false, votes: 1 })

    // Jana hlasuje znova – počet sa nezmení
    const again = await ChannelModerationService.kick(channel, jana.id, tomas)
    assert.deepEqual(again, { banned: false, votes: 1 })

    const second = await ChannelModerationService.kick(channel, peter.id, tomas)
    assert.deepEqual(second, { banned: false, votes: 2 })
    assert.isTrue(await ChannelAccessService.isMember(channel.id, tomas.id))

    const third = await ChannelModerationService.kick(channel, maria.id, tomas)
    assert.isTrue(third.banned)
    assert.isFalse(await ChannelAccessService.isMember(channel.id, tomas.id))
    assert.isTrue(await ChannelAccessService.isBanned(channel.id, tomas.id))

    // hlasy proti vyhodenému už neplatia
    const votesLeft = await KickVote.query()
      .where('channel_id', channel.id)
      .where('target_user_id', tomas.id)
    assert.lengthOf(votesLeft, 0)
  })

  test('správca vyhodí okamžite a zabanovaný sa nevie vrátiť cez /join', async ({ assert }) => {
    const { channel, ed, tomas } = await publicChannelWithMembers()

    const result = await ChannelModerationService.kick(channel, ed.id, tomas)
    assert.isTrue(result.banned)
    assert.isTrue(await ChannelAccessService.isBanned(channel.id, tomas.id))
    assert.isFalse(await ChannelAccessService.isMember(channel.id, tomas.id))
  })

  test('ban zmaže starú pozvánku, aby ho neobišla', async ({ assert }) => {
    const { channel, ed, tomas } = await publicChannelWithMembers()
    await ChannelModerationService.kick(channel, ed.id, tomas)
    // pozvánka vytvorená "za chrbtom" pred banom
    await Invitation.create({ channelId: channel.id, invitedUserId: tomas.id, invitedById: ed.id })
    await ChannelModerationService.ban(channel.id, tomas.id)

    const invitations = await Invitation.query()
      .where('channel_id', channel.id)
      .where('invited_user_id', tomas.id)
    assert.lengthOf(invitations, 0)
    const bans = await Ban.query().where('channel_id', channel.id).where('user_id', tomas.id)
    assert.lengthOf(bans, 1)
  })

  test('správca cez /invite zruší ban a pošle pozvánku, člen nie', async ({ assert }) => {
    const { channel, ed, jana, tomas } = await publicChannelWithMembers()
    await ChannelModerationService.kick(channel, ed.id, tomas)

    await assert.rejects(
      () => ChannelModerationService.invite(channel, jana.id, tomas),
      't_tomas má zakázaný prístup, pozvať ho môže iba správca'
    )

    await ChannelModerationService.invite(channel, ed.id, tomas)
    assert.isFalse(await ChannelAccessService.isBanned(channel.id, tomas.id))
    // členom sa stane až po prijatí pozvánky
    assert.isFalse(await ChannelAccessService.isMember(channel.id, tomas.id))
    const invitation = await Invitation.query()
      .where('channel_id', channel.id)
      .where('invited_user_id', tomas.id)
      .first()
    assert.isNotNull(invitation)
  })

  test('súkromný kanál: pozýva a odoberá iba správca, člen nehlasuje', async ({ assert }) => {
    const [ed, jana, peter] = await Promise.all(['ed', 'jana', 'peter'].map(createUser))
    const channel = await ChannelMembershipService.createChannel('tajny', true, ed.id)
    await ChannelMembershipService.addMember(channel, jana.id)

    await assert.rejects(
      () => ChannelModerationService.invite(channel, jana.id, peter),
      'Do súkromného kanála môže pozývať iba správca'
    )
    await assert.rejects(
      () => ChannelModerationService.kick(channel, jana.id, ed),
      'V súkromnom kanáli môže vyhadzovať iba správca'
    )

    await ChannelModerationService.invite(channel, ed.id, peter)
    await ChannelModerationService.revoke(channel, ed.id, peter) // zruší pozvánku
    await ChannelModerationService.revoke(channel, ed.id, jana) // odoberie člena
    assert.isFalse(await ChannelAccessService.isMember(channel.id, jana.id))
    await assert.rejects(
      () => ChannelModerationService.revoke(channel, jana.id, ed),
      'Používateľa môže odobrať iba správca'
    )
  })

  test('správcu nemožno vyhodiť hlasovaním', async ({ assert }) => {
    const { channel, ed, jana } = await publicChannelWithMembers()
    await assert.rejects(
      () => ChannelModerationService.kick(channel, jana.id, ed),
      'Správcu nemožno vyhodiť'
    )
  })
})
