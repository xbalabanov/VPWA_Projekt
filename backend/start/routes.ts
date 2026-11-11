/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.Auth, 'signup'])
        router.post('login', [controllers.Auth, 'login'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.Auth, 'logout'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    // Kanály, pozvánky a vyhľadanie používateľov (UC2, UC4) – iba pre prihlásených.
    // matchers.number(): /channels/abc vráti 404 namiesto chyby v DB dotaze.
    // https://docs.adonisjs.com/guides/basics/routing#route-params-validation
    router
      .group(() => {
        router.get('channels', [controllers.Channels, 'index'])
        router.post('channels', [controllers.Channels, 'store'])
        router.post('channels/join', [controllers.Channels, 'join'])
        router
          .delete('channels/:id', [controllers.Channels, 'destroy'])
          .where('id', router.matchers.number())
        router
          .delete('channels/:id/membership', [controllers.Channels, 'leave'])
          .where('id', router.matchers.number())
        router
          .get('channels/:id/members', [controllers.Channels, 'members'])
          .where('id', router.matchers.number())

        router.get('invitations', [controllers.Invitations, 'index'])
        router
          .post('invitations/:id/accept', [controllers.Invitations, 'accept'])
          .where('id', router.matchers.number())
        router
          .delete('invitations/:id', [controllers.Invitations, 'destroy'])
          .where('id', router.matchers.number())

        router.get('users/search', [controllers.Users, 'search'])
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1')
