import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Ručné spustenie mazania expirovaných kanálov (A8): `node ace channels:cleanup`.
 * Pravidelne to isté robí preload start/channel_cleanup.ts v bežiacom serveri.
 * Udalosti channel.deleted z tohto procesu nedostane žiadny prehliadač (nie je k nemu
 * pripojený); klienti sa zosúladia pri ďalšom obnovení zoznamu kanálov.
 * https://docs.adonisjs.com/guides/ace/creating-commands
 */
export default class ChannelsCleanup extends BaseCommand {
  static commandName = 'channels:cleanup'
  static description = 'Zmaže kanály, v ktorých viac ako 30 dní nebola správa'

  // Príkaz potrebuje DB (Lucid) – aplikáciu treba naštartovať.
  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const { default: ChannelExpirationService } =
      await import('#services/channel_expiration_service')
    const deleted = await ChannelExpirationService.cleanupExpired()
    this.logger.success(`Zmazané expirované kanály: ${deleted}`)
  }
}
