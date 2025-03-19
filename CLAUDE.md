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
- **CSS**: Tailwind CSS v4 with shadcn/ui component library and class-variance-authority for variants
- **State Management**: Server components for data fetching; use React hooks for client-side state
- **DB Access**: Use Drizzle ORM with strong typing and prepared queries; add new models to schema.ts
- **Error Handling**: Prefer early returns with descriptive error messages; use try/catch for async operations
- **Authentication**: JWT stored in cookies via the auth system; use auth middleware for protected routes

## UI Component System
- **Card Components**: Cards use consistent styling with variants (default, soft, outline, card)
  - Cards in dark mode use `bg-primary/5` background color for consistent theme
  - StatCard icon containers use `dark:bg-primary/5 dark:text-primary` in dark mode
  - The "card" button variant uses the same styling as cards in dark mode
- **Chart Components**: Revenue charts use transparent background in both light and dark modes
- **Theme System**: Light and dark mode with CSS variables defined in globals.css
  - Global CSS variables follow the pattern `--color-name: hsl(var(--name))` or `--color-name: var(--name)`
  - Dark mode class toggles variable values for consistent theming
- **Component Design**: Components use Radix UI primitives customized with Tailwind
  - Form controls, dialogs, and interactive elements follow shadcn/ui principles

## Layout Patterns
- **Dashboard Layout**: Responsive dashboard with modern sidebar navigation
  - Main sidebar includes all navigation including settings links
  - All dashboard pages use consistent full-width layout with same heading styles
  - Workspaces use bright, high-contrast color indicators (`bg-blue-500`, `bg-purple-500`, etc.)
  - User avatar in header matches sidebar account styling for consistency
- **Authentication Pages**: Two-column layout for authentication screens
  - Left column with dark background, testimonial, and logo
  - Right column with authentication form
  - Responsive mobile view with simplified layout
  - Theme toggle and sign-in/sign-up link positioned together in top-right corner

## Tech Stack
- Next.js 15 with Turbopack
- React 19
- TypeScript 5.8+
- Tailwind CSS 4.0
- Postgres with Drizzle ORM
- shadcn/ui component library
- Radix UI primitives
- Lucide React icons
- Stripe for payment processing