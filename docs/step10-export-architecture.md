# Step 10 — Report output and export architecture

## Implemented working exports

The Monthly Progress Report page exports the already-composed working report model as:

- `Monthly_Progress_Report_YYYY-MM_DRAFT.pdf`
- `Monthly_Progress_Report_YYYY-MM_DRAFT.xlsx`

Historical Analysis exports the selected metric/range as a structured Excel workbook. The PDF and Excel libraries are dynamically loaded only when a user requests an export.

The working PDF uses real text and vector table content through jsPDF. It is not a screenshot or browser-print capture. The workbook uses numeric cells for operational quantities and preserves a separate unit column or unit-bearing heading.

## Official exports

Official final-version export is intentionally not enabled in the browser. It requires:

1. An immutable finalized snapshot created by the Step 8 finalization service.
2. A trusted server-side/Edge Function renderer that reads that snapshot.
3. Private Supabase Storage upload and signed download URLs.
4. Export metadata and audit logging.

Migration `202609160015_step10_export_metadata.sql` adds the private `monthly-reports` bucket and metadata table needed for this. It must be applied only after migration `014` because it references `monthly_report_versions`.

The intended official path is:

`finalized report version → immutable snapshot → trusted renderer → private Storage → export metadata → signed download`

No official PDF or Excel may be generated from revised live tables.

## Known limits in the current working export

- It contains the report sections and source data currently supported by the consolidated report: HSSC&E incident overview, Production figures, Inventory/Sales/PEP summary, Facilities narratives, and Drilling wells.
- Data fields not yet in the workbook-backed source model, such as Facilities progress/project status or Drilling delay status, are not invented.
- Official version selection, stored exports, export permissions beyond existing RLS, and version-aware snapshot downloads await the trusted backend renderer and actual finalization flow.
- Generated working exports are downloaded locally and are not stored in Supabase.
