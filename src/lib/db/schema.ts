import { pgTable, text, timestamp, uuid, varchar, jsonb, integer } from 'drizzle-orm/pg-core'

// ========================================
// LEVEL 1: ANONYMOUS USER TRACKING
// ========================================

export const anonymousSessions = pgTable('anonymous_sessions', {
  sessionId: varchar('session_id', { length: 255 }).primaryKey(),
  ipAddress: varchar('ip_address', { length: 45 }),
  location: varchar('location', { length: 100 }),
  deviceInfo: jsonb('device_info'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
  totalPageViews: integer('total_page_views').default(0),
  timeOnSite: integer('time_on_site').default(0), // seconds
  referralSource: varchar('referral_source', { length: 500 }),
  utmCampaign: varchar('utm_campaign', { length: 100 }),
  utmSource: varchar('utm_source', { length: 100 }),
  utmMedium: varchar('utm_medium', { length: 100 }),
  conversionScore: integer('conversion_score').default(0),
  status: varchar('status', { length: 20 }).default('active'), // active, converted, expired
})

export const anonymousActivities = pgTable('anonymous_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 255 }).references(() => anonymousSessions.sessionId).notNull(),
  activityType: varchar('activity_type', { length: 50 }).notNull(), // page_view, button_click, tool_use, download, form_interaction
  activityData: jsonb('activity_data').notNull(),
  valueScore: integer('value_score').default(1), // importance of this activity (1-100)
  pagePath: varchar('page_path', { length: 500 }),
  elementId: varchar('element_id', { length: 100 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  duration: integer('duration'), // how long they spent on this activity
})
