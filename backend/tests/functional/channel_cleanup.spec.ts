import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import socket from '@rlanz/socket/services/main'
import { DateTime } from 'luxon'
import User from '#models/user'
import Channel from '#models/channel'
import Invitation from '#models/invitation'
import Message from '#models/message'
import ChannelMembershipService from '#services/channel_membership_service'
import ChannelExpirationService from '#services/channel_expiration_service'

// Pravidelné mazanie expirovaných kanálov bez požiadavky klienta (A8).
test.group('ChannelExpirationService.cleanupExpired', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => socket.restore())

  async function user(nick: string) {
    return User.create({
      firstName: 'Test',
      lastName: nick,
      nickName: nick,
      email: `${nick}@test.sk`,
      password: 'heslo1234',
    })
  }

  async function channelWithActivity(name: string, adminId: number, daysAgo: number) {
    const channel = await ChannelMembershipService.createChannel(name, false, adminId)
    channel.lastActivityAt = DateTime.now().minus({ days: daysAgo })
    await channel.save()
    return channel
  }

  test('zmaže expirované kanály a čerstvé nechá', async ({ assert }) => {
    const admin = await user('t_admin')
    const old = await channelWithActivity('t_stary', admin.id, 40)
    const fresh = await channelWithActivity('t_cerstvy', admin.id, 5)
    const border = await channelWithActivity('t_hranica', admin.id, 29)

    const deleted = await ChannelExpirationService.cleanupExpired()

    // V DB môžu byť aj expirované demo kanály (seed), preto aspoň 1.
    // Global transaction ich po teste vráti späť.
    assert.isAtLeast(deleted, 1)
    assert.isNull(await Channel.find(old.id))
    assert.isNotNull(await Channel.find(fresh.id))
    assert.isNotNull(await Channel.find(border.id))
  })

  test('členom pošle channel.deleted (expired), pozvaným invitation.removed', async () => {
    const admin = await user('t_admin')
    const anna = await user('t_anna')
    const cyril = await user('t_cyril')
    const old = await channelWithActivity('t_stary', admin.id, 40)
    await ChannelMembershipService.addMember(old, anna.id)
    await Invitation.create({ channelId: old.id, invitedUserId: cyril.id, invitedById: admin.id })
    const fake = socket.fake()

    await ChannelExpirationService.cleanupExpired()

    for (const member of [admin, anna]) {
      fake.assertEmittedTo(`users/${member.id}`, 'channel.deleted', {
        data: (data: unknown) =>
          (data as { channelId: number; reason: string }).channelId === old.id &&
          (data as { reason: string }).reason === 'expired',
      })
    }
    fake.assertEmittedTo(`users/${cyril.id}`, 'invitation.removed')
  })

  test('čas `now` sa dá posunúť (kanál expiruje až po 30 dňoch)', async ({ assert }) => {
    const admin = await user('t_admin')
    const channel = await channelWithActivity('t_buduci', admin.id, 10)

    await ChannelExpirationService.cleanupExpired(DateTime.now().plus({ days: 15 }))
    assert.isNotNull(await Channel.find(channel.id))

    await ChannelExpirationService.cleanupExpired(DateTime.now().plus({ days: 25 }))
    assert.isNull(await Channel.find(channel.id))
  })

  test('upratovanie zmaže expirovaný kanál aj s celou históriou', async ({ assert }) => {
    const admin = await user('t_admin')
    const channel = await channelWithActivity('t_historia', admin.id, 0)
    await Message.create({ channelId: channel.id, authorId: admin.id, content: 'stará' })
    channel.lastActivityAt = DateTime.now().minus({ days: 40 })
    await channel.save()

    await ChannelExpirationService.cleanupExpired()

    assert.isNull(await Channel.find(channel.id))
    assert.lengthOf(await Message.query().where('channel_id', channel.id), 0)
    // Názov je voľný – nový kanál s rovnakým názvom nemá starú históriu.
    const again = await ChannelMembershipService.createChannel(channel.name, false, admin.id)
    assert.lengthOf(await Message.query().where('channel_id', again.id), 0)
  })

  test('deleteExpiredChannel: čerstvý ani neexistujúci kanál nezmaže', async ({ assert }) => {
    const admin = await user('t_admin')
    const fresh = await channelWithActivity('t_cerstvy', admin.id, 5)
    const old = await channelWithActivity('t_stary', admin.id, 40)

    assert.isFalse(await ChannelExpirationService.deleteExpiredChannel(fresh.id))
    assert.isFalse(await ChannelExpirationService.deleteExpiredChannel(999999))
    assert.isTrue(await ChannelExpirationService.deleteExpiredChannel(old.id))
    assert.isNotNull(await Channel.find(fresh.id))
    assert.isNull(await Channel.find(old.id))
  })
})
