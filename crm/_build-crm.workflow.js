export const meta = {
  name: 'bidframe-crm-build',
  description: 'Expand, verify, and draft outreach for UK SME public-sector bidder leads (medium-large run)',
  phases: [
    { title: 'Expand', detail: '12 parallel sector research agents find named SME leads' },
    { title: 'Verify', detail: 'independent agent re-checks each contact + conversion score' },
    { title: 'Draft', detail: 'agent drafts personalised DM + email per lead, high priority first' },
  ],
}

const BASE = 'c:/Users/Sue Kim/ICL hack/Tender_Breakdown_AI-Agent/crm'
const PIPELINE_CAP = 150 // leads through verify+draft (12 + 150 + 150 = ~312 agents, well under the cap)

const POSITIONING = `Bidframe turns a public-sector tender into a verified, source-linked requirements
checklist in minutes: it catches the pass/fail requirement that would disqualify the whole bid, flags
what it is unsure about instead of guessing, and drafts the response from the bidder's own evidence with
every claim cited. The human approves every call. Built for SME bidders and small bid consultancies that
enterprise tools (e.g. AutogenAI) price out. We compete on auditability + the loud disqualifier catch +
measured recall, never on "we write your bid".`

const STYLE = `STYLE RULES (hard): British spelling. No hype, no exclamation marks, no emoji. NO em dashes
(use a comma or full stop). Lead with trust/traceability, never prose quality. The ask is soft: ~10
minutes, run it live on a tender they recognise, an honest expert read, no hard sell. Keep the DM under
~120 words and the email under ~160 words. Address the named person if known, else a warm role greeting.`

const LEADS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    leads: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          firm: { type: 'string' },
          contact_person: { type: 'string' },
          sub_sector: { type: 'string' },
          region: { type: 'string' },
          size_signal: { type: 'string' },
          email: { type: 'string' },
          email_type: { type: 'string', enum: ['gmail', 'domain', 'other', 'none'] },
          website: { type: 'string' },
          linkedin: { type: 'string' },
          phone: { type: 'string' },
          public_tender: { type: 'string' },
          conversion_estimate: { type: 'string', enum: ['High', 'Medium', 'Low'] },
          conversion_rationale: { type: 'string' },
          source: { type: 'string' },
          verification_status: { type: 'string', enum: ['verified', 'partial', 'unverified'] },
          notes: { type: 'string' },
        },
        required: ['firm', 'sub_sector', 'email', 'email_type', 'website', 'conversion_estimate', 'source', 'verification_status'],
      },
    },
  },
  required: ['leads'],
}

const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    email_ok: { type: 'boolean' },
    email_corrected: { type: 'string' },
    email_type: { type: 'string', enum: ['gmail', 'domain', 'other', 'none'] },
    identity_ok: { type: 'boolean' },
    conversion_estimate: { type: 'string', enum: ['High', 'Medium', 'Low'] },
    conversion_rationale: { type: 'string' },
    verification_status: { type: 'string', enum: ['verified', 'partial', 'unverified'] },
    verify_notes: { type: 'string' },
  },
  required: ['email_ok', 'email_corrected', 'email_type', 'conversion_estimate', 'verification_status', 'verify_notes'],
}

const RULES = `ABSOLUTE RULES (fabricated data is worse than no data):
- NEVER invent or guess an email, person name, or phone. Only record contact details found on a REAL public web page.
- Every email and key fact MUST have a source URL in the "source" field.
- "not_found" is an acceptable, expected value. An honest row with no email beats a fake one.
- Prefer SMALL / SME / sole-trader / regional firms that bid for UK public-sector contracts. Avoid national giants.
- A company's own published "Contact us" email is fine to record (public, not private).
- A findable public EMAIL is the most valuable field (we are locked out of LinkedIn). Gmail/owner-read inboxes rank highest.`

function expandPrompt(sector, idx) {
  return `You are a B2B lead-research analyst for Bidframe. ${POSITIONING}

YOUR SECTOR: ${sector}

Find REAL, named UK SME firms in this sector (aim 15-25, quality over quantity), each with publicly-available
contact info, using WebSearch + WebFetch. Mine Contracts Finder / Find a Tender award notices, council
framework awardee lists, and the firms' own websites for a public contact email.

CRASH-RESILIENCE (important): as soon as you have confirmed a few leads, write your running list to
"${BASE}/rows_raw/expand-${idx}.json" (a JSON array of lead objects) and REWRITE that file each time you add
more. This way the work survives if you are interrupted before your final answer. Your final structured
return should match that file.

${RULES}

Conversion scoring: High = small/solo, bids often into public frameworks, AND a findable public email
(esp. gmail). Medium = real SME bidder but only website/contact-form found, OR strong target that is
LinkedIn-only. Low = larger/slower or no contact path. Set verification_status = "verified" only when you
fetched a page showing the email + identity; "partial" if some fields sourced; "unverified" otherwise.

Return ONLY the structured object. Do not pad with fake rows.`
}

const EXPAND = [
  'UK SME domiciliary / home-care providers that bid for council home-care frameworks.',
  'UK SME supported-living, learning-disability and mental-health care providers that bid for council frameworks.',
  'UK SME commercial cleaning + FM firms that bid for school / council / NHS / void-property cleaning contracts.',
  'UK SME contract caterers that bid for school / academy-trust / council catering contracts.',
  'UK SME IT managed-service providers (G-Cloud / academy-trust ICT) that bid for public-sector ICT.',
  'UK SME training / employability providers that bid for Skills Bootcamp and DWP DPS2 contracts.',
  'UK SME manned-guarding / security firms that bid for council / school / NHS security contracts.',
  'UK SME grounds-maintenance / landscaping firms that bid for council / school grounds contracts.',
  'UK SME waste-management, recycling and street-cleansing firms that bid for council contracts.',
  'UK SME SEND home-to-school, passenger and community transport operators that bid for council contracts.',
  'UK SME managed-print, document-services and signage firms that bid for public-sector contracts.',
  'Small and solo UK bid-writing / tender consultancies and freelance bid writers (often Gmail-reachable).',
]

function normKey(firm) {
  return String(firm || '')
    .toLowerCase()
    .replace(/\b(ltd|limited|llp|plc|services|group|uk|the)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function collect(waveResults) {
  const out = []
  for (const r of (waveResults || []).filter(Boolean)) for (const l of (r.leads || [])) out.push(l)
  return out
}

function dedupe(leads, seenKeys) {
  const fresh = []
  for (const l of leads) {
    const k = normKey(l.firm)
    if (!k || seenKeys.has(k)) continue
    seenKeys.add(k)
    fresh.push(l)
  }
  return fresh
}

const rank = (e) => (e === 'High' ? 0 : e === 'Medium' ? 1 : 2)

function verifyStage(lead) {
  const prompt = `You independently VERIFY one sales lead for Bidframe. Do NOT trust the prior research blindly.

LEAD: ${JSON.stringify({ firm: lead.firm, contact_person: lead.contact_person, email: lead.email,
    website: lead.website, region: lead.region, source: lead.source, sub_sector: lead.sub_sector,
    conversion_estimate: lead.conversion_estimate })}

Using WebSearch + WebFetch, open the source URL and the firm's website and confirm:
1. Does the email actually appear on a real public page for THIS firm? If yes set email_ok=true and put the
   exact address in email_corrected (correct it if the page shows a different/better one). If you cannot
   confirm any public email, set email_ok=false and email_corrected="not_found". NEVER invent one.
2. Is the firm a real UK SME that plausibly bids for public-sector contracts (identity_ok)?
3. Re-score conversion_estimate on small/decides-fast + bids-often + reachable-by-email-now (we are locked
   out of LinkedIn, so email-reachable scores higher). One-line rationale.
Set verification_status = "verified" only if you confirmed email + identity on a fetched page; "partial" if
some; "unverified" if not. Be strict and honest. Return only the structured object.`
  return agent(prompt, { schema: VERIFY_SCHEMA, agentType: 'general-purpose', model: 'sonnet', phase: 'Verify', label: 'verify:' + lead.id })
    .then((v) => {
      const ver = v || { email_corrected: lead.email, email_type: lead.email_type, conversion_estimate: lead.conversion_estimate, conversion_rationale: lead.conversion_rationale, verification_status: 'unverified', verify_notes: 'verify agent unavailable' }
      return {
        ...lead,
        email: ver.email_corrected && ver.email_corrected !== '' ? ver.email_corrected : lead.email,
        email_type: ver.email_type || lead.email_type,
        conversion_estimate: ver.conversion_estimate || lead.conversion_estimate,
        conversion_rationale: ver.conversion_rationale || lead.conversion_rationale,
        verification_status: ver.verification_status || 'unverified',
        notes: [lead.notes, ver.verify_notes].filter(Boolean).join(' | '),
      }
    })
}

function draftStage(lead) {
  const rec = JSON.stringify(lead)
  const prompt = `You write outreach for Bidframe and persist one verified lead. ${POSITIONING}

THE LEAD (already verified): ${rec}

DO TWO FILE WRITES (priority order):
1. FIRST write "${BASE}/rows/${lead.id}.json" as exactly this compact one-line JSON:
${rec}
2. THEN write "${BASE}/drafts/${lead.id}.md" with two personalised, ready-to-send messages tailored to THIS
   firm, its sub_sector (${lead.sub_sector}) and its public_tender if present. Structure:

# ${lead.firm} (${lead.id})
- Segment: ${lead.sub_sector} | Conversion: ${lead.conversion_estimate} | Email: ${lead.email}

## LinkedIn cold DM
<the DM>

## Cold email
Subject: <subject line>

<the email body, signed off as "Joel, Bidframe">

${STYLE}

If the email is not_found, still write both (the email is then a template for when an address is found).
After both writes, reply with just: ok ${lead.id}`
  return agent(prompt, { agentType: 'general-purpose', model: 'sonnet', effort: 'low', phase: 'Draft', label: 'draft:' + lead.id })
}

// ---- run ----
phase('Expand')
log('Expansion: ' + EXPAND.length + ' sector research agents')
const wave = await parallel(EXPAND.map((s, i) => () => agent(expandPrompt(s, i), { schema: LEADS_SCHEMA, agentType: 'general-purpose', model: 'sonnet', phase: 'Expand', label: 'expand:' + s.slice(0, 26) })))

const seen = new Set()
let leads = dedupe(collect(wave), seen)
leads.sort((a, b) => rank(a.conversion_estimate) - rank(b.conversion_estimate))
leads = leads.map((l, i) => ({ ...l, id: 'L-' + String(i + 1).padStart(4, '0') }))
log('Deduped leads: ' + leads.length)

const pipe = leads.slice(0, PIPELINE_CAP)
const dropped = leads.length - pipe.length
if (dropped > 0) log('NOTE: ' + dropped + ' lower-ranked leads found but beyond the ' + PIPELINE_CAP + '-lead cap (raw in rows_raw/, not verified/drafted)')

await pipeline(pipe, verifyStage, draftStage)

return {
  total_leads_found: leads.length,
  verified_and_drafted: pipe.length,
  not_auto_processed: dropped,
  rows_dir: BASE + '/rows',
  drafts_dir: BASE + '/drafts',
}
