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

## Data and UI Interaction Patterns

### Server Actions
- **Action Patterns**:
  - Each module has its own `actions.ts` file in the module folder (e.g., `clients/actions.ts`)
  - Actions are strongly typed with Zod schemas for validation
  - Use `validatedActionWithUser` wrapper for secure, authenticated actions
  - Return a consistent result shape: `{ success, error, data }` for predictable handling
  - Example: `createTicket`, `updateClient`, `addTicketComment`

- **Data Fetching Actions**:
  - Module-specific data fetching actions (e.g., `getClientsForTeam`, `getTicketById`)
  - Support team-based data isolation using `getUserWithTeam`
  - Auto-create teams for new users when needed (in create/list operations)
  - Include field selection and joins for related entities
  - Support optional FormData parameter for form submission compatibility

### Form Components
- **Edit Forms Pattern**:
  - Form components are client components with their own data loading logic
  - Load data with `useEffect` when mounted, using entity-specific fetch action
  - Manage loading states with `useState` and conditional rendering
  - Handle form submission with proper try/catch and toast notifications
  - Support editing related entities with dropdowns (clients, assignees, etc.)
  - Example: `client-edit-form.tsx`, `ticket-edit-form.tsx`

- **Common Form Features**:
  - Use shadcn/ui form elements for consistent styling
  - Display required fields with red asterisk indicator
  - Implement proper validation with required attributes and client-side checks
  - Disable form elements and show spinners during submission
  - Use FormData for server action compatibility

### Real-Time UI Patterns
- **Optimistic Updates**:
  - Use React's `useOptimistic` hook for instant UI feedback
  - Create optimistic versions of data with temporary IDs
  - Update local state immediately before server confirmation
  - Revert to server state on error with toast notification
  - Example: `TicketComments` component for real-time commenting

- **List-Detail Relationship**:
  - List pages fetch data with server actions (e.g., `getTicketsForTeam`)
  - Detail/edit pages use ID from URL parameters with `useParams()`
  - Navigation between list and detail views with Next.js router
  - Consistent back navigation with `router.back()` in edit forms

- **Interactive Data Views**:
  - Data tables with client-side sorting and filtering
  - Dropdowns for related entities (`ClientCombobox` for selecting clients)
  - Form field dependencies (e.g., assignee dropdown populated with team members)
  - Date formatting with `date-fns` for consistent presentation

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

### Database Type Handling
- **Drizzle ORM Patterns**:
  - Define database schema in `schema.ts` with explicit column types
  - Use the generated types (`$inferSelect`, `$inferInsert`) for strongly-typed entities
  - Add type assertions (`as number`) when working with potentially null team IDs
  - Handle ORM constraints with proper type conversions:
    - Use `.toString()` for numeric values in decimal/numeric columns
    - Use `|| null` for optional foreign key relations
    - Use type guards before accessing nullable relations

- **Query Type Safety**:
  - Use `eq()` with non-null values in Drizzle query filters
  - Handle potential null references with optional chaining in nested joins
  - Provide fallback values for nullable fields in mapped results
  - Example: `client: item.client?.name || 'Unknown Client'`

### Form Data Type Handling
- **Form Submission**:
  - Use Zod schemas to validate and parse form data for server actions
  - Apply type preprocessing in Zod for consistent data types:
    ```typescript
    clientId: z.preprocess(
      (val) => Number(val),
      z.number().positive('Client is required')
    )
    ```
  - Handle form data type conversions when creating FormData objects
  - Ensure null/undefined values are properly handled in form submissions

- **Component Props**:
  - Define clear interfaces for component props with proper nullability
  - Use optional fields with default values in function parameters
  - Consider using generics for reusable components that handle different entity types
  - Implement proper disabled state handling and loading indicators

### Type Safety Best Practices
- **Type Guards**:
  - Use type narrowing with explicit checks before accessing potentially undefined properties
  - Apply null coalescing for default values: `item.value ?? defaultValue`
  - Implement conditional rendering based on data presence
  - Avoid type assertions except when TypeScript can't infer the correct type

- **Error Handling**:
  - Use try/catch blocks for async operations with proper error typing
  - Return typed result objects: `{ success?: string, error?: string, data?: T }`
  - Apply consistent error handling patterns across similar components
  - Log errors for debugging but display user-friendly messages

## Server vs Client Components

### Next.js App Router Architecture
- **Component Types**:
  - **Server Components**: Default in App Router; run only on the server with no client JS
  - **Client Components**: Marked with 'use client'; interactive with client-side JS
  - **Hybrid Approach**: Server components for data fetching + client components for interactivity

- **Data Flow Patterns**:
  - **Server-first Pattern**: Server components fetch data, pass to client components as props
  - **Client-first Pattern**: Client components fetch their own data with useEffect/SWR/React Query
  - **Hybrid Pattern**: Server components pre-render initial view, client components handle updates

### Dynamic Route Patterns
- **Server Component Route Pages**:
  - Receive `params` and `searchParams` props automatically
  - Can use async/await for data fetching in component body
  - Avoid using hooks (useEffect, useState, useParams)
  - Limited by TypeScript constraints with PageProps interface

- **Client Component Route Pages**:
  - Must use `useParams()` hook to access route parameters
  - Need to handle data fetching with useEffect/SWR
  - Include loading states and error boundaries
  - More flexible for forms and interactive elements
  - Example: `/dashboard/tickets/[id]/edit/page.tsx`, `/dashboard/clients/[id]/edit/page.tsx`

### Component Structure Best Practices
- **Page Component Pattern**:
  - Keep page components thin (< 20 lines) as routers to specialized components
  - For interactive pages: `'use client'` + `useParams()` + render form component
  - For read-only pages: Server component + pass data to client components

- **Form Handling Architecture**:
  - Forms should be client components with their own data loading logic
  - Use `useState` for form fields + `useEffect` for initial data loading
  - Submit with server actions, captured in `try/catch` blocks
  - Show loading states during submission
  - Display success/error with toast notifications
  - Navigate with router.push() after successful submission