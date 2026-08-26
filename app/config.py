"""Configuration loaded from environment variables (.env supported)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- Meta (Facebook / Instagram) ---
    # Token that Meta echoes back during webhook verification (you choose it).
    meta_verify_token: str = "change-me"
    # App Secret from the Meta app dashboard, used to verify X-Hub-Signature-256.
    meta_app_secret: str = ""
    # Page Access Token, used to send Messenger replies (and Instagram replies
    # when the Instagram account is linked to a Facebook Page).
    facebook_page_token: str = ""
    # Only needed when the Instagram account uses "Instagram Login" (no Page).
    # Leave empty to send Instagram replies through the Page token instead.
    instagram_token: str = ""
    graph_api_version: str = "v21.0"
    # Reject webhook deliveries whose signature does not match. Keep True in
    # production; set to False only for local testing without an app secret.
    verify_signature: bool = True

    # --- Claude ---
    anthropic_api_key: str = ""
    claude_model: str = "claude-opus-5"
    # "low" keeps replies fast for chat; raise to "medium"/"high" for harder work.
    claude_effort: str = "low"
    claude_max_tokens: int = 1024
    system_prompt: str = (
        "You are the customer-support assistant for this business, replying "
        "inside Facebook Messenger and Instagram direct messages. Answer in the "
        "same language the customer writes in (Arabic, French, or English). Keep "
        "replies short and friendly — two or three sentences at most, since they "
        "are read on a phone. If you do not know something, say so plainly and "
        "offer to pass the question to a human."
    )

    # --- Conversation memory ---
    # How many messages (user + assistant) to keep per conversation.
    history_max_messages: int = 20
    # Drop a conversation after this many seconds of silence.
    history_ttl_seconds: int = 60 * 60 * 24


@lru_cache
def get_settings() -> Settings:
    return Settings()
