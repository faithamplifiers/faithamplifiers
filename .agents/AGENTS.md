# Workspace Rules & Conventions

## 1. Domain Guidelines

- **Current Live Domain**: `https://faithamplifiers.vercel.app`
- **Dynamic Domain Handling**: All redirects, URLs, and callbacks MUST be resolved dynamically (e.g. using `window.location.origin` or request headers) rather than hardcoded. This ensures that when the site transitions to a custom domain in the future, all authentication flows, Paystack checkouts, and email links will continue working without modifying the codebase.
- **Hardcoding Avoidance**: Never hardcode production links. Use relative paths or dynamic host resolution.

---

## 2. Supabase Integration Rules

- **Database Alterations (DDL)**: Use the remote `supabase` MCP server with SQL statements rather than the local `supabase-mcp-server` to execute database schema alterations (to prevent privilege errors).
- **Edge Functions**: Edge Functions are deployed remotely using the Supabase CLI (`supabase functions deploy`). Resend keys are configured via remote secrets (`supabase secrets set`).
- **Row Level Security (RLS)**: Every new table MUST have RLS enabled, and explicit select/insert/update/delete policies configured for public access, authenticated access, or administrator access.

---

## 3. Web App Development

- **Design System**: Use vanilla CSS in `src/index.css` paired with Tailwind CSS utilities. Focus on premium gradients, smooth hover animations, and cohesive dark/light transitions.
- **Component Libraries**: Leverage `lucide-react` for modern icon components and `react-hot-toast` for notifications.
