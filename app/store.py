"""In-memory conversation history and message de-duplication.

This keeps the project dependency-free for a first deployment. Swap the two
classes for Redis (or any shared store) before running more than one worker —
each process keeps its own copy of this state.
"""

import time
from collections import OrderedDict
from typing import Any


class ConversationStore:
    """Per-sender message history, trimmed by length and expired by age."""

    def __init__(self, max_messages: int, ttl_seconds: int) -> None:
        self._max_messages = max_messages
        self._ttl_seconds = ttl_seconds
        self._data: dict[str, tuple[float, list[dict[str, Any]]]] = {}

    def _purge_expired(self, now: float) -> None:
        stale = [k for k, (seen, _) in self._data.items() if now - seen > self._ttl_seconds]
        for key in stale:
            del self._data[key]

    def history(self, key: str) -> list[dict[str, Any]]:
        now = time.time()
        self._purge_expired(now)
        entry = self._data.get(key)
        return list(entry[1]) if entry else []

    def append(self, key: str, role: str, content: Any) -> None:
        now = time.time()
        self._purge_expired(now)
        _, messages = self._data.setdefault(key, (now, []))
        messages.append({"role": role, "content": content})
        del messages[: max(0, len(messages) - self._max_messages)]
        self._data[key] = (now, messages)

    def reset(self, key: str) -> None:
        self._data.pop(key, None)


class SeenMessages:
    """Remembers recent message IDs so retried webhooks are not answered twice.

    Meta re-delivers a webhook when the endpoint is slow or returns an error, so
    the same ``mid`` can arrive several times.
    """

    def __init__(self, capacity: int = 2048) -> None:
        self._capacity = capacity
        self._ids: OrderedDict[str, None] = OrderedDict()

    def add_if_new(self, message_id: str | None) -> bool:
        """Record ``message_id``; return True when it had not been seen before."""
        if not message_id:
            return True
        if message_id in self._ids:
            self._ids.move_to_end(message_id)
            return False
        self._ids[message_id] = None
        while len(self._ids) > self._capacity:
            self._ids.popitem(last=False)
        return True
