import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import socket from '@rlanz/socket/services/main'
import type { AuthenticatedSocket } from '@rlanz/socket'
import User from '#models/user'
import ChannelMessagesChannel from '#channels/channel_messages_channel'
import ChannelMembershipService from '#services/channel_membership_service'

// Živé drafty „X píše…“ (UC11, B7): kto dostane typing.updated / typing.stopped.
test.group('PUT /channels/:id/typing', (group) => {
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

  async function channelWithMembers() {
    const admin = await user('t_admin')
    const anna = await user('t_anna')
    const cyril = await user('t_cyril') // nie je členom
    const channel = await ChannelMembershipService.createChannel('t_typing', false, admin.id)
    await ChannelMembershipService.addMember(channel, anna.id)
    return { admin, anna, cyril, channel }
  }

  const room = (channelId: number, u: User) => `channels/${channelId}/${u.id}`

  test('draft dostanú ostatní členovia, autor nie', async ({ client }) => {
    const { admin, anna, cyril, channel } = await channelWithMembers()
    const fake = socket.fake()

    const response = await client
      .put(`/api/v1/channels/${channel.id}/typing`)
      .json({ text: 'Ahoj, práve pí' })
      .loginAs(anna)

    response.assertStatus(200)
    fake.assertEmittedTo(room(channel.id, admin), 'typing.updated', {
      data: { channelId: channel.id, userId: anna.id, text: 'Ahoj, práve pí' },
    })
    fake.assertNotEmittedTo(room(channel.id, anna), 'typing.updated')
    fake.assertNotEmittedTo(room(channel.id, cyril), 'typing.updated')
  })

  test('prázdny text alebo iba medzery = typing.stopped', async ({ client }) => {
    const { admin, anna, channel } = await channelWithMembers()
    const fake = socket.fake()

    await client.put(`/api/v1/channels/${channel.id}/typing`).json({ text: '' }).loginAs(anna)
    await client.put(`/api/v1/channels/${channel.id}/typing`).json({ text: '   ' }).loginAs(anna)

    fake.assertCount(2, { event: 'typing.stopped' })
    fake.assertEmittedTo(room(channel.id, admin), 'typing.stopped', {
      data: { channelId: channel.id, userId: anna.id },
    })
    fake.assertCount(0, { event: 'typing.updated' })
  })

  test('nečlen draft neposlal (403) a nikto nič nedostal', async ({ client }) => {
    const { cyril, channel } = await channelWithMembers()
    const fake = socket.fake()

    const response = await client
      .put(`/api/v1/channels/${channel.id}/typing`)
      .json({ text: 'som tu?' })
      .loginAs(cyril)

    response.assertStatus(403)
    fake.assertCount(0)
  })

  test('vyhodený člen už draft poslať nemôže', async ({ client }) => {
    const { admin, anna, channel } = await channelWithMembers()
    await client
      .post(`/api/v1/channels/${channel.id}/kick`)
      .json({ nickName: 't_anna' })
      .loginAs(admin)
    const fake = socket.fake()

    const response = await client
      .put(`/api/v1/channels/${channel.id}/typing`)
      .json({ text: 'ešte píšem' })
      .loginAs(anna)

    response.assertStatus(403)
    fake.assertCount(0, { event: 'typing.updated' })
  })

  test('príliš dlhý draft server odmietne (422)', async ({ client }) => {
    const { anna, channel } = await channelWithMembers()

    const response = await client
      .put(`/api/v1/channels/${channel.id}/typing`)
      .json({ text: 'x'.repeat(5001) })
      .loginAs(anna)

    response.assertStatus(422)
  })

  test('odchod z odberu alebo odpojenie (onLeave) zruší draft u ostatných', async () => {
    const { admin, anna, channel } = await channelWithMembers()
    const fake = socket.fake()
    const annaSocket = { getUserOrFail: () => anna } as unknown as AuthenticatedSocket<User>

    await new ChannelMessagesChannel().onLeave(annaSocket, String(channel.id))

    fake.assertEmittedTo(room(channel.id, admin), 'typing.stopped', {
      data: { channelId: channel.id, userId: anna.id },
    })
  })
})
