# COLLECTIBLE TRACKER — COMPLETE SETUP GUIDE
# From zero to live, starting from an iPhone, for free.

---

## Before you begin

You need:
- An iPhone (or any phone/computer with a web browser)
- An email address
- About 45 minutes

You do NOT need:
- A computer
- Coding experience
- A credit card
- Any paid accounts

---

## OVERVIEW — What you are creating

You are setting up four free accounts that work together:

1. GitHub   — stores your app code (like Google Drive, but for code)
2. Supabase — your app's database (stores users, products, alerts)
3. Vercel   — hosts your website (makes it live on the internet)
4. Resend   — sends alert emails (100 per day free)

The whole thing costs £0 to run for testing.

---

## STEP 1 — Create a GitHub account

GitHub is where your code lives. It is free.

1. Open your browser and go to: https://github.com
2. Tap "Sign up"
3. Enter your email address, create a password, choose a username
4. Verify your email when GitHub sends you a confirmation
5. You now have a GitHub account ✓

---

## STEP 2 — Upload the project to GitHub

You have downloaded the project as a zip file (collectible-tracker-v3.zip).
You need to get it into GitHub.

### Option A — Using GitHub's website (easiest, no computer needed)

1. Log in to github.com
2. Tap the "+" button in the top right corner
3. Tap "New repository"
4. Fill in:
   - Repository name: collectible-tracker
   - Description: My collectible tracker app
   - Keep "Public" selected (needed for free Vercel deployment)
   - Tick "Add a README file"
5. Tap "Create repository"

Now upload your files:
6. Tap "uploading an existing file" (the link in the middle of the page)
7. You need to upload the files from inside the zip file.

   On iPhone:
   - Open the Files app
   - Find the downloaded zip file (usually in Downloads)
   - Tap and hold it → tap "Uncompress"
   - A new folder called collectible-tracker-v3 appears
   - Go back to GitHub in your browser
   - Tap "choose your files"
   - Navigate to the uncompressed folder
   - Select ALL files and folders inside it

   IMPORTANT: Upload the files INSIDE the folder, not the folder itself.
   GitHub should show dozens of files like package.json, src/, public/, etc.

8. Scroll down, tap "Commit changes"
9. Your code is now on GitHub ✓

### Option B — GitHub Desktop (if you have a Mac or Windows computer)

1. Download GitHub Desktop from: https://desktop.github.com
2. Sign in with your GitHub account
3. File → New Repository → call it "collectible-tracker"
4. Click "Create Repository"
5. Open the repo folder in Finder / Explorer
6. Copy all files from the unzipped collectible-tracker-v3 folder into it
7. In GitHub Desktop, tap "Commit to main", then "Push origin"

---

## STEP 3 — Create a Supabase account and project

Supabase stores all your data. It is free for small projects.

1. Go to: https://supabase.com
2. Tap "Start your project"
3. Sign up with your GitHub account (easiest) or email
4. Tap "New project"
5. Fill in:
   - Name: collectible-tracker
   - Database Password: tap "Generate a password", then COPY and SAVE it somewhere
     (you will not need this often, but keep it safe)
   - Region: West EU (Ireland) — closest to UK
6. Tap "Create new project"
7. Wait about 2 minutes while it sets up (shows a loading screen)

---

## STEP 4 — Set up the database

This creates all the tables your app needs.

### Part 1 — Run the main schema

1. In Supabase, tap "SQL Editor" in the left sidebar
2. Tap "New query"
3. Go back to your GitHub repository (github.com → your account → collectible-tracker)
4. Find the file called "supabase-schema.sql"
5. Tap on it to open it
6. Tap the "Raw" button (top right of the file view)
7. Select all the text (tap, hold, "Select All"), copy it
8. Go back to Supabase SQL Editor
9. Delete any text already in the box, paste your copied text
10. Tap the green "Run" button
11. You should see: "Success. No rows returned" ✓

### Part 2 — Run the founder access schema

1. Still in Supabase SQL Editor, tap "New query" again
2. Go back to GitHub, find "supabase-founder.sql"
3. Tap "Raw", copy all the text
4. Paste it into the SQL Editor
5. Tap "Run"
6. You should see: "Success. No rows returned" ✓

---

## STEP 5 — Get your Supabase secret keys

Your app needs these to connect to the database.

1. In Supabase, tap the cog icon ⚙️ (Settings) in the left sidebar
2. Tap "API"
3. You will see three important values. Copy each one carefully:

   a) PROJECT URL
      Looks like: https://abcdefghijklm.supabase.co
      (under "Project URL")

   b) ANON KEY (public)
      A very long string starting with "eyJ..."
      (under "Project API keys" → "anon public")

   c) SERVICE ROLE KEY (secret)
      Another very long string starting with "eyJ..."
      (under "Project API keys" → "service_role")
      ⚠️ Keep this secret. Never share it or post it anywhere.

Save all three somewhere safe (Apple Notes works fine).

---

## STEP 6 — Create a Resend account (free email alerts)

1. Go to: https://resend.com
2. Tap "Get started for free"
3. Sign up — no credit card needed
4. After signing in, tap "API Keys" in the left sidebar
5. Tap "Create API Key"
6. Name: collectible-tracker
7. Tap "Add"
8. Your key appears ONCE — it starts with "re_"
9. Copy it immediately and save it ✓

For "from" email: use onboarding@resend.dev on the free plan.
This means your alert emails say "from: onboarding@resend.dev".
You can change this later with a custom domain.

---

## STEP 7 — Create a Vercel account and deploy

Vercel hosts your website. It is free.

1. Go to: https://vercel.com
2. Tap "Sign up"
3. Choose "Continue with GitHub"
4. Authorise Vercel to access your GitHub

Now deploy your app:
5. Tap "Add New" → "Project"
6. Find "collectible-tracker" in the list and tap "Import"
7. Leave all settings as they are
8. DO NOT tap Deploy yet — you need to add your environment variables first

Adding environment variables:
9. Scroll down to the "Environment Variables" section
10. Add each variable below, one at a time:
    - Tap the Key field, type the name
    - Tap the Value field, paste your value
    - Tap "Add"

Here are the variables to add:

REQUIRED (your app will not work without these):

  Key: NEXT_PUBLIC_SUPABASE_URL
  Value: [your Supabase project URL from Step 5a]

  Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
  Value: [your Supabase anon key from Step 5b]

  Key: SUPABASE_SERVICE_ROLE_KEY
  Value: [your Supabase service role key from Step 5c]

  Key: NEXT_PUBLIC_APP_URL
  Value: https://collectible-tracker.vercel.app
  (you will update this with your actual URL after first deploy)

  Key: NEXT_PUBLIC_APP_NAME
  Value: Collectible Tracker

  Key: CRON_SECRET
  Value: [make up any long random string, e.g. xK9mP2qR7vL4nJ8wA3dF6hB5]

  Key: FOUNDER_EMAIL
  Value: [your email address]

  Key: ADMIN_EMAIL
  Value: [your email address]

OPTIONAL (add these for email alerts — recommended):

  Key: RESEND_API_KEY
  Value: [your Resend API key from Step 6]

  Key: RESEND_FROM_EMAIL
  Value: onboarding@resend.dev

  Key: RESEND_FROM_NAME
  Value: Collectible Tracker

OPTIONAL (leave blank for now — add later):

  NEXT_PUBLIC_VAPID_PUBLIC_KEY  (push notifications)
  VAPID_PRIVATE_KEY             (push notifications)
  VAPID_SUBJECT                 (push notifications)
  TWILIO_ACCOUNT_SID            (SMS — costs money)
  TWILIO_AUTH_TOKEN             (SMS — costs money)
  TWILIO_FROM_NUMBER            (SMS — costs money)
  STRIPE_SECRET_KEY             (paid subscriptions — skip for testing)
  STRIPE_PUBLISHABLE_KEY        (paid subscriptions — skip for testing)

11. After adding all required variables, tap "Deploy"
12. Vercel will build and deploy your app — takes about 2 minutes
13. When it says "Congratulations!" you have a live URL like:
    https://collectible-tracker-yourname.vercel.app ✓

---

## STEP 8 — Update your app URL

After your first deploy, you know your actual URL. Update it:

1. In Vercel, go to your project
2. Tap "Settings" → "Environment Variables"
3. Find NEXT_PUBLIC_APP_URL and tap Edit
4. Update the value to your actual Vercel URL
5. Tap Save
6. Go to "Deployments" and tap "Redeploy" on the latest deployment

---

## STEP 9 — Create your founder account

Your founder account gets permanent access to all premium features.

1. Go to your live app URL
2. Tap "Start for free" and create an account using your FOUNDER_EMAIL address
3. Confirm your email (check your inbox)
4. Log in

Now give yourself admin and founder access:
5. Go to: https://supabase.com → your project → SQL Editor → New query
6. Paste this (replacing the email with yours):

   update public.profiles
   set role = 'super_admin', subscription_tier = 'founder'
   where email = 'your@email.com';

7. Tap Run
8. You should see: "1 row updated" ✓

9. Refresh your app — you should now see "Admin" in the sidebar
10. Go to Admin — you will see the full admin panel with all features ✓

---

## STEP 10 — Test that everything works

Work through this checklist:

□ Can you log in?
  → Go to your app URL, tap "Sign in", enter your email and password

□ Do you see the dashboard?
  → After logging in, you should see the main dashboard

□ Do you see "Admin" in the sidebar?
  → If not, re-run the SQL from Step 9

□ Can you search for a product?
  → Tap "Explore" and search for "Prismatic Evolutions ETB"

□ Can you add something to your watchlist?
  → On a product page, tap "Track this product"

□ Can you run a manual stock check?
  → Go to Admin → tap "Run stock check now"

□ Does the market page load?
  → Tap "Market" in the sidebar

□ Does the collection page load?
  → Tap "Collection" in the sidebar

□ Does the portfolio page load? (founder access required)
  → Tap "Portfolio" in the sidebar

If any of these fail, see the Troubleshooting section below.

---

## STEP 11 — Add your first product URL

Stock checking only works when you have added direct product page URLs.
Here is how to add one as a test:

1. Go to Supabase → SQL Editor → New query
2. Paste this (it adds the Prismatic Evolutions ETB from Magic Madhouse):

INSERT INTO public.retailer_products (product_id, retailer_id, product_url, check_tier)
SELECT
  p.id,
  r.id,
  'https://www.magicmadhouse.co.uk/products/pokemon-prismatic-evolutions-elite-trainer-box',
  'high'
FROM public.products p
CROSS JOIN public.retailers r
WHERE p.slug = 'pe-etb'
  AND r.slug = 'magic-madhouse'
ON CONFLICT (product_id, retailer_id) DO NOTHING;

3. Tap Run
4. Go back to your app → Admin → "Run stock check now"
5. After a few seconds, check the product page for Prismatic Evolutions ETB
   — you should see the current stock status and price ✓

---

## FREE TIER LIMITATIONS

| Feature                    | Free tier | Notes                                              |
|----------------------------|-----------|----------------------------------------------------|
| GitHub storage             | 1GB       | More than enough                                   |
| Supabase database          | 500MB     | Enough for thousands of users and months of data   |
| Supabase API calls         | 2 million/month | More than enough for testing              |
| Vercel deployments         | Unlimited | Free forever                                       |
| Vercel cron jobs           | 1 job max | Runs hourly (every 60 min) on free tier            |
| Vercel function duration   | 10 seconds| Upgraded to 60s in the code                       |
| Vercel bandwidth           | 100GB/mo  | More than enough                                   |
| Resend emails              | 100/day   | Enough for testing                                 |
| Push notifications         | Unlimited | Free via web-push (VAPID keys)                     |
| SMS alerts (Twilio)        | Not free  | ~£0.04 per SMS — skip for now                     |
| Stripe billing             | Not needed| No billing system needed until you charge users    |
| Stock check frequency      | Hourly    | Manual checks available anytime via Admin panel    |
| User accounts              | Unlimited | No limits on Supabase free tier                    |
| Products in database       | Unlimited | 500MB database limit applies                       |

IMPORTANT NOTE ON CRON JOBS:
- Vercel Free allows only 1 cron job
- The cron job is set to run once per hour
- This means stock is checked automatically every 60 minutes
- For more frequent checks during testing, use Admin → "Run stock check now"
- If you upgrade to Vercel Pro ($20/month), you can check every 2 minutes

---

## TROUBLESHOOTING

PROBLEM: "Error: Invalid API key" or database connection error
SOLUTION: Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
          are exactly right in your Vercel environment variables.
          There should be no spaces before or after the values.

PROBLEM: The app deploys but shows a blank white page
SOLUTION: Go to Vercel → your project → "Functions" tab → look for error messages.
          Usually means a missing environment variable.

PROBLEM: I cannot see the Admin menu
SOLUTION: Make sure you ran the SQL in Step 9 and it said "1 row updated".
          Also make sure you are logged in with your FOUNDER_EMAIL address.

PROBLEM: Stock checks run but show "unknown" status
SOLUTION: The retailer URL might be blocking automated requests.
          Try a different retailer or add a note in the Admin panel.

PROBLEM: Emails are not being sent
SOLUTION: On Resend free tier, you can only send to your own email address.
          To send to other emails, you need to verify a domain (free but needs DNS access).

PROBLEM: "Build failed" error on Vercel
SOLUTION: Usually a missing environment variable. Check all required variables are set.

---

## ADDING MORE PRODUCTS (QUICK REFERENCE)

To add more product URLs, use this SQL template in Supabase:

INSERT INTO public.retailer_products (product_id, retailer_id, product_url, check_tier)
SELECT p.id, r.id, 'PASTE_PRODUCT_URL_HERE', 'high'
FROM public.products p CROSS JOIN public.retailers r
WHERE p.slug = 'PRODUCT_SLUG' AND r.slug = 'RETAILER_SLUG'
ON CONFLICT DO NOTHING;

Find product slugs: go to app → Explore → click a product → the URL shows the slug
Find retailer slugs: go to Admin → check the Retailer Health table

Example retailer slugs:
  smyths, argos, game, amazon-uk, pokemon-center
  magic-madhouse, total-cards, chaos-cards, zatu

---

## NEXT STEPS AFTER TESTING

Once you have confirmed everything works:

1. PUSH NOTIFICATIONS (free):
   - Run: npx web-push generate-vapid-keys (needs a computer)
   - Add the keys to Vercel environment variables
   - Users can then receive instant alerts when something restocks

2. MORE FREQUENT CHECKS ($20/month — Vercel Pro):
   - Upgrade Vercel to Pro
   - The cron schedule in vercel.json will automatically switch to every 2 minutes

3. SMS ALERTS (~£0.04/SMS — Twilio):
   - Create a Twilio account
   - Add the credentials to Vercel environment variables
   - Premium users can enable SMS in Settings

4. CUSTOM DOMAIN:
   - In Vercel → Settings → Domains → add your domain
   - Update NEXT_PUBLIC_APP_URL to your custom domain
   - Also update it in Supabase → Authentication → URL Configuration

5. STRIPE BILLING (when you want to charge users):
   - Create a Stripe account
   - Add keys to Vercel environment variables
   - Until then, use invite codes to grant premium access manually

---

## DEPLOYMENT READINESS SCORE: 8/10

WORKS FULLY ON FREE TIERS:
✓ User accounts and login
✓ Product search and database (21 Pokémon products pre-loaded)
✓ Watchlist (10 items on free tier)
✓ Collection management
✓ Market intelligence dashboard
✓ Release calendar
✓ Stock checking (hourly automatic + unlimited manual)
✓ Email alerts (100/day free via Resend)
✓ Admin panel with full user management
✓ Invite codes for granting premium access
✓ Founder account with all premium features
✓ In-app notifications
✓ Price history
✓ Portfolio tracking (available to founder)
✓ Dark/light mode

NEEDS ADDITIONAL SETUP (but app still works without):
⚠ Push notifications — needs VAPID keys (free but needs terminal command)
⚠ More frequent stock checks — needs Vercel Pro ($20/month)

NOT INCLUDED (optional paid features):
✗ SMS alerts — needs Twilio (~£0.04/SMS)
✗ Paid subscriptions — needs Stripe (only needed if charging users)
✗ Custom domain — optional, your Vercel URL works fine

EXACT SETUP ORDER:
1. GitHub — create account, upload project (Step 1-2)
2. Supabase — create project, run both SQL files (Step 3-5)
3. Resend — create account, get API key (Step 6)
4. Vercel — create account, import from GitHub, add env vars, deploy (Step 7-8)
5. Founder setup — run SQL to make yourself admin (Step 9)
6. Test (Step 10)
7. Add first product URL (Step 11)

MINIMUM REQUIRED ENVIRONMENT VARIABLES (6 variables):
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  NEXT_PUBLIC_APP_URL
  CRON_SECRET
  FOUNDER_EMAIL

The app will start and work with just these 6 variables.
Everything else (email, push, SMS) is optional and can be added later.
