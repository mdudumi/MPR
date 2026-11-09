# Step 9 — Analytics validation matrix

| Excel sheet / item | Business meaning | Authoritative SaaS source | Analytics output | Aggregation | Status |
| --- | --- | --- | --- | --- | --- |
| Raw Data Production / Production Overview | Monthly oil actual and forecast | `production_monthly`, `production_plan_budget` | Oil production, actual vs plan, YTD and trend | Monthly value; YTD sum | Implemented |
| Health and Safety Summary | Monthly incident categories | `hse_monthly_incidents` | HSSC&E incident count | Sum of categories | Implemented |
| Security, Environmental, CR | Security incidents | `security_monthly_reports` | Security incident count | Monthly value | Implemented |
| Security, Environmental, CR | Environmental incidents | `environment_monthly_reports` | Environmental incident count | Monthly value | Implemented |
| Security, Environmental, CR | CSR grievances | `csr_grievances` | Grievance count | Count of monthly entries | Implemented |
| Inventory, Activities, Sales, PEP | Crude oil inventory | `crude_oil_inventory_monthly` | Closing crude inventory | Sum of current locations | Implemented |
| Inventory, Activities, Sales, PEP | Sales deliveries | `sales_delivery_reporting_monthly` | Sales deliveries | Sum of net oil Bbl | Implemented |
| Inventory, Activities, Sales, PEP | PEP | `pep_asp_reporting_monthly` | PEP quantity | Monthly quantity / historical sum | Implemented |
| Facilities | Civil, Mechanical, Electrical narratives | `facilities_monthly_reports` | Drill-down only | Not applicable | No project progress or delay fields exist in supplied workbook data |
| Drilling | Wells drilled, rig and depth | `drilling_wells` | Wells reported this month | Count of well rows | Implemented |

## Important limits

- The existing populated data covers only the reporting history that has been imported. A trend leaves unavailable months blank rather than showing zero.
- Facilities does not contain project, progress percentage, delay, or management-attention fields in the supplied workbook. The dashboard does not infer them from narratives.
- Drilling currently provides wells, rigs, dates and depths but does not have a separate approved delay/status field. The dashboard does not infer drilling delays.
- The Step 8 version table is prepared by migration `014`, but there is not yet a finalized structured snapshot to use for version-specific analytics. The dashboard therefore labels its figures **Live operational data**.
- The workbook has embedded charts on Production Overview and Drilling. The implemented production trend is the available historical equivalent; drilling trend requires additional historical well periods.
