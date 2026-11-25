import { test } from '@japa/runner'
import type { AuthenticatedSocket } from '@rlanz/socket'
import UserEventsChannel from '#channels/user_events_channel'
import User from '#models/user'

// Autorizácia osobného odberu users/:userId (A7): iba vlastná identita.
function socketOf(user: User) {
  return { getUserOrFail: () => user } as unknown as AuthenticatedSocket<User>
}

test.group('UserEventsChannel.onJoin', () => {
  const ed = new User()
  ed.id = 1

  test('vlastný odber je povolený', async ({ assert }) => {
    await assert.doesNotReject(() => new UserEventsChannel().onJoin(socketOf(ed), '1'))
  })

  test('cudzí odber je odmietnutý', async ({ assert }) => {
    await assert.rejects(() => new UserEventsChannel().onJoin(socketOf(ed), '2'))
  })

  test('neplatné ID je odmietnuté', async ({ assert }) => {
    await assert.rejects(() => new UserEventsChannel().onJoin(socketOf(ed), '01'))
    await assert.rejects(() => new UserEventsChannel().onJoin(socketOf(ed), 'abc'))
  })
})
