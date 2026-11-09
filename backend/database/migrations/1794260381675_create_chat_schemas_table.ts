import { BaseSchema } from '@adonisjs/lucid/schema'

// Lucid migrácie a definovanie tabuliek:
// https://lucid.adonisjs.com/docs/migrations
// https://lucid.adonisjs.com/docs/table-builder
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('nick_name').notNullable()

      table.enum('status', ['online', 'dnd', 'offline']).notNullable().defaultTo('offline')

      table.boolean('notify_mentions_only').notNullable().defaultTo(false)
    })

    // Unikátnosť bez ohľadu na veľkosť písmen.
    this.schema.raw(`
      CREATE UNIQUE INDEX users_nick_name_lower_unique
      ON users (LOWER(nick_name))
    `)

    this.schema.raw(`
      CREATE UNIQUE INDEX users_email_lower_unique
      ON users (LOWER(email))
    `)

    this.schema.createTable('channels', (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.boolean('is_private').notNullable().defaultTo(false)

      table.integer('admin_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')

      table.timestamp('last_activity_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(`
      CREATE UNIQUE INDEX channels_name_lower_unique
      ON channels (LOWER(name))
    `)

    // Fyzické vyjadrenie vzťahu používateľ ↔ kanál z UML.
    this.schema.createTable('channel_members', (table) => {
      table
        .integer('channel_id')
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')

      table.timestamp('joined_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.primary(['channel_id', 'user_id'])
      table.index(['user_id'])
    })

    this.schema.createTable('messages', (table) => {
      table.increments('id')

      table
        .integer('channel_id')
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      table
        .integer('author_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')

      table.text('content').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      // Načítavanie histórie podľa kanála a kurzora správy.
      table.index(['channel_id', 'id'])
    })

    this.schema.createTable('mentions', (table) => {
      table
        .integer('message_id')
        .notNullable()
        .references('id')
        .inTable('messages')
        .onDelete('CASCADE')

      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')

      table.primary(['message_id', 'user_id'])
    })

    this.schema.createTable('invitations', (table) => {
      table.increments('id')

      table
        .integer('channel_id')
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      table
        .integer('invited_user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table
        .integer('invited_by_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['channel_id', 'invited_user_id'])
      table.index(['invited_user_id'])
    })

    this.schema.createTable('kick_votes', (table) => {
      table
        .integer('channel_id')
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      table
        .integer('target_user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.integer('voter_id').notNullable().references('id').inTable('users').onDelete('CASCADE')

      table.primary(['channel_id', 'target_user_id', 'voter_id'])
      table.check('target_user_id <> voter_id')
    })

    this.schema.createTable('bans', (table) => {
      table
        .integer('channel_id')
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')

      table.primary(['channel_id', 'user_id'])
    })
  }

  async down() {
    // Najprv odstránime tabuľky závislé od ostatných.
    this.schema.dropTable('bans')
    this.schema.dropTable('kick_votes')
    this.schema.dropTable('invitations')
    this.schema.dropTable('mentions')
    this.schema.dropTable('messages')
    this.schema.dropTable('channel_members')
    this.schema.dropTable('channels')

    this.schema.raw('DROP INDEX users_nick_name_lower_unique')
    this.schema.raw('DROP INDEX users_email_lower_unique')

    this.schema.alterTable('users', (table) => {
      table.dropColumns('first_name', 'last_name', 'nick_name', 'status', 'notify_mentions_only')
    })
  }
}
