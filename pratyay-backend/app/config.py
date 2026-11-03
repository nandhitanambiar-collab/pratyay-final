import os

# SQLite works out of the box for development.
# For PostgreSQL set, e.g.:
#   DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/pratyay
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pratyay.db")

# Origins allowed to call the API (Vite dev server by default)
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")


# ---------- AI providers (one per task) ----------
# Each task talks to any OpenAI-compatible server: a local llama.cpp server or a hosted API.
#   TONE_BASE_URL=http://localhost:8081/v1   TONE_MODEL=local
#   VERIFY_BASE_URL=https://<provider>/v1    VERIFY_MODEL=<model>   VERIFY_API_KEY=...
# EXTRACT_* falls back to VERIFY_* if not set. A task with no BASE_URL is switched off.
def _task(prefix: str, fallback: str | None = None) -> dict:
    def get(name, default=""):
        v = os.getenv(f"{prefix}_{name}")
        if v is None and fallback:
            v = os.getenv(f"{fallback}_{name}")
        return v if v is not None else default
    return {"base_url": get("BASE_URL"), "model": get("MODEL", "local"), "api_key": get("API_KEY", "none")}


LLM_TASKS = {
    "tone": _task("TONE"),
    "verify": _task("VERIFY"),
    "extract": _task("EXTRACT", fallback="VERIFY"),
}
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "60"))
AI_MAX_CLAIMS = int(os.getenv("AI_MAX_CLAIMS", "10"))
# Share of a claim's words that must appear in the best evidence before the verifier is called.
RETRIEVAL_MIN_COVERAGE = float(os.getenv("RETRIEVAL_MIN_COVERAGE", "0.5"))


# ---------- Built-in (hosted) models the user can pick in the UI ----------
# Each hosted provider is called through its OpenAI-compatible endpoint, with the API key read from the
# server's environment (the browser never sees or sends a key). frontend id -> (provider, model name sent to the API).
# Edit model names here when a provider renames or retires one.
HOSTED_PROVIDERS = {
    "google": {"base_url": os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai"),
               "key_env": "GEMINI_API_KEY"},
    "anthropic": {"base_url": os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com/v1"),
                  "key_env": "ANTHROPIC_API_KEY"},
    "openai": {"base_url": os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
               "key_env": "OPENAI_API_KEY"},
}
BUILTIN_MODELS = {
    "gemini-2.5-flash": ("google", "gemini-2.5-flash"),
    "gemini-2.5-pro": ("google", "gemini-2.5-pro"),
    "claude-3-7-sonnet": ("anthropic", "claude-3-7-sonnet-20250219"),
    "gpt-4o": ("openai", "gpt-4o"),
}
