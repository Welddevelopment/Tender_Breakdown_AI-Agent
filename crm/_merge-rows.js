// Append NEW per-lead rows (crm/rows/<id>.json) into crm/leads.csv without disturbing existing lines.
// Only rows whose id is not already in leads.csv are appended. Run: node crm/_merge-rows.js
const fs = require('fs');
const path = require('path');
const CRM = __dirname;
const ROWS = path.join(CRM, 'rows');
const CSV = path.join(CRM, 'leads.csv');

const COLS = ['id','firm','contact_person','segment','sub_sector','region','size_signal','email',
  'email_type','website','linkedin','phone','public_tender','conversion_estimate',
  'conversion_rationale','source','verification_status','status','notes'];

const esc = v => '"' + ((v === undefined || v === null) ? '' : String(v)).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';

const csv = fs.readFileSync(CSV, 'utf8').replace(/\s+$/, '');
const existingIds = new Set(csv.split('\n').slice(1).map(l => (l.match(/^"?(L-\d+)"?,/) || l.match(/^(L-\d+),/) || [])[1]).filter(Boolean));

const files = fs.existsSync(ROWS) ? fs.readdirSync(ROWS).filter(f => f.endsWith('.json')) : [];
const added = [];
const lines = [];
for (const f of files) {
  let o;
  try { o = JSON.parse(fs.readFileSync(path.join(ROWS, f), 'utf8')); } catch { continue; }
  if (!o.id || existingIds.has(o.id)) continue;
  o.status = o.status || 'Not contacted';
  lines.push(COLS.map(c => esc(o[c])).join(','));
  added.push(o.id);
}
if (lines.length) fs.writeFileSync(CSV, csv + '\n' + lines.join('\n') + '\n', 'utf8');
console.log('appended ' + lines.length + ' new rows: ' + (added.join(', ') || '(none)'));
