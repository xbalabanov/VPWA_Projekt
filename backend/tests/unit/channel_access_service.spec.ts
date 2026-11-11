import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import Channel from '#models/channel'
import Ban from '#models/ban'
import ChannelAccessService from '#services/channel_access_service'

// Každý test beží v transakcii, ktorá sa na konci vráti späť, takže DB ostane čistá.
// https://docs.adonisjs.com/guides/testing/database#wrapping-tests-in-transactions
test.group('ChannelAccessService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function createUser(nickName: string) {
    return User.create({
      firstName: nickName,
      lastName: 'Test',
      nickName,
      email: `${nickName}@test.sk`,
      password: 'heslo1234',
    })
  }

  test('rozlíši člena, správcu a zabanovaného', async ({ assert }) => {
    const admin = await createUser('admin')
    const member = await createUser('clen')
    const stranger = await createUser('cudzi')

    const channel = await Channel.create({ name: 'test', isPrivate: false, adminId: admin.id })
    await channel.related('members').attach([admin.id, member.id])
    await Ban.create({ channelId: channel.id, userId: stranger.id })

    assert.isTrue(await ChannelAccessService.isMember(channel.id, member.id))
    assert.isFalse(await ChannelAccessService.isMember(channel.id, stranger.id))
    assert.isTrue(ChannelAccessService.isAdmin(channel, admin.id))
    assert.isFalse(ChannelAccessService.isAdmin(channel, member.id))
    assert.isTrue(await ChannelAccessService.isBanned(channel.id, stranger.id))
    assert.isFalse(await ChannelAccessService.isBanned(channel.id, member.id))
  })

  test('assert* vracajú 404 a 403', async ({ assert }) => {
    const admin = await createUser('admin')
    const member = await createUser('clen')
    const channel = await Channel.create({ name: 'test', isPrivate: true, adminId: admin.id })
    await channel.related('members').attach([admin.id, member.id])

    const found = await ChannelAccessService.assertMember(channel.id, member.id)
    assert.equal(found.id, channel.id)

    await assert.rejects(() => ChannelAccessService.findChannelOrFail(999999), 'Kanál neexistuje')
    await assert.rejects(
      () => ChannelAccessService.assertAdmin(channel.id, member.id),
      'Túto akciu môže vykonať iba správca'
    )
    const outsider = await createUser('cudzi')
    await assert.rejects(
      () => ChannelAccessService.assertMember(channel.id, outsider.id),
      'Nie si členom tohto kanála'
    )
  })
})
