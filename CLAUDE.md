# CLAUDE.md - SaaS Starter Codebase Guide

## Build & Run Commands
- `pnpm dev` - Run development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:setup` - Set up environment variables and initialize Postgres
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed the database with test data
- `pnpm db:generate` - Generate database migrations
- `pnpm db:studio` - Launch Drizzle Studio
- `npx next lint` - Run ESLint for code linting
- `npx tsc --noEmit` - Run TypeScript checker

## Database Migration Process
1. **Set up PostgreSQL**:
   - Run `pnpm db:setup` to configure your environment
   - Choose between local Docker Postgres instance or a remote database
   - The script will create your `.env` file with the Postgres connection string

2. **Initialize the Database**:
   - Run `node lib/db/init-db.ts` to create the database schema
   - This creates all necessary tables based on the Drizzle schema definitions
   - A test team and client will be created for development purposes

3. **Run Migrations** (when schema changes):
   - After modifying `schema.ts`, run `pnpm db:generate` to create migration files
   - Run `pnpm db:migrate` to apply migrations to your database
   - View your database with `pnpm db:studio` to verify changes

4. **Database Environment Variables**:
   - `POSTGRES_URL` - Main connection string (required)
   - Docker default: `postgres://postgres:postgres@localhost:54322/postgres`
   - App database: `postgres://esitdev:21c2692af7b8b48f33bb3ba6c4b1ea8a@localhost:54322/esit_service_db`

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

## Data Interaction Components
- **Form Components**: All form components use React's server actions for data submission
  - Forms typically call type-safe actions from respective `actions.ts` files
  - Use `useOptimistic` hook for immediate UI updates before server response
  - Include proper loading states with disabled inputs during submission

- **TicketComments**: Implements real-time comments with optimistic updates
  - Uses `addTicketComment` server action from `tickets/actions.ts`
  - Displays comments with formatting based on internal/external status
  - Shows relative time using `formatDistanceToNow` from `date-fns`
  - Maintains scroll position in comment history

- **Data Tables**: Interactive tables with real-time data
  - Fetches data from server actions in the respective module
  - Implements client-side sorting, filtering, and pagination
  - Uses strong typing with TypeScript interfaces aligned with database schema

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

## TypeScript Type Safety Patterns
- **Common Type Issues**:
  - Handle potential null values with optional chaining (`item.client?.name`) and nullish coalescing (`|| 'default'`)
  - Use type assertions (`as number`) for Drizzle ORM parameters when TypeScript can't infer non-null values
  - Properly define component props interfaces with optional properties (`disabled?: boolean`)
  - Convert numeric values to strings for decimal DB fields (`amount.toString()`)

- **Server Actions**:
  - Server actions use Zod for runtime validation
  - Prefer strongly-typed parameters in server action functions
  - Return objects with consistent shape (e.g., `{ success: string }` or `{ error: string }`)
  - Handle both optimistic client-side updates and server validation

- **Component Props**:
  - Define clear interfaces for component props
  - Use generic types for reusable components
  - Ensure form components properly handle loading and disabled states

## Server vs Client Components
- **Server Components**:
  - Dynamic route pages should be server components (without 'use client')
  - Server components receive `params` prop automatically (e.g., `params: { id: string }`)
  - Use server components to fetch initial data using server actions
  - Pass data to client components for interactive functionality

- **Client Components**:
  - Mark with 'use client' directive at the top of the file
  - Create dedicated client component files for interactive UI elements
  - Receive data as props from parent server components
  - Handle form submissions, user input, and client-side interactions
  
- **Hybrid Pattern**:
  - For complex pages with dynamic routes, use server component for the route page
  - Create client components for interactive sections (like forms)
  - Example: `/clients/[id]/edit/page.tsx` (server) uses `client-edit-form.tsx` (client)