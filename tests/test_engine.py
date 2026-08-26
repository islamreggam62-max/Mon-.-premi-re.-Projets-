import textwrap

from orchestrator.authorization import Authorization
from orchestrator.engine import Engine


def make_auth(tmp_path):
    p = tmp_path / "authorization.yaml"
    p.write_text(textwrap.dedent("""
        operator: Me
        engagement: test
        i_am_authorized: true
        scope: [127.0.0.0/8]
    """))
    return Authorization.load(p)


def test_out_of_scope_target_is_skipped(tmp_path):
    auth = make_auth(tmp_path)
    engine = Engine(auth, modules=["dns_recon"])
    report = engine.run(["10.10.10.10"])
    assert len(report.targets) == 1
    assert report.targets[0].authorized is False
    assert report.targets[0].skipped_reason is not None
    assert report.targets[0].results == []


def test_in_scope_target_runs_modules(tmp_path):
    auth = make_auth(tmp_path)
    engine = Engine(auth, modules=["dns_recon"])
    report = engine.run(["127.0.0.1"])
    assert report.targets[0].authorized is True
    assert report.targets[0].results[0].module == "dns_recon"


def test_unknown_module_rejected(tmp_path):
    auth = make_auth(tmp_path)
    try:
        Engine(auth, modules=["definitely_not_real"])
        assert False, "expected ValueError"
    except ValueError:
        pass
