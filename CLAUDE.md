# CLAUDE.md - SaaS Starter Guide

## Build & Development Commands
- `pnpm dev` - Start development server (Turbopack)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:setup` - Set up environment variables
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with test data
- `pnpm db:generate` - Generate database migrations
- `pnpm db:studio` - Launch Drizzle Studio
- `npx next lint` - Run ESLint
- `npx tsc --noEmit` - TypeScript check

## Code Style Guidelines
- **Structure**: Next.js 15 app router with organized component, lib, and route folders
- **Imports**: Use absolute imports with `@/` prefix (e.g., `import { x } from '@/lib/utils'`)
- **TypeScript**: Strict mode, explicit types, no `any`, avoid type assertions
- **Components**: Functional components with typed props, prefer Server Components where possible
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for files
- **Styling**: Tailwind CSS 4.0 with shadcn/ui components and CSS variables for theming
- **Database**: Drizzle ORM with strong typing and prepared queries
- **Error Handling**: Early returns with descriptive messages, try/catch for async operations
- **Authentication**: JWT cookies with auth middleware for protected routes
- **Theming**: Light/dark mode with CSS variables, `bg-primary/5` for dark mode backgrounds
- **Layout**: Responsive dashboard with sidebar navigation, two-column auth pages

## Tech Stack
- Next.js 15 (Turbopack), React 19, TypeScript 5.8+, Tailwind CSS 4.0
- Postgres with Drizzle ORM
- shadcn/ui components, Radix UI primitives, Lucide React icons
- Stripe for payment processing