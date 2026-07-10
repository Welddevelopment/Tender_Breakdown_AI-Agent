"use client";

import { useEffect, useState } from "react";
import {
  getComments,
  postComment,
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
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        return list.some((c) => c.id === incoming.id) ? list : [...list, incoming];
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
      const created = await postComment(reqId, body);
      setDraft("");
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
            return (
              <li key={c.id} className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-paper"
                  style={{ backgroundColor: who.color }}
                >
                  {who.initials}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-ink-muted">
                    <span className="font-medium text-ink">
                      {c.author_name ?? "Teammate"}
                    </span>
                    {" · "}
                    {timeLabel(c.created_at)}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-snug text-ink">
                    {c.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={submit} className="mt-3 flex gap-2">
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
      </form>
      {error && <p className="mt-2 text-xs text-signal-oxblood">{error}</p>}
    </div>
  );
}
