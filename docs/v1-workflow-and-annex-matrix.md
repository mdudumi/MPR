# V1 workflow and Annex classification

## Simplified department completion workflow

`NOT_STARTED → IN_PROGRESS → COMPLETE → LOCKED`

`COMPLETE` replaces the former submit/review/return/approve steps. A completed section may be reopened before overall report finalization. Existing `reviewed_*` and `approved_*` database columns remain only as deprecated compatibility fields; the application no longer uses them.

## Workbook classification matrix

| Excel sheet | Section / purpose | Classification | Source module | PDF | Excel export | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Cover | Report identity | MAIN_REPORT | Report package | Yes | Summary | Cover metadata only |
| Contents | Report ordering | MAIN_REPORT | Central report configuration | Yes | Summary | Not separately entered |
| Health and Safety Summary | Incident overview, LTI, frequency, exposure | MAIN_REPORT | HSE | Yes | H&S | Calculated columns remain system-calculated |
| Health and Safety | Operations support, incidents, training, health | MAIN_REPORT | HSE | Yes | H&S | Narrative operating report |
| Security, Environmental, CR | Security, Environmental and CSR reporting | MAIN_REPORT | Security / Environment / CSR | Yes | Domain sheets | Contains narrative and structured data |
| Production Overview | Production summary and chart | MAIN_REPORT | Production | Yes | Production | Uses authoritative monthly figures and plan |
| Inventory, Activities, Sales, PEP | Inventory, operations, sales, PEP | MAIN_REPORT | Production | Yes | Inv-Sales-PEP | Distinct business sections, not one generic table |
| Facilities | Civil, Mechanical, Electrical narratives | MAIN_REPORT | Facilities | Yes | Facilities | No project status/progress table exists in supplied workbook |
| Drilling | Drilling program, wells and drill times | MAIN_REPORT | Drilling | Yes | Drilling | Detailed wells also support Annex D |
| Raw Data Production | Historic production/calculation source | RAW_DATA | Production history import | No | Not automatically | Not an official Annex without a specific business decision |
| Blank helper sheets (`Sheet1`, `Sheet2` …) | Empty/supporting workbook artifacts | INTERNAL_ONLY | None | No | No | Not report content |

## V1 Annex definitions

| Annex | Title | Source | Required | Purpose |
| --- | --- | --- | --- | --- |
| A | HSSC&E Incident Details | HSE incident detail records | Optional | Supporting incident detail when reported |
| B | Environmental Ecopit Monthly Quantities | Environment Ecopit values | Optional | Waste quantities in m³ |
| C | CSR Grievance Register | CSR grievances | Optional | Detailed monthly grievance register |
| D | Drilling Well Details | Drilling wells | Optional | Wells, rig, coordinates and final depth |

The supplied workbook does not contain separately identified Annex worksheets for detailed well production, water-source wells, polymer injectors, waterflood injectors, or water disposals. Those remain unimplemented source-data requirements, not automatically fabricated Annexes.
