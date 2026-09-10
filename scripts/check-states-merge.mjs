// Prove the "areas we serve" listing picks up CMS pages without disturbing the
// hand-written ones.
//
// Runs against the real statesData.js and the real published rows, so it catches
// a state-name mismatch ("New York" vs "NewYork") or a trailing-slash duplicate
// that a synthetic fixture would not.
import fs from 'node:fs';
import { statesData } from '../src/components/Location/statesData.js';
import { mergeStateServices } from '../src/components/Location/mergeStateServices.js';

const ROOT = 'd:/milta-web-v3/milta-web';
const rows = JSON.parse(fs.readFileSync(`${ROOT}/db/extracted-pages.json`, 'utf8'))
  .filter((r) => r.status === 'published' && r.kind === 'service_state' && r.state)
  .map((r) => ({ state: r.state, service: r.service, url: r.url, meta_title: r.meta_title }));

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
};

const countLinks = (d) => Object.values(d).reduce((n, s) => n + s.services.length, 0);
const before = countLinks(statesData);
const merged = mergeStateServices(statesData, rows);
const after = countLinks(merged);

console.log(`published state pages: ${rows.length}`);
console.log(`links before: ${before}   after: ${after}\n`);

// 1. Nothing lost, nothing rewritten.
check('no link was removed', after >= before, `${before} -> ${after}`);
check('the source object was not mutated', countLinks(statesData) === before);

let rewritten = 0;
for (const [key, entry] of Object.entries(statesData)) {
  for (const s of entry.services) {
    const still = merged[key].services.find((m) => m.url === s.url);
    if (!still || still.name !== s.name) rewritten++;
  }
}
check('every hand-written label is untouched', rewritten === 0, `${rewritten} changed`);

// 2. The whole point: every published page is now linked from somewhere.
const norm = (u) => String(u).replace(/\/+$/, '').toLowerCase();
const linked = new Set(Object.values(merged).flatMap((s) => s.services.map((x) => norm(x.url))));
const unlinked = rows.filter((r) => !linked.has(norm(r.url)));
check('every published state page is linked', unlinked.length === 0,
  unlinked.slice(0, 5).map((r) => r.url).join(', '));

// 3. No page linked twice — the trailing-slash trap.
const all = Object.values(merged).flatMap((s) => s.services.map((x) => norm(x.url)));
const dupes = all.filter((u, i) => all.indexOf(u) !== i);
check('no duplicate links', dupes.length === 0, [...new Set(dupes)].slice(0, 5).join(', '));

// 4. A brand-new page, of the kind an upload creates, gets picked up — including
//    one in a state the file has never heard of.
const withNew = mergeStateServices(statesData, [
  ...rows,
  { state: 'Texas', service: 'Payroll', url: '/us/services/zz-new-texas-payroll/', meta_title: 'x' },
  { state: 'Oregon', service: 'Bookkeeping', url: '/us/services/zz-new-oregon/', meta_title: 'y' },
]);
const texas = withNew.Texas.services.find((s) => s.url === '/us/services/zz-new-texas-payroll/');
check('a new page in a known state is added', !!texas, texas?.name);
check('a new state is created', !!withNew.Oregon, withNew.Oregon?.services?.[0]?.name);
check('the new state has a description', !!withNew.Oregon?.description);
check('label reads like the existing ones', texas?.name === 'Payroll Services in Texas', texas?.name);

// 5. Degrades to today's behaviour when the database says nothing.
check('empty result changes nothing', mergeStateServices(statesData, []) === statesData);

console.log(`\n${failures ? `${failures} CHECK(S) FAILED` : 'all checks passed'}`);
process.exit(failures ? 1 : 0);
