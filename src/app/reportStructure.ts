export type ReportNode = { code: string; title: string; route: string; children?: ReportNode[] }

export const reportStructure: ReportNode[] = [
  { code: 'HSSE', title: 'Health, Safety, Security, Community & Environment', route: '/health-safety', children: [
    { code: 'HSSE_INCIDENTS', title: '1.1 HSSC&E Summary', route: '/health-safety' },
    { code: 'HSSE_HEALTH_SAFETY', title: '1.2 Health & Safety', route: '/health-safety/narrative' },
    { code: 'HSSE_SECURITY', title: '1.3 Security', route: '/security' },
    { code: 'HSSE_ENVIRONMENT', title: '1.4 Environmental', route: '/environment' },
    { code: 'HSSE_CSR', title: '1.5 Corporate Social Responsibility', route: '/csr' },
  ] },
  { code: 'PRODUCTION', title: 'Production', route: '/production', children: [
    { code: 'PROD_OVERVIEW', title: '2.1 Overview', route: '/production/overview' },
    { code: 'PROD_FIGURES', title: '2.2 Production Figures', route: '/production/figures' },
    { code: 'PROD_CRUDE_INVENTORY', title: '2.3 Crude Oil Inventory', route: '/inventory-sales-pep' },
    { code: 'PROD_WATER_INVENTORY', title: '2.4 Water Inventory', route: '/inventory-sales-pep' },
    { code: 'PROD_OPERATIONS', title: '2.5 Production Operation Activities', route: '/inventory-sales-pep' },
    { code: 'PROD_SALES', title: '2.6 Sales Deliveries', route: '/inventory-sales-pep' },
    { code: 'PROD_PEP_ASP', title: '2.7 PEP / ASP', route: '/inventory-sales-pep' },
  ] },
  { code: 'FACILITIES', title: 'Facilities Construction', route: '/facilities', children: [
    { code: 'FAC_CIVIL', title: '3.1 Civil & General Activity', route: '/facilities/civil-general' },
    { code: 'FAC_MECHANICAL', title: '3.2 Mechanical', route: '/facilities/mechanical' },
    { code: 'FAC_ELECTRICAL', title: '3.3 Electrical', route: '/facilities/electrical' },
  ] },
  { code: 'DRILLING', title: 'Drilling', route: '/drilling', children: [{ code: 'DRILLING_PROGRAM', title: '4.1 Drilling Program', route: '/drilling/program' }] },
  { code: 'ANNEXES', title: 'Annexes', route: '/annexes' },
]

export const flattenReportStructure = (nodes = reportStructure): ReportNode[] => nodes.flatMap(node => [node, ...(node.children ? flattenReportStructure(node.children) : [])])
