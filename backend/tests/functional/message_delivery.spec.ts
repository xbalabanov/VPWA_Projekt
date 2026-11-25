import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import socket from '@rlanz/socket/services/main'
import User from '#models/user'
import ChannelMembershipService from '#services/channel_membership_service'

// Po strate členstva server nedoručí obsah kanála ani starému odberu (A7):
// message.created ide iba na channels/:kanál/:člen aktuálnych členov.
test.group('Doručenie správ iba aktuálnym členom', (group) => {
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

  test('vyhodený člen nedostane ďalšiu správu', async ({ client }) => {
    const admin = await user('t_admin')
    const anna = await user('t_anna')
    const boris = await user('t_boris')
    const channel = await ChannelMembershipService.createChannel('t_kanal', false, admin.id)
    await ChannelMembershipService.addMember(channel, anna.id)
    await ChannelMembershipService.addMember(channel, boris.id)

    await client
      .post(`/api/v1/channels/${channel.id}/kick`)
      .json({ nickName: 't_boris' })
      .loginAs(admin)
    const fake = socket.fake()

    const response = await client
      .post(`/api/v1/channels/${channel.id}/messages`)
      .json({ content: 'po vyhodení' })
      .loginAs(anna)

    response.assertStatus(201)
    fake.assertEmittedTo(`channels/${channel.id}/${anna.id}`, 'message.created')
    fake.assertEmittedTo(`channels/${channel.id}/${admin.id}`, 'message.created')
    fake.assertNotEmittedTo(`channels/${channel.id}/${boris.id}`, 'message.created')
  })

  test('člen, ktorý odišiel (/cancel), nedostane ďalšiu správu', async ({ client }) => {
    const admin = await user('t_admin')
    const anna = await user('t_anna')
    const channel = await ChannelMembershipService.createChannel('t_kanal', false, admin.id)
    await ChannelMembershipService.addMember(channel, anna.id)

    await client.delete(`/api/v1/channels/${channel.id}/membership`).loginAs(anna)
    const fake = socket.fake()

    await client
      .post(`/api/v1/channels/${channel.id}/messages`)
      .json({ content: 'po odchode' })
      .loginAs(admin)

    fake.assertNotEmittedTo(`channels/${channel.id}/${anna.id}`, 'message.created')
  })
})
