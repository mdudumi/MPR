-- Step 10: metadata for trusted server-side exports. The browser never writes official files directly.
create type public.report_export_source as enum ('WORKING_REPORT', 'FINALIZED_VERSION');
create type public.report_export_format as enum ('PDF', 'XLSX');
create type public.report_export_status as enum ('REQUESTED', 'GENERATING', 'READY', 'FAILED');

create table public.monthly_report_exports (
  id uuid primary key default gen_random_uuid(),
  reporting_period_id uuid not null references public.reporting_periods(id) on delete restrict,
  report_version_id uuid references public.monthly_report_versions(id) on delete restrict,
  source_type public.report_export_source not null,
  format public.report_export_format not null,
  status public.report_export_status not null default 'REQUESTED',
  storage_path text,
  file_name text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  checksum_sha256 text,
  error_message text,
  generated_at timestamptz,
  generated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check ((source_type = 'WORKING_REPORT' and report_version_id is null) or (source_type = 'FINALIZED_VERSION' and report_version_id is not null)),
  check ((status = 'READY' and storage_path is not null and file_name is not null) or status <> 'READY')
);
create index monthly_report_exports_version_idx on public.monthly_report_exports(report_version_id, format, status);
alter table public.monthly_report_exports enable row level security;
create policy "exports reporting managers read" on public.monthly_report_exports for select using (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER'));
create policy "exports reporting managers manage" on public.monthly_report_exports for all using (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER')) with check (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER'));

-- Private by default. A future trusted Edge Function creates files and signed URLs.
insert into storage.buckets (id, name, public) values ('monthly-reports', 'monthly-reports', false) on conflict (id) do update set public = false;
create policy "monthly report storage select" on storage.objects for select using (bucket_id = 'monthly-reports' and (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER')));
create policy "monthly report storage service write" on storage.objects for insert with check (bucket_id = 'monthly-reports' and (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER')));
