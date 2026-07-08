"use client";

import { useEffect, useState } from "react";
import {
  getComments,
  postComment,
  tenderEventsUrl,
  type Comment,
  type TenderEvent,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRequirements } from "@/context/RequirementsContext";
import { collaboratorFor } from "@/lib/collaborators";
import { supabaseEnabled } from "@/lib/env";
import { useSupabase } from "@/lib/supabase";
import {
  fetchComments,
  insertComment,
  type CommentRow,
} from "@/lib/supabase-data";
import type { Requirement } from "@/types/requirement";

// A team discussion thread on one requirement. Two live backings:
// - Production: Supabase — comments keyed by the requirement row pk, a Realtime
//   subscription streams teammates' comments in, and the DB trigger stamps the
//   author identity (unforgeable).
// - Legacy: the old REST + SSE pair, retired at cutover.
// The caller only renders this in a live mode, so there's no mock branch here.

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

export function CommentThread({ requirement }: { requirement: Requirement }) {
  if (supabaseEnabled) return <SupabaseThread requirement={requirement} />;
  return <LegacyThread reqId={requirement.id} />;
}

// ---- Shared rendering --------------------------------------------------------

interface ThreadComment {
  id: string;
  authorId: string;
  authorName: string | null;
  body: string;
  createdAt: string;
}

function legacyToThread(row: Comment): ThreadComment {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

function ThreadView({
  comments,
  draft,
  sending,
  error,
  onDraft,
  onSubmit,
}: {
  comments: ThreadComment[] | null;
  draft: string;
  sending: boolean;
  error: string | null;
  onDraft: (value: string) => void;
  onSubmit: () => void;
}) {
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
              id: c.authorId,
              email: c.authorId,
              name: c.authorName,
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
                      {c.authorName ?? "Teammate"}
                    </span>
                    {" · "}
                    {timeLabel(c.createdAt)}
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          placeholder="Add a comment for your team"
          aria-label="Add a comment"
          className="min-w-0 flex-1 rounded-md border border-hairline bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-forest"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="shrink-0 rounded-md bg-forest px-3 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-forest-hover disabled:opacity-50"
        >
          {sending ? "Posting…" : "Post"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-signal-oxblood">{error}</p>}
    </div>
  );
}

// ---- Production: Supabase + Realtime -------------------------------------------

function rowToThread(row: CommentRow): ThreadComment {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

function SupabaseThread({ requirement }: { requirement: Requirement }) {
  const supabase = useSupabase();
  const { tenderId } = useRequirements();
  const { user } = useAuth();
  const [comments, setComments] = useState<ThreadComment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pk = requirement.db_id;

  useEffect(() => {
    if (!supabase || !pk) return;
    let cancelled = false;
    fetchComments(supabase, pk)
      .then((rows) => {
        if (!cancelled) setComments(rows.map(rowToThread));
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });

    const channel = supabase
      .channel(`comments-${pk}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `requirement_pk=eq.${pk}`,
        },
        (payload) => {
          const incoming = rowToThread(payload.new as CommentRow);
          setComments((prev) => {
            const list = prev ?? [];
            return list.some((c) => c.id === incoming.id)
              ? list
              : [...list, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [supabase, pk]);

  async function submit() {
    const body = draft.trim();
    if (!body || !supabase || !pk || !tenderId || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = await insertComment(supabase, {
        requirementPk: pk,
        tenderId,
        body,
        authorName: user?.name ?? user?.email ?? null,
      });
      setDraft("");
      const incoming = rowToThread(created);
      setComments((prev) => {
        const list = prev ?? [];
        return list.some((c) => c.id === incoming.id) ? list : [...list, incoming];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post the comment.");
    } finally {
      setSending(false);
    }
  }

  if (!pk) {
    // Rows only carry a pk once they've come from Supabase (i.e. the tender has
    // finished processing) — before that there's nothing to attach a thread to.
    return (
      <p className="text-sm text-ink-muted">
        Comments open once this tender finishes processing.
      </p>
    );
  }

  return (
    <ThreadView
      comments={comments}
      draft={draft}
      sending={sending}
      error={error}
      onDraft={(value) => {
        setDraft(value);
        setError(null);
      }}
      onSubmit={() => void submit()}
    />
  );
}

// ---- Legacy: REST + SSE (retired at cutover) ------------------------------------

function LegacyThread({ reqId }: { reqId: string }) {
  const { tenderId } = useRequirements();
  const [comments, setComments] = useState<ThreadComment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getComments(reqId)
      .then((rows) => {
        if (!cancelled) setComments(rows.map(legacyToThread));
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [reqId]);

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
      const mapped = legacyToThread(incoming);
      setComments((prev) => {
        const list = prev ?? [];
        return list.some((c) => c.id === mapped.id) ? list : [...list, mapped];
      });
    };
    return () => source.close();
  }, [tenderId, reqId]);

  async function submit() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const created = legacyToThread(await postComment(reqId, body));
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
    <ThreadView
      comments={comments}
      draft={draft}
      sending={sending}
      error={error}
      onDraft={(value) => {
        setDraft(value);
        setError(null);
      }}
      onSubmit={() => void submit()}
    />
  );
}
