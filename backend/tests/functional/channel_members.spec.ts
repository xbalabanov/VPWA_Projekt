import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import ChannelMembershipService from '#services/channel_membership_service'

// GET /channels/:id/members – zoznam členov pre /list (UC10, A6).
// Čítať ho smie iba aktuálny člen, aj pri priamom volaní API.
test.group('GET /channels/:id/members', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

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
    const channel = await ChannelMembershipService.createChannel('t_list', false, admin.id)
    await ChannelMembershipService.addMember(channel, anna.id)
    return { admin, anna, cyril, channel }
  }

  test('člen dostane aktuálnych členov bez emailu, so stavom', async ({ client, assert }) => {
    const { admin, anna, channel } = await channelWithMembers()

    const response = await client.get(`/api/v1/channels/${channel.id}/members`).loginAs(anna)

    response.assertStatus(200)
    const members = response.body().data as Record<string, unknown>[]
    assert.sameMembers(
      members.map((m) => m.id),
      [admin.id, anna.id]
    )
    // Verejné údaje + stav (B6), bez emailu a hesla.
    assert.properties(members[0], ['id', 'firstName', 'lastName', 'nickName', 'status'])
    assert.notProperty(members[0], 'email')
    assert.notProperty(members[0], 'password')
  })

  test('nečlen dostane 403', async ({ client }) => {
    const { cyril, channel } = await channelWithMembers()

    const response = await client.get(`/api/v1/channels/${channel.id}/members`).loginAs(cyril)

    response.assertStatus(403)
  })

  test('neprihlásený dostane 401, neexistujúci kanál 404', async ({ client }) => {
    const { anna, channel } = await channelWithMembers()

    const anonymous = await client.get(`/api/v1/channels/${channel.id}/members`)
    anonymous.assertStatus(401)

    const missing = await client.get(`/api/v1/channels/999999/members`).loginAs(anna)
    missing.assertStatus(404)
  })

  test('po /kick vyhodený zoznam nečíta a ostatní ho v ňom nevidia', async ({ client, assert }) => {
    const { admin, anna, channel } = await channelWithMembers()

    await client
      .post(`/api/v1/channels/${channel.id}/kick`)
      .json({ nickName: 't_anna' })
      .loginAs(admin)

    const kicked = await client.get(`/api/v1/channels/${channel.id}/members`).loginAs(anna)
    kicked.assertStatus(403)

    const remaining = await client.get(`/api/v1/channels/${channel.id}/members`).loginAs(admin)
    assert.deepEqual(
      (remaining.body().data as { id: number }[]).map((m) => m.id),
      [admin.id]
    )
  })

  test('po /cancel odídený zoznam nečíta', async ({ client }) => {
    const { anna, channel } = await channelWithMembers()

    await client.delete(`/api/v1/channels/${channel.id}/membership`).loginAs(anna)

    const response = await client.get(`/api/v1/channels/${channel.id}/members`).loginAs(anna)
    response.assertStatus(403)
  })
})
