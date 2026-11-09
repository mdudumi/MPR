# HSSC&E Summary mapping

This mapping preserves the field names and display order of the `Health and Safety Summary` worksheet. The initial application deliberately displays the same operational tables. Pale cells are historical or calculated; only the monthly source values are editable.

## Incident Summary

| Existing Excel field | Database field | UI field | Editable | Calculation/source |
|---|---|---|---|---|
| Incidents | `hse_incident_types.name` | Incident | No | Controlled incident-type list in workbook display order |
| Bankers Lost Time Incident | `hse_monthly_incidents.incident_count` for `BANKERS_LTI` | Bankers Lost Time Incident | This Month only | Monthly source value |
| Contractor Lost Time Incident | `hse_monthly_incidents.incident_count` for `CONTRACTOR_LTI` | Contractor Lost Time Incident | This Month only | Monthly source value |
| Restricted Work Case | `hse_monthly_incidents.incident_count` for `RESTRICTED_WORK_CASE` | Restricted Work Case | This Month only | Monthly source value |
| Personnel Injury FA | `hse_monthly_incidents.incident_count` for `PERSONNEL_INJURY_FA` | Personnel Injury FA | This Month only | Monthly source value |
| Personnel Injury MT | `hse_monthly_incidents.incident_count` for `PERSONNEL_INJURY_MT` | Personnel Injury MT | This Month only | Monthly source value |
| Property Damage | `hse_monthly_incidents.incident_count` for `PROPERTY_DAMAGE` | Property Damage | This Month only | Monthly source value |
| Near Miss | `hse_monthly_incidents.incident_count` for `NEAR_MISS` | Near Miss | This Month only | Monthly source value |
| Environmental | `hse_monthly_incidents.incident_count` for `ENVIRONMENTAL` | Environmental | This Month only | Monthly source value |
| Security | `hse_monthly_incidents.incident_count` for `SECURITY` | Security | This Month only | Monthly source value |
| Motor Vehicle Accidents | `hse_monthly_incidents.incident_count` for `MOTOR_VEHICLE_ACCIDENTS` | Motor Vehicle Accidents | This Month only | Monthly source value |
| Fatality | `hse_monthly_incidents.incident_count` for `FATALITY` | Fatality | This Month only | Monthly source value |
| Fires | `hse_monthly_incidents.incident_count` for `FIRES` | Fires | This Month only | Monthly source value |
| Non Tabulated | `hse_monthly_incidents.incident_count` for `NON_TABULATED` | Non Tabulated | This Month only | Monthly source value |
| Totals | No stored value | Totals | No | Sum of all listed monthly incident values for the displayed period |
| Total Recordable | No stored value | Total Recordable | No | Sum of Bankers LTI, Contractor LTI, Restricted Work Case, Personnel Injury FA, and Personnel Injury MT. This classification should be reconfirmed with HSE before production rollout. |
| Last Month | No stored value | Last Month | No | Same incident type from immediately preceding reporting period |
| Year to Date | No stored value | Year to Date | No | Sum of the same incident type from January through selected month |
| Inception to Date | `hse_incident_types.inception_baseline` plus `hse_monthly_incidents` | Inception to Date | No | Imported baseline plus all system monthly values. When full history is imported, baseline is set to zero to avoid double-counting. |

## Lost Time Incidents, LTI Frequency, and Exposure Hours

| Existing Excel field | Database field | UI field | Editable | Calculation/source |
|---|---|---|---|---|
| Bankers LTI | `hse_monthly_incidents` / `BANKERS_LTI` | Bankers | No in this table | References Incident Summary source value |
| Contractors LTI | `hse_monthly_incidents` / `CONTRACTOR_LTI` | Contractors | No in this table | References Incident Summary source value |
| Total LTI | No stored value | Total LTI | No | Bankers LTI + Contractor LTI |
| Bankers Exposure Hours | `hse_exposure_hours.bankers_hours` | Bankers | This Month only | Monthly source value |
| Contractor Exposure Hours | `hse_exposure_hours.contractor_hours` | Contractor | This Month only | Monthly source value |
| Exposure Hours Totals | No stored value | Totals | No | Bankers + Contractor exposure hours |
| Bankers LTI Frequency | No stored value | Bankers | No | Bankers LTI × 1,000,000 ÷ Bankers exposure hours |
| Contractor LTI Frequency | No stored value | Contractors | No | Contractor LTI × 1,000,000 ÷ Contractor exposure hours |
| Total Frequency | No stored value | Total Frequency | No | Total LTI × 1,000,000 ÷ total exposure hours |

The workbook’s May 2025 inception values validate this frequency expression: 82 Total LTI and 64,648,891 total exposure hours produce 1.268 per million exposure hours, matching the workbook’s displayed Total Frequency.

## Known validation boundary

The supplied worksheet contains values rather than Excel formulas for these cells. The LTI-frequency method is therefore evidenced by its displayed values. Total Recordable is modeled from the visibly related injury/LTI categories and must be signed off by the HSE report owner before the first official submission.
