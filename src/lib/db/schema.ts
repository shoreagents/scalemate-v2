import { pgTable, text, timestamp, uuid, varchar, jsonb } from 'drizzle-orm/pg-core'

// Test table
export const test = pgTable('test', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  preferences: jsonb('preferences'),
}) 