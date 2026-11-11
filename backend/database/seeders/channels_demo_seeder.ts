import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import User from '#models/user'
import Channel from '#models/channel'
import Invitation from '#models/invitation'

// Heslo všetkých demo účtov (zapísané aj v backend/README.md).
export const DEMO_PASSWORD = 'heslo123'

/**
 * Demo dáta pre scenár kontroly UC1–UC6 (docs/faza-2.md), Stanislavova časť K1:
 * - Ed = správca verejného kanála general
 * - Jana, Peter, Mária = traja hlasujúci členovia, Tomáš = cieľ hlasovania
 * - Lucia = nečlen s platnou pozvánkou do súkromného kanála projekt
 * - stary-kanal = posledná aktivita pred 40 dňami (zanikne pri prvom prístupe)
 * - novinky = čerstvý kanál (zostane)
 * Spustenie: node ace db:seed (alebo node ace migration:fresh --seed).
 * https://lucid.adonisjs.com/docs/seeders
 */
export default class extends BaseSeeder {
  async run() {
    // updateOrCreateMany podľa emailu: opakované spustenie nevytvorí duplikáty
    // a heslo sa nastaví znova (zahashuje ho model User).
    const users = await User.updateOrCreateMany(
      'email',
      [
        ['Ed', 'Novák', 'ed'],
        ['Jana', 'Kováčová', 'jana'],
        ['Peter', 'Horváth', 'peter'],
        ['Mária', 'Szabová', 'maria'],
        ['Tomáš', 'Varga', 'tomas'],
        ['Lucia', 'Bieliková', 'lucia'],
      ].map(([firstName, lastName, nickName]) => ({
        firstName,
        lastName,
        nickName,
        email: `${nickName}@example.com`,
        password: DEMO_PASSWORD,
      }))
    )
    const [ed, jana, peter, maria, tomas, lucia] = users

    // Demo kanály vždy vytvoríme načisto (aj s členmi, hlasmi a banmi z predošlého dema).
    const names = ['general', 'projekt', 'stary-kanal', 'novinky']
    await Channel.query().whereIn('name', names).delete()

    const now = DateTime.now()

    const general = await Channel.create({
      name: 'general',
      isPrivate: false,
      adminId: ed.id,
      lastActivityAt: now,
    })
    await general.related('members').attach([ed.id, jana.id, peter.id, maria.id, tomas.id])

    const projekt = await Channel.create({
      name: 'projekt',
      isPrivate: true,
      adminId: ed.id,
      lastActivityAt: now,
    })
    await projekt.related('members').attach([ed.id, jana.id])
    await Invitation.create({ channelId: projekt.id, invitedUserId: lucia.id, invitedById: ed.id })

    // Expiračné dáta sú v samostatnom kanáli, aby cleanup nezmazal hlavné demo.
    const stary = await Channel.create({
      name: 'stary-kanal',
      isPrivate: false,
      adminId: ed.id,
      lastActivityAt: now.minus({ days: 40 }),
    })
    await stary.related('members').attach([ed.id, jana.id])

    const novinky = await Channel.create({
      name: 'novinky',
      isPrivate: false,
      adminId: jana.id,
      lastActivityAt: now.minus({ days: 2 }),
    })
    await novinky.related('members').attach([jana.id, peter.id, ed.id])
  }
}
