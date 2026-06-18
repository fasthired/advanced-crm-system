# Site Crash Fix - Supabase Configuration

## Problem
The site was crashing with error: `Error: supabaseUrl is required`

This happened because the Supabase environment variables were not set.

## Solution
I've fixed the crash by making the app gracefully handle missing configuration:

1. **Supabase client initialization** now checks if credentials are available before trying to create the client
2. **Auth context** now safely handles missing Supabase configuration
3. **New setup page** guides you through configuration step-by-step
4. **Auto-redirect** sends you to setup page if not configured

## How to Fix (3 Steps)

### Step 1: Create .env.local File
In your project root, create a file named `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### Step 2: Get Your Credentials
1. Go to supabase.com
2. Create a new project
3. Go to Settings > API
4. Copy the Project URL
5. Copy the anon public key
6. Paste them into .env.local

### Step 3: Restart Dev Server
- Stop your dev server (Ctrl+C)
- Run `pnpm dev` again
- Open http://localhost:3000

## What Changed
- Fixed Supabase client to handle missing credentials
- Added setup page at `/setup`
- Added graceful error handling in auth context
- Added auto-redirect to setup if not configured
- Added `.env.example` file for reference

## Now What?
After setting up Supabase:
1. You'll be redirected to setup page if credentials are missing
2. Once configured, you'll see the login page
3. Click "Sign up" to create your account
4. Start using your CRM!

The app no longer crashes - it guides you through setup instead.
