# CRM System - Quick Start Guide

## ⚡ Get Running in 5 Minutes

### Step 1: Create Supabase Project (1 min)
- Go to https://supabase.com
- Click "New Project"
- Fill in project name, database password, select region
- Wait for setup to complete

### Step 2: Get API Keys (1 min)
- In Supabase, click "Settings" → "API"
- Copy `NEXT_PUBLIC_SUPABASE_URL`
- Copy `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 3: Create Database (1 min)
- In Supabase, click "SQL Editor"
- Click "New Query"
- Open `supabase-setup.sql` file from this project
- Copy entire contents and paste into SQL Editor
- Click "Run"
- Wait for completion (tables will be created)

### Step 4: Set Environment Variables (30 sec)
Create file `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### Step 5: Start App (30 sec)
```bash
pnpm install
pnpm dev
```
Open http://localhost:3000

### Step 6: Create Account (30 sec)
- Click "Sign up"
- Enter email, password, name
- Click "Create Account"
- Login with your credentials
- You're in!

## 🎯 What to Do First

### Create a Customer
1. Click "Customers" tab
2. Click "Add Customer" button
3. Enter name (required), email, phone
4. Pick status (Lead/Prospect/Qualified/Customer)
5. Click "Create Customer"

### Log a Call
1. Click "Calls" tab
2. Click "Log Call" button
3. Select customer
4. Pick call type (Inbound/Outbound/Missed)
5. Enter duration
6. Add notes
7. Click "Log Call"

### Create a Task
1. Click "Tasks" tab
2. Click "New Task" button
3. Enter title
4. Set priority
5. Set due date
6. Click "Create Task"

### View Analytics
1. Click "Analytics" tab
2. See customer breakdown chart
3. See calls this week chart
4. See task completion %

### Export Data
1. Go to any list (Customers/Calls/Tasks)
2. Click "Export CSV" button
3. File downloads automatically

## 📱 Navigation

### Mobile (Bottom Tabs)
- Home - Dashboard
- Customers - Customer list
- Calls - Call logs
- Follow-ups - Follow-ups
- Tasks - Task list
- Analytics - Charts

### Desktop (Left Sidebar)
- Dashboard
- Customers
- Calls
- Follow-ups
- Tasks
- Analytics
- Settings

## 🔑 Credentials to Remember
- Supabase URL: `your_supabase_project.supabase.co`
- Supabase Key: `ey...` (long alphanumeric string)
- Your Login Email: Whatever you signed up with

## 🚢 Deploy to Live (5 minutes)

### Option 1: Vercel (Recommended)
```bash
git init
git add .
git commit -m "CRM System"
git push origin main
```
1. Go to vercel.com
2. Import your GitHub repo
3. Add environment variables
4. Click Deploy
5. Your CRM is live!

### Option 2: Any Hosting
```bash
pnpm build
pnpm start
```
Deploy the `.next` folder to any Node.js hosting

## 💡 Tips

- **Search**: Use search bar to find customers
- **Filter**: Click status dropdown to filter
- **Export**: Export to Excel anytime
- **Mobile**: Works great on phone too
- **Multiple Users**: Each user only sees their own data
- **Backup**: Supabase automatically backs up your data

## ❓ Common Issues

**"Can't connect to database"**
- Check .env.local has correct values
- Verify tables exist in Supabase SQL Editor

**"Can't login"**
- Check email exists in Supabase Auth > Users
- Clear browser cache and try again

**"Tables don't exist"**
- Run supabase-setup.sql again in Supabase

**"Port 3000 in use"**
- Run: `pnpm dev -- -p 3001`

## 📚 Full Documentation

- See `README.md` for complete feature list
- See `SETUP.md` for detailed setup guide
- Check code comments for implementation details

## 🎉 You're Ready!

You now have a complete CRM system with:
✅ Customer management
✅ Call logging
✅ Follow-ups & tasks
✅ Analytics
✅ User authentication
✅ CSV export
✅ Mobile & desktop
✅ Zero costs

**Start by creating your first customer!**
