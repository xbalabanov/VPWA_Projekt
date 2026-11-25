import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import socket from '@rlanz/socket/services/main'
import { DateTime } from 'luxon'
import User from '#models/user'
import Invitation from '#models/invitation'
import ChannelMembershipService from '#services/channel_membership_service'

// Kto dostane ktorú realtime udalosť (A7) pri skutočnom HTTP volaní.
// socket.fake() zachytí emitované udalosti bez WebSocket klientov.
// https://github.com/RomainLanz/socket#test-broadcasts
test.group('Realtime udalosti kanálov a členstva', (group) => {
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

  // Verejný kanál: admin + dvaja členovia.
  async function publicChannel() {
    const admin = await user('t_admin')
    const anna = await user('t_anna')
    const boris = await user('t_boris')
    const channel = await ChannelMembershipService.createChannel('t_verejny', false, admin.id)
    await ChannelMembershipService.addMember(channel, anna.id)
    await ChannelMembershipService.addMember(channel, boris.id)
    return { admin, anna, boris, channel }
  }

  const to = (u: User) => `users/${u.id}`

  test('/invite: pozvánka ide iba adresátovi', async ({ client }) => {
    const { admin, anna, channel } = await publicChannel()
    const cyril = await user('t_cyril')
    const fake = socket.fake()

    const response = await client
      .post(`/api/v1/channels/${channel.id}/invitations`)
      .json({ nickName: 't_cyril' })
      .loginAs(admin)

    response.assertStatus(201)
    fake.assertEmittedTo(to(cyril), 'invitation.created', {
      data: (data: unknown) => (data as { channelName: string }).channelName === 't_verejny',
    })
    fake.assertNotEmittedTo(to(anna), 'invitation.created')
  })

  test('prijatie pozvánky: ja channel.updated, ostatní membership.changed', async ({ client }) => {
    const { admin, anna, channel } = await publicChannel()
    const cyril = await user('t_cyril')
    const invitation = await Invitation.create({
      channelId: channel.id,
      invitedUserId: cyril.id,
      invitedById: admin.id,
    })
    const fake = socket.fake()

    const response = await client.post(`/api/v1/invitations/${invitation.id}/accept`).loginAs(cyril)

    response.assertStatus(200)
    fake.assertEmittedTo(to(cyril), 'channel.updated')
    fake.assertEmittedTo(to(admin), 'membership.changed', {
      data: (data: unknown) => (data as { change: string }).change === 'joined',
    })
    fake.assertEmittedTo(to(anna), 'membership.changed')
  })

  test('odmietnutie pozvánky: invitation.removed iba mne', async ({ client }) => {
    const { admin, anna, channel } = await publicChannel()
    const cyril = await user('t_cyril')
    const invitation = await Invitation.create({
      channelId: channel.id,
      invitedUserId: cyril.id,
      invitedById: admin.id,
    })
    const fake = socket.fake()

    const response = await client.delete(`/api/v1/invitations/${invitation.id}`).loginAs(cyril)

    response.assertStatus(200)
    fake.assertEmittedTo(to(cyril), 'invitation.removed')
    fake.assertNotEmittedTo(to(anna), 'invitation.removed')
  })

  test('/kick správcom: vyhodený channel.deleted, ostatní membership.changed', async ({
    client,
  }) => {
    const { admin, anna, boris, channel } = await publicChannel()
    const fake = socket.fake()

    const response = await client
      .post(`/api/v1/channels/${channel.id}/kick`)
      .json({ nickName: 't_boris' })
      .loginAs(admin)

    response.assertStatus(200)
    fake.assertEmittedTo(to(boris), 'channel.deleted', {
      data: (data: unknown) => (data as { reason: string }).reason === 'kicked',
    })
    fake.assertEmittedTo(to(anna), 'membership.changed', {
      data: (data: unknown) => (data as { userId: number }).userId === boris.id,
    })
    fake.assertEmittedTo(to(admin), 'membership.changed')
    fake.assertNotEmittedTo(to(boris), 'membership.changed')
  })

  test('/kick hlasom: prvý hlas nič nepošle, tretí hlas = ban a udalosti', async ({ client }) => {
    const { admin, anna, boris, channel } = await publicChannel()
    const dana = await user('t_dana')
    const emil = await user('t_emil')
    await ChannelMembershipService.addMember(channel, dana.id)
    await ChannelMembershipService.addMember(channel, emil.id)
    const fake = socket.fake()

    for (const voter of [anna, dana]) {
      await client
        .post(`/api/v1/channels/${channel.id}/kick`)
        .json({ nickName: 't_boris' })
        .loginAs(voter)
    }
    fake.assertCount(0)

    const third = await client
      .post(`/api/v1/channels/${channel.id}/kick`)
      .json({ nickName: 't_boris' })
      .loginAs(emil)

    third.assertBodyContains({ data: { banned: true } })
    fake.assertEmittedTo(to(boris), 'channel.deleted')
    fake.assertEmittedTo(to(admin), 'membership.changed')
  })

  test('/cancel člena: on channel.deleted (left), ostatní membership.changed', async ({
    client,
  }) => {
    const { admin, anna, channel } = await publicChannel()
    const fake = socket.fake()

    const response = await client.delete(`/api/v1/channels/${channel.id}/membership`).loginAs(anna)

    response.assertStatus(200)
    fake.assertEmittedTo(to(anna), 'channel.deleted', {
      data: (data: unknown) => (data as { reason: string }).reason === 'left',
    })
    fake.assertEmittedTo(to(admin), 'membership.changed')
  })

  test('/quit správcu: všetci členovia channel.deleted, pozvaný invitation.removed', async ({
    client,
  }) => {
    const { admin, anna, boris, channel } = await publicChannel()
    const cyril = await user('t_cyril')
    await Invitation.create({
      channelId: channel.id,
      invitedUserId: cyril.id,
      invitedById: admin.id,
    })
    const fake = socket.fake()

    const response = await client.delete(`/api/v1/channels/${channel.id}`).loginAs(admin)

    response.assertStatus(200)
    for (const member of [admin, anna, boris]) {
      fake.assertEmittedTo(to(member), 'channel.deleted', {
        data: (data: unknown) => (data as { reason: string }).reason === 'deleted',
      })
    }
    fake.assertEmittedTo(to(cyril), 'invitation.removed')
  })

  test('/revoke: člen channel.deleted (revoked), pozvaný invitation.removed', async ({
    client,
  }) => {
    const admin = await user('t_admin')
    const anna = await user('t_anna')
    const cyril = await user('t_cyril')
    const channel = await ChannelMembershipService.createChannel('t_tajny', true, admin.id)
    await ChannelMembershipService.addMember(channel, anna.id)
    await Invitation.create({
      channelId: channel.id,
      invitedUserId: cyril.id,
      invitedById: admin.id,
    })
    const fake = socket.fake()

    await client
      .post(`/api/v1/channels/${channel.id}/revoke`)
      .json({ nickName: 't_anna' })
      .loginAs(admin)
    await client
      .post(`/api/v1/channels/${channel.id}/revoke`)
      .json({ nickName: 't_cyril' })
      .loginAs(admin)

    fake.assertEmittedTo(to(anna), 'channel.deleted', {
      data: (data: unknown) => (data as { reason: string }).reason === 'revoked',
    })
    fake.assertEmittedTo(to(cyril), 'invitation.removed')
  })

  test('expirácia: členovia dostanú channel.deleted (expired)', async ({ client }) => {
    const { admin, anna, channel } = await publicChannel()
    channel.lastActivityAt = DateTime.now().minus({ days: 40 })
    await channel.save()
    const fake = socket.fake()

    const response = await client.get('/api/v1/channels').loginAs(admin)

    response.assertStatus(200)
    for (const member of [admin, anna]) {
      fake.assertEmittedTo(to(member), 'channel.deleted', {
        data: (data: unknown) => (data as { reason: string }).reason === 'expired',
      })
    }
  })

  test('správa do expirovaného kanála: členovia dostanú channel.deleted', async ({ client }) => {
    const { admin, anna, channel } = await publicChannel()
    channel.lastActivityAt = DateTime.now().minus({ days: 40 })
    await channel.save()
    const fake = socket.fake()

    const response = await client
      .post(`/api/v1/channels/${channel.id}/messages`)
      .json({ content: 'ahoj' })
      .loginAs(anna)

    response.assertStatus(404)
    fake.assertEmittedTo(to(admin), 'channel.deleted', {
      data: (data: unknown) => (data as { reason: string }).reason === 'expired',
    })
  })
})
