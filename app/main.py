"""FastAPI application exposing the Meta webhook endpoint."""

import json
import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import BackgroundTasks, FastAPI, Request, Response

from .claude_client import ClaudeReplier
from .config import get_settings
from .handlers import MessageHandler
from .meta_client import MetaClient
from .security import verify_signature
from .store import ConversationStore, SeenMessages

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    http = httpx.AsyncClient(timeout=15.0)
    app.state.settings = settings
    app.state.http = http
    app.state.handler = MessageHandler(
        replier=ClaudeReplier(settings),
        meta=MetaClient(settings, http),
        conversations=ConversationStore(
            max_messages=settings.history_max_messages,
            ttl_seconds=settings.history_ttl_seconds,
        ),
        seen=SeenMessages(),
    )
    try:
        yield
    finally:
        await http.aclose()


app = FastAPI(title="Claude ↔ Messenger & Instagram", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/webhook")
async def verify(request: Request) -> Response:
    """Meta's one-time subscription handshake.

    Meta calls this with the verify token you entered in the app dashboard and
    expects the `hub.challenge` value echoed back verbatim.
    """
    params = request.query_params
    settings = request.app.state.settings
    if (
        params.get("hub.mode") == "subscribe"
        and params.get("hub.verify_token") == settings.meta_verify_token
    ):
        return Response(content=params.get("hub.challenge", ""), media_type="text/plain")
    logger.warning("Webhook verification failed")
    return Response(status_code=403, content="Verification failed")


@app.post("/webhook")
async def receive(request: Request, background: BackgroundTasks) -> Response:
    """Receive a message event.

    Meta retries any delivery that is not acknowledged within a few seconds, so
    the reply is generated in the background and the webhook answers 200 first.
    """
    settings = request.app.state.settings
    raw_body = await request.body()

    if settings.verify_signature and not verify_signature(
        settings.meta_app_secret, raw_body, request.headers.get("x-hub-signature-256")
    ):
        logger.warning("Rejected webhook with an invalid signature")
        return Response(status_code=403, content="Invalid signature")

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        logger.warning("Rejected webhook with a malformed body")
        return Response(status_code=400, content="Malformed payload")

    background.add_task(request.app.state.handler.handle_payload, payload)
    return Response(status_code=200, content="EVENT_RECEIVED")
