// This script adds RouteGuard wrapping to all dashboard pages
const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '..', 'src', 'app', 'dashboard');

// Map: relative path -> module key
const pageModuleMap = {
  // dashboard/page.tsx already done
  'ai-analytics/page.tsx': 'ai_analytics',
  'crm/page.tsx': 'crm',
  'crm/activities/page.tsx': 'crm',
  'crm/companies/page.tsx': 'crm',
  'crm/contacts/page.tsx': 'crm',
  'crm/deals/page.tsx': 'crm',
  'crm/emails/page.tsx': 'crm',
  'crm/leads/page.tsx': 'crm',
  'crm/opportunities/page.tsx': 'crm',
  'orders/page.tsx': 'orders',
  'sales/page.tsx': 'sales',
  'sales/orders/page.tsx': 'sales',
  'inventory/page.tsx': 'inventory',
  'inventory/history/page.tsx': 'inventory',
  'inventory/warehouses/page.tsx': 'inventory',
  'production/page.tsx': 'production',
  'production/bom/page.tsx': 'production',
  'production/orders/page.tsx': 'production',
  'production/products/page.tsx': 'production',
  'procurement/page.tsx': 'procurement',
  'procurement/orders/page.tsx': 'procurement',
  'procurement/suppliers/page.tsx': 'procurement',
  'reports/page.tsx': 'reports',
  'reports/finance/page.tsx': 'reports',
  'reports/inventory/page.tsx': 'reports',
  'reports/production/page.tsx': 'reports',
  'reports/sales/page.tsx': 'reports',
  'admin/page.tsx': 'admin',
  'admin/audit-log/page.tsx': 'admin',
  'admin/roles/page.tsx': 'admin',
  'admin/settings/page.tsx': 'admin',
  'admin/users/page.tsx': 'admin',
};

let modified = 0;
let skipped = 0;

for (const [relPath, moduleKey] of Object.entries(pageModuleMap)) {
  const filePath = path.join(basePath, relPath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP (not found): ${relPath}`);
    skipped++;
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Already has RouteGuard?
  if (content.includes('RouteGuard')) {
    console.log(`SKIP (already guarded): ${relPath}`);
    skipped++;
    continue;
  }

  // Detect if it has "use client" 
  const hasUseClient = content.includes('"use client"') || content.includes("'use client'");

  // Add "use client" if missing
  if (!hasUseClient) {
    content = '"use client";\n\n' + content;
  }

  // Add RouteGuard import after existing imports
  const routeGuardImport = 'import { RouteGuard } from "@/components/auth/RouteGuard";';
  if (!content.includes(routeGuardImport)) {
    // Find the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('import{')) {
        lastImportIndex = i;
      }
    }
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, routeGuardImport);
      content = lines.join('\n');
    }
  }

  // Find the export default function pattern
  const exportMatch = content.match(/export\s+default\s+function\s+(\w+)\s*\(/);
  
  if (exportMatch) {
    const funcName = exportMatch[1];
    
    // Rename: `export default function X(` -> `function X(`
    content = content.replace(
      `export default function ${funcName}(`,
      `function ${funcName}(`
    );
    
    // Append the guarded export at the end
    content = content.trimEnd() + '\n\n' +
      `export default function ${funcName}Guarded() {\n` +
      `  return (\n` +
      `    <RouteGuard module="${moduleKey}">\n` +
      `      <${funcName} />\n` +
      `    </RouteGuard>\n` +
      `  );\n` +
      `}\n`;
  } else {
    // Handle `export default page` or `export default SomeVar` pattern
    const defaultExportMatch = content.match(/export\s+default\s+(\w+)\s*;?\s*$/m);
    if (defaultExportMatch) {
      const varName = defaultExportMatch[1];
      
      // Remove the original export default
      content = content.replace(defaultExportMatch[0], '');
      
      // Append guarded wrapper
      content = content.trimEnd() + '\n\n' +
        `export default function ${varName}Guarded() {\n` +
        `  const Content = ${varName};\n` +
        `  return (\n` +
        `    <RouteGuard module="${moduleKey}">\n` +
        `      <Content />\n` +
        `    </RouteGuard>\n` +
        `  );\n` +
        `}\n`;
    } else {
      console.log(`WARN: Could not parse export in ${relPath}`);
      skipped++;
      continue;
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`DONE: ${relPath} -> module="${moduleKey}"`);
  modified++;
}

console.log(`\nSummary: ${modified} modified, ${skipped} skipped`);
