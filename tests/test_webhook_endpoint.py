import hashlib
import hmac
import json

import pytest
from fastapi.testclient import TestClient

from app.main import app

VERIFY_TOKEN = "test-verify-token"
APP_SECRET = "test-app-secret"


class RecordingHandler:
    def __init__(self) -> None:
        self.payloads: list[dict] = []

    async def handle_payload(self, payload):
        self.payloads.append(payload)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def recorder(client):
    handler = RecordingHandler()
    client.app.state.handler = handler
    return handler


def signed(body: bytes) -> dict[str, str]:
    digest = hmac.new(APP_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return {"X-Hub-Signature-256": f"sha256={digest}", "Content-Type": "application/json"}


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_verification_echoes_the_challenge(client):
    response = client.get(
        "/webhook",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": VERIFY_TOKEN,
            "hub.challenge": "1158201444",
        },
    )
    assert response.status_code == 200
    assert response.text == "1158201444"


def test_verification_rejects_a_wrong_token(client):
    response = client.get(
        "/webhook",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": "wrong",
            "hub.challenge": "1158201444",
        },
    )
    assert response.status_code == 403


def test_signed_payload_is_queued_for_handling(client, recorder):
    body = json.dumps({"object": "page", "entry": []}).encode()
    response = client.post("/webhook", content=body, headers=signed(body))
    assert response.status_code == 200
    assert recorder.payloads == [{"object": "page", "entry": []}]


def test_unsigned_payload_is_rejected(client, recorder):
    body = json.dumps({"object": "page"}).encode()
    response = client.post(
        "/webhook", content=body, headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 403
    assert recorder.payloads == []


def test_malformed_body_is_rejected(client, recorder):
    body = b"not json"
    response = client.post("/webhook", content=body, headers=signed(body))
    assert response.status_code == 400
    assert recorder.payloads == []
