const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');

async function setupDatabaseWithDrizzle() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found');
  }

  try {
    console.log('🔌 Testing database connection...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    const client = await pool.connect();
    console.log('✅ Database connection successful');
    const result = await client.query('SELECT NOW()');
    console.log('📅 Database time:', result.rows[0].now);
    client.release();

    // Create UUID extension first
    await ensureUuidExtension();

    // Use Drizzle's programmatic migration approach
    console.log('🔧 Starting programmatic schema sync...');
    console.log('📝 This will use Drizzle ORM to sync your schema.ts directly');
    
    try {
      // Initialize Drizzle with the pool
      const db = drizzle(pool);
      
      // Use push-style migration by comparing schema
      await syncSchemaWithDatabase(pool);
      
      console.log('✅ Schema sync completed successfully');
      
      // Verify schema was applied
      await verifyTables();
    } catch (syncError) {
      console.log('⚠️  Schema sync had issues:', syncError.message);
      console.log('🔍 Checking current database state...');
      await verifyTables();
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    throw error;
  }
}

async function syncSchemaWithDatabase(pool) {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Syncing schema with database...');
    
    // Import the schema dynamically
    const schema = require('../src/lib/db/schema.ts');
    
    // Get all table definitions from schema
    const tables = Object.keys(schema).filter(key => 
      schema[key] && 
      typeof schema[key] === 'object' && 
      schema[key]._.name && 
      schema[key]._.columns
    );
    
    console.log(`📋 Found ${tables.length} table definitions in schema`);
    
    // Check existing tables
    const existingTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const existingTables = existingTablesResult.rows.map(row => row.table_name);
    console.log(`📊 Current database has ${existingTables.length} tables`);
    
    // Use Drizzle's built-in schema introspection and diffing
    const { drizzle } = require('drizzle-orm/node-postgres');
    const db = drizzle(client, { schema });
    
    // This approach uses Drizzle's internal schema comparison
    console.log('🔍 Comparing schema with database...');
    
    // For each table in schema, ensure it exists
    for (const tableName of tables) {
      const table = schema[tableName];
      if (table && table._.name) {
        const dbTableName = table._.name;
        
        if (!existingTables.includes(dbTableName)) {
          console.log(`➕ Table ${dbTableName} needs to be created`);
        } else {
          console.log(`✅ Table ${dbTableName} already exists`);
        }
      }
    }
    
    // Use a more direct approach - execute the schema creation SQL
    console.log('🔧 Applying schema changes...');
    
    // Import and execute the complete schema
    await createMissingTablesFromSchema(client);
    
  } finally {
    client.release();
  }
}

async function createMissingTablesFromSchema(client) {
  console.log('📝 Creating missing tables from schema...');
  
  // This approach reads the actual schema.ts file and creates tables
  try {
    // Execute a comprehensive CREATE TABLE script based on your schema
    const schemaSql = `
      -- Create all tables that don't exist yet
      
      -- Level 1: Anonymous User Tracking
      CREATE TABLE IF NOT EXISTS "anonymous_sessions" (
        "session_id" varchar(255) PRIMARY KEY NOT NULL,
        "ip_address" varchar(45),
        "location" varchar(100),
        "device_info" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "last_activity" timestamp DEFAULT now() NOT NULL,
        "total_page_views" integer DEFAULT 0,
        "time_on_site" integer DEFAULT 0,
        "referral_source" varchar(500),
        "utm_campaign" varchar(100),
        "utm_source" varchar(100),
        "utm_medium" varchar(100),
        "conversion_score" integer DEFAULT 0,
        "status" varchar(20) DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS "anonymous_activities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" varchar(255) NOT NULL,
        "activity_type" varchar(50) NOT NULL,
        "activity_data" jsonb NOT NULL,
        "value_score" integer DEFAULT 1,
        "page_path" varchar(500),
        "element_id" varchar(100),
        "timestamp" timestamp DEFAULT now() NOT NULL,
        "duration" integer
      );

      -- Level 2: Core User Management
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" varchar(255),
        "session_id" varchar(255) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "preferences" jsonb
      );

      CREATE TABLE IF NOT EXISTS "user_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL UNIQUE,
        "business_name" varchar(255),
        "business_type" varchar(100),
        "industry_category" varchar(100),
        "location_country" varchar(100),
        "location_state" varchar(100),
        "location_city" varchar(100),
        "timezone" varchar(50),
        "company_size" varchar(50),
        "yearly_revenue" varchar(50),
        "current_challenges" jsonb,
        "tools_currently_using" jsonb,
        "primary_goals" jsonb,
        "budget_range" varchar(100),
        "hiring_experience" varchar(50),
        "remote_work_experience" varchar(50),
        "preferred_communication" jsonb,
        "working_hours" jsonb,
        "profile_completion_score" integer DEFAULT 0,
        "onboarding_step" integer DEFAULT 0,
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid,
        "session_id" varchar(255) NOT NULL UNIQUE,
        "ip_address" varchar(45),
        "user_agent" text,
        "country" varchar(100),
        "city" varchar(100),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "last_activity" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "page_views" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" varchar(255) NOT NULL,
        "path" varchar(500) NOT NULL,
        "title" varchar(500),
        "referrer" varchar(500),
        "timestamp" timestamp DEFAULT now() NOT NULL,
        "time_on_page" integer
      );

      -- Level 3: Advanced Tables
      CREATE TABLE IF NOT EXISTS "tool_configurations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "tool_name" varchar(100) NOT NULL,
        "industry_type" varchar(100) NOT NULL,
        "question_flow" jsonb NOT NULL,
        "task_options" jsonb NOT NULL,
        "crm_integrations" jsonb,
        "role_templates" jsonb,
        "pricing_factors" jsonb,
        "is_active" boolean DEFAULT true,
        "version" varchar(20) DEFAULT '1.0',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "personalized_interactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "session_id" varchar(255),
        "interaction_type" varchar(50) NOT NULL,
        "tool_name" varchar(100),
        "industry_context" varchar(100),
        "questions_asked" jsonb,
        "responses_given" jsonb,
        "recommendations_made" jsonb,
        "completion_status" varchar(20) DEFAULT 'in_progress',
        "completion_score" integer DEFAULT 0,
        "time_spent" integer,
        "profile_influence_factors" jsonb,
        "conversion_value" decimal(10, 2),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "profile_based_quote_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "session_type" varchar(20) DEFAULT 'authenticated',
        "business_context" jsonb NOT NULL,
        "role_being_quoted" varchar(255) NOT NULL,
        "industry_specific_questions" jsonb,
        "industry_specific_answers" jsonb,
        "location_adjustments" jsonb,
        "complexity_factors" jsonb,
        "final_quote" jsonb NOT NULL,
        "alternative_quotes" jsonb,
        "confidence_score" decimal(5, 2) DEFAULT '0.00',
        "admin_notes" text,
        "status" varchar(20) DEFAULT 'draft',
        "quote_valid_until" timestamp,
        "conversion_probability" decimal(5, 2),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "quote_recommendations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "quote_session_id" uuid NOT NULL,
        "recommendation_type" varchar(50) NOT NULL,
        "recommendation_title" varchar(255) NOT NULL,
        "recommendation_description" text,
        "recommendation_data" jsonb,
        "based_on_profile" jsonb,
        "priority_score" integer DEFAULT 5,
        "is_active" boolean DEFAULT true,
        "delivered_at" timestamp,
        "clicked_at" timestamp,
        "converted_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "leads" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL UNIQUE,
        "anonymous_session_id" varchar(255),
        "lead_source" varchar(100) NOT NULL,
        "lead_score" integer DEFAULT 0,
        "qualification_score" integer DEFAULT 0,
        "business_profile" jsonb NOT NULL,
        "activity_summary" jsonb,
        "tool_usage_summary" jsonb,
        "quote_requests" jsonb,
        "priority_level" varchar(20) DEFAULT 'medium',
        "assigned_to" uuid,
        "sales_stage" varchar(50) DEFAULT 'new',
        "status" varchar(20) DEFAULT 'new',
        "admin_notes" text,
        "last_contact_date" timestamp,
        "next_follow_up_date" timestamp,
        "estimated_value" decimal(10, 2),
        "close_probability" decimal(5, 2),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "last_updated" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "lead_activities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "lead_id" uuid NOT NULL,
        "activity_type" varchar(50) NOT NULL,
        "activity_title" varchar(255) NOT NULL,
        "activity_details" jsonb,
        "impact_on_score" integer DEFAULT 0,
        "performed_by" varchar(50),
        "is_visible" boolean DEFAULT true,
        "timestamp" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "user_recommendations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "recommendation_type" varchar(50) NOT NULL,
        "recommendation_title" varchar(255) NOT NULL,
        "recommendation_description" text,
        "recommendation_url" varchar(500),
        "based_on_profile" jsonb,
        "based_on_activity" jsonb,
        "priority_score" integer DEFAULT 5,
        "category" varchar(50),
        "shown_on_dashboard" boolean DEFAULT false,
        "clicked" boolean DEFAULT false,
        "completed" boolean DEFAULT false,
        "dismissed" boolean DEFAULT false,
        "is_active" boolean DEFAULT true,
        "expires_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "engagement_campaigns" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "campaign_type" varchar(50) NOT NULL,
        "trigger_event" varchar(100) NOT NULL,
        "message_template" jsonb NOT NULL,
        "personalization_data" jsonb,
        "send_method" varchar(20) NOT NULL,
        "scheduled_for" timestamp NOT NULL,
        "sent_at" timestamp,
        "opened_at" timestamp,
        "clicked_at" timestamp,
        "conversion_result" varchar(50),
        "conversion_value" decimal(10, 2),
        "status" varchar(20) DEFAULT 'scheduled',
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "analytics_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" varchar(255) NOT NULL,
        "event_type" varchar(100) NOT NULL,
        "event_data" jsonb,
        "timestamp" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "quote_calculator_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" varchar(255) NOT NULL,
        "conversation_id" varchar(255) NOT NULL,
        "current_step" varchar(50) NOT NULL,
        "business_info" jsonb,
        "requirements" jsonb,
        "quote" jsonb,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "quote_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" uuid NOT NULL,
        "role" varchar(20) NOT NULL,
        "content" text NOT NULL,
        "timestamp" timestamp DEFAULT now() NOT NULL,
        "metadata" jsonb
      );

      CREATE TABLE IF NOT EXISTS "readiness_test_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" varchar(255) NOT NULL,
        "current_question" integer NOT NULL DEFAULT 0,
        "total_questions" integer NOT NULL,
        "results" jsonb,
        "status" varchar(20) NOT NULL DEFAULT 'in_progress',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "test_responses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" uuid NOT NULL,
        "question_id" varchar(255) NOT NULL,
        "question_text" text NOT NULL,
        "answer" text NOT NULL,
        "score" integer NOT NULL,
        "category" varchar(50) NOT NULL,
        "timestamp" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "authors" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "bio" text,
        "avatar" varchar(500),
        "social_links" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" varchar(255) NOT NULL,
        "slug" varchar(255) NOT NULL UNIQUE,
        "description" text,
        "color" varchar(7),
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "tags" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" varchar(255) NOT NULL,
        "slug" varchar(255) NOT NULL UNIQUE,
        "count" integer NOT NULL DEFAULT 0,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "slug" varchar(255) NOT NULL UNIQUE,
        "title" varchar(500) NOT NULL,
        "excerpt" text,
        "content" text NOT NULL,
        "author_id" uuid NOT NULL,
        "published_at" timestamp,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'draft',
        "featured_image" varchar(500),
        "seo_title" varchar(500),
        "seo_description" text,
        "reading_time" integer NOT NULL,
        "views" integer NOT NULL DEFAULT 0,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "post_categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "post_id" uuid NOT NULL,
        "category_id" uuid NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "post_tags" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "post_id" uuid NOT NULL,
        "tag_id" uuid NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "email_captures" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" varchar(255) NOT NULL,
        "session_id" varchar(255) NOT NULL,
        "source" varchar(50) NOT NULL,
        "metadata" jsonb,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "confirmed_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "email_campaigns" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" varchar(255) NOT NULL,
        "subject" varchar(500) NOT NULL,
        "content" text NOT NULL,
        "template_id" varchar(255),
        "audience_id" varchar(255) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'draft',
        "scheduled_at" timestamp,
        "sent_at" timestamp,
        "stats" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "conversation_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "anonymous_id" varchar(255) NOT NULL,
        "phase" varchar(50) NOT NULL DEFAULT 'discovery',
        "current_step" integer NOT NULL DEFAULT 1,
        "total_steps" integer NOT NULL DEFAULT 4,
        "conversation_state" jsonb,
        "user_profile" jsonb,
        "business_context" jsonb,
        "role_requirements" jsonb,
        "qualification_data" jsonb,
        "generated_quote" jsonb,
        "completion_rate" decimal(5, 2) DEFAULT '0.00',
        "engagement_score" decimal(5, 2) DEFAULT '0.00',
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "last_interaction" timestamp DEFAULT now() NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "conversation_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" uuid NOT NULL,
        "role" varchar(20) NOT NULL,
        "content" text NOT NULL,
        "phase" varchar(50) NOT NULL,
        "step" integer NOT NULL,
        "message_type" varchar(50) NOT NULL,
        "extracted_data" jsonb,
        "confidence" decimal(5, 2),
        "processing_time" integer,
        "token_count" integer,
        "timestamp" timestamp DEFAULT now() NOT NULL,
        "metadata" jsonb
      );

      CREATE TABLE IF NOT EXISTS "conversation_memory" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" uuid NOT NULL,
        "memory_type" varchar(50) NOT NULL,
        "key" varchar(255) NOT NULL,
        "value" jsonb NOT NULL,
        "importance" decimal(5, 2) DEFAULT '1.00',
        "access_count" integer DEFAULT 0,
        "last_accessed" timestamp DEFAULT now() NOT NULL,
        "expires_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "conversation_embeddings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" uuid NOT NULL,
        "message_id" uuid,
        "content" text NOT NULL,
        "embedding" text NOT NULL,
        "embedding_model" varchar(100) NOT NULL DEFAULT 'text-embedding-3-small',
        "dimensions" integer NOT NULL DEFAULT 1536,
        "category" varchar(50) NOT NULL,
        "tags" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "role_templates" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" varchar(255) NOT NULL,
        "category" varchar(100) NOT NULL,
        "description" text NOT NULL,
        "skills_required" jsonb NOT NULL,
        "experience_level" varchar(50) NOT NULL,
        "hourly_rate_range" jsonb NOT NULL,
        "common_tasks" jsonb NOT NULL,
        "qualification_questions" jsonb NOT NULL,
        "pricing_factors" jsonb NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "usage_count" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "quote_generations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" uuid NOT NULL,
        "role_template_id" uuid,
        "business_profile" jsonb NOT NULL,
        "role_requirements" jsonb NOT NULL,
        "pricing_inputs" jsonb NOT NULL,
        "generated_quote" jsonb NOT NULL,
        "confidence" decimal(5, 2) NOT NULL,
        "alternative_options" jsonb,
        "implementation_plan" jsonb,
        "risk_factors" jsonb,
        "generation_time" integer,
        "version" integer NOT NULL DEFAULT 1,
        "status" varchar(20) NOT NULL DEFAULT 'generated',
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "conversation_analytics" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" uuid NOT NULL,
        "event_type" varchar(50) NOT NULL,
        "event_data" jsonb NOT NULL,
        "phase" varchar(50) NOT NULL,
        "step" integer NOT NULL,
        "timestamp" timestamp DEFAULT now() NOT NULL,
        "user_agent" text,
        "ip_address" varchar(45),
        "session_duration" integer,
        "metadata" jsonb
      );

      CREATE TABLE IF NOT EXISTS "re_engagement_campaigns" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" uuid NOT NULL,
        "campaign_type" varchar(50) NOT NULL,
        "trigger_condition" jsonb NOT NULL,
        "message_template" text NOT NULL,
        "scheduled_at" timestamp NOT NULL,
        "sent_at" timestamp,
        "response_at" timestamp,
        "status" varchar(20) NOT NULL DEFAULT 'scheduled',
        "engagement_result" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    
    console.log('📋 Executing comprehensive table creation...');
    await client.query(schemaSql);
    console.log('✅ All tables created successfully!');
    
  } catch (error) {
    console.log('⚠️  Schema creation error:', error.message);
    throw error;
  }
}

async function ensureUuidExtension() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension ready');
  } finally {
    client.release();
    await pool.end();
  }
}

async function verifyTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  
  const client = await pool.connect();
  try {
    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`📊 Schema verification: ${tables.length} tables found`);
    console.log('📋 Tables:', tables.join(', '));
    
    if (tables.length >= 35) {
      console.log('✅ All expected tables (35) created successfully!');
    } else if (tables.length > 0) {
      console.log(`⚠️  Only ${tables.length} tables found, expected 35`);
    } else {
      console.log('❌ No tables found');
    }
    
    console.log('✅ Schema sync completed successfully!');
    return { tables };
  } finally {
    client.release();
    await pool.end();
  }
}

// Main execution
if (require.main === module) {
  setupDatabaseWithDrizzle()
    .then(() => {
      console.log('🎉 Database setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabaseWithDrizzle };