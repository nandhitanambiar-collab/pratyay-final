"""Turns a review's target_model_id into the model settings the AI pipeline should use."""
import os

from sqlalchemy.orm import Session

from . import config
from . import models as m

SELF_HOSTED_PREFIX = "selfhosted:"
_OFF = {"base_url": "", "model": "", "api_key": ""}


def resolve(db: Session, target_id: str | None) -> tuple[dict | None, str | None]:
    """Returns (settings, note).
    settings: None -> use the server's env config; {"base_url","model","api_key"} -> use this for every task;
    an empty base_url -> AI off for this review. `note` explains any fallback and is stored with the analysis."""
    if not target_id or target_id == "server-default":
        return None, None

    if target_id in config.BUILTIN_MODELS:
        provider, model = config.BUILTIN_MODELS[target_id]
        p = config.HOSTED_PROVIDERS[provider]
        key = os.getenv(p["key_env"], "").strip()
        if not key:
            return dict(_OFF), f"{p['key_env']} is not set on the server, so {target_id} was not called (rule checks only)"
        return {"base_url": p["base_url"], "model": model, "api_key": key}, None

    if target_id.startswith(SELF_HOSTED_PREFIX):
        raw = target_id[len(SELF_HOSTED_PREFIX):]
        row = db.get(m.SelfHostedModel, int(raw)) if raw.isdigit() else None
        if row is None:
            return None, "The saved self-hosted model no longer exists; used the server's default AI settings"
        return {"base_url": row.base_url, "model": row.model, "api_key": row.api_key or "none"}, None

    return None, None   # unknown id (e.g. an older review): server default
