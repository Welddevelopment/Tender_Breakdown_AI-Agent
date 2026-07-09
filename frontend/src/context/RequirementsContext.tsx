"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  Actor,
  Answer,
  AnswerDecision,
  AwardCriterion,
  CapabilityDoc,
  Requirement,
  RequirementDecision,
  RequirementStatus,
  SourceDoc,
  Tender,
} from "@/types/requirement";
import { useAuth } from "@/context/AuthContext";
import { loadDemoTender } from "@/data/demo-tender";
import {
  draftAnswers as apiDraftAnswers,
  getTender,
  isApiEnabled,
  patchRequirement,
  tenderEventsUrl,
  type TenderEvent,
} from "@/lib/api";
import {
  loadAnswerStore,
  mergeStoreIntoRequirements,
  projectStore,
  saveAnswerStore,
} from "@/lib/answer-store";
import { compareWeakestFirst, hasDraft } from "@/lib/answers";

// The no-backend demo default is the same real Bradwell tender the /showcase
// runs on, so every app surface (Matrix / Bid / Graph) shows one coherent
// tender until a live one is loaded. It is LAZY now (loadDemoTender): the
// prebake JSON used to be imported at module top level, which shipped the demo
// tender in this provider's chunk on every authed route (frontend-jawad.md A2).
// Live mode never renders it: the NoTenderLoaded gate intercepts until a real
// tender is fetched.

const SAVE_FAILED =
  "Couldn't save that change to the server. It shows here, but may not have been kept. Check your connection, then redo it.";

// A draft run in flight (live or the sample-mode replay): which cards are still
// waiting for their answer (the card shows a skeleton), which just landed (the
// card runs its one-shot settle), and the run's total for the "N of M drafted"
// count. Null whenever no run is playing.
export interface DraftRun {
  pending: Set<string>;
  landed: Set<string>;
  total: number;
}

// The undo seam for batch decisions: what to capture before a bulk change so it
// can be put back exactly (status + recorded decision), one entry per id.
export interface DecisionSnapshot {
  id: string;
  status: RequirementStatus;
  decision: RequirementDecision | null;
}

// The undo seam for answer content: the whole answer object + the deprecated
// draft_answer alias, captured before an edit or a bulk answer-approve so Undo
// restores the exact prior draft, state, verdict, and evidence.
export interface AnswerSnapshot {
  id: string;
  answer: Answer | null;
  draftAnswer: string | null;
}

interface RequirementsContextValue {
  requirements: Requirement[];
  // True only for the moment the mock demo seed is still lazy-loading (no
  // backend, no frozen tender). Work surfaces hold a calm shell instead of
  // mounting empty — which would also burn their one-shot entrance choreography.
  seeding: boolean;
  capabilityDocs: CapabilityDoc[];
  sourceDocs: SourceDoc[];
  awardCriteria: AwardCriterion[];
  title: string;
  tenderId: string | null;
  drafting: boolean;
  updateRequirement: (id: string, patch: Partial<Requirement>) => void;
  approve: (id: string) => void;
  editRequirement: (id: string, note: string) => void;
  flag: (id: string, note: string) => void;
  approveMany: (ids: string[]) => void;
  flagMany: (ids: string[], note: string) => void;
  snapshotDecisions: (ids: string[]) => DecisionSnapshot[];
  restoreDecisions: (snapshot: DecisionSnapshot[]) => void;
  reopen: (id: string) => void;
  editAnswer: (id: string, text: string) => void;
  // Answer-scoped decisions — a verdict on the drafted answer, independent of the
  // requirement's own status. In-memory + localStorage only (no backend endpoint
  // for answer content yet), so unlike approve/flag these never PATCH.
  approveAnswer: (id: string) => void;
  flagAnswer: (id: string, note: string) => void;
  reopenAnswer: (id: string) => void;
  // Bulk answer-approve (the /answers ready-drafts control) + the answer-content
  // undo seam it and the panel's edit share.
  approveAnswers: (ids: string[]) => void;
  snapshotAnswers: (ids: string[]) => AnswerSnapshot[];
  restoreAnswers: (snapshot: AnswerSnapshot[]) => void;
  answerOpenQuestion: (
    reqId: string,
    questionId: string,
    answerText: string
  ) => void;
  loadTender: (tenderId: string) => Promise<void>;
  draftAnswers: (provider?: "openai" | "mock", files?: File[]) => Promise<void>;
  demoDraft: () => void;
  draftRun: DraftRun | null;
  // Draft-edit sessions for the answers workspace, keyed by requirement id so
  // mid-edit text survives the card unmounting on a re-sort/filter change.
  answerEdits: Record<string, string>;
  beginAnswerEdit: (id: string, initial: string) => void;
  updateAnswerEdit: (id: string, text: string) => void;
  endAnswerEdit: (id: string) => void;
}

const RequirementsContext = createContext<RequirementsContextValue | null>(null);

export function RequirementsProvider({
  children,
  initialTender,
}: {
  children: React.ReactNode;
  // Freeze the provider on a specific tender instead of the mock. The read-only
  // /demo showcase passes the pre-baked SPSO run here so it shows a real tender
  // with no backend or API key, independent of the app's live/mock state.
  initialTender?: Tender;
}) {
  // Seeded from initialTender synchronously when a caller freezes the provider
  // on a specific tender (demo/pitch/pack pages — no flash there), or lazily
  // from the demo prebake in mock mode (the effect below), so the JSON stays
  // out of the shared bundle. loadTender() swaps in a real tender when the API
  // is wired up.
  const [seed, setSeed] = useState<Tender | null>(initialTender ?? null);
  const [requirements, setRequirements] = useState<Requirement[]>(
    () => initialTender?.requirements ?? []
  );
  const [capabilityDocs, setCapabilityDocs] = useState<CapabilityDoc[]>(
    () => initialTender?.capability_docs ?? []
  );
  const [sourceDocs, setSourceDocs] = useState<SourceDoc[]>(
    () => initialTender?.source_docs ?? []
  );
  // The tender's published award criteria (name + weight, #27) — the matrix
  // lens and the graph both read real names + weights from here. Empty until
  // the tender publishes them; refreshed alongside requirements on load/draft.
  const [awardCriteria, setAwardCriteria] = useState<AwardCriterion[]>(
    () => initialTender?.award_criteria ?? []
  );

  // Mock mode with no frozen tender: pull the demo seed the moment the provider
  // hydrates (the chunk fetch is the price of the lighter first load; it starts
  // immediately, not on user action). Live mode skips this — NoTenderLoaded
  // gates until a real tender is fetched.
  useEffect(() => {
    if (seed || isApiEnabled()) return;
    let cancelled = false;
    loadDemoTender().then((tender) => {
      if (!cancelled) setSeed(tender);
    });
    return () => {
      cancelled = true;
    };
  }, [seed]);

  // Adopt the lazy seed when it lands: the four data states fill from it, with
  // any locally-persisted answer edits merged in (this replaces the old
  // synchronous mount merge, which assumed the seed was already in state).
  // Never runs for a frozen initialTender (already seeded synchronously) and
  // never overwrites a live tender that loaded first.
  const seedAdoptedRef = useRef(false);
  useEffect(() => {
    if (!seed || initialTender || seedAdoptedRef.current) return;
    seedAdoptedRef.current = true;
    setRequirements((prev) => {
      if (prev.length > 0) return prev; // a live tender won the race
      const stored = loadAnswerStore(seed.tender_id);
      return Object.keys(stored).length > 0
        ? mergeStoreIntoRequirements(seed.requirements, stored)
        : seed.requirements;
    });
    setCapabilityDocs((prev) =>
      prev.length > 0 ? prev : (seed.capability_docs ?? [])
    );
    setSourceDocs((prev) => (prev.length > 0 ? prev : (seed.source_docs ?? [])));
    setAwardCriteria((prev) =>
      prev.length > 0 ? prev : (seed.award_criteria ?? [])
    );
  }, [seed, initialTender]);
  // The live tender currently loaded (null on the mock default). Needed so the
  // autofill action knows which tender to draft against.
  const [tenderId, setTenderId] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const { user } = useAuth(); // for collaboration attribution on decisions (null when signed out)

  // Where the answers response workspace persists a human's draft edits + gap
  // answers (localStorage; there's no backend endpoint for answer text yet). Key
  // by the live tender when one is loaded, else the seed's id so the mock/demo
  // build keeps edits across a refresh. A frozen /demo showcase (initialTender)
  // stays read-only, and there is no key while the lazy seed is still loading
  // (requirements empty) — otherwise the persist effect below would overwrite
  // the stored edits with an empty projection before adoption merges them back.
  const persistKey =
    tenderId ??
    (initialTender || requirements.length === 0 ? null : (seed?.tender_id ?? null));

  function updateRequirement(id: string, patch: Partial<Requirement>) {
    setRequirements((prev) =>
      prev.map((req) => (req.id === id ? { ...req, ...patch } : req))
    );
  }

  // Replace the in-memory tender with one fetched from the live backend.
  async function loadTender(id: string) {
    const tender = await getTender(id);
    // Merge any locally-saved answer edits + gap answers for this tender back
    // over the fresh server data (evidence and machine fields stay from the API).
    setRequirements(
      mergeStoreIntoRequirements(tender.requirements, loadAnswerStore(id))
    );
    setCapabilityDocs(tender.capability_docs ?? []);
    setSourceDocs(tender.source_docs ?? []);
    setAwardCriteria(tender.award_criteria ?? []);
    setTenderId(id);
    try {
      window.sessionStorage.setItem("bf-tender", id);
    } catch {
      // sessionStorage unavailable (private mode) — refresh-restore just won't work.
    }
  }

  // #28: restore the last live tender on a refresh — its decisions come back too,
  // since the backend persists them. sessionStorage keeps it tab-scoped (cleared
  // when the tab closes). The mock/demo (no API) is unaffected.
  useEffect(() => {
    // A seeded demo is frozen — never override it with a live/restored tender,
    // even when NEXT_PUBLIC_API_BASE_URL is set on the hosted build.
    if (initialTender) return;
    if (!isApiEnabled()) return;
    let saved: string | null = null;
    try {
      saved = window.sessionStorage.getItem("bf-tender");
    } catch {
      saved = null;
    }
    if (saved) {
      // Async restore: loadTender awaits the fetch before setting any state, so this
      // is not a synchronous cascading render (the rule can't see past the await).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadTender(saved).catch(() => {
        try {
          window.sessionStorage.removeItem("bf-tender");
        } catch {
          /* ignore */
        }
      });
    }
  }, [initialTender]);

  // (Locally-saved answer edits for the mock/demo default are merged when the
  // lazy seed is adopted, above. The live app restores through loadTender,
  // keyed by the live tender id, and a frozen /demo showcase stays read-only.)

  // Persist the human-mutable subset (edited/written answers + gap answers)
  // whenever requirements change. No-op when persistence is disabled (frozen
  // demo) or on the server.
  useEffect(() => {
    saveAnswerStore(persistKey, projectStore(requirements));
  }, [requirements, persistKey]);

  // The draft run playing right now (live or replay), for the per-card
  // skeleton/settle and the "N of M drafted" count. Null when idle.
  const [draftRun, setDraftRun] = useState<DraftRun | null>(null);
  // Timers for the staged landing, cleared on unmount so navigating away
  // mid-run can't fire setState on a dead provider.
  const revealTimers = useRef<number[]>([]);
  useEffect(() => {
    const timers = revealTimers.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  // The staged landing shared by live drafting and the demo replay: swap each
  // drafted requirement into view one at a time, in the given order (callers
  // pass weakest-first, matching the workspace's default sort), so drafting
  // reads as drafting rather than a form submit. Reduced motion lands
  // everything at once — the run still works, it just doesn't perform.
  function playReveal(finalById: Map<string, Requirement>, order: string[]) {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || order.length === 0) {
      setRequirements((prev) => prev.map((req) => finalById.get(req.id) ?? req));
      setDraftRun(null);
      setDrafting(false);
      return;
    }
    // Aim for a ~4.5s run whatever the answer count, clamped so two answers
    // still read as a sequence and fifty don't take a minute.
    const step = Math.min(700, Math.max(260, Math.round(4500 / order.length)));
    order.forEach((id, index) => {
      revealTimers.current.push(
        window.setTimeout(() => {
          setRequirements((prev) =>
            prev.map((req) => (req.id === id ? finalById.get(id) ?? req : req))
          );
          setDraftRun((prev) =>
            prev
              ? {
                  total: prev.total,
                  pending: new Set([...prev.pending].filter((p) => p !== id)),
                  landed: new Set(prev.landed).add(id),
                }
              : prev
          );
        }, 420 + index * step)
      );
    });
    // Keep the landed set alive long enough for the last card's settle, then
    // close the run.
    revealTimers.current.push(
      window.setTimeout(() => {
        setDraftRun(null);
        setDrafting(false);
      }, 420 + order.length * step + 600)
    );
  }

  // Live collaboration: subscribe to the loaded tender's event stream so a teammate's
  // decision lands here without a refresh. setState happens in the SSE onmessage
  // callback (an external subscription), the pattern the lint rule permits. The stream
  // is per-tender; comment threads open their own stream. EventSource auto-reconnects.
  useEffect(() => {
    if (initialTender || !tenderId || !isApiEnabled()) return;
    const url = tenderEventsUrl(tenderId);
    if (!url || typeof window === "undefined" || !("EventSource" in window)) return;
    const source = new EventSource(url);
    source.onmessage = (e) => {
      let event: TenderEvent;
      try {
        event = JSON.parse(e.data) as TenderEvent;
      } catch {
        return;
      }
      if (event.type !== "requirement" || !event.req_id) return;
      const reqId = event.req_id;
      setRequirements((prev) =>
        prev.map((req) =>
          req.id === reqId
            ? {
                ...req,
                status: event.status ?? req.status,
                // decision may legitimately be null (a reopen) — apply it as sent.
                decision:
                  event.decision === undefined ? req.decision : event.decision,
              }
            : req
        )
      );
    };
    return () => source.close();
  }, [tenderId, initialTender]);

  // Auditable autofill: ask the API to (re)draft grounded answers for the loaded
  // tender, optionally against freshly-uploaded capability docs. The non-answer
  // fields swap in at once; the drafted answers land through playReveal.
  async function draftAnswers(provider: "openai" | "mock" = "openai", files?: File[]) {
    if (!tenderId || !isApiEnabled()) return;
    setDrafting(true);
    // While the request is in flight we don't yet know which cards will get a
    // draft, so every card shows the in-flight skeleton; the run narrows to
    // the actually-drafted set once the response arrives.
    setDraftRun({
      pending: new Set(requirements.map((req) => req.id)),
      landed: new Set(),
      total: requirements.length,
    });
    try {
      const tender = await apiDraftAnswers(tenderId, { provider, files });
      setCapabilityDocs(tender.capability_docs ?? []);
      setSourceDocs(tender.source_docs ?? []);
      setAwardCriteria(tender.award_criteria ?? []);
      const drafted = tender.requirements.filter(hasDraft);
      const draftedIds = new Set(drafted.map((req) => req.id));
      // Swap everything else in now; hold the drafted answers back so each can
      // land on its own beat.
      setRequirements(
        tender.requirements.map((req) =>
          draftedIds.has(req.id)
            ? { ...req, answer: null, draft_answer: null }
            : req
        )
      );
      setDraftRun({ pending: draftedIds, landed: new Set(), total: drafted.length });
      playReveal(
        new Map(tender.requirements.map((req) => [req.id, req])),
        [...drafted].sort(compareWeakestFirst).map((req) => req.id)
      );
    } catch (err) {
      setDraftRun(null);
      setDrafting(false);
      throw err;
    }
  }

  // Scripted demo draft for sample mode (no live tender, no backend): the hero
  // action still has to WORK in front of judges, so clear the prebaked answers
  // (state only — the seed file is untouched) and re-play them through the same
  // staged landing a live run uses. Honest by construction: it only ever
  // replays answers the seeded run actually produced, never invents prose.
  function demoDraft() {
    if (drafting) return;
    const drafted = requirements.filter(hasDraft);
    if (drafted.length === 0) return;
    const finalById = new Map(drafted.map((req) => [req.id, req]));
    setDrafting(true);
    setDraftRun({
      pending: new Set(finalById.keys()),
      landed: new Set(),
      total: drafted.length,
    });
    setRequirements((prev) =>
      prev.map((req) =>
        finalById.has(req.id)
          ? { ...req, answer: null, draft_answer: null }
          : req
      )
    );
    playReveal(finalById, [...drafted].sort(compareWeakestFirst).map((req) => req.id));
  }

  // Collaboration attribution: stamp the signed-in user onto a decision so the UI shows "who did
  // what" optimistically. The backend RE-STAMPS this authoritatively on PATCH (client value ignored),
  // so it can't be forged. Null on the frozen demo / no-auth build → the decision renders as "you".
  const decisionActor: Actor | null = user
    ? { id: user.id, email: user.email, name: user.name ?? null }
    : null;
  function withActor(d: RequirementDecision): RequirementDecision {
    return decisionActor ? { ...d, actor: decisionActor } : d;
  }

  // Optimistic in-memory update + best-effort persistence to the API when wired.
  function applyDecision(
    id: string,
    status: RequirementStatus,
    decision: RequirementDecision
  ) {
    const stamped = withActor(decision);
    updateRequirement(id, { status, decision: stamped });
    if (isApiEnabled()) {
      patchRequirement(id, { status, decision: stamped }).catch(() => {
        toast.error(SAVE_FAILED);
      });
    }
  }

  // The batch counterpart of applyDecision: one setRequirements pass for the
  // whole set (a single render, however many rows), then the same optimistic
  // fire-and-forget per-id PATCH when the API is wired.
  function applyDecisionMany(
    ids: string[],
    status: RequirementStatus,
    decision: RequirementDecision
  ) {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const stamped = withActor(decision);
    setRequirements((prev) =>
      prev.map((req) => (idSet.has(req.id) ? { ...req, status, decision: stamped } : req))
    );
    if (isApiEnabled()) {
      for (const id of ids) {
        patchRequirement(id, { status, decision: stamped }).catch(() => {
          toast.error(SAVE_FAILED);
        });
      }
    }
  }

  function approveMany(ids: string[]) {
    applyDecisionMany(ids, "accepted", {
      action: "approve",
      note: "",
      timestamp: new Date().toISOString(),
    });
  }

  function flagMany(ids: string[], note: string) {
    applyDecisionMany(ids, "flagged", {
      action: "flag",
      note,
      timestamp: new Date().toISOString(),
    });
  }

  // Undo seam for batch decisions: capture status + decision for a set of ids
  // BEFORE a bulk change, and put a captured snapshot back afterwards. Restore
  // is one setState pass + the usual per-id PATCH. State mechanics only — the
  // toast/undo UI lives with the caller.
  function snapshotDecisions(ids: string[]): DecisionSnapshot[] {
    const idSet = new Set(ids);
    return requirements
      .filter((req) => idSet.has(req.id))
      .map((req) => ({ id: req.id, status: req.status, decision: req.decision }));
  }

  function restoreDecisions(snapshot: DecisionSnapshot[]) {
    if (snapshot.length === 0) return;
    const byId = new Map(snapshot.map((entry) => [entry.id, entry]));
    setRequirements((prev) =>
      prev.map((req) => {
        const entry = byId.get(req.id);
        return entry
          ? { ...req, status: entry.status, decision: entry.decision }
          : req;
      })
    );
    if (isApiEnabled()) {
      for (const entry of snapshot) {
        patchRequirement(entry.id, {
          status: entry.status,
          decision: entry.decision,
        }).catch(() => {
          toast.error(SAVE_FAILED);
        });
      }
    }
  }

  function approve(id: string) {
    applyDecision(id, "accepted", {
      action: "approve",
      note: "",
      timestamp: new Date().toISOString(),
    });
  }

  function editRequirement(id: string, note: string) {
    applyDecision(id, "edited", {
      action: "edit",
      note,
      timestamp: new Date().toISOString(),
    });
  }

  function flag(id: string, note: string) {
    applyDecision(id, "flagged", {
      action: "flag",
      note,
      timestamp: new Date().toISOString(),
    });
  }

  // Undo a decision: return the requirement to pending and clear the recorded
  // decision. Optimistic in-memory, best-effort persistence like applyDecision.
  function reopen(id: string) {
    updateRequirement(id, { status: "pending", decision: null });
    if (isApiEnabled()) {
      patchRequirement(id, { status: "pending", decision: null }).catch(() => {
        toast.error(SAVE_FAILED);
      });
    }
  }

  // Draft-edit sessions for the answers workspace, keyed by requirement id and
  // held here rather than in the card so mid-edit text survives the card
  // unmounting when a filter or re-sort moves it (a live-demo hazard when it
  // was card-local useState). An id is "editing" while it has an entry.
  const [answerEdits, setAnswerEdits] = useState<Record<string, string>>({});
  function beginAnswerEdit(id: string, initial: string) {
    setAnswerEdits((prev) => ({ ...prev, [id]: initial }));
  }
  function updateAnswerEdit(id: string, text: string) {
    setAnswerEdits((prev) => ({ ...prev, [id]: text }));
  }
  function endAnswerEdit(id: string) {
    setAnswerEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  // Human revises the drafted answer — record it as human-edited and keep the
  // deprecated draft_answer alias in sync. When no answer exists yet (a
  // requirement the autofill left blank), CREATE one from the human's text so
  // it can be drafted from scratch here. A hand-written answer carries no
  // evidence refs, so it honestly reads as unbacked until backed. (No backend
  // endpoint yet — in-memory + localStorage.)
  function editAnswer(id: string, text: string) {
    setRequirements((prev) =>
      prev.map((req) => {
        if (req.id !== id) return req;
        const base = req.answer ?? {
          text: "",
          state: "empty" as const,
          evidence_refs: [],
          confidence: 0.5,
        };
        return {
          ...req,
          draft_answer: text,
          answer: {
            ...base,
            text,
            state: "human_edited",
            confidence: Math.max(base.confidence, 0.7),
          },
        };
      })
    );
  }

  // Record a human verdict on the drafted answer itself, stamped with the actor
  // like a requirement decision but written onto answer.decision, NOT the
  // requirement status — the two are independent (a requirement can be accepted
  // while its answer still needs input). No backend endpoint for answer content
  // yet, so this is in-memory only and rides the localStorage persist effect;
  // it never PATCHes. A no-op when there's no draft to decide on.
  function setAnswerDecision(id: string, decision: AnswerDecision | null) {
    const stamped =
      decision && decisionActor ? { ...decision, actor: decisionActor } : decision;
    setRequirements((prev) =>
      prev.map((req) => {
        if (req.id !== id || !req.answer) return req;
        return { ...req, answer: { ...req.answer, decision: stamped } };
      })
    );
  }

  function approveAnswer(id: string) {
    setAnswerDecision(id, {
      verdict: "approved",
      note: "",
      timestamp: new Date().toISOString(),
    });
  }

  function flagAnswer(id: string, note: string) {
    setAnswerDecision(id, {
      verdict: "flagged",
      note,
      timestamp: new Date().toISOString(),
    });
  }

  // Undo an answer verdict — back to undecided (Approve/Flag offered again).
  function reopenAnswer(id: string) {
    setAnswerDecision(id, null);
  }

  // Batch answer-approve for the /answers ready-drafts control: one setState
  // pass, one stamp, only rows that actually hold an answer. Callers pass the
  // already-filtered eligible set (isAnswerApprovable). No PATCH — answer content
  // has no backend endpoint yet; it rides the localStorage persist effect.
  function approveAnswers(ids: string[]) {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const decision: AnswerDecision = {
      verdict: "approved",
      note: "",
      timestamp: new Date().toISOString(),
    };
    const stamped = decisionActor ? { ...decision, actor: decisionActor } : decision;
    setRequirements((prev) =>
      prev.map((req) =>
        idSet.has(req.id) && req.answer
          ? { ...req, answer: { ...req.answer, decision: stamped } }
          : req
      )
    );
  }

  // Capture answer content for a set of ids BEFORE an edit or bulk approve, so
  // Undo can put the exact prior draft/state/verdict back. State mechanics only —
  // the toast/undo UI lives with the caller (mirrors snapshotDecisions).
  function snapshotAnswers(ids: string[]): AnswerSnapshot[] {
    const idSet = new Set(ids);
    return requirements
      .filter((req) => idSet.has(req.id))
      .map((req) => ({
        id: req.id,
        answer: req.answer ?? null,
        draftAnswer: req.draft_answer,
      }));
  }

  function restoreAnswers(snapshot: AnswerSnapshot[]) {
    if (snapshot.length === 0) return;
    const byId = new Map(snapshot.map((entry) => [entry.id, entry]));
    setRequirements((prev) =>
      prev.map((req) => {
        const entry = byId.get(req.id);
        return entry
          ? { ...req, answer: entry.answer, draft_answer: entry.draftAnswer }
          : req;
      })
    );
  }

  // Human answers a gap question the tool flagged. (No backend endpoint yet — in-memory.)
  function answerOpenQuestion(
    reqId: string,
    questionId: string,
    answerText: string
  ) {
    setRequirements((prev) =>
      prev.map((req) => {
        if (req.id !== reqId || !req.open_questions) return req;
        return {
          ...req,
          open_questions: req.open_questions.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  answer: answerText,
                  answered_at: new Date().toISOString(),
                }
              : q
          ),
        };
      })
    );
  }

  return (
    <RequirementsContext.Provider
      value={{
        requirements,
        seeding: !initialTender && !isApiEnabled() && seed === null,
        capabilityDocs,
        sourceDocs,
        awardCriteria,
        title: seed?.title ?? "",
        tenderId,
        drafting,
        updateRequirement,
        approve,
        editRequirement,
        flag,
        approveMany,
        flagMany,
        snapshotDecisions,
        restoreDecisions,
        reopen,
        editAnswer,
        approveAnswer,
        flagAnswer,
        reopenAnswer,
        approveAnswers,
        snapshotAnswers,
        restoreAnswers,
        answerOpenQuestion,
        loadTender,
        draftAnswers,
        demoDraft,
        draftRun,
        answerEdits,
        beginAnswerEdit,
        updateAnswerEdit,
        endAnswerEdit,
      }}
    >
      {children}
    </RequirementsContext.Provider>
  );
}

export function useRequirements(): RequirementsContextValue {
  const context = useContext(RequirementsContext);
  if (context === null) {
    throw new Error(
      "useRequirements must be used within a RequirementsProvider"
    );
  }
  return context;
}
