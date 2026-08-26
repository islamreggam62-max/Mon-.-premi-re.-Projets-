"""Sending messages back through the Meta Send API."""

import logging

import httpx

from .config import Settings

logger = logging.getLogger(__name__)

MESSENGER = "messenger"
INSTAGRAM = "instagram"

# Send API text limits, minus a little headroom.
TEXT_LIMIT = {MESSENGER: 1900, INSTAGRAM: 950}


def _split_text(text: str, limit: int) -> list[str]:
    """Split a reply into Send-API-sized chunks, preferring line/word breaks."""
    chunks: list[str] = []
    remaining = text.strip()
    while len(remaining) > limit:
        window = remaining[:limit]
        cut = max(window.rfind("\n"), window.rfind(" "))
        if cut <= 0:
            cut = limit
        chunks.append(remaining[:cut].strip())
        remaining = remaining[cut:].strip()
    if remaining:
        chunks.append(remaining)
    return chunks


class MetaClient:
    def __init__(self, settings: Settings, http: httpx.AsyncClient) -> None:
        self._settings = settings
        self._http = http

    def _endpoint(self, platform: str) -> tuple[str, str]:
        """Return the (url, access_token) pair for the platform.

        Instagram accounts that use Instagram Login talk to graph.instagram.com
        with their own token. Accounts linked to a Facebook Page — and Messenger
        itself — go through graph.facebook.com with the Page token.
        """
        version = self._settings.graph_api_version
        if platform == INSTAGRAM and self._settings.instagram_token:
            return (
                f"https://graph.instagram.com/{version}/me/messages",
                self._settings.instagram_token,
            )
        return (
            f"https://graph.facebook.com/{version}/me/messages",
            self._settings.facebook_page_token,
        )

    async def _post(self, platform: str, payload: dict) -> None:
        url, token = self._endpoint(platform)
        if not token:
            logger.error("No access token configured for platform %s", platform)
            return
        try:
            response = await self._http.post(
                url, params={"access_token": token}, json=payload
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            # Meta puts the actionable reason in the body, not the status line.
            logger.error(
                "Send API rejected the request (%s): %s",
                exc.response.status_code,
                exc.response.text,
            )
        except httpx.HTTPError:
            logger.exception("Send API request failed")

    async def send_text(self, platform: str, recipient_id: str, text: str) -> None:
        for chunk in _split_text(text, TEXT_LIMIT.get(platform, TEXT_LIMIT[INSTAGRAM])):
            await self._post(
                platform,
                {
                    "recipient": {"id": recipient_id},
                    "messaging_type": "RESPONSE",
                    "message": {"text": chunk},
                },
            )

    async def send_typing(self, platform: str, recipient_id: str) -> None:
        await self._post(
            platform,
            {"recipient": {"id": recipient_id}, "sender_action": "typing_on"},
        )
