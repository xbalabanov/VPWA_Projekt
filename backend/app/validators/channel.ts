import vine from '@vinejs/vine'

// Rovnaké pravidlo názvu ako vo frontende (ChannelList): bez medzier, aby fungovalo /join nazov.
const CHANNEL_NAME_PATTERN = /^[A-Za-z0-9_.-]+$/

const channelName = () =>
  vine.string().trim().minLength(1).maxLength(50).regex(CHANNEL_NAME_PATTERN)

/**
 * Vytvorenie kanála cez UI (UC2). Obsadený názov (bez ohľadu na veľkosť písmen) vráti 422.
 * https://docs.adonisjs.com/guides/basics/validation#unique-and-exists-validations
 */
export const createChannelValidator = vine.create({
  name: channelName().unique({ table: 'channels', column: 'name', caseInsensitive: true }),
  isPrivate: vine.boolean().optional(),
})

/**
 * /join nazov [private] (UC4). Názov môže existovať – vtedy je to vstup, nie vytvorenie.
 */
export const joinChannelValidator = vine.create({
  name: channelName(),
  isPrivate: vine.boolean().optional(),
})

/**
 * /invite, /revoke, /kick nick – cieľový používateľ.
 */
export const targetUserValidator = vine.create({
  nickName: vine.string().trim().minLength(1).maxLength(30),
})

/**
 * GET /users/search?nick=… – začiatok nicku pre dopĺňanie.
 */
export const userSearchValidator = vine.create({
  nick: vine.string().trim().minLength(1).maxLength(30),
})
