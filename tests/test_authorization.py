import textwrap
from datetime import date, timedelta

import pytest

from orchestrator.authorization import Authorization, AuthorizationError


def write_auth(tmp_path, body: str):
    p = tmp_path / "authorization.yaml"
    p.write_text(textwrap.dedent(body))
    return p


def test_missing_file_refuses(tmp_path):
    with pytest.raises(AuthorizationError):
        Authorization.load(tmp_path / "nope.yaml")


def test_not_attested_refuses(tmp_path):
    p = write_auth(tmp_path, """
        operator: Me
        engagement: test
        i_am_authorized: false
        scope: [127.0.0.1]
    """)
    with pytest.raises(AuthorizationError):
        Authorization.load(p)


def test_public_target_refused_by_default(tmp_path):
    p = write_auth(tmp_path, """
        operator: Me
        engagement: test
        i_am_authorized: true
        scope: [8.8.8.8]
    """)
    with pytest.raises(AuthorizationError):
        Authorization.load(p)


def test_local_scope_ok_and_enforced(tmp_path):
    p = write_auth(tmp_path, """
        operator: Me
        engagement: test
        i_am_authorized: true
        scope: [127.0.0.0/8, 192.168.56.0/24]
    """)
    auth = Authorization.load(p)
    auth.check("127.0.0.1")            # in scope -> no raise
    assert auth.is_authorized("192.168.56.10")
    assert not auth.is_authorized("192.168.99.10")
    with pytest.raises(AuthorizationError):
        auth.check("10.0.0.1")


def test_expired_refuses(tmp_path):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    p = write_auth(tmp_path, f"""
        operator: Me
        engagement: test
        i_am_authorized: true
        expires: "{yesterday}"
        scope: [127.0.0.1]
    """)
    with pytest.raises(AuthorizationError):
        Authorization.load(p)
