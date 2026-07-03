# Setup & Deployment Guide

This guide details the environment variables, integration configurations, and deployment steps required to run the production features of the Faith Amplifiers web application.

---

## 1. Environment Variables

Create or update the `.env` file in the root of your project:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Paystack Configuration
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
```

> [!IMPORTANT]
> When deploying to production (e.g. Vercel), remember to add these variables to your hosting environment settings.

---

## 2. Supabase Edge Functions Deployment

The application features two serverless Deno Edge Functions for email dispatch via Resend:
1. `send-contact-email` (Phase 3)
2. `send-booking-notification` (Phase 5)

### Prerequisites
1. Sign up for an account at [Resend](https://resend.com) and generate an API key.
2. Ensure you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed and linked to your project.

### Step-by-Step Deployment
1. Set the Resend API key in your Supabase remote secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_api_key_here
   ```
2. Deploy the functions to the remote Supabase project:
   ```bash
   supabase functions deploy send-contact-email
   supabase functions deploy send-booking-notification
   ```

---

## 3. Paystack Setup

We support a 3-tier membership structure. The **Event & Services Privilege** tier requires a one-time fee of ₦5,000 processed securely via Paystack.

1. Sign up at [Paystack](https://paystack.com).
2. Retrieve your **Test / Live Public Key** from the dashboard (Settings > API Keys & Webhooks).
3. Set the key in `VITE_PAYSTACK_PUBLIC_KEY` in your environment variables.
4. We load Paystack inline javascript dynamically. No extra npm modules are required.

---

## 4. Supabase Auth Redirect URLs

To support dynamic domain migration (e.g. moving from `https://faithamplifiers.vercel.app` to a custom domain), the frontend code resolves redirect paths dynamically using `window.location.origin`.

To allow this, you MUST register the corresponding callback paths in your Supabase Dashboard:

1. Go to **Supabase Dashboard** > **Authentication** > **URL Configuration**.
2. Set **Site URL** to your main production domain (e.g. `https://faithamplifiers.vercel.app`).
3. Under **Redirect URLs**, add:
   - `http://localhost:5173/auth/callback` (Local Development)
   - `http://localhost:5173/verify-email` (Local Development)
   - `https://faithamplifiers.vercel.app/auth/callback` (Production)
   - `https://faithamplifiers.vercel.app/verify-email` (Production)

> [!TIP]
> When migrating to a custom domain in the future, simply update the **Site URL** and **Redirect URLs** in the Supabase URL Configuration. No code modifications are needed!
