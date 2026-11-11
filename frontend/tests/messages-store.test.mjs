import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createPinia, setActivePinia } from 'pinia';
import { useMessagesStore } from '../src/stores/messages.ts';
import { useUsersStore } from '../src/stores/users.ts';

// Každý test dostane nové, nezávislé stores.
beforeEach(() => {
  setActivePinia(createPinia());
  useUsersStore().currentUserId = 1;
});

function makeMessage(id, overrides = {}) {
  return {
    id,
    channelId: 1,
    authorId: 2,
    content: 'Testovacia správa',
    createdAt: '2026-11-10T10:00:00.000Z',
    mentionedUserIds: [],
    ...overrides,
  };
}

test('opätovné doručenie aktualizuje správu a jej adresátov', () => {
  const store = useMessagesStore();

  store.upsertApiMessages([makeMessage(10, { mentionedUserIds: [1] })]);

  store.upsertApiMessages([
    makeMessage(10, {
      content: 'Aktualizovaná správa',
      mentionedUserIds: [2, 2],
    }),
  ]);

  assert.equal(store.messages.length, 1);
  assert.equal(store.messages[0].content, 'Aktualizovaná správa');
  assert.equal(store.isMentioned(10, 1), false);
  assert.equal(store.isMentioned(10, 2), true);
  assert.equal(store.mentions.length, 1);
});

test('používa kurzor servera a skončí po poslednej stránke', async (t) => {
  const store = useMessagesStore();
  store.setSource('api');

  const fetchMock = t.mock.method(globalThis, 'fetch', async (input) => {
    const beforeId = new URL(String(input)).searchParams.get('beforeId');

    if (beforeId === null) {
      return Response.json({
        data: {
          messages: [makeMessage(20)],
          nextBeforeId: 13,
          hasMore: true,
        },
      });
    }

    assert.equal(beforeId, '13');

    return Response.json({
      data: {
        messages: [makeMessage(5)],
        nextBeforeId: null,
        hasMore: false,
      },
    });
  });

  await store.loadOlder(1);
  assert.equal(store.nextBeforeId[1], 13);

  await store.loadOlder(1);
  await store.loadOlder(1);

  assert.deepEqual(
    store.messages.map((message) => message.id),
    [5, 20],
  );
  assert.equal(store.hasMoreFor(1), false);
  assert.equal(fetchMock.mock.callCount(), 2);
});

test('chyba ponechá históriu aj kurzor a dovolí opakovanie', async (t) => {
  const store = useMessagesStore();
  store.setSource('api');
  let attempt = 0;

  t.mock.method(globalThis, 'fetch', async () => {
    attempt += 1;

    if (attempt === 2) {
      return Response.json({ message: 'Dočasný výpadok servera.' }, { status: 503 });
    }

    return Response.json({
      data: {
        messages: [makeMessage(attempt === 1 ? 20 : 5)],
        nextBeforeId: attempt === 1 ? 13 : null,
        hasMore: attempt === 1,
      },
    });
  });

  await store.loadOlder(1);
  await store.loadOlder(1);

  assert.deepEqual(
    store.messages.map((message) => message.id),
    [20],
  );
  assert.equal(store.nextBeforeId[1], 13);
  assert.equal(store.loadErrorFor(1), 'Dočasný výpadok servera.');
  assert.equal(store.loading[1], false);

  await store.loadOlder(1);

  assert.deepEqual(
    store.messages.map((message) => message.id),
    [5, 20],
  );
  assert.equal(store.loadErrorFor(1), null);
});

test('nezdvojí požiadavku a ignoruje odpoveď starého zdroja', async (t) => {
  const store = useMessagesStore();
  store.setSource('api');

  const { promise, resolve } = Promise.withResolvers();
  const fetchMock = t.mock.method(globalThis, 'fetch', () => promise);

  const pending = store.loadOlder(1);
  await store.loadOlder(1);

  assert.equal(fetchMock.mock.callCount(), 1);
  assert.equal(store.loading[1], true);

  store.setSource('mock');

  resolve(
    Response.json({
      data: {
        messages: [makeMessage(90)],
        nextBeforeId: null,
        hasMore: false,
      },
    }),
  );

  await pending;

  assert.equal(store.source, 'mock');
  assert.deepEqual(store.messages, []);
  assert.deepEqual(store.mentions, []);
  assert.deepEqual(store.loading, {});
});

test('ignoruje odpoveď určenú predchádzajúcemu používateľovi', async (t) => {
  const store = useMessagesStore();
  store.setSource('api');

  const { promise, resolve } = Promise.withResolvers();
  t.mock.method(globalThis, 'fetch', () => promise);

  const pending = store.loadOlder(1);

  useUsersStore().currentUserId = 2;

  resolve(
    Response.json({
      data: {
        messages: [makeMessage(90)],
        nextBeforeId: null,
        hasMore: false,
      },
    }),
  );

  await pending;

  assert.deepEqual(store.messages, []);
  assert.deepEqual(store.mentions, []);
  assert.equal(store.loading[1], false);
});

test('odoslanie použije odpoveď servera a pri chybe zachová správy', async (t) => {
  const store = useMessagesStore();
  store.setSource('api');
  let attempt = 0;

  t.mock.method(globalThis, 'fetch', async (_input, options) => {
    attempt += 1;

    if (attempt === 1) {
      assert.deepEqual(JSON.parse(options.body), {
        content: 'Ahoj @jana',
      });

      return Response.json(
        {
          data: makeMessage(81, {
            authorId: 1,
            content: 'Ahoj @jana',
            mentionedUserIds: [42],
          }),
        },
        { status: 201 },
      );
    }

    return Response.json({ message: 'Správu sa nepodarilo uložiť.' }, { status: 503 });
  });

  assert.equal(await store.sendMessage(1, '  Ahoj @jana  '), null);
  assert.equal(store.isMentioned(81, 42), true);
  assert.equal(store.isMentioned(81, 2), false);

  assert.equal(await store.sendMessage(1, 'Druhá správa'), 'Správu sa nepodarilo uložiť.');

  assert.deepEqual(
    store.messages.map((message) => message.id),
    [81],
  );
});
