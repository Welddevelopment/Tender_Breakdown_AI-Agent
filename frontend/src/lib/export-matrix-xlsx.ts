import type { AwardCriterion, Requirement } from "@/types/requirement";
import { slugifyTitle, triggerDownload } from "@/lib/export-response";
import { confidenceTier, type ConfidenceTier } from "@/components/ConfidenceIndicator";
import { sourceRefLabel } from "@/lib/source-doc";

// The styled Excel export of the compliance matrix — the rich sibling of the
// plain CSV in MatrixView. Follows the export-response.ts discipline: exceljs
// is dynamically imported INSIDE the export function, so the ~1MB library is
// code-split into its own async chunk and only fetched when a user actually
// exports. Everything judge-facing stays honest here too: confidence lands as
// a tier WORD (High / Medium / Low), never the raw number, and gating rows are
// visually loud (oxblood-tinted fill, bold ref).

export interface MatrixXlsxInput {
  title: string;
  requirements: Requirement[];
  awardCriteria: AwardCriterion[];
}

// Design-system hexes (globals.css), in exceljs ARGB form.
const INK = "FF211D17";
const PAPER = "FFF6F2E9";
const FOREST = "FF2C5640";
const INK_MUTED = "FF6B6358";
// A faint oxblood wash: signal-oxblood #b42d24 at ~10% over paper.
const OXBLOOD_TINT = "FFF3E2DC";

// Tier word for the sheet: the three-word export lexicon. needs_review demotion
// comes from confidenceTier itself, and the alarm tier stays Low — a word, not
// a score, so no reader can mistake it for precision.
const TIER_EXPORT_WORD: Record<ConfidenceTier, string> = {
  oxblood: "Low",
  amber: "Low",
  yellow: "Medium",
  "light-green": "High",
};

const HEADERS = [
  "Ref / clause",
  "Source document",
  "Requirement",
  "Category",
  "Mandatory?",
  "Gating?",
  "Award criterion",
  "Weight %",
  "Confidence",
  "Status",
  "Decision note",
  "Answer verdict",
  "Drafted answer",
  "Evidence refs",
];

const COLUMN_WIDTHS = [16, 26, 64, 16, 11, 9, 20, 10, 12, 11, 30, 16, 52, 48];

// Columns whose cells hold running prose and should wrap. (1-indexed exceljs cols;
// shifted by the new "Answer verdict" column: requirement 3, decision note 11,
// drafted answer 13, evidence 14.)
const WRAP_COLUMNS = new Set([3, 11, 13, 14]);

// The answer's own verdict (Stage 5), as a plain word for the sheet — a state,
// never a score. Blank until a human rules on the draft.
function answerVerdictWord(req: Requirement): string {
  const verdict = req.answer?.decision?.verdict;
  if (verdict === "approved") return "Approved";
  if (verdict === "flagged") return "Flagged";
  return "";
}

function evidenceLabel(req: Requirement): string {
  return (
    req.answer?.evidence_refs
      ?.map((ref) => `${ref.doc_id} p.${ref.page}: ${ref.excerpt}`)
      .join(" | ") ?? ""
  );
}

// The 14 cell values for one requirement's row, in HEADERS order. Shared by the
// XLSX and CSV exports so the two matrix formats can never drift.
function matrixCells(
  req: Requirement,
  criteriaById: Map<string, AwardCriterion>
): (string | number)[] {
  const criterion = req.criteria_ref ? criteriaById.get(req.criteria_ref) : undefined;
  const tier = confidenceTier(req.confidence, { needsReview: req.needs_review });
  return [
    sourceRefLabel(req),
    req.source_filename ?? "",
    req.text,
    req.category,
    req.type === "mandatory" ? "Yes" : "No",
    req.is_gating ? "Yes" : "No",
    criterion?.name ?? (req.criteria_ref ?? ""),
    criterion?.weight ?? "",
    TIER_EXPORT_WORD[tier],
    req.status,
    req.decision?.note ?? "",
    answerVerdictWord(req),
    req.answer?.text ?? req.draft_answer ?? "",
    evidenceLabel(req),
  ];
}

// CSV fallback for the compliance matrix (brief: XLSX first, CSV fallback). Same
// columns as the XLSX via matrixCells; RFC-4180 quoting. Plain record, no styling.
export function exportMatrixCsv(input: MatrixXlsxInput): void {
  const { title, requirements, awardCriteria } = input;
  const criteriaById = new Map(awardCriteria.map((c) => [c.id, c]));
  const esc = (value: string | number): string => {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [HEADERS.map(esc).join(",")];
  for (const req of requirements) {
    lines.push(matrixCells(req, criteriaById).map(esc).join(","));
  }
  const blob = new Blob([lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  triggerDownload(blob, `${slugifyTitle(title)}-compliance-matrix.csv`);
}

export async function exportMatrixXlsx(input: MatrixXlsxInput): Promise<void> {
  // Dynamic import keeps exceljs out of the main bundle (see header comment).
  const { Workbook } = await import("exceljs");
  const { title, requirements, awardCriteria } = input;
  const criteriaById = new Map(awardCriteria.map((c) => [c.id, c]));

  const workbook = new Workbook();
  workbook.creator = "Bidframe";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Compliance matrix", {
    // Freeze the title + header rows so the header stays put while scrolling.
    views: [{ state: "frozen", ySplit: 2 }],
  });
  sheet.columns = COLUMN_WIDTHS.map((width) => ({ width }));

  // Row 1 — the title plate: tender title + count, bold 14pt (Fraunces where
  // the reader has it, a serif fallback otherwise).
  const noun = requirements.length === 1 ? "requirement" : "requirements";
  sheet.mergeCells(1, 1, 1, HEADERS.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `${title} — ${requirements.length} ${noun}`;
  titleCell.font = { name: "Fraunces", size: 14, bold: true, color: { argb: INK } };
  titleCell.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 28;

  // Row 2 — the header band: ink fill, paper text, bold, with an autofilter.
  const headerRow = sheet.getRow(2);
  headerRow.values = HEADERS;
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
    cell.font = { size: 10, bold: true, color: { argb: PAPER } };
    cell.alignment = { vertical: "middle" };
  });
  sheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: HEADERS.length },
  };

  for (const req of requirements) {
    const row = sheet.addRow(matrixCells(req, criteriaById));

    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.alignment = {
        vertical: "top",
        wrapText: WRAP_COLUMNS.has(col),
      };
      cell.font = { size: 10, color: { argb: INK } };
      if (req.is_gating) {
        // Deal-breakers stay loud on paper: a faint oxblood wash across the row.
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: OXBLOOD_TINT },
        };
      }
    });
    // Bold ref anchors the gating row; muted note keeps the record quiet.
    if (req.is_gating) {
      row.getCell(1).font = { size: 10, bold: true, color: { argb: INK } };
    }
    row.getCell(11).font = { size: 10, color: { argb: INK_MUTED } };
    // A settled decision reads in forest — the one earned colour.
    if (req.status === "accepted") {
      row.getCell(10).font = { size: 10, bold: true, color: { argb: FOREST } };
    }
    // An approved answer verdict earns forest too; the word carries it in greyscale.
    if (req.answer?.decision?.verdict === "approved") {
      row.getCell(12).font = { size: 10, bold: true, color: { argb: FOREST } };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `${slugifyTitle(title)}-compliance-matrix.xlsx`);
}
