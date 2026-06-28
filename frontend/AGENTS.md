@../AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Frontend-only quick reference

- Mock data: `src/data/mock-requirements.ts`
- Types: `src/types/requirement.ts`
- Main view: `src/app/page.tsx` + `src/components/ComplianceMatrix.tsx`
- Run: `npm run dev` from this directory
