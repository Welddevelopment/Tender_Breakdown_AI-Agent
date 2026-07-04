"""events.py — in-memory per-tender pub/sub for live collaboration (SSE).

Teammates working the same tender see each other's decisions, comments and shares
appear live. A subscriber (the GET /tenders/{id}/events SSE handler) registers an
asyncio.Queue; a publisher (a decision PATCH, a comment POST, a share) pushes a small
event onto every queue for that tender.

Single process only — like the JOBS registry in main.py, this holds state in memory,
which is correct for the one-instance Render deploy. A multi-instance deployment would
back this with Redis pub/sub instead; the subscribe / publish seam wouldn't change.

Thread-safety: publishers are plain sync route handlers (FastAPI runs `def` routes in a
threadpool), while each subscriber's queue is consumed on the main event loop. We capture
the loop at subscribe time and hand items across with `loop.call_soon_threadsafe`, so a
publish from any thread lands safely on the consumer's loop.
"""

from __future__ import annotations

import asyncio
from collections import defaultdict

# tender_id -> set of (queue, owning-event-loop) for every open SSE stream on it.
_subscribers: dict[str, set[tuple[asyncio.Queue, asyncio.AbstractEventLoop]]] = defaultdict(set)


def subscribe(tender_id: str) -> asyncio.Queue:
    """Register a live stream for a tender and return its queue. Call from an async
    context (the SSE handler) so the running loop is captured for cross-thread delivery."""
    queue: asyncio.Queue = asyncio.Queue()
    loop = asyncio.get_running_loop()
    _subscribers[tender_id].add((queue, loop))
    return queue


def unsubscribe(tender_id: str, queue: asyncio.Queue) -> None:
    """Drop a stream (client disconnected). Leaves no empty buckets lying around."""
    subs = _subscribers.get(tender_id)
    if not subs:
        return
    for entry in list(subs):
        if entry[0] is queue:
            subs.discard(entry)
    if not subs:
        _subscribers.pop(tender_id, None)


def publish(tender_id: str, event: dict) -> None:
    """Fan an event out to every open stream on this tender. Safe to call from a sync
    route handler on a worker thread; delivery is marshalled onto each consumer's loop.
    A no-op when nobody is listening."""
    for queue, loop in list(_subscribers.get(tender_id, ())):
        try:
            loop.call_soon_threadsafe(queue.put_nowait, event)
        except RuntimeError:
            # Consumer's loop has closed (stream torn down mid-publish) — skip it.
            unsubscribe(tender_id, queue)
