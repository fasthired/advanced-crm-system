# Advanced CRM System - Setup Guide

## 🎯 Overview

This is a **complete, production-ready CRM (Customer Relationship Management) system** built with Next.js 16, Supabase, and modern web technologies. It includes everything you need to manage customers, track calls, follow-ups, tasks, and analytics - **completely free and fully functional**.

## ✨ Features Included

### Core Features
- ✅ **User Authentication** - Email/password signup and login with Supabase Auth
- ✅ **Customer Management** - Create, edit, delete, search customers with full profiles
- ✅ **Call Logging** - Track inbound/outbound calls with notes and duration
- ✅ **Follow-ups** - Schedule and manage follow-ups with priorities
- ✅ **Tasks** - Create tasks with status tracking (To Do, In Progress, Done)
- ✅ **Reminders** - Set reminders for important events
- ✅ **Notifications** - Real-time notifications for activities
- ✅ **Analytics Dashboard** - Charts showing customer breakdown, call stats, task completion
- ✅ **CSV Export** - Export customers, calls, and tasks data
- ✅ **Activity Logging** - Audit trail of all user actions
- ✅ **Mobile-First Design** - Fully responsive, works great on all devices
- ✅ **Dark Theme** - Modern dark UI with slate color scheme

### Technical Features
- Row-Level Security (RLS) - Data isolation per user
- Real-time database synchronization
- Optimized indexes for fast queries
- Audit logging for compliance
- Type-safe database access
- Responsive navigation (mobile bottom nav, desktop sidebar)

## 🚀 Quick Start (5 minutes)

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and click **"Start your project"**
2. Sign up with GitHub or email
3. Click **"New Project"**
4. Fill in the project details:
   - Name: `crm-system` (or your choice)
   - Database Password: Create a strong password and save it
   - Region: Choose closest to you
5. Wait for the project to initialize (2-3 minutes)
6. Go to **Settings > API** and copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: Setup Database

1. In Supabase, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase-setup.sql` file
4. Paste into the SQL Editor
5. Click **"Run"** (it will take 10-30 seconds)
6. You should see success messages for all tables created

### Step 3: Configure Your App

1. In the project root, create a file called `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

2. Replace with your actual values from Step 1

### Step 4: Run the App

```bash
# Install dependencies (if not already done)
pnpm install

# Start the development server
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000)
4. You'll be redirected to the login page

### Step 5: Create Your First User

1. Click **"Sign up here"** on the login page
2. Fill in:
   - Full Name: Your name
   - Email: your@email.com
   - Password: Your secure password
3. Click **"Create Account"**
4. You'll be redirected to login
5. Sign in with your credentials
6. You're now in the CRM dashboard!

## 🏗️ Database Schema

### Tables Created

1. **users** - User accounts and preferences
2. **customers** - Customer records with contact info and status
3. **calls** - Call logs with duration, outcome, notes
4. **follow_ups** - Follow-up reminders and tasks
5. **reminders** - Task reminders with recurrence
6. **tasks** - To-do items with status and priority
7. **notifications** - Real-time notifications
8. **activities** - Audit log of all actions
9. **analytics** - Metrics and reporting data

All tables have:
- Row-Level Security (RLS) enabled - only users see their own data
- Automatic timestamps (created_at, updated_at)
- Optimized indexes for fast queries

## 📱 Navigation

### Mobile (Bottom Navigation)
- Home - Dashboard overview
- Customers - Customer list
- Calls - Call logs
- Follow-ups - Follow-up tasks
- Tasks - To-do items
- Analytics - Reports and charts

### Desktop (Left Sidebar)
- Dashboard - Overview and quick actions
- Customers - Full customer management
- Calls - Call tracking
- Follow-ups - Follow-up management
- Tasks - Task management
- Analytics - Reports and visualization
- Settings - Account & preferences

## 💡 Usage Examples

### Adding a Customer
1. Click **"Customers"** in navigation
2. Click **"Add Customer"** button
3. Fill in customer details (name required, others optional)
4. Select status (Lead, Prospect, Qualified, Customer, Inactive)
5. Click **"Create Customer"**

### Logging a Call
1. Click **"Calls"** in navigation
2. Click **"Log Call"** button
3. Select customer
4. Choose call type (Inbound, Outbound, Missed)
5. Enter duration in minutes
6. Add notes
7. Click **"Log Call"**

### Creating a Task
1. Click **"Tasks"** in navigation
2. Click **"New Task"** button
3. Add title and description
4. Set priority (Low, Medium, High, Urgent)
5. Set due date
6. Click **"Create Task"**
7. Mark complete when done

### Viewing Analytics
1. Click **"Analytics"** in navigation
2. See charts showing:
   - Customers by status (pie chart)
   - Calls this week (line chart)
   - Task completion percentage
   - Average call duration

### Exporting Data
1. Go to Customers, Calls, or Tasks page
2. Click **"Export CSV"** button
3. File downloads automatically
4. Open in Excel, Google Sheets, etc.

## 🔐 Security

- **Authentication**: Supabase Auth handles secure password storage and session management
- **Row-Level Security**: Each user only sees their own data
- **HTTPS**: All data encrypted in transit (when deployed)
- **No Passwords Stored**: Passwords are hashed by Supabase
- **Audit Logging**: All actions logged for compliance

## 📊 API Endpoints (Used Internally)

- `/api/auth/*` - Authentication (handled by Supabase)
- Direct database queries via Supabase client (no REST API needed)

## 🎨 Customization

### Change Colors
Edit `/app/globals.css` and update the CSS variables in `:root` section

### Add Custom Fields
1. Add column to Supabase table
2. Update TypeScript types in `lib/supabase.ts`
3. Update forms to include new field

### Add New Modules
1. Create new table in Supabase with RLS policies
2. Add API methods in `lib/api-client.ts`
3. Create page components in `app/dashboard/`

## 🚢 Deployment to Vercel

### Free Option (Recommended)

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial CRM commit"
git branch -M main
git remote add origin <your-github-repo>
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click **"Add New"** > **"Project"**
4. Select your GitHub repository
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your key
6. Click **"Deploy"**
7. Your app is live!

### Access Your Deployed App
- Vercel gives you a URL like: `https://crm-system-xyz.vercel.app`
- Use anywhere with any device

## 🐛 Troubleshooting

### "Database connection error"
- Check `.env.local` has correct Supabase URL and key
- Verify Supabase project is active
- Ensure SQL script ran successfully

### "Login not working"
- Check Supabase Auth is enabled
- Verify user was created in Supabase Auth > Users
- Clear browser cache and try again

### "Tables not found"
- Confirm `supabase-setup.sql` ran without errors
- Go to Supabase > Table Editor and verify tables exist
- Re-run the SQL script if needed

### "Port 3000 already in use"
```bash
# Use a different port
pnpm dev -- -p 3001
```

## 📈 Performance Tips

- Indexes are already optimized for common queries
- Images stored in Supabase Storage (not included, optional)
- Pagination built-in for large datasets
- Real-time subscriptions ready

## 💬 Support & Help

For Supabase issues: [supabase.com/support](https://supabase.com/support)
For Next.js questions: [nextjs.org/docs](https://nextjs.org/docs)
For this CRM: Check comments in code files

## 📝 License

This CRM system is provided as-is for your use. Modify and deploy freely!

## 🎓 Learning Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
- [React Documentation](https://react.dev)
- [Tailwind CSS Guide](https://tailwindcss.com/docs)

---

**You now have a fully functional, production-ready CRM system!**

Start by creating a customer, logging a call, and exploring the features. Enjoy! 🎉
