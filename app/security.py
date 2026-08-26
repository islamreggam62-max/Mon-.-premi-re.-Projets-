"""Verification of Meta webhook payload signatures."""

import hashlib
import hmac


def verify_signature(app_secret: str, raw_body: bytes, header: str | None) -> bool:
    """Check the ``X-Hub-Signature-256`` header Meta sends with every webhook.

    The header looks like ``sha256=<hex digest>`` where the digest is an HMAC of
    the *raw* request body keyed with the app secret. The body must be the exact
    bytes received — re-serializing the parsed JSON changes the digest.
    """
    if not app_secret or not header:
        return False
    algorithm, _, signature = header.partition("=")
    if algorithm != "sha256" or not signature:
        return False
    expected = hmac.new(app_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
