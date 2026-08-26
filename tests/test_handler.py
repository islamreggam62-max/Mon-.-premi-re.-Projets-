import pytest

from app.handlers import ATTACHMENT_ONLY_REPLY, IncomingMessage, MessageHandler
from app.meta_client import MESSENGER, _split_text
from app.store import ConversationStore, SeenMessages


class FakeReplier:
    def __init__(self, reply: str = "bonjour") -> None:
        self.reply_text = reply
        self.calls: list[tuple[list, str]] = []

    async def reply(self, history, user_message):
        self.calls.append((list(history), user_message))
        return self.reply_text


class FakeMeta:
    def __init__(self) -> None:
        self.sent: list[tuple[str, str, str]] = []
        self.typing: list[tuple[str, str]] = []

    async def send_text(self, platform, recipient_id, text):
        self.sent.append((platform, recipient_id, text))

    async def send_typing(self, platform, recipient_id):
        self.typing.append((platform, recipient_id))


def build_handler():
    replier, meta = FakeReplier(), FakeMeta()
    handler = MessageHandler(
        replier=replier,
        meta=meta,
        conversations=ConversationStore(max_messages=20, ttl_seconds=3600),
        seen=SeenMessages(),
    )
    return handler, replier, meta


def message(text="salut", message_id="m1", attachments=False):
    return IncomingMessage(
        platform=MESSENGER,
        sender_id="USER_ID",
        recipient_id="PAGE_ID",
        message_id=message_id,
        text=text,
        has_attachments=attachments,
    )


@pytest.mark.asyncio
async def test_replies_and_shows_typing():
    handler, _, meta = build_handler()
    await handler.handle(message())
    assert meta.typing == [(MESSENGER, "USER_ID")]
    assert meta.sent == [(MESSENGER, "USER_ID", "bonjour")]


@pytest.mark.asyncio
async def test_history_is_passed_to_the_next_turn():
    handler, replier, _ = build_handler()
    await handler.handle(message("premier", "m1"))
    await handler.handle(message("deuxieme", "m2"))
    history, user_message = replier.calls[-1]
    assert user_message == "deuxieme"
    assert history == [
        {"role": "user", "content": "premier"},
        {"role": "assistant", "content": "bonjour"},
    ]


@pytest.mark.asyncio
async def test_duplicate_delivery_is_answered_once():
    handler, _, meta = build_handler()
    await handler.handle(message(message_id="same"))
    await handler.handle(message(message_id="same"))
    assert len(meta.sent) == 1


@pytest.mark.asyncio
async def test_separate_senders_keep_separate_histories():
    handler, replier, _ = build_handler()
    await handler.handle(message("premier", "m1"))
    other = IncomingMessage(
        platform=MESSENGER,
        sender_id="OTHER_USER",
        recipient_id="PAGE_ID",
        message_id="m2",
        text="hello",
        has_attachments=False,
    )
    await handler.handle(other)
    history, _ = replier.calls[-1]
    assert history == []


@pytest.mark.asyncio
async def test_attachment_only_message_gets_a_canned_reply():
    handler, replier, meta = build_handler()
    await handler.handle(message(text="", attachments=True))
    assert replier.calls == []
    assert meta.sent == [(MESSENGER, "USER_ID", ATTACHMENT_ONLY_REPLY)]


@pytest.mark.asyncio
async def test_empty_event_without_attachment_is_ignored():
    handler, _, meta = build_handler()
    await handler.handle(message(text=""))
    assert meta.sent == []


@pytest.mark.asyncio
async def test_one_failing_message_does_not_stop_the_batch():
    handler, replier, meta = build_handler()

    async def explode(history, user_message):
        if user_message == "boom":
            raise RuntimeError("Claude is down")
        return "ok"

    replier.reply = explode
    payload = {
        "object": "page",
        "entry": [
            {
                "messaging": [
                    {
                        "sender": {"id": "USER_ID"},
                        "recipient": {"id": "PAGE_ID"},
                        "message": {"mid": "m1", "text": "boom"},
                    },
                    {
                        "sender": {"id": "USER_ID"},
                        "recipient": {"id": "PAGE_ID"},
                        "message": {"mid": "m2", "text": "salut"},
                    },
                ]
            }
        ],
    }
    await handler.handle_payload(payload)
    assert meta.sent == [(MESSENGER, "USER_ID", "ok")]


def test_long_reply_is_split_on_word_boundaries():
    chunks = _split_text(" ".join(["mot"] * 500), 100)
    assert all(len(chunk) <= 100 for chunk in chunks)
    assert " ".join(chunks) == " ".join(["mot"] * 500)


def test_short_reply_is_not_split():
    assert _split_text("salut", 100) == ["salut"]
