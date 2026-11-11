import vine from '@vinejs/vine'

// https://vinejs.dev/docs/types/string
export const sendMessageValidator = vine.create({
  content: vine.string().trim().minLength(1),
})
