-- These sections are owned by their future modules. Clear any statuses written
-- by the earlier Production completion bug so they do not appear completed.
update public.report_section_status rss
set status = 'NOT_STARTED', updated_at = now()
from public.report_sections rs
where rss.report_section_id = rs.id
  and rs.code in ('PROD_CRUDE_INVENTORY','PROD_WATER_INVENTORY','PROD_OPERATIONS','PROD_SALES','PROD_PEP_ASP')
  and rss.status in ('COMPLETED','REVIEWED');
