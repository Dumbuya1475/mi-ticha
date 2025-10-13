# Environment Variables Setup Guide

This guide will help you configure the environment variables needed to run Mi Ticha locally, with a focus on Supabase integration.

## Overview

Mi Ticha uses environment variables to securely store API keys, database credentials, and other sensitive configuration. These variables are stored in a `.env.local` file that you need to create.

## Step 1: Create the Environment File

In the root directory of your project, create a file named `.env.local`:

\`\`\`bash
touch .env.local
\`\`\`

## Step 2: Supabase Configuration

Since you've already created a Supabase project, you'll need to get your project credentials from the Supabase dashboard.

### Getting Your Supabase Credentials

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on the **Settings** icon (gear icon) in the sidebar
4. Navigate to **API** section
5. You'll find the following credentials:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")
   - **service_role key** (under "Project API keys" - keep this secret!)

### Add Supabase Variables to .env.local

Add the following variables to your `.env.local` file:

\`\`\`bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: For server-side operations (keep this secret!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Development redirect URL for email confirmations
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

### Example .env.local File

\`\`\`bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjoxOTMxNzM3NjE2fQ.example_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example_service_role_key_here
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

## Step 3: Additional Environment Variables (Optional)

Depending on your implementation, you may need additional environment variables:

### AI Integration (if using AI features)

\`\`\`bash
# OpenAI API Key (for AI tutoring features)
OPENAI_API_KEY=your_openai_api_key_here

# Or other AI providers
ANTHROPIC_API_KEY=your_anthropic_key_here
\`\`\`

### Analytics (Optional)

\`\`\`bash
# Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id_here
\`\`\`

### Other Services

\`\`\`bash
# Email service (if using)
RESEND_API_KEY=your_resend_api_key_here

# File storage (if not using Supabase Storage)
NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN=your_blob_token_here
\`\`\`

## Step 4: Supabase Database Setup

After configuring your environment variables, you'll need to set up your database schema in Supabase.

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the sidebar
3. Create your tables using SQL commands

### Option 2: Using Migration Scripts

If you have SQL migration scripts in your project, you can run them directly from the Supabase SQL Editor.

### Basic Schema Example

Here's a basic schema to get started (customize based on your needs):

\`\`\`sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('parent', 'student')) NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER CHECK (age >= 8 AND age <= 14),
  grade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE public.chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Reading practice table
CREATE TABLE public.reading_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  duration_seconds INTEGER,
  words_read INTEGER,
  comprehension_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (example - customize based on your needs)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Parents can view their students" ON public.students
  FOR SELECT USING (auth.uid() = parent_id);
\`\`\`

## Step 5: Verify Configuration

After setting up your `.env.local` file:

1. Restart your development server:
   \`\`\`bash
   npm run dev
   \`\`\`

2. Check the console for any environment variable errors

3. Test the Supabase connection by attempting to sign up or log in

## Security Best Practices

1. **Never commit `.env.local` to version control**
   - Add `.env.local` to your `.gitignore` file (should already be there)

2. **Use different keys for development and production**
   - Keep production keys separate and secure

3. **Rotate keys regularly**
   - Especially if they may have been exposed

4. **Use service role key only on the server**
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
   - Only use it in API routes or server components

5. **Enable Row Level Security (RLS)**
   - Always enable RLS on your Supabase tables
   - Create appropriate policies for data access

## Troubleshooting

### "Invalid API key" Error

- Double-check that you copied the correct keys from Supabase
- Ensure there are no extra spaces or line breaks in your `.env.local` file
- Restart your development server after making changes

### "Cannot connect to Supabase" Error

- Verify your `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check that your Supabase project is active and not paused
- Ensure your internet connection is stable

### Environment Variables Not Loading

- Make sure the file is named exactly `.env.local` (not `.env` or `env.local`)
- Restart your development server after creating or modifying the file
- Check that the file is in the root directory of your project

## Production Deployment

When deploying to production (e.g., Vercel):

1. Add environment variables in your hosting platform's dashboard
2. Use production Supabase credentials (not development ones)
3. Update `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` to your production URL
4. Enable all necessary Supabase features (Auth, Storage, etc.)

## Need Help?

- Supabase Documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Next.js Environment Variables: [https://nextjs.org/docs/app/building-your-application/configuring/environment-variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
