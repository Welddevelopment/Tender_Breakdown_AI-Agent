import type { AnswerDecision, AnswerState, Requirement } from "@/types/requirement";

// Local persistence for the /answers response workspace. There is no backend
// endpoint for answer text yet (only PATCH /requirements/{id} for status +
// decision), so a human's drafted answers and gap inputs would be lost on
// refresh. This keeps ONLY the user-mutable subset in localStorage, keyed by
// tender, and merges it back over freshly seeded/live requirements — the machine
// fields (evidence_refs, category, source…) always come from the seed/API, never
// from here. SSR-guarded: every entry point is a no-op on the server.

const keyFor = (tenderKey: string) => `bf-answers:${tenderKey}`;

export interface PersistedAnswer {
  text: string;
  state: AnswerState;
  confidence: number;
}

export interface PersistedReq {
  answer?: PersistedAnswer; // present once the human writes/edits the draft
  // The answer-scoped verdict (approve/flag). Stored on its OWN key, not under
  // `answer`, because a human can approve a machine "auto" draft without editing
  // its text — and auto text is intentionally not persisted (it comes from the
  // seed/API). So the decision has to survive even when there is no PersistedAnswer.
  answerDecision?: AnswerDecision;
  openQuestions?: Record<string, string>; // questionId -> answer text
}

export type AnswerStore = Record<string, PersistedReq>; // reqId -> patch

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function loadAnswerStore(tenderKey: string | null): AnswerStore {
  if (!hasWindow() || !tenderKey) return {};
  try {
    const raw = window.localStorage.getItem(keyFor(tenderKey));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") return parsed as AnswerStore;
    return {};
  } catch {
    // Unavailable (private mode) or corrupt — behave as if nothing was stored.
    return {};
  }
}

export function saveAnswerStore(
  tenderKey: string | null,
  store: AnswerStore
): void {
  if (!hasWindow() || !tenderKey) return;
  try {
    if (Object.keys(store).length === 0) {
      window.localStorage.removeItem(keyFor(tenderKey));
      return;
    }
    window.localStorage.setItem(keyFor(tenderKey), JSON.stringify(store));
  } catch {
    // Storage full/unavailable — the edit still shows in memory this session.
  }
}

// Project the persistable subset out of the live requirements. We keep a draft
// only once the human has touched it (state "human_edited"), and any answered
// open questions. Machine-drafted "auto" answers are intentionally NOT stored —
// they come back from the seed/API on reload.
export function projectStore(reqs: Requirement[]): AnswerStore {
  const store: AnswerStore = {};
  for (const req of reqs) {
    const entry: PersistedReq = {};

    if (req.answer && req.answer.state === "human_edited") {
      entry.answer = {
        text: req.answer.text,
        state: req.answer.state,
        confidence: req.answer.confidence,
      };
    }

    // The verdict persists regardless of state — approving an auto draft is a
    // real human action even when the text stays machine-authored.
    if (req.answer?.decision) {
      entry.answerDecision = req.answer.decision;
    }

    const answered: Record<string, string> = {};
    for (const q of req.open_questions ?? []) {
      if (q.answer !== null) answered[q.id] = q.answer;
    }
    if (Object.keys(answered).length > 0) entry.openQuestions = answered;

    if (entry.answer || entry.answerDecision || entry.openQuestions)
      store[req.id] = entry;
  }
  return store;
}

// Merge a stored patch set over a fresh requirements array. Only text/state/
// confidence and gap answers are overwritten; evidence_refs and every other
// field are preserved from the incoming (seed/live) data.
export function mergeStoreIntoRequirements(
  reqs: Requirement[],
  store: AnswerStore
): Requirement[] {
  if (Object.keys(store).length === 0) return reqs;

  const restoredAt = new Date().toISOString();

  return reqs.map((req) => {
    const patch = store[req.id];
    if (!patch) return req;

    let next = req;

    if (patch.answer) {
      const base = req.answer ?? {
        text: "",
        state: "human_edited" as AnswerState,
        evidence_refs: [],
        confidence: 0.7,
      };
      next = {
        ...next,
        draft_answer: patch.answer.text,
        answer: {
          ...base,
          text: patch.answer.text,
          state: patch.answer.state,
          confidence: patch.answer.confidence,
        },
      };
    }

    // Restore the answer-scoped verdict onto whichever answer we now hold — the
    // just-restored human draft, or the machine draft carried in from the seed.
    if (patch.answerDecision && next.answer) {
      next = {
        ...next,
        answer: { ...next.answer, decision: patch.answerDecision },
      };
    }

    if (patch.openQuestions && next.open_questions) {
      next = {
        ...next,
        open_questions: next.open_questions.map((q) => {
          const savedAnswer = patch.openQuestions?.[q.id];
          return savedAnswer !== undefined
            ? { ...q, answer: savedAnswer, answered_at: q.answered_at ?? restoredAt }
            : q;
        }),
      };
    }

    return next;
  });
}
