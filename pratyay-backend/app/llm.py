"""
Provider layer: one function, chat_json(task, ...), that works with a local llama.cpp
server or any hosted OpenAI-compatible API. Which one is used is decided by settings.
"""
import json
import re
from contextlib import contextmanager
from contextvars import ContextVar
from urllib.parse import urlparse

from . import config


class LLMError(Exception):
    pass


class LLMHTTPError(LLMError):
    def __init__(self, status: int, body: str):
        super().__init__(f"HTTP {status}: {body}")
        self.status = status


# Per-review model choice. None = use the server's env config (TONE_*/VERIFY_*/EXTRACT_*).
# A dict {"base_url", "model", "api_key"} = every task uses that model; an empty base_url switches AI off.
_target: ContextVar[dict | None] = ContextVar("llm_target", default=None)


@contextmanager
def use_target(cfg: dict | None):
    token = _target.set(cfg)
    try:
        yield
    finally:
        _target.reset(token)


def _cfg(task: str) -> dict:
    t = _target.get()
    return t if t is not None else config.LLM_TASKS[task]


def is_configured(task: str) -> bool:
    return bool(_cfg(task)["base_url"])


def label(task: str) -> str:
    """Human-readable disclosure of which model handled a task, shown next to AI findings."""
    cfg = _cfg(task)
    host = urlparse(cfg["base_url"]).hostname or ""
    if host in {"localhost", "127.0.0.1", "::1", "0.0.0.0"}:
        return f"local:{cfg['model']}"
    return f"api:{host}/{cfg['model']}"


def _post(url: str, headers: dict, payload: dict, timeout: float) -> dict:
    """The only place that touches the network (tests replace this function)."""
    import httpx
    try:
        r = httpx.post(url, headers=headers, json=payload, timeout=timeout)
    except httpx.HTTPError as e:
        raise LLMError(f"Could not reach model server: {e}") from e
    if r.status_code >= 400:
        raise LLMHTTPError(r.status_code, r.text[:300])
    return r.json()


def _parse_json(content: str) -> dict:
    content = content.strip()
    content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content, flags=re.I)
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        raise LLMError(f"Model returned invalid JSON: {content[:120]!r}") from e
    if not isinstance(data, dict):
        raise LLMError("Model returned JSON that is not an object")
    return data


def chat_json(task: str, system: str, user: str, schema: dict, name: str = "result") -> dict:
    cfg = _cfg(task)
    if not cfg["base_url"]:
        raise LLMError(f"Task '{task}' is not configured")
    url = cfg["base_url"].rstrip("/") + "/chat/completions"
    headers = {"Authorization": f"Bearer {cfg['api_key']}", "Content-Type": "application/json"}

    attempts = [
        # 1. strict JSON schema (llama.cpp and most hosted APIs)
        ({"type": "json_schema", "json_schema": {"name": name, "schema": schema}},
         [{"role": "system", "content": system}, {"role": "user", "content": user}]),
        # 2. plain JSON mode, with the schema described in the prompt
        ({"type": "json_object"},
         [{"role": "system", "content": f"{system}\nReturn only JSON matching this schema: {json.dumps(schema)}"},
          {"role": "user", "content": user}]),
    ]
    last: Exception | None = None
    for response_format, messages in attempts:
        payload = {"model": cfg["model"], "temperature": 0,
                   "messages": messages, "response_format": response_format}
        try:
            data = _post(url, headers, payload, config.LLM_TIMEOUT)
        except LLMHTTPError as e:
            if e.status == 400:           # server does not support this response_format
                last = e
                continue
            raise
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as e:
            raise LLMError("Unexpected response shape from model server") from e
        return _parse_json(content)
    raise last or LLMError("No response from model server")
