import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

// Test table
export const test = pgTable('test', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}) 