// Use regular export to avoid drizzle-kit import at runtime
export default {
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
  introspect: {
    casing: 'camel'
  }
}; 