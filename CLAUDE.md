# CLAUDE.md - SaaS Starter Codebase Guide

## Build & Run Commands
- `pnpm dev` - Run development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:setup` - Set up environment variables
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed the database with test data
- `pnpm db:generate` - Generate database migrations
- `pnpm db:studio` - Launch Drizzle Studio
- `npx next lint` - Run ESLint for code linting
- `npx tsc --noEmit` - Run TypeScript checker

## Code Style Guidelines
- **Project Structure**: Next.js app router with organized folders for components, lib, and app routes
- **Imports**: Use absolute imports with `@/` prefix (`import { x } from '@/lib/utils'`)
- **TypeScript**: Strict mode enabled; prefer explicit types over `any`; avoid type assertions
- **React Components**: Functional components with TypeScript interfaces for props; use React Server Components where possible
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for files
- **CSS**: Tailwind CSS with shadcn/ui component library and class-variance-authority for variants
- **State Management**: Server components for data fetching; use React hooks for client-side state
- **DB Access**: Use Drizzle ORM with strong typing and prepared queries; add new models to schema.ts
- **Error Handling**: Prefer early returns with descriptive error messages; use try/catch for async operations
- **Authentication**: JWT stored in cookies via the auth system; use auth middleware for protected routes

## Tech Stack
- Next.js 15, TypeScript, Tailwind CSS, Postgres, Drizzle ORM, shadcn/ui, Stripe