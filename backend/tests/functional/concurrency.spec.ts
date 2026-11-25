import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import User from '#models/user'
import Ban from '#models/ban'
import Channel from '#models/channel'
import Invitation from '#models/invitation'
import KickVote from '#models/kick_vote'
import Message from '#models/message'
import ChannelAccessService from '#services/channel_access_service'
import ChannelMembershipService from '#services/channel_membership_service'
import ChannelExpirationService from '#services/channel_expiration_service'

// Súbežné operácie (A8): členstvo, bany a história musia ostať konzistentné.
// Bez globálnej transakcie – každá požiadavka ide cez vlastné DB spojenie, takže zámky
// (forUpdate) naozaj súťažia. Testy zdieľajú DB s demom: vytvárajú iba záznamy s prefixom
// t_a8_ a v teardown ich zmažú (žiadny truncate).
const PREFIX = 't_a8_'

test.group('Súbežné operácie', (group) => {
  group.each.teardown(async () => {
    // Kanály najprv – CASCADE zmaže členstvá, pozvánky, hlasy, bany a správy.
    await db.from('channels').where('name', 'like', `${PREFIX}%`).delete()
    await db.from('users').where('nick_name', 'like', `${PREFIX}%`).delete()
  })

  let counter = 0
  async function user(name: string) {
    const nick = `${PREFIX}${name}${++counter}`
    return User.create({
      firstName: 'Test',
      lastName: name,
      nickName: nick,
      email: `${nick}@test.sk`,
      password: 'heslo1234',
    })
  }

  async function publicChannel(adminId: number, memberIds: number[]) {
    const channel = await ChannelMembershipService.createChannel(
      `${PREFIX}kanal${++counter}`,
      false,
      adminId
    )
    for (const id of memberIds) await ChannelMembershipService.addMember(channel, id)
    return channel
  }

  test('traja hlasujú naraz: jeden ban, vyhodený nie je člen, hlasy sú zmazané', async ({
    client,
    assert,
  }) => {
    const admin = await user('admin')
    const voters = await Promise.all([user('v'), user('v'), user('v')])
    const target = await user('t')
    const channel = await publicChannel(admin.id, [...voters.map((v) => v.id), target.id])

    const responses = await Promise.all(
      voters.map((voter) =>
        client
          .post(`/api/v1/channels/${channel.id}/kick`)
          .json({ nickName: target.nickName })
          .loginAs(voter)
      )
    )

    for (const response of responses) assert.include([200, 404], response.status())
    const bans = await Ban.query().where('channel_id', channel.id).where('user_id', target.id)
    assert.lengthOf(bans, 1)
    assert.isFalse(await ChannelAccessService.isMember(channel.id, target.id))
    const votes = await KickVote.query()
      .where('channel_id', channel.id)
      .where('target_user_id', target.id)
    assert.lengthOf(votes, 0)
  })

  test('/join a /kick naraz: nikto nie je zároveň člen aj zabanovaný', async ({
    client,
    assert,
  }) => {
    const admin = await user('admin')

    for (let round = 0; round < 5; round++) {
      const target = await user('t')
      const channel = await publicChannel(admin.id, [target.id])

      // Vyhodený sa hneď pokúša vrátiť.
      const responses = await Promise.all([
        client
          .post(`/api/v1/channels/${channel.id}/kick`)
          .json({ nickName: target.nickName })
          .loginAs(admin),
        client.post('/api/v1/channels/join').json({ name: channel.name }).loginAs(target),
      ])

      for (const response of responses) assert.notEqual(response.status(), 500)
      const member = await ChannelAccessService.isMember(channel.id, target.id)
      const banned = await ChannelAccessService.isBanned(channel.id, target.id)
      assert.isFalse(member && banned, `kolo ${round}: člen aj ban naraz`)
      assert.isTrue(banned, `kolo ${round}: správca kick má skončiť banom`)
    }
  })

  test('/invite a ban naraz: zabanovaný sa cez pozvánku nedostane do kanála', async ({
    client,
    assert,
  }) => {
    const admin = await user('admin')
    const inviter = await user('m')

    for (let round = 0; round < 5; round++) {
      const target = await user('t')
      const channel = await publicChannel(admin.id, [inviter.id, target.id])

      await Promise.all([
        client
          .post(`/api/v1/channels/${channel.id}/kick`)
          .json({ nickName: target.nickName })
          .loginAs(admin),
        client
          .post(`/api/v1/channels/${channel.id}/invitations`)
          .json({ nickName: target.nickName })
          .loginAs(inviter),
      ])

      // Ak pozvánka prekĺzla, jej prijatie musí zlyhať.
      const invitations = await Invitation.query()
        .where('channel_id', channel.id)
        .where('invited_user_id', target.id)
      for (const invitation of invitations) {
        const accept = await client
          .post(`/api/v1/invitations/${invitation.id}/accept`)
          .loginAs(target)
        assert.equal(accept.status(), 403, `kolo ${round}: prijatie pozvánky po bane`)
      }
      assert.isTrue(await ChannelAccessService.isBanned(channel.id, target.id))
      assert.isFalse(await ChannelAccessService.isMember(channel.id, target.id))
    }
  })

  test('správa do práve expirujúceho kanála: uložená správa nezmizne s kanálom', async ({
    client,
    assert,
  }) => {
    const admin = await user('admin')

    for (let round = 0; round < 5; round++) {
      // Podľa servera (teraz) kanál ešte žije, podľa upratovania (o 10 dní) už nie.
      const channel = await publicChannel(admin.id, [])
      channel.lastActivityAt = DateTime.now().minus({ days: 25 })
      await channel.save()

      const [sent] = await Promise.all([
        client
          .post(`/api/v1/channels/${channel.id}/messages`)
          .json({ content: `kolo ${round}` })
          .loginAs(admin),
        ChannelExpirationService.deleteExpiredChannel(
          channel.id,
          DateTime.now().plus({ days: 10 })
        ),
      ])

      const exists = (await Channel.find(channel.id)) !== null
      const messages = await Message.query().where('channel_id', channel.id)

      if (sent.status() === 201) {
        // Správa prišla skôr – kanál má čerstvú aktivitu a upratovanie ho nesmie zmazať.
        assert.isTrue(exists, `kolo ${round}: uložená správa zmizla so zmazaným kanálom`)
        assert.lengthOf(messages, 1)
      } else {
        // Upratovanie bolo skôr – správa sa neuložila a kanál je preč aj s históriou.
        // 404 = kanál už neexistoval, 403 = zmizol medzi kontrolou kanála a členstva.
        assert.include([403, 404], sent.status())
        assert.isFalse(exists)
        assert.lengthOf(messages, 0)
      }
    }
  })
})
