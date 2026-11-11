import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import User from '#models/user'
import Channel from '#models/channel'
import ChannelAccessService from '#services/channel_access_service'
import ChannelExpirationService from '#services/channel_expiration_service'
import ChannelMembershipService from '#services/channel_membership_service'

// Hranica 30 dní bez čakania: čas poslednej aktivity nastavíme ručne.
test.group('ChannelExpirationService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function channelWithActivity(name: string, lastActivityAt: DateTime) {
    const admin = await User.create({
      firstName: 'Ed',
      lastName: 'Test',
      nickName: `ed_${name}`,
      email: `ed_${name}@test.sk`,
      password: 'heslo1234',
    })
    const channel = await ChannelMembershipService.createChannel(name, false, admin.id)
    channel.lastActivityAt = lastActivityAt
    await channel.save()
    return { channel, admin }
  }

  test('hranica 30 dní', ({ assert }) => {
    const now = DateTime.fromISO('2026-11-12T10:00:00Z')
    const channel = new Channel()

    channel.lastActivityAt = now.minus({ days: 29, hours: 23 })
    assert.isFalse(ChannelExpirationService.isExpired(channel, now))

    channel.lastActivityAt = now.minus({ days: 30 })
    assert.isFalse(ChannelExpirationService.isExpired(channel, now)) // presne 30 dní ešte nie

    channel.lastActivityAt = now.minus({ days: 30, minutes: 1 })
    assert.isTrue(ChannelExpirationService.isExpired(channel, now))
  })

  test('expirovaný kanál sa zmaže a názov sa uvoľní', async ({ assert }) => {
    const { channel, admin } = await channelWithActivity(
      'stary',
      DateTime.now().minus({ days: 40 })
    )

    assert.isTrue(await ChannelExpirationService.deleteIfExpired(channel))
    assert.isNull(await Channel.find(channel.id))

    // nový kanál s rovnakým názvom ide vytvoriť
    const again = await ChannelMembershipService.createChannel('stary', false, admin.id)
    assert.notEqual(again.id, channel.id)
  })

  test('čerstvý kanál zostane', async ({ assert }) => {
    const { channel } = await channelWithActivity('cerstvy', DateTime.now().minus({ days: 2 }))

    assert.isFalse(await ChannelExpirationService.deleteIfExpired(channel))
    assert.isNotNull(await Channel.find(channel.id))
  })

  test('vstup do expirovaného kanála vráti 404', async ({ assert }) => {
    const { channel, admin } = await channelWithActivity(
      'stary2',
      DateTime.now().minus({ days: 31 })
    )

    await assert.rejects(
      () => ChannelAccessService.assertMember(channel.id, admin.id),
      'Kanál zanikol, viac ako 30 dní v ňom nebola správa'
    )
    assert.isNull(await Channel.find(channel.id))
  })
})
