import vine from '@vinejs/vine'

// Rovnaké pravidlo nicku ako vo frontend/src/utils/mentions.ts (registrácia aj @zmienky).
const NICK_NAME_PATTERN = /^[A-Za-z0-9_.-]*[A-Za-z0-9_]$/

/**
 * Registrácia (UC1).
 * Email a nick ukladáme orezané a malými písmenami, aby Jana a jana boli ten istý
 * používateľ. Unikátnosť overuje validátor (422 so správou), nie až DB index (500).
 * https://vinejs.dev/docs/types/string
 * https://docs.adonisjs.com/guides/basics/validation#unique-and-exists-validations
 */
export const signupValidator = vine.create({
  firstName: vine.string().trim().minLength(1).maxLength(100),
  lastName: vine.string().trim().minLength(1).maxLength(100),
  nickName: vine
    .string()
    .trim()
    .toLowerCase()
    .maxLength(30)
    .regex(NICK_NAME_PATTERN)
    .unique({ table: 'users', column: 'nick_name', caseInsensitive: true }),
  email: vine
    .string()
    .trim()
    .toLowerCase()
    .email()
    .maxLength(254)
    .unique({ table: 'users', column: 'email', caseInsensitive: true }),
  password: vine.string().minLength(6).maxLength(64),
  passwordConfirmation: vine.string().sameAs('password'),
})

/**
 * Prihlásenie. Email normalizujeme rovnako ako pri registrácii.
 */
export const loginValidator = vine.create({
  email: vine.string().trim().toLowerCase().email(),
  password: vine.string(),
})
