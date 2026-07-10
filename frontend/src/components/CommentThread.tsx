"use client";

import { useEffect, useState } from "react";
import {
  getComments,
  postComment,
  resolveComment,
  tenderEventsUrl,
  type Comment,
  type TenderEvent,
} from "@/lib/api";
import { useRequirements } from "@/context/RequirementsContext";
import { collaboratorFor } from "@/lib/collaborators";

// A team discussion thread on one requirement. Live-product only (the caller renders it
// only when the API is on). Comments load on open; a teammate's new comment on this same
// requirement arrives live over the tender's SSE stream. Author is stamped server-side.

function timeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentThread({ reqId }: { reqId: string }) {
  const { tenderId } = useRequirements();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [markAsBlocker, setMarkAsBlocker] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  // The comment that just landed (posted here or arrived live) gets the one-shot
  // settle beat; everything else renders plain. Cleared once it's played.
  const [justLandedId, setJustLandedId] = useState<string | null>(null);

  // Load the existing thread.
  useEffect(() => {
    let cancelled = false;
    getComments(reqId)
      .then((c) => {
        if (!cancelled) setComments(c);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [reqId]);

  // Live: a teammate's comment on THIS requirement appears without a refresh. setState
  // lands in the SSE callback (external subscription), the pattern the lint rule allows.
  useEffect(() => {
    if (!tenderId) return;
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
      if (event.type !== "comment" || !event.comment) return;
      const incoming = event.comment;
      if (incoming.req_id !== reqId) return;
      setComments((prev) => {
        const list = prev ?? [];
        // A comment we already have (e.g. a blocker just resolved on another
        // client) replaces in place; a genuinely new one appends.
        const idx = list.findIndex((c) => c.id === incoming.id);
        if (idx === -1) {
          setJustLandedId(incoming.id);
          return [...list, incoming];
        }
        const next = list.slice();
        next[idx] = incoming;
        return next;
      });
    };
    return () => source.close();
  }, [tenderId, reqId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = await postComment(reqId, body, markAsBlocker);
      setDraft("");
      setMarkAsBlocker(false);
      setJustLandedId(created.id);
      setComments((prev) => {
        const list = prev ?? [];
        return list.some((c) => c.id === created.id) ? list : [...list, created];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post the comment.");
    } finally {
      setSending(false);
    }
  }

  async function resolve(commentId: string) {
    if (resolvingId) return;
    setResolvingId(commentId);
    setError(null);
    try {
      const updated = await resolveComment(commentId);
      setComments((prev) => (prev ?? []).map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't resolve the blocker.");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="max-w-[64ch]">
      {comments === null ? (
        <p className="text-sm text-ink-muted">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No comments yet. Start the discussion for your team.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => {
            const who = collaboratorFor({
              id: c.author_id,
              email: c.author_id,
              name: c.author_name,
            });
            const openBlocker = c.is_blocker === true && !c.resolved_at;
            const resolvedBlocker = c.is_blocker === true && !!c.resolved_at;
            const edge = openBlocker
              ? "border-l-2 border-signal-oxblood-frame pl-2.5"
              : "";
            const settle = c.id === justLandedId ? "settle-once" : "";
            return (
              <li
                key={c.id}
                onAnimationEnd={() => {
                  if (c.id === justLandedId) setJustLandedId(null);
                }}
                className={`flex items-start gap-2.5 ${edge} ${settle}`.trim()}
              >
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-paper"
                  style={{ backgroundColor: who.color }}
                >
                  {who.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-ink-muted">
                    <span className="font-medium text-ink">
                      {c.author_name ?? "Teammate"}
                    </span>
                    <span>{timeLabel(c.created_at)}</span>
                    {openBlocker && (
                      <span className="font-mono text-[10px] uppercase tracking-wide text-signal-oxblood">
                        Blocker
                      </span>
                    )}
                    {resolvedBlocker && (
                      <span className="text-ink-muted">Resolved</span>
                    )}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-snug text-ink">
                    {c.body}
                  </p>
                  {openBlocker && (
                    <button
                      type="button"
                      onClick={() => resolve(c.id)}
                      disabled={resolvingId === c.id}
                      aria-busy={resolvingId === c.id}
                      className="ui-btn mt-1 font-mono text-[11px] uppercase tracking-wide text-signal-oxblood underline decoration-signal-oxblood-frame underline-offset-2 disabled:opacity-50"
                    >
                      {resolvingId === c.id ? "Resolving…" : "Resolve"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={submit} className="mt-3 flex flex-col gap-1.5">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              // Esc on the inline form clears the draft and lets go of focus.
              if (e.key === "Escape" && draft) {
                e.preventDefault();
                setDraft("");
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Add a comment for your team"
            aria-label="Add a comment"
            className="min-w-0 flex-1 rounded-md border border-hairline bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-forest focus-visible:ring-1 focus-visible:ring-forest"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-busy={sending}
            className="ui-btn shrink-0 rounded-md bg-forest px-3 py-1.5 text-sm font-semibold text-paper hover:bg-forest-hover disabled:opacity-50"
          >
            {sending ? "Posting…" : "Post"}
          </button>
        </div>
        <label className="flex w-fit items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
          <input
            type="checkbox"
            checked={markAsBlocker}
            onChange={(e) => setMarkAsBlocker(e.target.checked)}
            className="h-3 w-3 accent-signal-oxblood"
          />
          Mark as blocker
        </label>
      </form>
      {error && <p className="mt-2 text-xs text-signal-oxblood">{error}</p>}
    </div>
  );
}
