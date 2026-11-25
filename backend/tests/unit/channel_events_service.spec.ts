import { test } from '@japa/runner'
import ChannelEventsService, {
  type Audience,
  type ChannelDto,
  type Delivery,
} from '#services/channel_events_service'

// Výber príjemcov udalostí (A7) – čistá funkcia, bez DB a socketu.
const channel: ChannelDto = {
  id: 7,
  name: 'projekt',
  isPrivate: true,
  adminId: 1,
  lastActivityAt: '2026-11-25T10:00:00.000Z',
}

const audience: Audience = {
  memberIds: [1, 2, 3],
  invitations: [{ id: 50, userId: 9 }],
}

// Pre prehľadné porovnanie: "userId event", zoradené.
function summary(deliveries: Delivery[]): string[] {
  return deliveries.map((d) => `${d.userId} ${d.event}`).sort()
}

function dataFor(deliveries: Delivery[], userId: number) {
  return deliveries.find((d) => d.userId === userId)?.data
}

test.group('ChannelEventsService.plan', () => {
  test('pozvánka ide iba adresátovi', ({ assert }) => {
    const invitation = {
      id: 51,
      channelId: 7,
      invitedUserId: 4,
      invitedById: 1,
      createdAt: '2026-11-25T10:00:00.000Z',
      channelName: 'projekt',
      channelIsPrivate: true,
      invitedByNickName: 'ed',
    }
    const deliveries = ChannelEventsService.plan({ type: 'invited', invitation }, audience)

    assert.deepEqual(summary(deliveries), ['4 invitation.created'])
    assert.deepEqual(dataFor(deliveries, 4), invitation)
  })

  test('zrušená pozvánka ide iba jej adresátovi', ({ assert }) => {
    const deliveries = ChannelEventsService.plan(
      { type: 'invitationRemoved', invitationId: 50, channelId: 7, userId: 9 },
      audience
    )

    assert.deepEqual(summary(deliveries), ['9 invitation.removed'])
    assert.deepEqual(dataFor(deliveries, 9), { invitationId: 50, channelId: 7 })
  })

  test('nový člen dostane kanál, ostatní membership.changed', ({ assert }) => {
    // userId 3 práve vstúpil – v publiku už je
    const deliveries = ChannelEventsService.plan({ type: 'joined', channel, userId: 3 }, audience)

    assert.deepEqual(summary(deliveries), [
      '1 membership.changed',
      '2 membership.changed',
      '3 channel.updated',
    ])
    assert.deepEqual(dataFor(deliveries, 3), channel)
    assert.deepEqual(dataFor(deliveries, 1), { channelId: 7, userId: 3, change: 'joined' })
  })

  test('odobratý člen dostane channel.deleted, zvyšní membership.changed', ({ assert }) => {
    // userId 4 už v publiku nie je (odobratý pred zistením publika)
    const deliveries = ChannelEventsService.plan(
      { type: 'removed', channel, userId: 4, reason: 'kicked' },
      audience
    )

    assert.deepEqual(summary(deliveries), [
      '1 membership.changed',
      '2 membership.changed',
      '3 membership.changed',
      '4 channel.deleted',
    ])
    assert.deepEqual(dataFor(deliveries, 4), {
      channelId: 7,
      channelName: 'projekt',
      reason: 'kicked',
    })
    assert.deepEqual(dataFor(deliveries, 2), { channelId: 7, userId: 4, change: 'kicked' })
  })

  test('zrušený kanál: členom channel.deleted, pozvaným invitation.removed', ({ assert }) => {
    const deliveries = ChannelEventsService.plan(
      { type: 'deleted', channel, reason: 'expired' },
      audience
    )

    assert.deepEqual(summary(deliveries), [
      '1 channel.deleted',
      '2 channel.deleted',
      '3 channel.deleted',
      '9 invitation.removed',
    ])
    assert.deepEqual(dataFor(deliveries, 1), {
      channelId: 7,
      channelName: 'projekt',
      reason: 'expired',
    })
    assert.deepEqual(dataFor(deliveries, 9), { invitationId: 50, channelId: 7 })
  })
})
