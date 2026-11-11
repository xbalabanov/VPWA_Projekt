import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import User from '#models/user'
import Channel from '#models/channel'
import ChannelMembershipService from '#services/channel_membership_service'

// Odoslanie správy a expirácia kanála (A5 + B1) cez skutočné HTTP volanie.
// https://docs.adonisjs.com/guides/testing/http-tests
test.group('POST /channels/:id/messages – expirácia', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function memberOfChannel(lastActivityAt: DateTime) {
    const user = await User.create({
      firstName: 'Test',
      lastName: 'Expiracia',
      nickName: 't_expiracia',
      email: 't_expiracia@test.sk',
      password: 'heslo1234',
    })
    const channel = await ChannelMembershipService.createChannel('t_kanal', false, user.id)
    channel.lastActivityAt = lastActivityAt
    await channel.save()
    return { user, channel }
  }

  test('do expirovaného kanála sa správa nepošle a kanál zanikne', async ({ client, assert }) => {
    const { user, channel } = await memberOfChannel(DateTime.now().minus({ days: 40 }))

    const response = await client
      .post(`/api/v1/channels/${channel.id}/messages`)
      .json({ content: 'ahoj' })
      .loginAs(user)

    response.assertStatus(404)
    assert.isNull(await Channel.find(channel.id))
  })

  test('správa v čerstvom kanáli posunie poslednú aktivitu', async ({ client, assert }) => {
    const before = DateTime.now().minus({ days: 5 })
    const { user, channel } = await memberOfChannel(before)

    const response = await client
      .post(`/api/v1/channels/${channel.id}/messages`)
      .json({ content: 'ahoj' })
      .loginAs(user)

    response.assertStatus(201)
    await channel.refresh()
    assert.isTrue(channel.lastActivityAt > before.plus({ days: 4 }))
  })
})
