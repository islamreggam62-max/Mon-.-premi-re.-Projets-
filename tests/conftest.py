import os

# Deterministic settings for every test module, applied before app.config is
# imported so Settings() never reads a developer's real .env.
os.environ.setdefault("META_VERIFY_TOKEN", "test-verify-token")
os.environ.setdefault("META_APP_SECRET", "test-app-secret")
os.environ.setdefault("FACEBOOK_PAGE_TOKEN", "test-page-token")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")
