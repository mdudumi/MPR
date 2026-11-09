# Monthly Progress Report SaaS

Step 1 foundation for the Patos-Marinza Development Project Monthly Progress Report. The application deliberately retains the workbook's familiar report hierarchy rather than replacing it with generic operational forms.

## Included in this foundation

- React, TypeScript, Vite, Tailwind-ready CSS, and Supabase client setup.
- Email/password authentication through Supabase Auth.
- A report-first shell with dark navigation, reporting-month context, dashboard, official report overview, and placeholder routes matching the existing report structure.
- Reporting periods and report-section readiness/status tracking.
- Supabase migration for profiles, roles, reporting periods, report sections, status records, audit fields, and Row Level Security.
- A safe `Create reporting month` function that only creates report/status structure. It does not copy monthly numeric data.

## Setup

1. Copy `.env.example` to `.env.local`. The supplied URL and publishable key are already safe for frontend use. Do not add a service-role key.
   GitHub stores the source code only; it does not provide these runtime variables. For a hosted build, add the same two variables in the hosting provider's project settings, then redeploy.
2. In the Supabase SQL editor, run every migration in numeric order, from `202609160001_foundation.sql` through `202609160007_import_may_2025_production.sql`. Migration 006 creates the Production workspace schema and security policies. Migration 007 imports the workbook-sourced January–May 2025 production figures needed for May comparisons and YTD.
3. Create an Auth user in Supabase. The database trigger creates its profile and grants `VIEWER` by default.
4. Promote the first administrator in the SQL editor:

   ```sql
   insert into public.user_roles (user_id, role)
   values ('AUTH_USER_UUID', 'ADMIN')
   on conflict do nothing;
   ```

5. Install packages and start the app:

   ```bash
   pnpm install
   pnpm dev
   ```

## Role model

`ADMIN` administers users, roles, section definitions, and periods. `REPORTING_MANAGER` has cross-report visibility and can create reporting periods. `DEPARTMENT_MANAGER` and `CONTRIBUTOR` work only in assigned departments. `VIEWER` can see permitted report information. `DEPARTMENT_EDITOR` remains supported as a legacy compatibility role from the first migration.

## Production module

Production is an active monthly workspace. It preserves the workbook’s Net Oil (tonne, m³, bbl), Water (m³), Sand (m³), Gas (Nm³), and Days on Production rows, with read-only previous-month and YTD values. The Raw Data Production table is a dedicated monthly historical import source; its workbook calculations for average daily production, cumulative oil, forecast comparison, and previous-month comparison are calculated in the application rather than typed by users.

## Step 3 modules

Health & Safety, Security, Environment, and CSR are active monthly workspaces. Each is controlled by the global reporting month, has an explicit save strategy, and respects finalized/closed period states. The Step 3 schema adds submission transitions, supporting incident records, environmental Ecopit quantities, CSR projects/activities, and grievances. Review the full workbook mapping and outstanding gaps in `docs/step3-validation-matrix.md`.

Run calculation checks with `node --test tests/*.test.mjs`.
