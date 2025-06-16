import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString && process.env.NODE_ENV !== 'production') {
  console.warn('DATABASE_URL not provided - database features will be disabled')
}

// Create a type-safe database instance
const createDb = () => {
  if (!connectionString) {
    // Create a mock database for TypeScript compilation
    const mockClient = {} as postgres.Sql
    return drizzle(mockClient, { schema })
  }
  
  const client = postgres(connectionString, { prepare: false })
  return drizzle(client, { schema })
}

// Always create the database instance for proper TypeScript support
const database = createDb()

// Export a proxy that handles runtime database availability
export const dbProxy = new Proxy(database, {
  get(target, prop) {
    if (!connectionString && typeof prop === 'string' && ['query', 'insert', 'update', 'delete', 'select'].includes(prop)) {
      throw new Error('Database connection not available. Please set DATABASE_URL environment variable.')
    }
    return (target as any)[prop]
  }
})

// Export db as the proxy for backward compatibility
export { dbProxy as db }

export * from './schema' 