import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createPinia, setActivePinia } from 'pinia';
import { DRAFT_SEND_INTERVAL_MS, useMessagesStore } from '../src/stores/messages.ts';
import { useUsersStore } from '../src/stores/users.ts';

// Živé drafty „X píše…“ (UC11, B7).
beforeEach(() => {
  setActivePinia(createPinia());
  useUsersStore().currentUserId = 1;
  useMessagesStore().clearSession(); // zruší časovače z predošlého testu
});

// Zachytí odoslané drafty: [{ channelId, text }].
function captureTyping(t) {
  const sent = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const match = /\/channels\/(\d+)\/typing$/.exec(String(input));
    assert.ok(match, `neočakávaná požiadavka ${String(input)}`);
    assert.equal(init.method, 'PUT');
    sent.push({ channelId: Number(match[1]), text: JSON.parse(init.body).text });
    return Response.json({ data: { ok: true } });
  });
  return sent;
}

test('prvé písmeno sa pošle hneď, ďalšie najviac raz za interval s posledným textom', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sent = captureTyping(t);
  const store = useMessagesStore();

  store.setDraft(5, 'A');
  store.setDraft(5, 'Ah');
  store.setDraft(5, 'Aho');
  assert.deepEqual(sent, [{ channelId: 5, text: 'A' }]);

  t.mock.timers.tick(DRAFT_SEND_INTERVAL_MS);
  assert.deepEqual(sent.at(-1), { channelId: 5, text: 'Aho' });
  assert.equal(sent.length, 2);
});

test('prázdny text (odoslanie, vymazanie) sa pošle hneď a zruší čakajúci draft', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sent = captureTyping(t);
  const store = useMessagesStore();

  store.setDraft(5, 'A');
  store.setDraft(5, 'Ahoj');
  store.setDraft(5, '');
  assert.deepEqual(sent, [
    { channelId: 5, text: 'A' },
    { channelId: 5, text: '' },
  ]);

  // Po intervale sa už starý text „Ahoj“ neposiela.
  t.mock.timers.tick(DRAFT_SEND_INTERVAL_MS);
  assert.equal(sent.length, 2);
});

test('bez rozpísaného textu sa nič neposiela (prepnutie kanála, príkaz, iba medzery)', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sent = captureTyping(t);
  const store = useMessagesStore();

  store.setDraft(5, '');
  store.setDraft(5, '   ');
  t.mock.timers.tick(DRAFT_SEND_INTERVAL_MS);

  assert.equal(sent.length, 0);
});

test('rovnaký text sa znova neposiela', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sent = captureTyping(t);
  const store = useMessagesStore();

  store.setDraft(5, 'Ahoj');
  t.mock.timers.tick(DRAFT_SEND_INTERVAL_MS);
  store.setDraft(5, 'Ahoj');
  t.mock.timers.tick(DRAFT_SEND_INTERVAL_MS);

  assert.deepEqual(sent, [{ channelId: 5, text: 'Ahoj' }]);
});

test('každý kanál má vlastný interval', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sent = captureTyping(t);
  const store = useMessagesStore();

  store.setDraft(5, 'v piatom');
  store.setDraft(6, 'v šiestom');

  assert.deepEqual(sent, [
    { channelId: 5, text: 'v piatom' },
    { channelId: 6, text: 'v šiestom' },
  ]);
});

test('cudzí draft sa nahrádza, zmizne po typing.stopped; vlastný sa ignoruje', () => {
  const store = useMessagesStore();

  store.onRemoteDraft(5, 2, 'Ah');
  store.onRemoteDraft(5, 2, 'Ahoj');
  store.onRemoteDraft(5, 1, 'môj vlastný');
  assert.deepEqual(store.draftsIn(5), [{ channelId: 5, userId: 2, text: 'Ahoj' }]);

  store.removeDraft(5, 2);
  assert.deepEqual(store.draftsIn(5), []);
});
