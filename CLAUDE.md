# CLAUDE.md - SaaS Starter Codebase Guide

## Build & Run Commands
- `pnpm dev` - Run development server with Turbopack
- `pnpm build` - Build for production
- `pnpm db:setup` - Set up environment variables
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed the database with test data
- `pnpm db:generate` - Generate database migrations
- `pnpm db:studio` - Launch Drizzle Studio

## Code Style Guidelines
- **Project Structure**: Next.js app router with organized folders for components, lib, and app routes
- **Imports**: Use absolute imports with `@/` prefix (`import { x } from '@/lib/utils'`)
- **TypeScript**: Strict mode enabled; prefer explicit types over `any`
- **React Components**: Functional components with TypeScript interfaces for props
- **Naming**: PascalCase for components, camelCase for functions/variables
- **CSS**: Tailwind CSS with shadcn/ui component library and class-variance-authority for variants
- **DB Access**: Use Drizzle ORM with strong typing and prepared queries
- **Error Handling**: Prefer early returns with descriptive error messages
- **Authentication**: JWT stored in cookies via the auth system

## Tech Stack
- Next.js, TypeScript, Tailwind CSS, Postgres, Drizzle ORM, shadcn/ui, Stripe