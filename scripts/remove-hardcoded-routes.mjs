#!/usr/bin/env node
// Remove hardcoded state service routes and replace with Supabase catch-all
import fs from 'fs';

const file = 'd:\\milta-web-v3\\milta-web\\src\\App.jsx';
let content = fs.readFileSync(file, 'utf8');

// Find Connecticut start (first hardcoded state route comment)
const connStart = content.indexOf('{/* Connecticut */');

// Find the LAST PayrollMontana route
const montanaPayrollIdx = content.lastIndexOf('element={<PayrollMontana />} />');
const montanaEnd = content.indexOf('\n', montanaPayrollIdx);

// Find the next </Routes> tag
const closeRoutesStart = content.indexOf('</Routes>', montanaEnd);

if (connStart !== -1 && montanaEnd !== -1 && closeRoutesStart !== -1) {
  // Get the lines before Connecticut and from </Routes> onward
  const lineBeforeConn = content.lastIndexOf('\n', connStart);
  const before = content.slice(0, lineBeforeConn + 1);
  const after = content.slice(closeRoutesStart);
  
  // Create new content with just the catch-all route
  const newContent = before + '\n          {/* ── All state service pages now served from Supabase ── */}\n          <Route path="/us/services/*" element={<CmsServicePage />} />\n\n        ' + after;
  
  fs.writeFileSync(file, newContent, 'utf8');
  console.log('✓ Removed ~270 hardcoded state service routes (Connecticut - Montana)');
  console.log('✓ App.jsx now routes all /us/services/* paths to Supabase via CmsServicePage');
} else {
  console.error('Could not find route sections to remove');
  console.error(`connStart: ${connStart}, montanaEnd: ${montanaEnd}, closeRoutesStart: ${closeRoutesStart}`);
  process.exit(1);
}
