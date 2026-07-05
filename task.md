# Task Progress — Core Platform Fixes & Billing History

## Phase 1: SMTP Sender Configuration
- [x] Script to configure Supabase Auth SMTP using Resend credentials

## Phase 2: Onboarding Email Verification Screen
- [x] Register.tsx — Add check-email verification confirmation screen
- [x] Dashboard.tsx — Render newsletter prompt on first dashboard login post-verification

## Phase 3: Payment & Verification Card Fixes
- [x] UpgradePlan.tsx — Add "Complete Payment" action bypassing doc upload if verification is pending
- [x] VerificationsManager.tsx [NEW] — Admin panel to approve/reject user verification submissions
- [x] AdminDashboard.tsx — Register routes for `VerificationsManager`

## Phase 4: Scoping Dashboard Info
- [x] api.ts — Modify `fetchDashboardStats` and `fetchRecentActivity` to support `userId` scoping
- [x] DashboardHome.tsx — Pass `user.id` to statistics/activities queries if member, hide "Total Users" card

## Phase 5: Billing & Transactions History
- [x] PaymentsHistory.tsx [NEW] — Member-facing payments page under `/dashboard/payments`
- [x] FinanceManager.tsx [NEW] — Admin-facing finance transactions log page under `/fa-admin/finance`
- [x] Sidebar Navigation — Wire up billing history links in both dashboards

## Phase 6: Build Verification
- [x] `npm run build` compilation check
