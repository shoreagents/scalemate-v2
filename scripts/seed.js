const { Client } = require('pg')
const { drizzle } = require('drizzle-orm/postgres-js')
const postgres = require('postgres')

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false })
const db = drizzle(client)

const industryConfigurations = [
  {
    toolName: 'quote_calculator',
    industryType: 'real_estate',
    questionFlow: [
      {
        id: 'role_focus',
        question: 'Are you looking for property management or sales support?',
        options: ['Property Management', 'Sales & Leasing', 'Both'],
        required: true
      },
      {
        id: 'crm_system',
        question: 'Which Australian real estate CRM are you currently using?',
        options: ['VaultRe', 'Locked On', 'Box+Dice', 'PropertyMe', 'Console', 'Other', 'None'],
        required: true
      },
      {
        id: 'property_volume',
        question: 'How many active property listings do you manage monthly?',
        options: ['1-50', '51-100', '101-200', '201-500', '500+'],
        required: true
      },
      {
        id: 'main_tasks',
        question: 'What property management tasks need the most support?',
        options: [
          'Tenant screening and applications',
          'Lease documentation and renewals', 
          'Maintenance coordination',
          'Property inspections',
          'Rent collection and accounting',
          'Marketing and advertising',
          'Australian compliance reporting'
        ],
        multiple: true,
        required: true
      },
      {
        id: 'compliance_needs',
        question: 'Which Australian compliance areas do you need support with?',
        options: [
          'RTA requirements',
          'REIQ standards',
          'State-specific legislation',
          'Bond lodgement processes',
          'Tribunal proceedings',
          'Insurance claims'
        ],
        multiple: true,
        required: false
      }
    ],
    taskOptions: [
      'Property listing management and updates',
      'Tenant screening and application processing',
      'Lease documentation and renewals',
      'Maintenance coordination and scheduling',
      'Property inspection scheduling and reports',
      'Rent collection and payment processing',
      'Australian compliance and regulatory reporting',
      'Marketing material creation',
      'Database management and data entry',
      'Client communication and follow-up'
    ],
    crmIntegrations: ['VaultRe', 'Locked On', 'Box+Dice', 'PropertyMe', 'Console', 'Salesforce'],
    roleTemplates: [
      {
        title: 'Property Management Assistant',
        description: 'Handles day-to-day property management tasks',
        skills: ['Australian real estate knowledge', 'CRM proficiency', 'Customer service'],
        hourlyRate: { min: 8, max: 15, currency: 'AUD' }
      },
      {
        title: 'Real Estate Virtual Assistant',
        description: 'General administrative support for real estate operations',
        skills: ['Administrative tasks', 'Communication', 'Organization'],
        hourlyRate: { min: 6, max: 12, currency: 'AUD' }
      }
    ],
    pricingFactors: {
      location: 'australia',
      currency: 'AUD',
      costOfLivingMultiplier: 1.3,
      complianceComplexity: 1.2
    },
    isActive: true,
    version: '1.0'
  },
  {
    toolName: 'quote_calculator',
    industryType: 'healthcare',
    questionFlow: [
      {
        id: 'practice_type',
        question: 'What type of healthcare practice do you operate?',
        options: ['General Practice', 'Dental', 'Specialist', 'Allied Health', 'Mental Health'],
        required: true
      },
      {
        id: 'patient_volume',
        question: 'How many patients do you see per week?',
        options: ['Under 50', '50-100', '101-200', '201-500', '500+'],
        required: true
      },
      {
        id: 'main_tasks',
        question: 'Which administrative tasks need the most support?',
        options: [
          'Appointment scheduling',
          'Patient communication',
          'Insurance processing',
          'Medical record management',
          'Billing and accounts',
          'Prescription management',
          'Compliance documentation'
        ],
        multiple: true,
        required: true
      }
    ],
    taskOptions: [
      'Appointment scheduling and management',
      'Patient communication and follow-up',
      'Insurance claim processing',
      'Medical record data entry',
      'Billing and payment processing',
      'Prescription coordination',
      'HIPAA compliance documentation',
      'Patient portal management',
      'Referral coordination',
      'Administrative reporting'
    ],
    crmIntegrations: ['Epic', 'Cerner', 'Allscripts', 'Practice Fusion', 'eClinicalWorks'],
    roleTemplates: [
      {
        title: 'Medical Virtual Assistant',
        description: 'HIPAA-compliant administrative support for healthcare practices',
        skills: ['Healthcare knowledge', 'HIPAA compliance', 'Medical terminology'],
        hourlyRate: { min: 10, max: 18, currency: 'USD' }
      }
    ],
    pricingFactors: {
      location: 'usa',
      currency: 'USD',
      costOfLivingMultiplier: 1.0,
      complianceComplexity: 1.5
    },
    isActive: true,
    version: '1.0'
  },
  {
    toolName: 'quote_calculator',
    industryType: 'ecommerce', 
    questionFlow: [
      {
        id: 'platform',
        question: 'Which e-commerce platform do you use?',
        options: ['Shopify', 'WooCommerce', 'Magento', 'BigCommerce', 'Amazon', 'Custom'],
        required: true
      },
      {
        id: 'order_volume',
        question: 'How many orders do you process monthly?',
        options: ['Under 100', '100-500', '501-1000', '1001-5000', '5000+'],
        required: true
      },
      {
        id: 'main_tasks',
        question: 'Which e-commerce tasks need support?',
        options: [
          'Order processing and fulfillment',
          'Customer service and support',
          'Inventory management',
          'Product listing and updates',
          'Marketing and promotions',
          'Returns and refunds',
          'Supplier coordination'
        ],
        multiple: true,
        required: true
      }
    ],
    taskOptions: [
      'Order processing and fulfillment',
      'Customer service chat and email support',
      'Inventory tracking and management',
      'Product listing optimization',
      'Social media marketing',
      'Email marketing campaigns',
      'Returns and refund processing',
      'Supplier communication',
      'Data entry and analysis',
      'Quality assurance'
    ],
    crmIntegrations: ['Shopify', 'WooCommerce', 'Klaviyo', 'HubSpot', 'Salesforce'],
    roleTemplates: [
      {
        title: 'E-commerce Assistant',
        description: 'Manages online store operations and customer service',
        skills: ['E-commerce platforms', 'Customer service', 'Digital marketing'],
        hourlyRate: { min: 7, max: 14, currency: 'USD' }
      }
    ],
    pricingFactors: {
      location: 'global',
      currency: 'USD',
      costOfLivingMultiplier: 1.0,
      complianceComplexity: 1.0
    },
    isActive: true,
    version: '1.0'
  }
]

async function seedToolConfigurations() {
  console.log('🌱 Seeding tool configurations...')
  
  try {
    for (const config of industryConfigurations) {
      await db.execute(`
        INSERT INTO tool_configurations (
          tool_name, industry_type, question_flow, task_options, 
          crm_integrations, role_templates, pricing_factors, 
          is_active, version, created_at, updated_at
        ) VALUES (
          '${config.toolName}', 
          '${config.industryType}', 
          '${JSON.stringify(config.questionFlow)}', 
          '${JSON.stringify(config.taskOptions)}',
          '${JSON.stringify(config.crmIntegrations)}',
          '${JSON.stringify(config.roleTemplates)}',
          '${JSON.stringify(config.pricingFactors)}',
          ${config.isActive},
          '${config.version}',
          NOW(),
          NOW()
        )
        ON CONFLICT (tool_name, industry_type) 
        DO UPDATE SET 
          question_flow = EXCLUDED.question_flow,
          task_options = EXCLUDED.task_options,
          crm_integrations = EXCLUDED.crm_integrations,
          role_templates = EXCLUDED.role_templates,
          pricing_factors = EXCLUDED.pricing_factors,
          updated_at = NOW()
      `)
      
      console.log(`✅ Seeded ${config.industryType} configuration for ${config.toolName}`)
    }
    
    console.log('🎉 Tool configurations seeded successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding tool configurations:', error)
    throw error
  }
}

async function seedRoleTemplates() {
  console.log('🌱 Seeding role templates...')
  
  const roleTemplates = [
    {
      name: 'Virtual Assistant - Real Estate',
      category: 'Real Estate',
      description: 'Comprehensive property management and administrative support',
      skillsRequired: [
        'Australian real estate knowledge',
        'CRM proficiency (VaultRe, Locked On, etc.)',
        'Customer service excellence',
        'Attention to detail',
        'Communication skills'
      ],
      experienceLevel: 'intermediate',
      hourlyRateRange: { min: 8, max: 15, currency: 'AUD' },
      commonTasks: [
        'Property listing management',
        'Tenant screening and applications',
        'Lease documentation',
        'Maintenance coordination',
        'Compliance reporting',
        'Client communication'
      ],
      qualificationQuestions: [
        'How many years of real estate experience do you have?',
        'Which Australian real estate CRMs are you familiar with?',
        'Have you worked with Australian tenancy laws?',
        'Can you work during Australian business hours?'
      ],
      pricingFactors: {
        experienceMultiplier: 1.2,
        specializationBonus: 2,
        complianceRequirement: 1.3
      },
      isActive: true,
      usageCount: 0
    },
    {
      name: 'Customer Service Representative',
      category: 'General',
      description: 'Professional customer service and support',
      skillsRequired: [
        'Excellent communication skills',
        'Problem-solving abilities',
        'Patience and empathy',
        'Multi-tasking',
        'Computer proficiency'
      ],
      experienceLevel: 'entry',
      hourlyRateRange: { min: 5, max: 10, currency: 'USD' },
      commonTasks: [
        'Live chat support',
        'Email customer service',
        'Order processing',
        'Complaint resolution',
        'Product information',
        'Follow-up communication'
      ],
      qualificationQuestions: [
        'How many years of customer service experience do you have?',
        'Are you comfortable with live chat platforms?',
        'Can you handle difficult customer situations?',
        'What is your typing speed?'
      ],
      pricingFactors: {
        experienceMultiplier: 1.1,
        specializationBonus: 1,
        languageBonus: 1.2
      },
      isActive: true,
      usageCount: 0
    }
  ]
  
  try {
    for (const template of roleTemplates) {
      await db.execute(`
        INSERT INTO role_templates (
          name, category, description, skills_required, experience_level,
          hourly_rate_range, common_tasks, qualification_questions,
          pricing_factors, is_active, usage_count, created_at, updated_at
        ) VALUES (
          '${template.name}',
          '${template.category}',
          '${template.description}',
          '${JSON.stringify(template.skillsRequired)}',
          '${template.experienceLevel}',
          '${JSON.stringify(template.hourlyRateRange)}',
          '${JSON.stringify(template.commonTasks)}',
          '${JSON.stringify(template.qualificationQuestions)}',
          '${JSON.stringify(template.pricingFactors)}',
          ${template.isActive},
          ${template.usageCount},
          NOW(),
          NOW()
        )
        ON CONFLICT (name) 
        DO UPDATE SET 
          description = EXCLUDED.description,
          skills_required = EXCLUDED.skills_required,
          updated_at = NOW()
      `)
      
      console.log(`✅ Seeded role template: ${template.name}`)
    }
    
    console.log('🎉 Role templates seeded successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding role templates:', error)
    throw error
  }
}

async function main() {
  try {
    console.log('🚀 Starting database seeding process...')
    
    await seedToolConfigurations()
    await seedRoleTemplates()
    
    console.log('✨ Database seeding completed successfully!')
    
  } catch (error) {
    console.error('💥 Database seeding failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Run the seeding process
main() 