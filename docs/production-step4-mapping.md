# Production: workbook-to-SaaS mapping

| Excel sheet / section | Workbook field | Unit | SaaS table / field | Screen | Entry method | Calculation / note |
|---|---|---:|---|---|---|---|
| Production Overview, 2.2 Production 2025 Figures | Net Oil | tonne | `production_monthly.net_oil_tonne` | Production Figures | Manual or imported | Monthly official value |
| Production Overview, 2.2 Production 2025 Figures | Net Oil | m³ | `production_monthly.net_oil_m3` | Production Figures | Manual or imported | Monthly official value |
| Production Overview, 2.2 Production 2025 Figures | Net Oil | bbl | `production_monthly.net_oil_bbl` | Production Figures | Manual or imported | Previous month and YTD calculated |
| Production Overview, 2.2 Production 2025 Figures | Water | m³ | `production_monthly.water_m3` | Production Figures | Manual or imported | Previous month and YTD calculated |
| Production Overview, 2.2 Production 2025 Figures | Sand | m³ | `production_monthly.sand_m3` | Production Figures | Manual or imported | Previous month and YTD calculated |
| Production Overview, 2.2 Production 2025 Figures | Gas | m³ | `production_monthly.gas_nm3` | Production Figures | Manual or imported | Database legacy field name does not change the workbook-facing m³ unit. |
| Production Overview, 2.2 Production 2025 Figures | Days on Prod. | — | `production_monthly.days_on_production` | Production Figures | Manual or imported | Source label retained exactly. May 2025 value exceeds calendar days, so no calendar-day validation is imposed. |
| Raw Data Production | Oil Production bbl, Actual | bbl | `production_history.oil_actual_bbl` | Production History (future import expansion) | Imported | One source row per month |
| Raw Data Production | Oil Production bbl, Forecast | bbl | `production_history.oil_forecast_bbl`, `production_plan_budget.oil_forecast_bbl` | Forecast Comparison | Imported / manual forecast | Do not treat forecast as budget without confirmation. |
| Raw Data Production | Average Daily Production | bopd | calculated | Production Figures | Calculated | Actual bbl divided by number of calendar days in the reporting month. |
| Raw Data Production | Cumulative Oil | bbl | calculated from historical data | History / future management reporting | Calculated | Running sum; not a user entry field. |
| Raw Data Production | vs Forecast | bopd | calculated | Forecast Comparison | Calculated | Display only if forecast is reported and non-zero. |
| Raw Data Production | vs Previous Month | bopd | calculated | History / future management reporting | Calculated | Uses the previous stored reporting period. |
| Production Overview, 2.1 Overview | Monthly operational narrative | — | `production_narratives.content` | Production Overview | Rich-text narrative | Workbook wording preserved in initial May 2025 import. |

## Not implemented in Step 4

- Full historical import of all 2004–2025 Raw Data Production rows. The schema and duplicate protection (`period_date` unique) are ready; only January–May 2025 are seeded to support the active May report.
- Production charts, Inventory, Operations, Sales, Deliveries, PEP, and ASP. These are distinct workbook components scheduled for the next scope rather than folded into Production figures.
- An official override workflow. The database records override metadata, but the workbook does not establish an existing manual-override procedure to reproduce yet.
