/*
|--------------------------------------------------------------------------
| Pravidelné mazanie expirovaných kanálov (A8)
|--------------------------------------------------------------------------
|
| Kanál bez správy dlhšie ako 30 dní zaniká aj vtedy, keď ho nikto neotvorí.
| Preload beží iba v procese HTTP servera (adonisrc.ts: environment ['web']),
| takže sa nespúšťa v testoch ani v ace príkazoch. Ručne: `node ace channels:cleanup`.
| Interval: CHANNEL_CLEANUP_INTERVAL_MINUTES (predvolene 60, 0 = vypnuté).
| https://docs.adonisjs.com/guides/concepts/application-lifecycle
|
*/

import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import ChannelExpirationService from '#services/channel_expiration_service'

const DEFAULT_INTERVAL_MINUTES = 60
const intervalMinutes = env.get('CHANNEL_CLEANUP_INTERVAL_MINUTES') ?? DEFAULT_INTERVAL_MINUTES

// Jeden beh upratovania; chyba (napr. výpadok DB) nesmie zhodiť server, skúsi sa to znova.
async function runCleanup() {
  try {
    const deleted = await ChannelExpirationService.cleanupExpired()
    if (deleted > 0) logger.info({ deleted }, 'Zmazané expirované kanály')
  } catch (error) {
    logger.error({ err: error }, 'Mazanie expirovaných kanálov zlyhalo')
  }
}

if (intervalMinutes > 0) {
  let timer: NodeJS.Timeout | null = null

  // Až keď server beží (socket je pripravený posielať channel.deleted); prvý beh hneď.
  await app.ready(() => {
    void runCleanup()
    timer = setInterval(() => void runCleanup(), intervalMinutes * 60_000)
  })

  // Pri vypnutí servera interval zrušíme, aby nedržal proces nažive.
  app.terminating(() => {
    if (timer) clearInterval(timer)
  })
}
