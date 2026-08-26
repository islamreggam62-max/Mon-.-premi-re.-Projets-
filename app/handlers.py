"""Turning raw webhook payloads into replies."""

import logging
from dataclasses import dataclass
from typing import Any

from .claude_client import ClaudeReplier
from .meta_client import INSTAGRAM, MESSENGER, MetaClient
from .store import ConversationStore, SeenMessages

logger = logging.getLogger(__name__)

# Meta's `object` field tells us which product the delivery came from.
OBJECT_TO_PLATFORM = {"page": MESSENGER, "instagram": INSTAGRAM}

ATTACHMENT_ONLY_REPLY = (
    "Thanks! I can only read text messages for now — could you describe it in "
    "writing?"
)


@dataclass(frozen=True)
class IncomingMessage:
    platform: str
    sender_id: str
    recipient_id: str
    message_id: str | None
    text: str
    has_attachments: bool

    @property
    def conversation_key(self) -> str:
        return f"{self.platform}:{self.recipient_id}:{self.sender_id}"


def parse_webhook(payload: dict[str, Any]) -> list[IncomingMessage]:
    """Extract the user messages worth answering from a webhook payload.

    Everything else — delivery receipts, read receipts, reactions, postbacks and
    echoes of our own replies — is dropped here so the handler only ever sees
    real inbound messages.
    """
    platform = OBJECT_TO_PLATFORM.get(payload.get("object", ""))
    if platform is None:
        return []

    messages: list[IncomingMessage] = []
    for entry in payload.get("entry") or []:
        for event in entry.get("messaging") or []:
            message = event.get("message")
            if not isinstance(message, dict):
                continue
            if message.get("is_echo"):
                continue  # our own outgoing message, echoed back
            sender_id = (event.get("sender") or {}).get("id")
            recipient_id = (event.get("recipient") or {}).get("id")
            if not sender_id or not recipient_id:
                continue
            messages.append(
                IncomingMessage(
                    platform=platform,
                    sender_id=str(sender_id),
                    recipient_id=str(recipient_id),
                    message_id=message.get("mid"),
                    text=(message.get("text") or "").strip(),
                    has_attachments=bool(message.get("attachments")),
                )
            )
    return messages


class MessageHandler:
    def __init__(
        self,
        replier: ClaudeReplier,
        meta: MetaClient,
        conversations: ConversationStore,
        seen: SeenMessages,
    ) -> None:
        self._replier = replier
        self._meta = meta
        self._conversations = conversations
        self._seen = seen

    async def handle(self, incoming: IncomingMessage) -> None:
        if not self._seen.add_if_new(incoming.message_id):
            logger.info("Skipping duplicate delivery of %s", incoming.message_id)
            return

        if not incoming.text:
            if incoming.has_attachments:
                await self._meta.send_text(
                    incoming.platform, incoming.sender_id, ATTACHMENT_ONLY_REPLY
                )
            return

        await self._meta.send_typing(incoming.platform, incoming.sender_id)

        key = incoming.conversation_key
        history = self._conversations.history(key)
        reply = await self._replier.reply(history, incoming.text)

        # Record the exchange only after a reply exists, so a failed call does
        # not leave a dangling user turn in the history.
        self._conversations.append(key, "user", incoming.text)
        self._conversations.append(key, "assistant", reply)

        await self._meta.send_text(incoming.platform, incoming.sender_id, reply)

    async def handle_payload(self, payload: dict[str, Any]) -> None:
        for incoming in parse_webhook(payload):
            try:
                await self.handle(incoming)
            except Exception:  # keep one bad message from killing the batch
                logger.exception("Failed to handle message %s", incoming.message_id)
