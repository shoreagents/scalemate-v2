import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

// Only create database connection if DATABASE_URL is provided
// This allows the build to succeed without a database connection
let db: ReturnType<typeof drizzle> | null = null

if (connectionString) {
  // Disable prefetch as it is not supported for "Transaction" pool mode
  const client = postgres(connectionString, { prepare: false })
  db = drizzle(client, { schema })
} else if (process.env.NODE_ENV !== 'production') {
  console.warn('DATABASE_URL not provided - database features will be disabled')
}

// Export a proxy that throws helpful errors when database is not available
export const dbProxy = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!db) {
      throw new Error('Database connection not available. Please set DATABASE_URL environment variable.')
    }
    return (db as any)[prop]
  }
})

// Export db as the proxy for backward compatibility
export { dbProxy as db }

export * from './schema' 