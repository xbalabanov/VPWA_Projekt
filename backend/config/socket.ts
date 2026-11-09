import { authenticateWithAdonisAuth, defineConfig } from '@rlanz/socket'
import type User from '#models/user'

// Podľa materiálu predmetu:
// https://github.com/kurice/vpwa27/blob/main/prednasky/slek/part1/readme.md#websockety
export default defineConfig({
  websocket: {
    path: '/socket',

    origin: ['http://localhost:9000', 'http://127.0.0.1:9000'],

    middleware: [
      () => import('@adonisjs/session/session_middleware'),
      () => import('@adonisjs/auth/initialize_auth_middleware'),
    ],

    authenticate: authenticateWithAdonisAuth<User>(),
  },
})
