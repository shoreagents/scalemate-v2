# 🚀 ScaleMate Profile-Based Architecture - Deployment Guide

## 📋 Overview

This guide covers deploying ScaleMate's new profile-based architecture with Railway + Drizzle for automatic database management. The system now includes:

- ✅ **Anonymous User Tracking** - Intelligent visitor behavior analysis
- ✅ **Dynamic User Profiles** - Industry-specific business profiling
- ✅ **Personalized Tools** - Context-aware quote calculator and tools
- ✅ **Lead Management** - Advanced lead scoring and qualification
- ✅ **Re-engagement System** - Automated personalized recommendations
- ✅ **Railway + Drizzle** - Automatic database deployment and migrations

## 🛠️ Prerequisites

### Required Accounts & API Keys

1. **Railway Account** ([railway.app](https://railway.app))
2. **GitHub Account** (for automated deployments)
3. **Anthropic API Key** ([console.anthropic.com](https://console.anthropic.com))
4. **OpenAI API Key** ([platform.openai.com](https://platform.openai.com))

### Local Development Requirements

- Node.js 18+
- PostgreSQL (for local development)
- Git

## 🚀 Step 1: Railway Setup

### 1.1 Install Railway CLI

```bash
# Install Railway CLI globally
npm install -g @railway/cli

# Login to Railway
railway login
```

### 1.2 Create Railway Project

```bash
# Navigate to your project directory
cd scalemate-v2

# Initialize Railway project
railway init

# Link to your GitHub repository
railway link
```

### 1.3 Add PostgreSQL Database

1. Go to your Railway dashboard
2. Click "New" → "Database" → "PostgreSQL"
3. Copy the `DATABASE_URL` from the Connect tab

## 🔧 Step 2: Environment Configuration

### 2.1 Railway Environment Variables

Set up environment variables in Railway dashboard:

```bash
# Database (automatically provided by Railway)
DATABASE_URL=postgresql://postgres:password@host:port/database

# AI Services
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
OPENAI_API_KEY=sk-your-openai-key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
NODE_ENV=production
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-app.railway.app

# Optional: Email Services
RESEND_API_KEY=re_your-resend-key
```

### 2.2 Local Development Environment

Create `.env.local` for local development:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/scalemate"

# AI Services
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"
OPENAI_API_KEY="sk-your-openai-key"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## 🗄️ Step 3: Database Schema Deployment

### 3.1 Automatic Deployment (Recommended)

The system automatically runs migrations on deployment via Railway:

```bash
# This happens automatically when you deploy
npm run build          # Triggers postbuild script
npm run db:deploy      # Runs drizzle-kit push:pg
npm run start          # Starts the application
```

### 3.2 Manual Database Setup

For manual control or troubleshooting:

```bash
# Generate migration files
npm run db:generate

# Deploy schema to database
npm run db:deploy

# Seed industry configurations and role templates
npm run db:seed

# Open database studio for inspection
npm run db:studio
```

### 3.3 Verify Database Setup

Check that all tables were created:

```bash
# Connect to your database
psql $DATABASE_URL

# List all tables
\dt

# Expected tables:
# - anonymous_sessions
# - anonymous_activities  
# - user_profiles
# - tool_configurations
# - personalized_interactions
# - profile_based_quote_sessions
# - quote_recommendations
# - leads
# - lead_activities
# - user_recommendations
# - engagement_campaigns
# + all existing tables
```

## 🚀 Step 4: Deployment Process

### 4.1 Automated Deployment

Railway automatically deploys when you push to your main branch:

```bash
# Deploy changes
git add .
git commit -m "Deploy profile-based architecture"
git push origin main

# Railway will automatically:
# 1. Build the application
# 2. Run database migrations
# 3. Deploy the new version
# 4. Run health checks
```

### 4.2 Manual Deployment

For manual deployment control:

```bash
# Deploy directly via Railway CLI
railway up --detach

# Or deploy specific service
railway up --service your-service-name
```

### 4.3 Health Check Verification

After deployment, verify the system is healthy:

```bash
# Check health endpoint
curl https://your-app.railway.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": {
      "status": "connected",
      "responseTime": "25ms"
    },
    "application": {
      "status": "running",
      "nodeEnv": "production"
    }
  },
  "version": "2.0.0"
}
```

## 🔄 Step 5: Database Backup Strategy

### 5.1 Create Backups

```bash
# Create a backup before deployment
npm run db:backup create

# List available backups
npm run db:backup list

# Clean old backups (keeps last 7 days)
npm run db:backup clean
```

### 5.2 Backup Automation

Add to your deployment workflow:

```bash
# In your deployment script
npm run db:backup create    # Create backup
npm run build              # Build application  
npm run db:deploy          # Deploy schema changes
npm run db:seed           # Seed new data if needed
```

### 5.3 Emergency Restore

If you need to restore from backup:

```bash
# List available backups
npm run db:backup list

# Restore specific backup
npm run db:backup restore scalemate-backup-2024-01-15.sql
```

## 🧪 Step 6: Testing the New Architecture

### 6.1 Anonymous Tracking Test

```bash
# Test anonymous session creation
curl -X POST https://your-app.railway.app/api/tracking \
  -H "Content-Type: application/json" \
  -d '{
    "referralSource": "google",
    "utmParams": {
      "campaign": "offshore-hiring",
      "source": "google",
      "medium": "cpc"
    }
  }'
```

### 6.2 Profile Creation Test

```bash
# Test profile creation
curl -X POST https://your-app.railway.app/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "sessionId": "sess_abc123",
    "profileData": {
      "businessName": "Test Real Estate Agency",
      "businessType": "Real Estate",
      "industryCategory": "Property Management",
      "locationCountry": "Australia",
      "locationCity": "Sydney",
      "companySize": "5-10 employees",
      "budgetRange": "$2000-4000/month",
      "currentChallenges": ["administrative overload"],
      "primaryGoals": ["hire virtual assistant"]
    }
  }'
```

### 6.3 Personalized Tools Test

Visit your deployed application and:

1. **Anonymous User Flow:**
   - Browse pages (tracked automatically)
   - Use tools (scored automatically)
   - Download resources (high-value activity)

2. **Registered User Flow:**
   - Sign up for account
   - Complete business profile
   - Use personalized quote calculator
   - Receive industry-specific recommendations

## 📊 Step 7: Monitoring & Analytics

### 7.1 Database Monitoring

Railway provides built-in PostgreSQL monitoring:

- Query performance
- Connection usage
- Storage utilization
- Backup status

### 7.2 Application Monitoring

Monitor key metrics via your admin dashboard:

```typescript
// Anonymous session analytics
const highValueSessions = await anonymousTrackingService.getHighValueSessions(30, 7)

// Lead conversion rates
const leadStats = await db.select()
  .from(leads)
  .where(gte(leads.createdAt, thirtyDaysAgo))

// Profile completion rates
const profileStats = await db.select()
  .from(userProfiles)
  .where(gte(userProfiles.profileCompletionScore, 80))
```

### 7.3 Performance Metrics

Track these key performance indicators:

- **Anonymous to Registered Conversion**: Target 15-25%
- **Profile Completion Rate**: Target 80%+
- **Lead Score Distribution**: Monitor hot/warm/cold ratios
- **Tool Usage by Industry**: Track personalization effectiveness
- **Re-engagement Success**: Monitor recommendation click-through rates

## 🔧 Step 8: Troubleshooting

### 8.1 Common Issues

**Database Connection Failed:**
```bash
# Check Railway database status
railway status

# Test connection locally
psql $DATABASE_URL
```

**Migration Failed:**
```bash
# Check current schema
npm run db:studio

# Reset migrations (use with caution)
npm run db:generate
npm run db:deploy
```

**Health Check Failed:**
```bash
# Check application logs
railway logs

# Verify environment variables
railway variables
```

### 8.2 Rollback Strategy

If deployment fails:

```bash
# Rollback to previous deployment
railway rollback

# Restore database from backup
npm run db:backup restore previous-backup.sql
```

### 8.3 Emergency Procedures

**Critical Database Issue:**
1. Create immediate backup: `npm run db:backup create`
2. Assess damage via `npm run db:studio`
3. Restore from latest backup if needed
4. Contact Railway support if infrastructure issue

**Application Down:**
1. Check Railway service status
2. Review recent deployment logs
3. Rollback to last known good version
4. Monitor health endpoint recovery

## 🎯 Step 9: Post-Deployment Verification

### 9.1 Functionality Checklist

- [ ] Anonymous tracking working
- [ ] User registration and profile creation
- [ ] Industry-specific tool configurations loaded
- [ ] Personalized quote calculator functional
- [ ] Lead scoring and management operational
- [ ] Recommendation engine generating suggestions
- [ ] Email systems functional
- [ ] Admin dashboard accessible

### 9.2 Performance Verification

- [ ] Page load times < 2 seconds
- [ ] Database query response < 100ms average
- [ ] Health check passing consistently
- [ ] No memory leaks or resource issues
- [ ] Backup system operational

### 9.3 Data Verification

- [ ] Industry configurations seeded correctly
- [ ] Role templates available
- [ ] Anonymous sessions being tracked
- [ ] User profiles calculating completion scores
- [ ] Leads being created and scored properly

## 🔄 Step 10: Ongoing Maintenance

### 10.1 Weekly Tasks

- Review backup status and clean old files
- Monitor database performance and usage
- Check lead conversion rates and quality
- Review anonymous tracking effectiveness

### 10.2 Monthly Tasks

- Analyze user journey patterns
- Update industry-specific configurations
- Review and optimize lead scoring algorithms
- Update role templates based on market feedback

### 10.3 Quarterly Tasks

- Comprehensive performance review
- Database optimization and indexing review
- Security audit and dependency updates
- Feature usage analysis and roadmap planning

---

## 🎉 Success Metrics

**Target Performance After Deployment:**

- **Anonymous to Lead Conversion**: 20-30% (vs 5-10% traditional)
- **Lead Quality Score**: 70+ average (vs 40-50 traditional)
- **Profile Completion Rate**: 85%+ (new capability)
- **Tool Engagement**: 60%+ completion (vs 30% generic)
- **Re-engagement Success**: 25%+ click-through on recommendations

**Cost Optimization:**

- **Railway PostgreSQL**: $10-25/month (scales with usage)
- **Total monthly infrastructure**: $15-40 for most applications
- **ROI**: 3-5x improvement in lead quality and conversion

---

## 🚨 Support & Resources

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Drizzle ORM Docs**: [orm.drizzle.team](https://orm.drizzle.team)
- **ScaleMate Health Check**: `https://your-app.railway.app/api/health`
- **Database Studio**: `npm run db:studio`

 