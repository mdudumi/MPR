# Step 3 Excel-to-SaaS validation matrix

The source workbook is `Monthly Progress Report May 2025.xlsx`. This matrix covers only the four Step 3 reporting areas. Supporting calculation sheets remain non-user-facing sources.

| Excel section | Excel field / concept | Database table / field | SaaS screen | Editable / calculated | Calculation / source | Status |
|---|---|---|---|---|---|---|
| Health and Safety Summary | Incident categories | `hse_incident_types`, `hse_monthly_incidents.incident_count` | Health & Safety → HSSC&E Summary | This Month editable | Lookup-controlled business categories | Implemented |
| Health and Safety Summary | Last Month | No stored aggregate | HSSC&E Summary | Calculated | Previous stored reporting period | Implemented |
| Health and Safety Summary | Year to Date | No stored aggregate | HSSC&E Summary | Calculated | January through selected month | Implemented |
| Health and Safety Summary | Inception to Date | `hse_incident_types.inception_baseline` + monthly data | HSSC&E Summary | Calculated | Baseline plus system values | Implemented |
| Health and Safety Summary | Totals / Total Recordable | No stored aggregate | HSSC&E Summary | Calculated | Incident category sums | Implemented; Total Recordable classification awaits HSE sign-off |
| Health and Safety Summary | Lost Time Incidents | `hse_monthly_incidents` Bankers / Contractor LTI | HSSC&E Summary | Calculated | References source incident counts | Implemented |
| Health and Safety Summary | Exposure Hours | `hse_exposure_hours` | HSSC&E Summary | This Month editable | Bankers + Contractor totals | Implemented |
| Health and Safety Summary | LTI Frequency | No stored aggregate | HSSC&E Summary | Calculated | LTI × 1,000,000 ÷ exposure hours | Implemented and validated against May 2025 ITD values |
| Health and Safety | Operations Support | `hse_narratives` | Health & Safety workspace | Editable | Formatted monthly narrative | Implemented |
| Health and Safety | Incident Investigations / Incident Breakdown / Brief Description | `hse_narratives`, `hse_incident_details` | Health & Safety workspace | Editable | Narrative and optional supporting records | Implemented; count reconciliation warning still pending |
| Health and Safety | H&S Training / Health | `hse_narratives` | Health & Safety workspace | Editable | Formatted monthly narrative | Implemented |
| Security | Operations Support / Security Incidents / Incidents of High Importance | `security_monthly_reports` narrative fields | Security | Editable | Formatted monthly narrative | Implemented |
| Security | Incident count, patrol checks, dispatches, checks, investigations, static sites | `security_monthly_reports` numeric fields | Security | This Month editable; history calculated | Previous stored periods / YTD | Implemented |
| Security | Security incident details | `security_incident_details` | Security | Editable | Monthly supporting records | Implemented |
| Environment | Environmental incident count / details | `environment_monthly_reports`, `environment_incident_details` | Environment | This Month editable; history calculated | Previous stored periods / YTD | Implemented |
| Environment | Operations Support / Incidents Breakdown / Monitoring Program | `environment_monthly_reports` narrative fields | Environment | Editable | Formatted monthly narrative | Implemented |
| Environment | Ecopit quantities and waste materials | `environment_ecopit_monthly_values` | Environment → Ecopit Monthly Quantities | This Month editable; history calculated | m³ by Ecopit/location and material | Implemented |
| CSR | Social Infrastructure Projects | `csr_social_infrastructure_projects`, `csr_monthly_reports` | CSR | Editable | Monthly project rows and narrative | Implemented |
| CSR | Other Activities | `csr_other_activities`, `csr_monthly_reports` | CSR | Editable | Monthly activity rows and narrative | Implemented |
| CSR | Grievances: Date, Project Activity, Category, Status, Valid / Not Valid | `csr_grievances` | CSR → Grievances | Editable while draft/returned | Monthly grievance records | Implemented |

## Explicitly not implemented in Step 3

- Production, Inventory/Sales/PEP, Facilities, Drilling, annexes, PDF/Excel output, notifications, AI narrative, advanced analytics, and historical workbook imports.
- Full formula reconciliation between HSE summary and supporting incident-detail rows. The screen preserves both and does not silently alter reported values.
- Workbook-specific structured H&S training rows, detailed security classifications, environmental-monitoring activity rows, and any fields not visible in the supplied workbook sections. These require report-owner confirmation before adding mandatory fields.
