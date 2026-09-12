from __future__ import annotations

from pathlib import Path

import pytest

from scraper.config import default_config


def test_default_config_uses_content_mirror_environment(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("REFUGIO_CONTENT_MIRROR_DIR", "/srv/content")

    config = default_config()

    assert config.output_dir == Path("/srv/content")
