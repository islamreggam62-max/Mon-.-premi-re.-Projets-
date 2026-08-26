import hashlib
import hmac

from app.security import verify_signature

SECRET = "app-secret"
BODY = b'{"object":"page"}'


def signature(body: bytes, secret: str = SECRET) -> str:
    digest = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def test_accepts_matching_signature():
    assert verify_signature(SECRET, BODY, signature(BODY))


def test_rejects_signature_from_another_secret():
    assert not verify_signature(SECRET, BODY, signature(BODY, "other-secret"))


def test_rejects_tampered_body():
    assert not verify_signature(SECRET, b'{"object":"instagram"}', signature(BODY))


def test_rejects_missing_or_malformed_header():
    assert not verify_signature(SECRET, BODY, None)
    assert not verify_signature(SECRET, BODY, "sha1=abc")
    assert not verify_signature(SECRET, BODY, "sha256=")


def test_rejects_when_no_secret_configured():
    assert not verify_signature("", BODY, signature(BODY))
