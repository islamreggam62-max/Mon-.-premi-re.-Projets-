"""Tests de la plateforme NAFTAL LEGAL INTELLIGENCE.

Executables sans pytest :  python -m unittest tests.test_naftal
(Compatibles pytest egalement.)
"""
import os
import tempfile
import unittest
from pathlib import Path

# Isolation : repertoire de donnees temporaire, defini AVANT d'importer naftal.
_TMP = tempfile.mkdtemp(prefix="naftal-test-")
os.environ["NAFTAL_DATA_DIR"] = _TMP
os.environ["NAFTAL_ADMIN_EMAIL"] = "admin@test.local"
os.environ["NAFTAL_ADMIN_PASSWORD"] = "AdminTest123"
os.environ["NAFTAL_LLM_ENABLED"] = "0"

from naftal.analysis import analyze_text, compare_texts, risk_report  # noqa: E402
from naftal.extraction import extract_text, segment_clauses  # noqa: E402
from naftal.reports import (  # noqa: E402
    generate_analysis_report,
    generate_comparison_report,
)
from naftal.security import hash_password, verify_password  # noqa: E402

_SAMPLES = Path(__file__).resolve().parent.parent / "naftal" / "samples"
V1 = (_SAMPLES / "contrat_demo_v1.txt").read_text()
V2 = (_SAMPLES / "contrat_demo_v2.txt").read_text()


class TestSegmentation(unittest.TestCase):
    def test_detects_articles(self):
        clauses = segment_clauses(V1)
        refs = [c.ref for c in clauses]
        self.assertIn("Article 1", refs)
        self.assertIn("Article 9", refs)
        self.assertEqual(refs[0], "Préambule")

    def test_preserves_original_text(self):
        clauses = segment_clauses(V1)
        art1 = next(c for c in clauses if c.ref == "Article 1")
        self.assertIn("fourniture", art1.text.lower())

    def test_empty_text(self):
        self.assertEqual(segment_clauses(""), [])


class TestExtraction(unittest.TestCase):
    def test_txt_extraction(self):
        p = Path(_TMP) / "x.txt"
        p.write_text("Article 1 : Objet\nTexte.")
        res = extract_text(p)
        self.assertTrue(res.ok)
        self.assertIn("Objet", res.text)
        self.assertEqual(len(res.sha256), 64)

    def test_unsupported_format(self):
        p = Path(_TMP) / "x.rtf"
        p.write_text("x")
        res = extract_text(p)
        self.assertFalse(res.ok)


class TestAnalysis(unittest.TestCase):
    def test_protective_contract_low_risk(self):
        a = analyze_text(V1)
        self.assertLess(a.risk_score, 20)

    def test_risky_contract_high_risk(self):
        a = analyze_text(V2)
        self.assertGreaterEqual(a.risk_score, 60)
        cats = {f["problem"] for f in a.issues()}
        self.assertTrue(any("illimit" in p.lower() for p in cats))

    def test_missing_provisions_flagged_absent(self):
        a = analyze_text(V2)
        missing = [f for f in a.findings if not f["present"]]
        labels = {f["category"] for f in missing}
        self.assertIn("Garanties et assurances", labels)

    def test_no_hallucinated_articles(self):
        # Chaque constat present renvoie a une reference reelle du texte.
        a = analyze_text(V1)
        refs = {c.ref for c in segment_clauses(V1)}
        for f in a.findings:
            if f["present"] and f["article_ref"] not in ("(plusieurs clauses)", "(clauses de duree)"):
                self.assertIn(f["article_ref"], refs | {"Préambule"})

    def test_force_majeure_not_flagged_as_abusive_exoneration(self):
        a = analyze_text(V1)
        fm_exon = [
            f for f in a.issues()
            if "exoneration" in f["problem"].lower() and "7" in f["article_ref"]
        ]
        self.assertEqual(fm_exon, [])


class TestComparison(unittest.TestCase):
    def test_handles_renumbering(self):
        c = compare_texts(V1, V2)
        # Force majeure (Art 7 -> Art 6) doit etre apparie, pas vu comme suppression+ajout.
        pairs = [(ch["ref_a"], ch["ref_b"]) for ch in c.changes if ch["kind"] == "modification"]
        self.assertIn(("Article 7", "Article 6"), pairs)

    def test_detects_deletion(self):
        c = compare_texts(V1, V2)
        deleted = [ch for ch in c.changes if ch["kind"] == "suppression"]
        self.assertTrue(any("Garanties" in ch["before"] or "garantie" in ch["before"].lower() for ch in deleted))

    def test_detects_critical_risk_change(self):
        c = compare_texts(V1, V2)
        self.assertTrue(any(ch["risk"] == "CRITICAL" for ch in c.changes))

    def test_risk_score_increases(self):
        c = compare_texts(V1, V2)
        self.assertLess(c.risk_score_a, c.risk_score_b)


class TestRisk(unittest.TestCase):
    def test_risk_report_structure(self):
        r = risk_report(analyze_text(V2))
        self.assertEqual(r["overall_level"], "CRITICAL")
        self.assertEqual(len(r["domains"]), 4)


class TestSecurity(unittest.TestCase):
    def test_hash_verify(self):
        hp = hash_password("MotDePasse123")
        self.assertTrue(verify_password("MotDePasse123", hp))
        self.assertFalse(verify_password("mauvais", hp))

    def test_short_password_rejected(self):
        with self.assertRaises(ValueError):
            hash_password("court")


class TestReports(unittest.TestCase):
    def test_analysis_reports(self):
        a = analyze_text(V2)
        from dataclasses import asdict
        meta = {"document": "test.txt"}
        for fmt in ("docx", "pdf", "xlsx"):
            p = generate_analysis_report(meta, asdict(a), fmt)
            self.assertTrue(p.exists() and p.stat().st_size > 500)

    def test_comparison_report(self):
        from dataclasses import asdict
        c = compare_texts(V1, V2)
        p = generate_comparison_report({"document": "cmp"}, asdict(c), "docx")
        self.assertTrue(p.exists() and p.stat().st_size > 500)


class TestAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from fastapi.testclient import TestClient
        from naftal.app import create_app
        from naftal.__main__ import ensure_admin
        ensure_admin()
        cls.client = TestClient(create_app())

    def _login(self):
        r = self.client.post("/api/auth/login", json={"email": "admin@test.local", "password": "AdminTest123"})
        self.assertEqual(r.status_code, 200)

    def test_health(self):
        self.assertEqual(self.client.get("/api/health").json()["status"], "ok")

    def test_requires_auth(self):
        c2 = self.__class__.client.__class__(self.__class__.client.app)
        self.assertEqual(c2.get("/api/contracts").status_code, 401)

    def test_full_flow(self):
        self._login()
        r = self.client.post("/api/documents/load-samples")
        self.assertEqual(r.status_code, 200)
        docs = r.json()["documents"]
        self.assertEqual(len(docs), 2)
        did = docs[0]["id"]
        # analyse
        ra = self.client.post("/api/analysis/run", json={"document_id": did})
        self.assertEqual(ra.status_code, 200)
        self.assertIn("risk_score", ra.json())
        # rapport + telechargement
        rr = self.client.post("/api/reports/analysis", json={"document_id": did, "fmt": "docx"})
        self.assertEqual(rr.status_code, 200)
        url = rr.json()["url"]
        self.assertEqual(self.client.get(url).status_code, 200)

    def test_path_traversal_blocked(self):
        self._login()
        r = self.client.get("/api/reports/download/..%2f..%2fnaftal.db")
        self.assertIn(r.status_code, (400, 404))


if __name__ == "__main__":
    unittest.main(verbosity=2)
