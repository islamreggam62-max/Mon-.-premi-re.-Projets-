from app.handlers import parse_webhook
from app.meta_client import INSTAGRAM, MESSENGER


def payload(obj: str, message: dict) -> dict:
    return {
        "object": obj,
        "entry": [
            {
                "id": "PAGE_ID",
                "messaging": [
                    {
                        "sender": {"id": "USER_ID"},
                        "recipient": {"id": "PAGE_ID"},
                        "message": message,
                    }
                ],
            }
        ],
    }


def test_parses_messenger_text():
    [message] = parse_webhook(payload("page", {"mid": "m1", "text": "  salut  "}))
    assert message.platform == MESSENGER
    assert message.sender_id == "USER_ID"
    assert message.text == "salut"
    assert message.conversation_key == "messenger:PAGE_ID:USER_ID"


def test_parses_instagram_text():
    [message] = parse_webhook(payload("instagram", {"mid": "m2", "text": "hi"}))
    assert message.platform == INSTAGRAM


def test_skips_echo_of_our_own_reply():
    assert parse_webhook(payload("page", {"mid": "m3", "text": "hi", "is_echo": True})) == []


def test_skips_non_message_events():
    assert parse_webhook({"object": "page", "entry": [{"messaging": [{"delivery": {}}]}]}) == []
    assert parse_webhook({"object": "page", "entry": [{"messaging": [{"read": {}}]}]}) == []


def test_skips_unknown_object_type():
    assert parse_webhook(payload("whatsapp_business_account", {"mid": "m4", "text": "hi"})) == []


def test_flags_attachment_only_message():
    [message] = parse_webhook(
        payload("page", {"mid": "m5", "attachments": [{"type": "image"}]})
    )
    assert message.text == ""
    assert message.has_attachments


def test_tolerates_empty_payload():
    assert parse_webhook({}) == []
    assert parse_webhook({"object": "page"}) == []
