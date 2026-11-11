import { BaseSchema } from '@adonisjs/lucid/schema'

// full_name zostal zo starter kitu. Používame first_name + last_name,
// preto ho odstránime. Novou migráciou, aby sa nemenila už spustená migrácia.
// https://lucid.adonisjs.com/docs/migrations#altering-tables
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('full_name')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('full_name').nullable()
    })
  }
}
