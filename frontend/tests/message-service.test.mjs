import test from 'node:test';
import assert from 'node:assert/strict';
import messageService from '../src/services/MessageService.ts';
import { ApiError } from '../src/services/api.ts';

const page = {
  messages: [],
  nextBeforeId: null,
  hasMore: false,
};

test('načíta prvú stránku a pošle session cookies', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async (input, options) => {
    const url = new URL(String(input));

    assert.equal(url.origin, 'http://localhost:3333');
    assert.equal(url.pathname, '/api/v1/channels/7/messages');
    assert.equal(url.searchParams.get('limit'), '20');
    assert.equal(url.searchParams.has('beforeId'), false);
    assert.equal(options.credentials, 'include');
    assert.equal(new Headers(options.headers).get('Accept'), 'application/json');

    return Response.json({ data: page });
  });

  const result = await messageService.loadMessages(7);

  assert.deepEqual(result, page);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('načíta staršie správy podľa kurzora', async (t) => {
  t.mock.method(globalThis, 'fetch', async (input) => {
    const url = new URL(String(input));

    assert.equal(url.searchParams.get('beforeId'), '45');
    assert.equal(url.searchParams.get('limit'), '20');

    return Response.json({ data: page });
  });

  const result = await messageService.loadMessages(7, 45);

  assert.deepEqual(result, page);
});

test('odošle iba obsah a vráti správu zo servera', async (t) => {
  const message = {
    id: 81,
    channelId: 7,
    authorId: 2,
    content: 'Ahoj @jana',
    createdAt: '2026-11-09T10:00:00.000Z',
    mentionedUserIds: [3],
  };

  t.mock.method(globalThis, 'fetch', async (input, options) => {
    assert.equal(String(input), 'http://localhost:3333/api/v1/channels/7/messages');
    assert.equal(options.method, 'POST');
    assert.equal(options.credentials, 'include');
    assert.equal(new Headers(options.headers).get('Content-Type'), 'application/json');
    assert.deepEqual(JSON.parse(options.body), {
      content: 'Ahoj @jana',
    });

    return Response.json({ data: message }, { status: 201 });
  });

  const result = await messageService.sendMessage(7, 'Ahoj @jana');

  assert.deepEqual(result, message);
});

test('odovzdá chybu pri odmietnutí prístupu', async (t) => {
  const payload = {
    message: 'Nie si členom kanála.',
  };

  t.mock.method(globalThis, 'fetch', async () => {
    return Response.json(payload, { status: 403 });
  });

  await assert.rejects(
    () => messageService.loadMessages(7),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 403);
      assert.equal(error.message, 'Nie si členom kanála.');
      assert.deepEqual(error.details, payload);

      return true;
    },
  );
});

test('prečíta validačnú chybu Adonisu', async (t) => {
  const payload = {
    errors: [
      {
        field: 'content',
        rule: 'required',
        message: 'Zadaj obsah správy.',
      },
    ],
  };

  t.mock.method(globalThis, 'fetch', async () => {
    return Response.json(payload, { status: 422 });
  });

  await assert.rejects(
    () => messageService.sendMessage(7, ''),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 422);
      assert.equal(error.message, 'Zadaj obsah správy.');
      assert.deepEqual(error.details, payload);

      return true;
    },
  );
});

test('zvládne chybu servera aj bez JSON odpovede', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    return new Response('<html>Internal Server Error</html>', {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  });

  await assert.rejects(
    () => messageService.loadMessages(7),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 500);
      assert.equal(error.message, 'Požiadavka na server zlyhala.');
      assert.equal(error.details, null);

      return true;
    },
  );
});
