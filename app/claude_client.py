"""Claude-backed reply generation."""

import logging
from typing import Any

import anthropic

from .config import Settings

logger = logging.getLogger(__name__)

# Server-side fallback: if a safety classifier declines the request, the API
# routes it to another model instead of returning an unusable turn.
FALLBACK_BETA = "server-side-fallback-2026-07-01"

FALLBACK_REPLY = (
    "Sorry — I couldn't produce an answer for that one. "
    "A member of our team will get back to you shortly."
)


class ClaudeReplier:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        # The SDK reads ANTHROPIC_API_KEY itself; pass the key only when the
        # app was configured with an explicit one.
        self._client = (
            anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
            if settings.anthropic_api_key
            else anthropic.AsyncAnthropic()
        )

    async def reply(self, history: list[dict[str, Any]], user_message: str) -> str:
        """Generate a reply to ``user_message`` given the prior conversation."""
        messages = [*history, {"role": "user", "content": user_message}]
        try:
            response = await self._client.beta.messages.create(
                model=self._settings.claude_model,
                max_tokens=self._settings.claude_max_tokens,
                system=self._settings.system_prompt,
                messages=messages,
                thinking={"type": "adaptive"},
                output_config={"effort": self._settings.claude_effort},
                betas=[FALLBACK_BETA],
                fallbacks="default",
            )
        except anthropic.APIError:
            logger.exception("Claude request failed")
            return FALLBACK_REPLY

        if response.stop_reason == "refusal":
            category = getattr(response.stop_details, "category", None)
            logger.warning("Claude declined the request (category=%s)", category)
            return FALLBACK_REPLY

        text = "".join(
            block.text for block in response.content if block.type == "text"
        ).strip()
        return text or FALLBACK_REPLY
