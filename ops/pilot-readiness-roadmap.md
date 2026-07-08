# Bidframe Pilot Readiness Roadmap

Status: draft operating plan  
Owner: whole team, with one named owner per workstream before each sprint  
Last updated: 2026-07-06  
Source basis: July 2026 codebase audit, live build checks, existing outreach plan, go-live runbook, and current production risks.

## Purpose

This document turns the 0-100 production-readiness score into standalone improvement stages. Use it to decide what kind of user exposure Bidframe is ready for, what work unlocks the next band, and what evidence the team must collect before claiming progress.

The current working score from the audit is **62/100**.

The recommended threshold for the very first free pilots is **70/100**.

At 62, the product is credible enough for founder-led demos and concierge discovery. It is not yet ready for unsupervised use by strangers, confidential tender packs, or a self-serve pilot motion.

## How To Use This Roadmap

Each band is standalone. You can read a single band and know:

- what customer exposure is allowed
- what must be true before entering the band
- what work gets you through the band
- what evidence proves the band is achieved
- what not to do yet

Do not move the score because the UI looks better or because one demo worked. Move the score only when the verification gate for the band passes.

## Score Philosophy

The score is not a judgement of the team's talent. It is a judgement of how much risk remains before real users depend on the product.

The score should rise when the product becomes more dependable under normal use, more honest under edge cases, and easier for the team to operate without heroics.

The score should not rise for:

- landing page polish alone
- a one-off successful live upload
- more demo fixtures without production hardening
- claims that are not backed by tests, logs, or real pilot feedback
- large rewrites that have not reduced operational risk

## Score Bands At A Glance

| Score | Band | User exposure | Main goal |
|---:|---|---|---|
| 0-39 | Experimental prototype | Internal only | Prove the idea can work once |
| 40-59 | Internal alpha | Friendly walkthroughs only | Make the demo repeatable |
| 60-69 | Concierge discovery | Founder-operated demos and supervised trials | Make the product honest and recoverable |
| 70-79 | Free pilot ready | 3-5 hand-held free pilots | Make the first users successful with guardrails |
| 80-89 | Private beta ready | 10-25 active pilot teams, selective paid pilots | Make usage durable across users, files, and failures |
| 90-100 | Production SaaS ready | Broader launch and paid production use | Make reliability, security, and operations boring |

## Current Position

Current score: **62/100**  
Current band: **60-69, concierge discovery**  
Next target: **70/100, free pilot ready**

Bidframe already has strong product proof:

- real tender upload and extraction flow
- source-backed requirements and deal-breaker detection
- evidence-backed answer drafting
- open questions where the system needs human input
- auth and per-user tender lists
- Next.js frontend with demo, review, graph, answers, upload, and tender views
- engine tests and smoke checks around mixed tender packs, gating detection, and answer safety

The gaps are mostly production-readiness gaps:

- long or fragile server build behaviour when remote font fetches are involved
- large frontend bundles from app-wide providers, demo data, and heavy PDF/source modules
- in-memory job and event handling on the backend
- SQLite and JSON rewrite patterns that are acceptable for demos but weak for multi-user production
- upload handling that reads files into memory before enforcing limits
- auth tokens exposed through localStorage and query strings for some source/PDF routes
- inconsistent access checks on source documents for shared/team access
- limited one-command backend test setup in the local environment
- limited operational monitoring, retry visibility, and user-facing recovery states

## Non-Negotiable Product Principle

Bidframe should be sold as a controlled first-read layer, not an autopilot.

Every readiness band must preserve these promises:

- the system surfaces requirements, risks, citations, and draft answers
- the user decides, approves, edits, or rejects
- uncertainty is visible
- source proof is easy to inspect
- no answer claims evidence that is not actually present
- no outreach claim outruns the product's measured behaviour

## Band 0-39: Experimental Prototype

### What This Band Means

The product can prove the concept in isolated conditions, usually with hand-picked data and hands-on developer support. This band is about answering: "Can this idea work at all?"

### User Exposure Allowed

Internal team only.

You can show screenshots or a highly controlled recording, but you should not put the tool in front of prospects as something they can use.

### Entry Criteria

- a rough product path exists
- at least one tender-like document can be processed somehow
- the team can explain the intended value proposition
- there is a known schema for the main output

### Work To Achieve This Band

Product:

- define the core user: bid manager, bid-writing consultant, or SME owner
- define the first painful workflow: tender first-read, compliance matrix, deal-breaker review, or answer drafting
- choose one first public tender vertical such as cleaning, facilities management, care, construction, or security
- describe the "before" workflow in plain language
- describe the "after" workflow in plain language

Data and engine:

- extract text from one PDF
- manually identify 10-30 requirements from that PDF
- define mandatory, gating, needs review, confidence, source page, source clause, and source excerpt
- make one golden example file that future changes can be compared against

Frontend:

- render a static compliance matrix
- show mandatory requirements differently from optional requirements
- show uncertain items differently from confident items
- show source page and source excerpt
- avoid raw confidence numbers in the UI

Backend:

- expose a health check
- expose one endpoint or file-backed path that returns the requirement schema
- keep secrets out of the repo

Team:

- write a one-page "what we are proving" note
- agree who owns frontend, backend, engine, and narrative
- keep a running list of known fake or hand-wired behaviour

### Verification Gate

You are in this band when:

- the team can show one static or semi-static tender breakdown
- the output follows the locked requirement schema
- a teammate can run the demo after reading the README
- every fake part is labelled internally

### What Not To Do Yet

- do not contact prospects for pilots
- do not claim automation quality
- do not build broad settings, billing, or admin
- do not optimise scaling before the core workflow is understandable

## Band 40-59: Internal Alpha

### What This Band Means

The demo is repeatable enough for friendly walkthroughs, but the team still drives every session. The product can process more than one tender, but reliability is uneven.

### User Exposure Allowed

Friendly walkthroughs only.

Acceptable audiences:

- teammates
- mentors
- hackathon judges
- founder friends
- one or two trusted industry contacts who know it is rough

Do not give unsupervised access.

### Entry Criteria

- one complete demo path exists
- the locked schema is respected
- the team can run frontend and backend locally
- at least one real or realistic tender can be processed end to end

### Work To Achieve This Band

Product:

- make the first workflow obvious: upload, review matrix, inspect source, decide
- remove dead ends from the main demo path
- decide which routes are product surfaces and which are pitch/demo surfaces
- make the user's control clear in the UI

Data and engine:

- add a small labelled gold set
- add a recall-first evaluation for deal-breakers
- add tests for dedupe, grouping, and answer safety
- make the extraction output stable enough that the frontend is not chasing shape changes
- capture known false positives and known false negatives

Frontend:

- build the matrix around the locked schema
- add source panel behaviour
- add decision controls
- add loading states for upload and processing
- add empty states for no tender loaded
- keep demo routes separate from live routes where possible

Backend:

- add upload endpoint
- add requirements endpoint
- add draft answer endpoint
- add patch endpoint for requirement decisions
- persist tenders locally
- add auth if external users may see any hosted surface

Security and privacy:

- keep API keys in environment variables
- keep tender PDFs out of git
- avoid logging sensitive document text in noisy places
- add a basic `.env.example`

Team:

- maintain `STATUS.md`
- keep role boards current
- document the daily demo script
- record which commands prove the current build works

### Verification Gate

You are in this band when:

- a teammate can run the demo without the original builder present
- the main demo tender works repeatedly
- lint and frontend build pass on the main branch
- at least one engine smoke check passes
- the team can explain what is real, what is mocked, and what is risky

### What Not To Do Yet

- do not promise pilots
- do not upload confidential third-party tender packs
- do not let users self-serve
- do not chase broad feature coverage at the expense of source proof

## Band 60-69: Concierge Discovery

### What This Band Means

The product is real enough to learn from users, but it still needs founder supervision. The team can run a call, process a public tender, and collect useful feedback without pretending the product is fully production-ready.

Bidframe is currently in this band.

### User Exposure Allowed

Founder-led demos and supervised discovery trials.

Good exposure:

- 10-minute walkthroughs
- live calls using a public tender the prospect recognises
- founder runs the tender and sends back the matrix
- screen recording shared after the call
- "free pilot in return for blunt feedback" as a future offer, not yet a self-serve link

Bad exposure:

- unsupervised accounts for prospects
- confidential tenders
- broad "try it yourself" links
- paid pilots without explicit caveats

### Entry Criteria

- frontend and backend can run locally
- hosted demo can show real product value
- engine can catch known deal-breakers on tested tenders
- source proof exists for key requirements
- answer drafting is grounded and shows gaps
- at least one deployment path exists

### Work To Complete This Band

#### 1. Fix The Access-Control Bug

Why it matters:

Users must never be blocked from source docs they legitimately have access to, and they must never see source docs they do not have access to.

Current issue:

- the PDF source endpoint uses a broader access check
- the source file endpoint has a stricter owner-only check
- shared/team users may be able to see matrix rows but fail when opening DOCX, XLSX, or CSV sources

Target state:

- every source endpoint uses the same access decision
- owner, collaborator, and denied-user cases are covered by tests
- the UI shows a clean unavailable-state if access is denied

Tasks:

- change source-file access logic to use the shared access helper
- add tests for owner access, collaborator access, and denied access
- manually verify PDF, DOCX, XLSX, and CSV source previews with two accounts
- document the expected access model in the backend README

Evidence:

- passing backend test for source access
- manual two-account verification note
- no source endpoint uses a different rule without a comment explaining why

#### 2. Make Server Builds Reliable

Why it matters:

Long builds slow the team down and make deploys feel unreliable. The audit showed the build can stall when remote font fetching is blocked, then succeed quickly when network is available.

Target state:

- builds do not depend on remote font fetches during deploy
- build time is measured and tracked
- the build can fail loudly for real errors instead of hanging on external fetches

Tasks:

- self-host the remaining Google fonts currently loaded through `next/font/google`
- keep the existing local Chillax font pattern
- remove unused font weights and subsets
- run a clean production build after the font change
- record build time before and after
- add a short note to frontend docs about font loading policy

Evidence:

- frontend build succeeds without external font network dependency
- build time is recorded in an ops note
- no user-facing visual regression on the main routes

#### 3. Reduce First-Load Bundle Risk

Why it matters:

Large first-load JavaScript makes the app slower for users and makes route changes feel heavy. The audit found several routes over roughly 800 KB to 1.1 MB uncompressed first-load JavaScript.

Target state:

- heavy PDF/source tooling loads only where needed
- demo fixture data does not leak into every product route
- app-wide providers are smaller and less client-heavy

Tasks:

- split demo data from the global requirements provider
- move route-specific demo fixtures into route-level loaders or client islands
- keep source viewer modules behind dynamic imports
- inspect why PDF.js appears in multiple chunks
- split large matrix/review components only where it reduces route weight
- avoid a cosmetic refactor that does not lower bundle size

Evidence:

- route bundle stats captured before and after
- the main app route and upload route show lower first-load JS
- source viewer still opens correctly for PDF, DOCX, XLSX, and CSV

#### 4. Make Upload Failures Recoverable

Why it matters:

Early pilot users will upload messy packs. A production-ish pilot must fail clearly and recover cleanly when files are too large, malformed, encrypted, scanned, or unsupported.

Target state:

- users see what failed and what to do next
- the backend enforces size limits before reading huge files into memory
- failed jobs do not leave users in limbo

Tasks:

- enforce upload limits as early as practical
- add user-facing messages for too-large files, unsupported types, encrypted PDFs, and extraction failure
- show partial success when a ZIP contains some usable and some rejected files
- add a retry path
- log failure reasons with a job id

Evidence:

- manual upload tests for large file, bad file, good PDF, and mixed ZIP
- UI shows recoverable states instead of a silent spinner
- backend logs identify why a job failed

#### 5. Make The Backend Operationally Safer

Why it matters:

The current backend can support demos, but in-memory jobs and subscribers are fragile under redeploys, crashes, and multiple workers.

Target state for this band:

- still lightweight
- honest about limits
- stable enough for 3-5 hand-held pilots

Tasks:

- document current single-process assumptions
- set safe concurrency defaults for live pilot deploys
- ensure `AUTH_SECRET`, `OPENAI_API_KEY`, and model settings are present in production
- verify persistent storage behaviour on the deployed backend
- add health check expectations to the runbook
- make job errors visible to the frontend

Evidence:

- deployed health check reports the intended extractor
- pilot deploy has stable env vars
- team knows what happens on redeploy
- no pilot is run on a backend that silently falls back to thin heuristic extraction

#### 6. Add A One-Command Verification Path

Why it matters:

Vibe-coded speed is fine when the product is young. Pilots need repeatable confidence before every call.

Target state:

- one documented command sequence tells the team whether the product is safe to demo
- missing local tooling is fixed or clearly documented
- smoke checks are easy enough that the team actually runs them

Tasks:

- create or document a pilot verification checklist
- make backend test dependencies installable
- add a short "before every pilot" command list
- include frontend lint, frontend build, backend import check, mixed-pack smoke, and gating floor check
- store the latest verification result in an ops note when a pilot is scheduled

Evidence:

- a new teammate can run the verification from docs
- frontend lint passes
- frontend build passes
- backend imports pass
- mixed-pack smoke passes
- gating floor smoke passes

#### 7. Tighten Pilot Messaging

Why it matters:

The outreach plan is already strong because it asks for expertise and blunt feedback. The product stage must match that honesty.

Target state:

- prospects understand this is an early free pilot
- public tenders are preferred
- testimonials are earned, not pressured
- confidential docs are not requested by default

Tasks:

- use the existing outreach framing: "free pilot in return for blunt feedback"
- say "No pressure on the testimonial; it has to earn it"
- ask for a public tender or a tender they are comfortable sharing
- avoid claims of perfect extraction
- avoid claims of autonomous bid writing
- capture permission before quoting anything

Evidence:

- outreach copy matches the product's true readiness
- pilot notes include tender used, result, misses, feedback, and permission status
- no unsupported traction claim enters pitch material

### Verification Gate For 70/100

Bidframe reaches **70/100** when all of these are true:

- frontend build and lint pass
- backend import check passes
- mixed-pack smoke passes
- gating floor smoke passes
- shared/team source document access is fixed and tested
- remote font build fragility is removed
- upload failure states are visible and recoverable
- production env vars are verified on the hosted backend
- a two-account privacy check passes
- a founder can run the pilot workflow from the runbook
- the pilot disclaimer and outreach framing are written

### What Not To Do In This Band

- do not rebuild the whole app
- do not migrate the whole database before fixing the obvious pilot blockers
- do not start self-serve onboarding
- do not accept confidential tender packs from strangers
- do not charge unless the buyer understands the product is early and hand-held

## Band 70-79: Free Pilot Ready

### What This Band Means

Bidframe can be offered to the first few real users as a free, founder-led pilot. The product still needs close team involvement, but the team has removed the main avoidable trust failures.

This is the right band for the outreach plan's first pilots.

### User Exposure Allowed

3-5 hand-held free pilots.

Recommended users:

- small bid-writing consultancies
- SMEs that frequently bid for public work
- prospects willing to use public tenders or non-sensitive packs
- people who will give blunt feedback quickly

Recommended pilot shape:

- one public or approved tender
- founder-operated upload if needed
- user reviews the matrix and source proof
- optional evidence-backed answer draft
- feedback call within 48 hours
- no confidential material unless the team has explicitly agreed the handling process

### Entry Criteria

- all 70/100 gate items are complete
- one founder can run the product without a developer sitting beside them
- the deployed backend is using the intended AI provider
- the team has a pilot intake note and feedback template
- the team has a known rollback or fallback demo if live upload is slow

### Work To Complete This Band

#### 1. Create A Pilot Operating System

Target state:

- every pilot follows the same path
- feedback is comparable across users
- the team can learn without making promises in the moment

Tasks:

- create a pilot intake template with company, role, tender type, tender source, file sensitivity, and desired outcome
- create a pilot results template with requirement count, deal-breakers found, misses, false positives, answer quality, time saved, and user quote
- create a go/no-go checklist for every pilot call
- name one pilot owner per account
- define what gets posted to `STATUS.md`, comms boards, and founder updates

Evidence:

- every pilot has an intake note
- every pilot has a result note
- every quote has permission status
- every product bug from a pilot has an owner

#### 2. Harden Auth And File Access

Target state:

- users trust that their documents are separated
- links to documents are not casually reusable
- source access is checked server-side every time

Tasks:

- replace long-lived query-token document access with short-lived signed links or authenticated fetches
- avoid putting bearer tokens in URLs where they can land in browser history, logs, or referrers
- review localStorage token usage and define a safer next step
- add tests for cross-user tender isolation
- add tests for source file access across all supported source types

Evidence:

- no ordinary document link works after expiry or without auth
- two-account isolation test passes
- access checks are consistent across matrix, PDF, and source files

#### 3. Make Jobs More Durable

Target state:

- a job can fail clearly
- a page refresh does not destroy the user's understanding of what happened
- a backend restart does not create confusing ghost progress

Tasks:

- persist job state enough for the UI to recover after refresh
- store job status, failure reason, file list, and timestamps
- show queued, processing, completed, partial, failed, and cancelled states
- make event streaming reconnect safely
- add a manual fallback polling path if events drop

Evidence:

- refreshing during processing still shows a truthful job state
- a forced backend restart during a test job creates a clear failed or retryable state
- users are not left staring at indefinite progress

#### 4. Start Database Migration Planning

Target state:

- the team knows exactly when SQLite stops being acceptable
- migration is planned before it becomes an emergency

Tasks:

- write a Postgres migration plan
- map current tables, JSON fields, and rewrite patterns
- identify which queries need indexes
- define how tender documents, source docs, requirements, answers, open questions, and events should be stored
- choose a managed Postgres provider or deployment path
- define backup and restore expectations

Evidence:

- migration design doc exists
- schema draft exists
- production cutover criteria are written
- no one is surprised by the storage work required for beta

#### 5. Improve Observability

Target state:

- the team can tell whether a pilot failed because of upload, extraction, model, database, auth, or frontend state
- user reports can be debugged from a job id

Tasks:

- add structured logs with tender id, job id, user id, file count, provider, duration, and outcome
- avoid logging full tender text
- add error categories for upload, parse, extraction, reconcile, draft, auth, and storage
- add basic metrics for upload count, success rate, extraction duration, draft duration, and error rate
- add a private ops view or log query recipe

Evidence:

- every pilot run can be traced by job id
- at least one intentionally failed job is easy to diagnose
- logs do not expose raw confidential content

#### 6. Tighten Frontend Architecture

Target state:

- product routes carry only the code and data they need
- demo routes remain rich without slowing the main product
- large components are split by responsibility, not by arbitrary line count

Tasks:

- separate demo fixture providers from live requirements state
- keep heavy proof/source overlays route-local
- split review, matrix, source, answer, and activity responsibilities where natural
- memoise or virtualise only where it solves measured slow rendering
- keep route-level errors and loading states consistent

Evidence:

- route bundle stats improve or at least stop growing
- matrix interaction remains responsive on large tenders
- demo pages still work after provider split

#### 7. Build A Pilot Feedback Loop

Target state:

- each pilot improves the product or the positioning
- feedback is not lost in chat

Tasks:

- after every pilot, write a short note with "what they tried", "what worked", "what broke", "what they asked for", and "what we will change"
- tag feedback as product, engine, UI, backend, pricing, or messaging
- decide within 24 hours whether each item is now, later, or no
- add serious misses to eval fixtures when possible
- add story-worthy proof to the proof-point process

Evidence:

- at least three pilot notes exist
- at least one pilot miss becomes a regression test or eval item
- at least one positioning change comes from user language

### Verification Gate For 80/100

Bidframe reaches **80/100** when all of these are true:

- 3-5 free pilots have been completed or scheduled with a repeatable process
- no critical access-control or privacy issue remains open
- job state survives refresh and failure cases truthfully
- logs can explain pilot failures by job id
- route bundle work has reduced obvious waste or documented why it cannot yet
- cross-user isolation tests pass
- source access tests pass for supported formats
- pilot feedback is captured in a consistent template
- at least one real user says they would run a future bid through it

### What Not To Do In This Band

- do not open self-serve signup broadly
- do not claim enterprise-grade security
- do not sell to regulated customers without a data handling review
- do not process sensitive packs unless the user explicitly accepts the early-stage risk
- do not overbuild analytics before logs and job ids are reliable

## Band 80-89: Private Beta Ready

### What This Band Means

Bidframe can support a small group of active users with lower-touch support. The team still knows the users personally, but the product no longer depends on a founder watching every upload.

This is the band for broader beta and selective paid pilots.

### User Exposure Allowed

10-25 active pilot teams.

Allowed:

- invite-only beta
- selective paid pilots
- public tenders and approved customer packs
- written pilot terms
- scheduled support windows

Still not allowed:

- broad public launch
- high-volume procurement teams without capacity planning
- regulated or highly confidential data without proper agreements

### Entry Criteria

- 80/100 gate is complete
- several pilot users have completed real workflows
- the team knows the top recurring failure modes
- the product has basic observability
- the team has a clear database and job durability plan

### Work To Complete This Band

#### 1. Move To Production-Grade Storage

Target state:

- data survives redeploys reliably
- concurrent users do not stress a local SQLite file
- requirements and answers can be queried without rewriting whole blobs

Tasks:

- migrate production data from SQLite to managed Postgres or equivalent
- create normalized tables for users, tenders, source docs, requirements, answers, open questions, decisions, jobs, and comments
- preserve JSON only where flexibility is useful and indexed access is not required
- add migrations
- add indexes for user, tender, requirement, status, source doc, and job lookups
- add backup and restore procedure

Evidence:

- migration runs in staging
- backup restore is tested
- concurrent reads and writes pass a small load test
- no production data is stored only on ephemeral disk

#### 2. Add A Real Job Queue

Target state:

- extraction and drafting jobs are durable
- concurrency is controlled
- expensive AI calls can be retried safely

Tasks:

- choose a queue: managed worker queue, Redis-backed queue, or platform-native queue
- store job payloads and state outside process memory
- add retry policies by error type
- add idempotency so retries do not duplicate requirements or answers
- add rate-limit handling for AI providers
- separate web request handling from long-running extraction work

Evidence:

- backend restart does not lose queued jobs
- retry behaviour is visible and bounded
- duplicate job submission does not create duplicate tender records
- concurrent pilot uploads stay within provider limits

#### 3. Move File Storage Out Of The App Process

Target state:

- uploaded files and generated source artifacts are stored durably
- file access is controlled and auditable

Tasks:

- choose object storage
- store original uploads, extracted source docs, previews, and generated artifacts with metadata
- generate short-lived access URLs or proxy through authenticated routes
- define retention policy
- define deletion policy
- add virus or file-safety scanning if sensitive customer docs are accepted

Evidence:

- file survives app redeploy
- deleted tender removes or disables associated files
- access links expire
- file metadata can be audited

#### 4. Build Rate Limits And Cost Controls

Target state:

- one heavy user cannot exhaust the system
- AI costs are visible and bounded

Tasks:

- add per-user upload limits
- add per-user drafting limits
- add file size and page count limits by plan or pilot agreement
- log token usage and model cost by job
- add admin controls to disable or throttle a user
- add clear user-facing messages when limits are reached

Evidence:

- test user hitting a limit sees a clear message
- cost per tender can be estimated
- admin can disable a runaway account

#### 5. Improve Accuracy Measurement

Target state:

- the team can say what the system is good at and where it still needs review
- pilots improve the gold set

Tasks:

- expand gold set across tender categories
- track mandatory recall, gating recall, source citation accuracy, answer grounding, and false positive burden
- add real pilot misses to eval fixtures when allowed
- separate demo metrics from production metrics
- add a regular eval report before releases

Evidence:

- eval report runs on demand
- known deal-breakers remain caught
- answer hallucination checks stay clean
- user-facing claims match measured results

#### 6. Add Team And Collaboration Basics

Target state:

- consultancies and SMEs can use Bidframe with more than one person
- roles are understandable

Tasks:

- define workspace or organisation model
- define owner, editor, reviewer, and viewer roles
- make invite and revoke flows reliable
- add audit trail for decisions and answer edits
- add comments or review notes only where they support the core workflow

Evidence:

- invite, accept, revoke, and access-denied cases work
- audit log records key actions
- users can explain who has access to a tender

#### 7. Formalise Support And Incident Response

Target state:

- support does not depend on memory
- incidents are handled calmly

Tasks:

- define support inbox or channel
- define severity levels
- define response expectations for beta users
- create an incident note template
- create a rollback checklist
- create a customer-facing incident explanation template

Evidence:

- test incident is run internally
- support issues are tracked
- beta users know how to reach the team

### Verification Gate For 90/100

Bidframe reaches **90/100** when all of these are true:

- production data is on durable storage
- file storage is durable and access-controlled
- long-running jobs are queue-backed
- rate limits and cost controls exist
- backups are tested
- at least 10 active users or pilot teams have used the product
- no unresolved critical privacy or data-loss issue remains
- support and incident processes exist
- eval reports are part of release checks
- the team can onboard a beta user without live developer intervention

### What Not To Do In This Band

- do not sell as fully enterprise-ready
- do not accept unlimited usage
- do not hide accuracy limitations
- do not let beta users become the monitoring system
- do not keep production data only in demo-era storage

## Band 90-100: Production SaaS Ready

### What This Band Means

Bidframe is ready for broader paid production use. The system may still be young, but the fundamentals are dependable: security, reliability, recovery, observability, support, and product honesty.

### User Exposure Allowed

Broader launch and paid production use.

Allowed:

- paid customers
- broader inbound demos
- larger pilot cohorts
- procurement teams with written terms
- confidential documents when covered by the right agreements and controls

### Entry Criteria

- 90/100 gate is complete
- storage, jobs, and file access are production-grade
- the team can operate the system without inspecting every run
- beta users have produced repeatable evidence of value

### Work To Complete This Band

#### 1. Security And Compliance Baseline

Target state:

- customers can trust the product with sensitive tender material
- the team can answer basic security questions without improvising

Tasks:

- write a data handling policy
- write a retention and deletion policy
- write a subprocessors list
- prepare a lightweight security questionnaire response
- enforce least-privilege access internally
- rotate secrets on a schedule and after incidents
- enable dependency vulnerability scanning
- add secret scanning
- review auth, file links, and API routes for server-side authorization
- add audit logs for document access and key decisions

Evidence:

- security docs exist
- secret scanning is enabled
- dependency review is part of release flow
- document access is auditable
- deletion request can be completed and verified

#### 2. Reliability And Scale

Target state:

- normal growth does not require emergency rewrites
- failures degrade gracefully

Tasks:

- define service-level objectives for uptime, successful upload rate, and processing time
- add alerting for error rate, queue depth, extraction duration, model failures, storage failures, and auth failures
- run load tests based on realistic tender sizes
- define autoscaling or worker scaling behaviour
- define maintenance windows
- test deploy rollback
- test restore from backup

Evidence:

- alerts fire in a controlled test
- backup restore is tested at least quarterly
- load test results are documented
- queue and worker scaling behaviour is known

#### 3. Product Completeness For Paid Use

Target state:

- the product supports the full pilot-to-renewal workflow
- users can succeed without founder translation

Tasks:

- improve onboarding for first tender upload
- add clear product limits and plan limits
- add team management
- add export workflows that match bid team habits
- add saved review state and decision history
- add support entry points inside the app
- add user-visible release notes for material changes

Evidence:

- a new user can complete first tender review from invite to export
- export is useful in real bid workflows
- support requests include enough context to debug

#### 4. Commercial Readiness

Target state:

- the team can charge without custom handling every account

Tasks:

- define packaging and pricing
- define trial, pilot, and paid conversion terms
- define cancellation and data deletion process
- add billing only when the manual sales motion proves willingness to pay
- create customer success check-in rhythm
- create renewal or expansion criteria

Evidence:

- paid pilot terms exist
- first paid users have clear scope
- the team knows gross margin per tender or per account

#### 5. Governance Of AI Behaviour

Target state:

- AI outputs are useful, traceable, and monitored
- the product remains honest as models or prompts change

Tasks:

- version prompts
- version extraction models
- log model provider and model name for each job
- keep eval reports across model changes
- require regression checks before prompt changes
- track hallucination or unsupported-answer incidents
- add customer-visible uncertainty and citation quality indicators

Evidence:

- model changes are traceable
- eval regression blocks unsafe releases
- unsupported answer incidents are documented and reduced

### Verification Gate For 100/100

100/100 does not mean perfect software. It means the team has mature control over the known risks.

Bidframe can claim this band only when:

- security, reliability, and support practices are routine
- production incidents are rare, visible, and recoverable
- customer data handling is documented and followed
- the system scales within known limits
- paid customers complete real workflows repeatedly
- AI quality is measured continuously
- roadmap decisions are driven by customer evidence, not only internal taste

### What Not To Do In This Band

- do not pretend AI removes expert review
- do not chase enterprise procurement checklists before revenue supports it
- do not keep manual founder fixes hidden from the product roadmap
- do not allow sales promises to outrun measured system behaviour

## Detailed Path From 62 To 70

This is the immediate plan. It is intentionally smaller than a full refactor.

### Sprint Goal

Move Bidframe from "good supervised demo" to "safe enough for 3-5 free, founder-led pilots."

### P0 Work

These items block the 70/100 threshold.

| Item | Owner | Why it matters | Done when |
|---|---|---|---|
| Fix source access consistency | Backend | Users must see only what they are allowed to see, across every source type | owner, collaborator, and denied tests pass |
| Remove remote font build dependency | Frontend | Deploy builds should not hang on network font fetches | production build succeeds without external font fetch |
| Verify production env and health | Backend/J | Pilots must not run on thin fallback extraction | hosted health check reports intended extractor |
| Add pilot verification checklist | Generalist/J | Team needs repeatable confidence before calls | one teammate can run the checks from docs |
| Add visible upload failure states | Frontend/Backend | Pilot users will upload messy files | bad files fail with clear recovery messages |
| Run two-account privacy check | Backend/Frontend | Trust failure here is fatal | second user cannot see first user's tenders or sources |
| Write pilot guardrails | J | Outreach must stay honest | public-tender-first pilot language is documented |

### P1 Work

These items should happen during the same push to 70 or immediately after.

| Item | Owner | Why it matters | Done when |
|---|---|---|---|
| Capture route bundle baseline | Frontend | Build-time and load-time problems need numbers | route bundle stats saved before changes |
| Split global demo data from product state | Frontend | Demo data should not burden every route | product routes no longer import large fixtures through root context |
| Document backend single-process assumptions | Backend | The team must know what breaks on scale | runbook explains jobs, events, redeploys, and storage |
| Add job failure reason to UI | Backend/Frontend | Users need to know what happened | failed processing shows a reason and retry path |
| Make backend test setup easier | Backend/Generalist | Tests should not depend on one developer's machine | dependencies can be installed and tests can run from docs |

### P2 Work

These are useful, but they should not delay the first tiny pilot cohort if the P0 gate is clean.

| Item | Owner | Why it matters | Done when |
|---|---|---|---|
| Begin Postgres design | Backend | Avoid emergency migration later | migration plan exists |
| Begin queue design | Backend | Durable jobs are required for beta | queue choice and job model are documented |
| Improve component boundaries | Frontend | Large components slow future changes | split follows measured route or ownership pain |
| Add structured pilot logs | Backend | Debugging needs job ids and outcomes | every pilot run has a traceable job id |

### 70/100 Pilot Checklist

Before offering a first free pilot, run this checklist:

- [ ] frontend lint passes
- [ ] frontend production build passes
- [ ] backend import check passes
- [ ] mixed-pack smoke passes
- [ ] gating floor smoke passes
- [ ] hosted health check reports the intended extractor
- [ ] two-account isolation passes
- [ ] source documents open for allowed users and fail for denied users
- [ ] upload failure states are understandable
- [ ] pilot tender is public or explicitly approved by the user
- [ ] user knows this is an early free pilot for blunt feedback
- [ ] pilot notes template is ready
- [ ] fallback demo or preloaded tender is ready in case live upload is slow

### First Pilot Script

Use this shape:

1. Ask the user for a public tender they know or a tender they are comfortable sharing.
2. Explain that Bidframe creates a reviewable first-read, not a final bid.
3. Upload or pre-load the tender.
4. Show mandatory requirements and deal-breakers first.
5. Open source proof for one important requirement.
6. Show uncertainty and open questions.
7. If capability docs are available, draft a small number of answers and inspect citations.
8. Ask what they would trust, what they would not trust, and what would make it useful in their next bid.
9. Ask whether they would run a future bid through it.
10. Ask for permission before quoting any feedback.

### First Pilot Success Criteria

A first pilot is successful if:

- the user understands the product in under 10 minutes
- at least one real requirement or deal-breaker feels useful to them
- source proof is inspected and understood
- the product does not bluff when evidence is missing
- any failure is recoverable or clearly explained
- the user gives a concrete next step, such as "send me the matrix", "try this tender", or "I would use this on my next bid"

A first pilot is not successful if:

- the founder has to explain around broken basics
- the user cannot verify where requirements came from
- the system invents unsupported answer claims
- the user is left waiting without job status
- access control behaves inconsistently
- the team cannot reproduce what happened afterwards

## Refactor Guidance

The audit does **not** support a full rewrite right now.

It does support a focused production refactor in this order:

1. Fix trust and access bugs.
2. Remove build fragility.
3. Make upload and job failure states recoverable.
4. Separate demo-heavy frontend data from live product routes.
5. Add repeatable verification.
6. Add observability.
7. Move jobs, files, and data to durable production services.

Do not refactor for neatness alone. Refactor when it removes one of these risks:

- a user could see the wrong document
- a user could be blocked from a document they should see
- deploys are slow or fragile
- a user can get stuck in a broken processing state
- a backend restart loses important state
- a route ships large code or data it does not need
- the team cannot prove whether a change made quality better or worse

## Suggested Ownership Model

Use clear lanes, but keep the gates cross-functional.

| Area | Primary owner | Secondary reviewer | Notes |
|---|---|---|---|
| Source access and auth | Backend | Frontend | Reviewer should manually verify from the UI |
| Build reliability and bundles | Frontend | Generalist | Capture before/after numbers |
| Eval and smoke checks | Generalist | Backend | Add pilot misses to fixtures |
| Pilot messaging and notes | J | Generalist | Keep claims honest |
| Deployment and env | Backend/J | Frontend | Health check before every pilot |
| Product workflow | Frontend | J | Keep user control visible |

## Weekly Rhythm Until 80

Daily:

- update current blockers
- run the pilot verification checklist before any user call
- log any pilot evidence or serious miss

Twice weekly:

- review score against the current band gate
- decide P0/P1/P2 changes
- prune work that does not move the next gate

After every pilot:

- write the result note within 24 hours
- add confirmed misses to eval or backlog
- update outreach language if the user's words are better than ours
- log proof only when it is specific, permissioned, and verifiable

Before each deploy:

- run frontend lint and build
- run backend smoke/import checks
- verify hosted health
- verify one known tender path
- confirm no secrets or tender PDFs are being committed

## Scoring Checklist

Use this rough distribution when updating the score.

| Area | Points | What good looks like |
|---|---:|---|
| Product workflow | 15 | users can complete upload, review, source check, decision, and export/draft flow |
| Frontend reliability and performance | 15 | builds are reliable, bundles are controlled, UI handles loading and errors |
| Backend reliability | 20 | jobs, storage, auth, uploads, and APIs behave under realistic use |
| Engine quality and safety | 20 | deal-breakers are caught, answers are grounded, uncertainty is visible |
| Security and privacy | 15 | access control, token handling, file handling, and data separation are trustworthy |
| Operations and team process | 15 | deployment, tests, logs, support, and pilot learning are repeatable |

Current rough score:

| Area | Current | Reason |
|---|---:|---|
| Product workflow | 11/15 | strong demo and review workflow, still uneven for failure states |
| Frontend reliability and performance | 9/15 | build passes, but font/network fragility and large route bundles remain |
| Backend reliability | 11/20 | works for demos, but in-memory jobs/events and SQLite limit pilot confidence |
| Engine quality and safety | 15/20 | strong relative to stage, but needs broader production eval evidence |
| Security and privacy | 8/15 | auth exists, but query tokens and source access inconsistency are material |
| Operations and team process | 8/15 | strong hackathon docs, but pilot verification and support need hardening |
| Total | 62/100 | ready for concierge discovery, not yet free pilots |

## Decision Rules

Use these rules when the team is debating whether to move faster.

Move to free pilots when:

- the user data risk is controlled
- the build/deploy path is predictable
- the product can fail clearly
- the team can verify the build before a call
- the outreach promise is honest

Pause pilots when:

- source access is inconsistent
- the hosted backend is in fallback extraction mode
- upload failure leaves users stuck
- the latest build cannot be verified
- a user reports a possible privacy issue

Start charging when:

- at least one pilot user says they would use it on a future bid
- the workflow succeeds without founder rescue
- support and recovery are defined
- the team understands cost per tender
- the buyer knows exactly what is early

Start broad launch only when:

- storage, jobs, files, auth, and monitoring are production-grade
- the team can support failures without panic
- security and data handling docs exist
- enough users have completed real workflows to prove repeatability

## Bottom Line

Bidframe does not need a rewrite before pilots.

It needs a focused trust-and-reliability pass to move from **62 to 70**. That means fixing access consistency, removing build fragility, making uploads and jobs recoverable, verifying deployment settings, and turning the outreach motion into a controlled pilot operating system.

Once that is done, the team should run **3-5 free, founder-led pilots** using public or explicitly approved tenders. Those pilots should decide the next refactor priorities better than internal debate will.
