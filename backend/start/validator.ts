/*
|--------------------------------------------------------------------------
| Validator file
|--------------------------------------------------------------------------
|
| The validator file is used for configuring global transforms for VineJS.
| The transform below converts all VineJS date outputs from JavaScript
| Date objects to Luxon DateTime instances, so that validated dates are
| ready to use with Lucid models and other parts of the app that expect
| Luxon DateTime.
|
*/

import { DateTime } from 'luxon'
import vine, { SimpleMessagesProvider, VineDate } from '@vinejs/vine'

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}

VineDate.transform((value) => DateTime.fromJSDate(value))

// Slovenské chybové hlášky validácie. Frontend zobrazí prvú z nich.
// https://vinejs.dev/docs/custom_error_messages
vine.messagesProvider = new SimpleMessagesProvider({
  'required': 'Pole {{ field }} je povinné',
  'minLength': 'Pole {{ field }} musí mať aspoň {{ min }} znakov',
  'maxLength': 'Pole {{ field }} môže mať najviac {{ max }} znakov',
  'email': 'Zadaj platný email',
  'nickName.regex': 'Nick môže obsahovať iba písmená, čísla, _ . - (nesmie končiť . ani -)',
  'nickName.database.unique': 'Tento nick je už obsadený',
  'email.database.unique': 'Email je už použitý',
  'passwordConfirmation.sameAs': 'Heslá sa nezhodujú',
  'password.minLength': 'Heslo musí mať aspoň {{ min }} znakov',
})
