import type {
  Actor,
  CapabilityDoc,
  Requirement,
  RequirementStatus,
} from "@/types/requirement";
import { sourceRefLabel } from "@/lib/source-doc";

// Builders for the export menu. Content = the drafted answers grouped by
// requirement, each with its evidence citations, verdict, and any gap Q/A, in the
// order the workspace is showing them. All builders are pure (reqs + docs + title
// in, string/Blob out). The DOCX path dynamically imports the `docx` package so
// it is code-split out of the main /answers chunk and only pulled when a user
// actually picks DOCX. PDF is not here — it's the browser's own Save-as-PDF over
// the print stylesheet (see globals.css @media print).
//
// Exports are record-led (design-language.md): the emitted files carry no forest
// decoration, keep unresolved gaps visible, and speak in the mono record voice —
// source refs, verdicts, and audit lines read as the record, not as prose.

// "client" trims the response draft to what's fit to send outside the team:
// approved answers only, as clean prose — no internal source refs, verdict audit
// lines, or gap notes. "internal" (default) keeps the full detail. Honesty holds
// because the client-ready pack only ever contains approved answers, and the menu
// won't offer it while a deal-breaker, flag, or unapproved gating answer is open.
export type ExportAudience = "internal" | "client";

export interface ExportInput {
  title: string;
  requirements: Requirement[];
  capabilityDocs: CapabilityDoc[];
  audience?: ExportAudience;
}

function docNameLookup(docs: CapabilityDoc[]): (docId: string) => string {
  const byId = new Map(docs.map((d) => [d.doc_id, d.filename]));
  return (docId) => byId.get(docId) ?? docId;
}

// The record names who decided, by name or email — an export is a document, so
// it can't say "you". Falls back to a neutral noun rather than inventing a name.
function actorName(actor?: Actor | null): string {
  return actor?.name?.trim() || actor?.email || "the reviewer";
}

// A full date-and-time stamp for the record (exports are documents, not the live
// app's HH:MM). SSR-safe; echoes the raw string if it can't be parsed.
function formatStamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// The requirement's own decision, as a dry past-tense audit line (or null while
// pending). Mirrors the app's audit voice, named for the record.
function requirementAuditLine(req: Requirement): string | null {
  if (!req.decision) return null;
  const who = actorName(req.decision.actor);
  const when = formatStamp(req.decision.timestamp);
  switch (req.status) {
    case "accepted":
      return `Requirement approved by ${who}, ${when}.`;
    case "edited":
      return `Requirement edited by ${who}, ${when}.`;
    case "flagged":
      return `Requirement flagged by ${who}, ${when}.`;
    default:
      return null;
  }
}

// The answer's own verdict (Stage 5), as an audit line (or null while undecided).
function answerVerdictLine(req: Requirement): string | null {
  const decision = req.answer?.decision;
  if (!decision) return null;
  const who = actorName(decision.actor);
  const when = formatStamp(decision.timestamp);
  return decision.verdict === "approved"
    ? `Answer approved by ${who}, ${when}.`
    : `Answer flagged by ${who}, ${when}.`;
}

// A neutral, structured view of one requirement's response, shared by every
// text-based builder so MD / TXT / DOCX stay in lockstep.
interface Block {
  requirement: string;
  source: string;
  status: RequirementStatus;
  requirementAudit: string | null; // "Requirement approved by X, …" (or null)
  answer: string | null; // null => no draft yet
  answerVerdict: string | null; // "Answer approved by X, …" (or null)
  evidence: string[]; // "Backed by {filename}, p.{page}: “excerpt”"
  answered: { question: string; answer: string }[];
  outstanding: string[];
}

function toBlocks(input: ExportInput): Block[] {
  const docName = docNameLookup(input.capabilityDocs);
  // A client-ready draft carries only the answers a human has approved.
  const requirements =
    input.audience === "client"
      ? input.requirements.filter(
          (req) => req.answer?.decision?.verdict === "approved"
        )
      : input.requirements;
  return requirements.map((req) => {
    const answerText = (req.answer?.text ?? req.draft_answer ?? "").trim();

    const answered: { question: string; answer: string }[] = [];
    const outstanding: string[] = [];
    for (const q of req.open_questions ?? []) {
      if (q.answer) answered.push({ question: q.question, answer: q.answer });
      else outstanding.push(q.question);
    }

    return {
      requirement: req.text,
      source: sourceRefLabel(req),
      status: req.status,
      requirementAudit: requirementAuditLine(req),
      answer: answerText.length > 0 ? answerText : null,
      answerVerdict: answerVerdictLine(req),
      evidence: (req.answer?.evidence_refs ?? []).map(
        (ref) => `Backed by ${docName(ref.doc_id)}, p.${ref.page}: “${ref.excerpt}”`
      ),
      answered,
      outstanding,
    };
  });
}

export function buildMarkdown(input: ExportInput): string {
  const client = input.audience === "client";
  const blocks = toBlocks(input);
  const subtitle = client
    ? "Bid response — approved answers."
    : "Response pack — drafted answers with evidence.";
  const out: string[] = [`# ${input.title}`, "", subtitle, ""];
  blocks.forEach((b, i) => {
    out.push(`## ${i + 1}. ${b.requirement}`);
    if (!client) out.push(`*Source: ${b.source}*`);
    out.push("", "**Answer**", "");
    out.push(b.answer ?? "_No draft yet._", "");
    if (client) {
      out.push("");
      return;
    }
    if (b.answerVerdict) out.push(`\`${b.answerVerdict}\``, "");
    if (b.evidence.length > 0) {
      for (const e of b.evidence) out.push(`> ${e}`);
      out.push("");
    }
    for (const qa of b.answered) {
      out.push(`- **Q:** ${qa.question}`, `  **A:** ${qa.answer}`);
    }
    for (const q of b.outstanding) out.push(`- **Outstanding:** ${q}`);
    out.push("");
  });
  return out.join("\n");
}

export function buildText(input: ExportInput): string {
  const client = input.audience === "client";
  const blocks = toBlocks(input);
  const subtitle = client
    ? "Bid response — approved answers."
    : "Response pack — drafted answers with evidence.";
  const out: string[] = [
    input.title,
    "=".repeat(input.title.length),
    "",
    subtitle,
    "",
  ];
  blocks.forEach((b, i) => {
    out.push(`${i + 1}. ${b.requirement}`);
    if (!client) out.push(`   Source: ${b.source}`);
    out.push("", "   Answer:");
    out.push(`   ${b.answer ?? "No draft yet."}`, "");
    if (client) return;
    if (b.answerVerdict) out.push(`   ${b.answerVerdict}`, "");
    for (const e of b.evidence) out.push(`   - ${e}`);
    if (b.evidence.length > 0) out.push("");
    for (const qa of b.answered) {
      out.push(`   Q: ${qa.question}`, `   A: ${qa.answer}`);
    }
    for (const q of b.outstanding) out.push(`   Outstanding: ${q}`);
    out.push("");
  });
  return out.join("\n");
}

export async function buildDocx(input: ExportInput): Promise<Blob> {
  // Dynamic import keeps the ~hundreds-of-KB docx lib out of the initial bundle.
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import("docx");
  const client = input.audience === "client";
  const blocks = toBlocks(input);

  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({ text: input.title, heading: HeadingLevel.TITLE }),
    new Paragraph({
      text: client
        ? "Bid response — approved answers."
        : "Response pack — drafted answers with evidence.",
    }),
  ];

  blocks.forEach((b, i) => {
    children.push(
      new Paragraph({ text: `${i + 1}. ${b.requirement}`, heading: HeadingLevel.HEADING_2 })
    );
    if (!client) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: `Source: ${b.source}`, italics: true })] })
      );
    }
    children.push(
      new Paragraph({ children: [new TextRun({ text: "Answer", bold: true })] })
    );
    children.push(new Paragraph({ text: b.answer ?? "No draft yet." }));
    if (client) {
      children.push(new Paragraph({ text: "" }));
      return;
    }
    if (b.answerVerdict) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: b.answerVerdict, italics: true })],
        })
      );
    }
    for (const e of b.evidence) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: e, italics: true })] })
      );
    }
    for (const qa of b.answered) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: `Q: ${qa.question}`, bold: true })] })
      );
      children.push(new Paragraph({ text: `A: ${qa.answer}` }));
    }
    for (const q of b.outstanding) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: `Outstanding: ${q}`, bold: true })] })
      );
    }
    children.push(new Paragraph({ text: "" }));
  });

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}

// ---- Audit / Evidence Pack (the internal proof trail) -----------------------
// UX-OVERHAUL-BRIEF: an internal proof artifact, not a client-facing draft. Per
// requirement it records the decision trail (status + requirement audit line),
// the answer with its verdict, every evidence citation in full, the source ref,
// and any unresolved gap left explicitly visible.

export function buildEvidencePackMarkdown(input: ExportInput): string {
  const blocks = toBlocks(input);
  const out: string[] = [
    `# ${input.title}`,
    "",
    "Audit and evidence pack — the decision trail and the evidence behind each answer. Internal record.",
    "",
  ];
  blocks.forEach((b, i) => {
    out.push(`## ${i + 1}. ${b.requirement}`);
    out.push(`*Source: ${b.source}*`, "");
    out.push(`- Requirement status: ${b.status}`);
    if (b.requirementAudit) out.push(`- ${b.requirementAudit}`);
    out.push("", "**Answer**", "");
    out.push(b.answer ?? "_No draft yet._", "");
    out.push(`- ${b.answerVerdict ?? "No answer verdict yet."}`, "");
    if (b.evidence.length > 0) {
      out.push("**Evidence**", "");
      for (const e of b.evidence) out.push(`> ${e}`);
      out.push("");
    } else {
      out.push("**Evidence:** none linked yet.", "");
    }
    for (const qa of b.answered) {
      out.push(`- **Q:** ${qa.question}`, `  **A:** ${qa.answer}`);
    }
    for (const q of b.outstanding) out.push(`- **Outstanding:** ${q}`);
    out.push("");
  });
  return out.join("\n");
}

export async function buildEvidencePackDocx(input: ExportInput): Promise<Blob> {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import("docx");
  const blocks = toBlocks(input);

  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({ text: input.title, heading: HeadingLevel.TITLE }),
    new Paragraph({
      text: "Audit and evidence pack — the decision trail and the evidence behind each answer. Internal record.",
    }),
  ];

  blocks.forEach((b, i) => {
    children.push(
      new Paragraph({ text: `${i + 1}. ${b.requirement}`, heading: HeadingLevel.HEADING_2 })
    );
    children.push(
      new Paragraph({ children: [new TextRun({ text: `Source: ${b.source}`, italics: true })] })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Requirement status: ${b.status}`, italics: true })],
      })
    );
    if (b.requirementAudit) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: b.requirementAudit, italics: true })] })
      );
    }
    children.push(new Paragraph({ children: [new TextRun({ text: "Answer", bold: true })] }));
    children.push(new Paragraph({ text: b.answer ?? "No draft yet." }));
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: b.answerVerdict ?? "No answer verdict yet.", italics: true }),
        ],
      })
    );
    children.push(new Paragraph({ children: [new TextRun({ text: "Evidence", bold: true })] }));
    if (b.evidence.length > 0) {
      for (const e of b.evidence) {
        children.push(new Paragraph({ children: [new TextRun({ text: e, italics: true })] }));
      }
    } else {
      children.push(new Paragraph({ text: "None linked yet." }));
    }
    for (const qa of b.answered) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: `Q: ${qa.question}`, bold: true })] })
      );
      children.push(new Paragraph({ text: `A: ${qa.answer}` }));
    }
    for (const q of b.outstanding) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: `Outstanding: ${q}`, bold: true })] })
      );
    }
    children.push(new Paragraph({ text: "" }));
  });

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}

export function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : "response-pack";
}

// Trigger a client-side download for a built Blob (mirrors the CSV export in
// MatrixView). No-op on the server.
export function triggerDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
