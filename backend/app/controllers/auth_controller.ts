import User from '#models/user'
import { loginValidator, signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

/**
 * Registrácia, prihlásenie a odhlásenie cez session (UC1).
 * Prihlásenie si pamätá server v session; prehliadač dostane iba HttpOnly cookie,
 * takže JavaScript vo frontende k nemu nemá prístup.
 * https://docs.adonisjs.com/guides/authentication/session-guard
 */
export default class AuthController {
  /**
   * POST /api/v1/auth/signup – vytvorí účet a rovno prihlási.
   */
  async signup({ request, auth, serialize }: HttpContext) {
    // passwordConfirmation iba overíme, do DB ho neukladáme.
    const { passwordConfirmation, ...data } = await request.validateUsing(signupValidator)

    // Heslo zahashuje withAuthFinder v modeli User pri uložení.
    const user = await User.create(data)
    // status a notify_mentions_only doplní DB predvolenou hodnotou, načítame ich späť.
    await user.refresh()
    await auth.use('web').login(user)

    return serialize(UserTransformer.transform(user))
  }

  /**
   * POST /api/v1/auth/login – overí email a heslo a prihlási používateľa do session.
   */
  async login({ request, auth, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    //Nájde používateľa podľa emailu a porovná hash hesla.
    //Pri zlom emaily alebo hesle vyhodí chybu 400 (E_INVALID_CREDENTIALS)
    const user = await User.verifyCredentials(email, password)

    //Uloží ID usera do seesion; prehliadač dostane session cookie.
    await auth.use('web').login(user)

    return serialize(UserTransformer.transform(user))
  }

  /**
   * POST /api/v1/account/logout – zruší prihlásenie v session.
   */
  async logout({ auth, serialize }: HttpContext) {
    //Odstráni usera zo session, stará cookie už nikoho neprihlási
    await auth.use('web').logout()

    return serialize({ message: 'Odhlásený' })
  }
}
