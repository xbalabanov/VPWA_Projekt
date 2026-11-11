import { BaseSchema } from '@adonisjs/lucid/schema'

// Session uložená na serveri (SESSION_DRIVER=database). Pri cookie store by údaje
// session boli v samotnej cookie a jej kópia by fungovala aj po odhlásení.
// Vygenerované cez `node ace make:session-table`.
// https://docs.adonisjs.com/guides/basics/session#database-store
export default class extends BaseSchema {
  protected tableName = 'sessions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.text('data').notNullable()
      table.string('user_id').nullable().index()
      table.timestamp('expires_at').notNullable().index()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}