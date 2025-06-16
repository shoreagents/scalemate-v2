# ScaleMate - Offshore Team Scaling Platform

ScaleMate is a comprehensive educational platform designed for progressive business owners who want to scale their operations using offshore teams combined with AI solutions. The platform provides AI-powered tools, assessments, and educational resources to help businesses build successful offshore teams.

## 🚀 Features

### Core AI Tools
- **AI Quote Calculator**: Conversational AI that provides personalized offshore staffing quotes
- **Readiness Assessment**: Comprehensive evaluation across 8 critical business categories
- **Anonymous User Tracking**: Advanced analytics without requiring user registration
- **Email Capture System**: Strategic lead generation at multiple touchpoints

### Platform Capabilities
- **Modern UI/UX**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **AI Integration**: Powered by Claude (Anthropic) for intelligent conversations
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Analytics**: Custom analytics system for user behavior tracking
- **SEO Optimized**: Built-in SEO optimization for content and pages
- **Responsive Design**: Mobile-first approach with beautiful animations

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### Backend & Database
- **PostgreSQL** - Primary database
- **Drizzle ORM** - Type-safe database toolkit
- **Railway** - Database hosting (recommended)

### AI & Services
- **Anthropic Claude** - Conversational AI for tools
- **Resend** - Email delivery service
- **Custom Analytics** - User behavior tracking

### Development Tools
- **ESLint & Prettier** - Code formatting and linting
- **Husky** - Git hooks for code quality
- **Jest & Cypress** - Testing framework
- **Drizzle Kit** - Database migrations

## 📁 Project Structure

```
scalemate/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── tools/             # Tool pages
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── layout/           # Layout components
│   │   ├── sections/         # Page sections
│   │   └── tools/            # Tool-specific components
│   ├── lib/                  # Utility libraries
│   │   ├── db/              # Database schema and config
│   │   ├── ai/              # AI service integrations
│   │   └── utils.ts         # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── contexts/            # React context providers
│   ├── types/               # TypeScript type definitions
│   └── data/                # Static data and constants
├── public/                  # Static assets
├── drizzle/                # Database migrations
└── docs/                   # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Anthropic API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/scalemate.git
cd scalemate
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/scalemate"

# AI Services
ANTHROPIC_API_KEY="your_anthropic_api_key_here"

# Email Services
RESEND_API_KEY="your_resend_api_key_here"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Set up the database**
```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate
```

5. **Start the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run Jest tests
- `npm run test:e2e` - Run Cypress E2E tests
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

### Code Quality

The project uses several tools to maintain code quality:

- **ESLint** - Code linting with Next.js and TypeScript rules
- **Prettier** - Code formatting with Tailwind CSS plugin
- **Husky** - Pre-commit hooks for code quality
- **TypeScript** - Strict type checking

### Database Management

The project uses Drizzle ORM for type-safe database operations:

```typescript
// Example: Querying data
import { db, users } from '@/lib/db'
import { eq } from 'drizzle-orm'

const user = await db.select().from(users).where(eq(users.id, userId))
```

## 🤖 AI Integration

### Claude Integration

The platform integrates with Anthropic's Claude for intelligent conversations:

```typescript
import { sendClaudeMessage } from '@/lib/ai/claude'

const response = await sendClaudeMessage(
  messages,
  systemPrompt,
  maxTokens
)
```

### AI Tools

1. **Quote Calculator**: Uses Claude to have natural conversations about staffing needs
2. **Readiness Assessment**: AI-powered evaluation of business readiness

## 📊 Analytics

The platform includes a custom analytics system that tracks:

- Page views and user sessions
- Tool usage and completion rates
- User behavior patterns
- Conversion funnel metrics

All tracking is done anonymously without requiring user registration.

## 🎨 Design System

The project uses a comprehensive design system built with Tailwind CSS:

### Colors
- **Primary**: Blue color scheme for main actions
- **Secondary**: Gray color scheme for secondary elements
- **Success/Warning/Error**: Semantic colors for feedback

### Components
- Consistent spacing and typography
- Accessible color contrasts
- Responsive design patterns
- Smooth animations and transitions

## 🚀 Deployment

### Environment Setup

1. **Database**: Set up PostgreSQL database (Railway recommended)
2. **Environment Variables**: Configure all required environment variables
3. **Build**: Run `npm run build` to create production build

### Recommended Platforms

- **Vercel** - Optimal for Next.js applications
- **Railway** - Great for full-stack applications with database
- **Netlify** - Alternative for static deployment

### Database Migrations

Before deploying, ensure database migrations are run:

```bash
npm run db:migrate
```

## 📈 SEO & Performance

The platform is optimized for search engines and performance:

- **Meta Tags**: Comprehensive meta tag setup
- **Open Graph**: Social media sharing optimization
- **Sitemap**: Automatic sitemap generation
- **Performance**: Optimized images and code splitting
- **Core Web Vitals**: Optimized for Google's performance metrics

## 🔒 Security

Security measures implemented:

- **Environment Variables**: Sensitive data stored securely
- **API Rate Limiting**: Protection against abuse
- **Input Validation**: All user inputs validated
- **CORS**: Proper cross-origin resource sharing setup
- **Headers**: Security headers configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Maintain consistent code style
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Documentation**: Check the `/docs` folder
- **Issues**: Create an issue on GitHub
- **Email**: contact@scalemate.com

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Core platform setup
- [x] AI Quote Calculator
- [x] Readiness Assessment
- [x] Basic analytics

### Phase 2: Enhancement 🚧
- [ ] Advanced AI features
- [ ] Blog system
- [ ] User accounts
- [ ] Email automation

### Phase 3: Scale 📋
- [ ] Enterprise features
- [ ] API for integrations
- [ ] Mobile app
- [ ] Advanced analytics

---

Built with ❤️ for progressive business owners who want to scale with offshore teams and AI. 