# Mi Ticha - AI Learning Companion

## Overview

Mi Ticha is an AI-powered educational platform designed for Sierra Leone students aged 8-14. The platform provides personalized homework help, reading practice, and pronunciation assistance through Moe, a friendly AI tutor. Parents can monitor their children's learning progress and activities through a dedicated dashboard.

The application is built with Next.js 15.5.4 using the App Router, TypeScript, and Tailwind CSS. It uses Supabase for authentication and data persistence, and integrates with AI models (Groq's Llama) for conversational tutoring and content generation.

## Recent Changes

**October 13, 2025 - AI Implementation & Database Fix**
- **Fixed "Parent profile not found" error**: Created database trigger that auto-creates parent profiles on signup
- **Implemented Groq AI Integration**: Free AI service for Moe (the AI tutor) using Llama 3.1 70B
- **Fixed chat API route**: Updated to use proper Groq SDK with `@ai-sdk/groq` package
- **Added proper error handling**: Chat API returns clear error when API key is missing
- **Database setup script**: Created `scripts/complete-setup-with-trigger.sql` with RLS policies and automatic profile creation

**October 13, 2025 - Migrated from Vercel to Replit**
- Configured Next.js to run on port 5000 with 0.0.0.0 host binding for Replit environment
- Updated package.json scripts: `dev` and `start` commands now include `-p 5000 -H 0.0.0.0`
- Set up development workflow using pnpm package manager
- Configured autoscale deployment for production (build: `pnpm run build`, start: `pnpm run start`)
- Added Supabase environment variables to Replit Secrets (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- Verified application launches successfully on Replit

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: Next.js 14+ with App Router and React Server Components (RSC)
- Leverages server-side rendering for improved performance and SEO
- Client components used strategically for interactive features (chat, forms, real-time updates)
- TypeScript for type safety across the application

**UI Component System**: shadcn/ui with Radix UI primitives
- Consistent design system using the "new-york" style variant
- Tailwind CSS with custom color palette optimized for children (friendly sky blue, sunshine yellow, playful green, warm orange)
- Component library includes forms, cards, dialogs, and navigation elements
- Geist Sans and Geist Mono fonts for modern typography

**State Management**: 
- React hooks (useState, useEffect) for local component state
- No global state management library (Redux/Zustand) - relies on server components and props
- localStorage for student session persistence
- Real-time updates via Supabase subscriptions where needed

**Routing**: 
- File-based routing with Next.js App Router
- Protected routes enforced via middleware for both parent and student sections
- Separate authentication flows for parents and students

### Backend Architecture

**Authentication System**:
- Dual authentication model: Parent accounts (email/password) and Student accounts (username/password)
- Parents authenticate via standard Supabase Auth with email confirmation
- Students use a simplified username-based login mapped to internal email addresses
- Child accounts are "managed accounts" linked to parent profiles via `managed_by` relationship
- Middleware handles session verification and route protection

**API Routes** (Next.js Route Handlers):
- `/api/chat` - Streams AI responses using Vercel AI SDK with Groq models
- `/api/generate-sentence` - Generates reading practice sentences
- Server Actions for data mutations (create-child, student-auth, manage-child)

**AI Integration**:
- Uses Vercel AI SDK (`ai` package) for streaming chat responses
- Groq's Llama 3.1 70B model for tutoring conversations
- Three distinct tutoring modes: homework help, pronunciation practice, math practising and reading assistance
- Context-aware prompts tailored to Sierra Leone educational context

**Data Models** (Supabase Tables):
- `profiles` - Parent user profiles
- `students` - Student profiles with grade level, age, parent relationship
- `questions` - Student questions with type categorization (homework, pronunciation, word)
- `answers` - AI responses linked to questions
- `reading_sessions` - Reading practice session tracking
- `reading_passages` - Curated reading materials with comprehension questions
- `parent_notifications` - Activity notifications for parents

### Database and Data Layer

**Database**: Supabase (PostgreSQL)
- Provides authentication, real-time subscriptions, and RESTful API
- Row Level Security (RLS) policies enforce data access controls
- Parent-child relationship ensures parents only see their children's data

**Client Architecture**:
- Three Supabase client types for different contexts:
  - Browser client (`lib/supabase/client.ts`) - For client components
  - Server client (`lib/supabase/server.ts`) - For server components and API routes
  - Admin client (`lib/supabase/admin.ts`) - For privileged operations (user creation)
- Singleton pattern prevents multiple client instantiations

**Session Management**:
- Cookie-based sessions managed by Supabase SSR package
- Middleware refreshes sessions on each request
- Separate session handling for parent and student authentication flows

### External Dependencies

**Core Framework**:
- Next.js 14+ - Full-stack React framework with App Router
- React 18+ - UI library with Server Components support
- TypeScript - Type safety and developer experience

**UI and Styling**:
- Tailwind CSS - Utility-first CSS framework
- shadcn/ui - Composable UI component collection
- Radix UI - Headless UI primitives (dialogs, dropdowns, tabs, etc.)
- Lucide React - Icon library
- class-variance-authority - Component variant management
- tailwind-merge & clsx - Conditional className utilities

**Authentication and Database**:
- Supabase - Backend-as-a-Service (PostgreSQL database, authentication, real-time subscriptions)
- @supabase/ssr - Server-side rendering support for Supabase
- @supabase/supabase-js - Supabase JavaScript client
- bcryptjs - Password hashing (likely for legacy or additional security)

**AI and Language Models**:
- ai (Vercel AI SDK) - Streaming AI responses and chat interfaces
- Groq - AI model provider (Llama 3.1 70B Versatile)

**Forms and Validation**:
- React Hook Form (@hookform/resolvers) - Form state management and validation
- Zod (implied by resolvers) - Schema validation

**Developer Experience**:
- Geist font family - Modern sans-serif and monospace fonts
- next-themes - Dark mode support (configured but not fully implemented)
- @vercel/analytics - Usage analytics

**Deployment Context**:
- Designed to run on port 5000
- Configured for 0.0.0.0 host binding (container/cloud deployment)
- Service worker errors suppressed via error boundary
