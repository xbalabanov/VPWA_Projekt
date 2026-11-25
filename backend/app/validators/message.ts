import vine from '@vinejs/vine'

// https://vinejs.dev/docs/types/string
export const sendMessageValidator = vine.create({
  params: vine.object({
    id: vine.number().withoutDecimals().range([1, 2_147_483_647]),
  }),
  content: vine.string().trim().minLength(1),
})

export const listMessagesValidator = vine.create({
  params: vine.object({
    id: vine.number().withoutDecimals().range([1, 2_147_483_647]),
  }),
  afterId: vine.number().withoutDecimals().range([0, 2_147_483_647]).optional(),
  beforeId: vine.number().withoutDecimals().range([1, 2_147_483_647]).optional(),
  limit: vine.number().withoutDecimals().range([1, 100]).optional(),
})

// Živý draft (B7): prázdny text je povolený (= prestal písať), dĺžka obmedzená ako rozumná správa.
export const typingValidator = vine.create({
  params: vine.object({
    id: vine.number().withoutDecimals().range([1, 2_147_483_647]),
  }),
  text: vine.string().maxLength(5000).optional(),
})
