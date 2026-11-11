import { test } from '@japa/runner'
import { extractMentionedNickNames } from '../../app/utils/mentions.js'

// Testovacia štruktúra podľa dokumentácie AdonisJS:
// https://docs.adonisjs.com/guides/testing/introduction
test.group('Rozpoznávanie zmienok', () => {
  test('prázdny text neobsahuje zmienky', ({ assert }) => {
    assert.deepEqual(extractMentionedNickNames(''), [])
  })

  test('bežný text neobsahuje zmienky', ({ assert }) => {
    assert.deepEqual(extractMentionedNickNames('Ahojte, ako pokračuje projekt?'), [])
  })

  test('nájde viacerých adresátov', ({ assert }) => {
    assert.deepEqual(extractMentionedNickNames('Ahoj @jana a @peter'), ['jana', 'peter'])
  })

  test('zjednotí veľkosť písmen a odstráni duplicity', ({ assert }) => {
    assert.deepEqual(extractMentionedNickNames('@JANA ďakujem, @jana a @Peter!'), ['jana', 'peter'])
  })

  test('nezahrnie koncovú interpunkciu do nicku', ({ assert }) => {
    assert.deepEqual(extractMentionedNickNames('Ahoj @jana, pozri to s @peter.'), ['jana', 'peter'])
  })

  test('podporuje bodku, pomlčku a podčiarkovník v nicku', ({ assert }) => {
    assert.deepEqual(extractMentionedNickNames('@john.doe @anna-maria @user_1'), [
      'john.doe',
      'anna-maria',
      'user_1',
    ])
  })

  test('samotný zavináč nie je zmienka', ({ assert }) => {
    assert.deepEqual(extractMentionedNickNames('Ahoj @ a @!'), [])
  })

  test('opakované volania sa navzájom neovplyvňujú', ({ assert }) => {
    assert.deepEqual(extractMentionedNickNames('@jana'), ['jana'])
    assert.deepEqual(extractMentionedNickNames('@peter'), ['peter'])
    assert.deepEqual(extractMentionedNickNames('@jana'), ['jana'])
  })
})
