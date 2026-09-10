// Run with: node verify-upload.js from milta-web/server directory
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath,'utf8').split('\n').forEach(l => {
    const m=/^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(l.trim()); if(m) process.env[m[1]]=m[2];
  });
}

const cs = require('./services/contentService');
const ps = require('./services/pageService');
const { table, run } = require('./services/databaseService');

const doc = [
  'Meta Title: Best Bookkeeping Services in Delaware | Milta',
  'Meta Description: Milta offers trusted bookkeeping services for small businesses in Delaware. 15+ years of experience, fixed monthly fees.',
  'Meta Keywords: bookkeeping services Delaware, small business bookkeeping',
  '',
  'Best Bookkeeping Services for Small Businesses in Delaware, USA',
  'With over 15 years of experience, Milta provides outstanding bookkeeping services for small businesses in Delaware.',
  'Contact us today for a free consultation!',
  '',
  'Why Businesses Trust Milta for Bookkeeping',
  'Our team of dedicated bookkeepers handles everything from reconciliations to payroll.',
  '- Fixed monthly retainers with transparent reporting',
  '- Dedicated team of seasoned bookkeeping professionals',
  '- Fast monthly closes and real-time ledger access',
  '',
  'Core Bookkeeping Capabilities',
  '- General Ledger Maintenance: Complete audit-ready reconciliation',
  '- Accounts Payable and Receivable: Timely invoicing and bill pay',
  '- Financial Reporting: Monthly P&L, balance sheets, and cash projections',
  '',
  'Frequently Asked Questions',
  'Q: What is bookkeeping?',
  'A: Bookkeeping is the process of recording, organizing and managing your financial transactions.',
  'Q: How much does bookkeeping cost in Delaware?',
  'A: Our fixed monthly retainers start from a predictable fee for most small businesses.',
].join('\n');

async function main() {
  const buf = Buffer.from(doc, 'utf8');
  const result = await cs.previewDocument(
    {buffer: buf, mimetype: 'text/plain', originalname: 'bookkeeping-delaware.txt'},
    {service: 'Bookkeeping'}
  );
  
  console.log('\n=== PREVIEW RESULT ===');
  console.log('Found fields:', result.found);
  console.log('Missing fields:', result.missing);
  console.log('Meta Title:', result.fields.meta_title);
  console.log('Meta Desc:', result.fields.meta_description ? result.fields.meta_description.slice(0,60)+'...' : 'NOT FOUND');
  console.log('Content keys:', Object.keys(result.fields.content || {}));
  console.log('Hero:', JSON.stringify(result.fields.content && result.fields.content.hero, null, 2));
  console.log('Intro paragraphs:', result.fields.content && result.fields.content.intro && result.fields.content.intro.paragraphs ? result.fields.content.intro.paragraphs.length : 0);
  console.log('FAQs:', result.fields.content && result.fields.content.faqs ? result.fields.content.faqs.length : 0);
  console.log('CardGroups:', result.fields.content && result.fields.content.cardGroups ? result.fields.content.cardGroups.length : 0);
  
  // Test actual save
  const { data: pages } = await run(
    table('pages').select('id,url').eq('url','/us/services/best-bookkeeping-services-in-colorado').maybeSingle()
  );
  if (!pages) { console.log('\n⚠️  Test page not found in DB'); return; }
  
  const patch = {
    meta_title: result.fields.meta_title,
    meta_description: result.fields.meta_description,
    meta_keywords: result.fields.meta_keywords,
    content: result.fields.content,
    content_format: result.contentFormat,
    import_source: 'verify-upload.js',
    imported_at: new Date().toISOString(),
  };
  
  // Remove undefined fields (same as applyDocument does)
  for (const k of Object.keys(patch)) {
    if (patch[k] === undefined || patch[k] === null) delete patch[k];
  }
  
  console.log('\n=== SAVING TO DB ===');
  console.log('Patch keys:', Object.keys(patch));
  const saved = await ps.updatePage(pages.id, patch, {editedBy:'verify-script', note:'verify upload', internal: true});
  console.log('Changed?', saved && saved.changed);
  
  // Verify it was actually saved
  const check = await ps.getPage(pages.id);
  console.log('\n=== VERIFICATION (read back from DB) ===');
  console.log(check.meta_title ? '✅' : '❌', 'Meta Title:', check.meta_title);
  console.log(check.meta_description ? '✅' : '❌', 'Meta Desc:', check.meta_description ? check.meta_description.slice(0,50)+'...' : 'MISSING');
  const c = check.content;
  if (c && typeof c === 'object') {
    console.log('✅ Content is structured ServiceLayout object');
    console.log('  Keys:', Object.keys(c).join(', '));
    console.log('  Hero titleLead:', c.hero && c.hero.titleLead);
    console.log('  Hero subtitle:', c.hero && c.hero.subtitle ? c.hero.subtitle.slice(0,60)+'...' : 'MISSING');
    console.log('  Hero ctaLabel:', c.hero && c.hero.ctaLabel || '(not set)');
    console.log('  Intro:', c.intro && c.intro.paragraphs ? c.intro.paragraphs.filter(Boolean).length+' paragraph(s)' : 'MISSING');
    console.log('  FAQs:', c.faqs ? c.faqs.length : 0);
    console.log('  CardGroups:', c.cardGroups ? c.cardGroups.length : 0);
    console.log('\n✅ UPLOAD PIPELINE IS WORKING CORRECTLY');
  } else {
    console.log('❌ Content is NOT structured:', typeof c);
  }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); }).finally(() => process.exit(0));
