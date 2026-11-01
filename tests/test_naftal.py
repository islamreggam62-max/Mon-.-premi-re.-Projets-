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


class TestRetrieval(unittest.TestCase):
    def test_retrieves_relevant_clause(self):
        from naftal.analysis.retrieval import build_corpus_retriever
        r = build_corpus_retriever([{"label": "V2", "text": V2}])
        hits = r.search("responsabilite illimitee du client", k=2)
        self.assertTrue(hits)
        self.assertIn("5", hits[0][0].doc_id)  # Article 5

    def test_empty_query(self):
        from naftal.analysis.retrieval import build_corpus_retriever
        r = build_corpus_retriever([{"label": "V1", "text": V1}])
        self.assertEqual(r.search("", k=3), [])


try:  # pytest (mode « prepend ») ou python -m unittest depuis la racine
    from tests import retrieval_gold as gold
except ImportError:  # pragma: no cover
    import retrieval_gold as gold  # type: ignore


class TestLexicon(unittest.TestCase):
    def test_all_forms_of_resilier_share_one_stem(self):
        from naftal.analysis.lexicon import stem
        forms = ["resiliation", "resiliations", "resilier", "resilie", "resilies", "resiliee"]
        self.assertEqual(len({stem(f) for f in forms}), 1)

    def test_plural_and_derivation(self):
        from naftal.analysis.lexicon import stem
        for a, b in [("sinistre", "sinistres"), ("tribunal", "tribunaux"),
                     ("assurance", "assureur"), ("tacite", "tacitement")]:
            self.assertEqual(stem(a), stem(b), (a, b))

    def test_synonym_expansion_is_weighted_lower(self):
        from naftal.analysis.lexicon import expand_query, stem
        w = expand_query("rupture")
        self.assertEqual(w[stem("rupture")], 1.0)
        self.assertLess(w[stem("resiliation")], 1.0)   # voisin, pas exact
        self.assertIn("resiliation", __import__("naftal.analysis.lexicon", fromlist=["x"]).triggered_groups("rupture"))

    def test_stopwords_removed(self):
        from naftal.analysis.lexicon import tokens
        self.assertEqual(tokens("le contrat de la partie"), [])


class TestRetrievalQuality(unittest.TestCase):
    """Garde-fou de regression sur le jeu d'evaluation (voir retrieval_gold.py).

    Mesures : ancien TF-IDF MRR 0.825 / hit@3 0.85 / rappel@5 0.71 ;
    BM25 + lexique (max par famille) MRR 0.963 / hit@3 0.95 / rappel@5 1.00.
    Jeu minuscule (20 requetes, ecrit par l'auteur du lexique) : indicateur et garde-fou
    de regression, pas une preuve de performance. Seuils avec marge.
    """

    @classmethod
    def setUpClass(cls):
        from naftal.analysis.retrieval import build_corpus_retriever
        cls.r = build_corpus_retriever(gold.load_corpus())
        cls.res = gold.evaluate(lambda q, k: [p.doc_id for p, _ in cls.r.search(q, k)])

    def test_overall_quality(self):
        self.assertGreaterEqual(self.res["mrr"], 0.93)
        self.assertGreaterEqual(self.res["hit@3"], 0.90)
        self.assertGreaterEqual(self.res["recall@5"], 0.90)

    def test_inflection_misses_of_old_tfidf_are_fixed(self):
        # L'ancien TF-IDF ne retrouvait AUCUN de ces trois passages (rang None).
        found = dict(self.res["detail"])
        for q in ("reconduction tacite du contrat", "sinistre"):
            self.assertLessEqual(found[q], 3, q)
        # « obligation » est un mot generique qui apparait aussi dans « Obligations du
        # Client » : la clause de confidentialite est retrouvee mais au rang 4 (limite connue).
        self.assertLessEqual(found["obligation de non-divulgation"], 5)

    def test_exact_term_beats_stacked_synonyms(self):
        # Regression du defaut « survalorisation par accumulation de synonymes » : sur les
        # 2 contrats de demo, la clause de resiliation doit passer avant « Duree ».
        from naftal.analysis.retrieval import build_corpus_retriever
        ui = [d for d in gold.load_corpus() if d["label"] in ("V1", "V2")]
        ids = [p.doc_id for p, _ in build_corpus_retriever(ui).search("rupture avant terme", 3)]
        self.assertIn(ids[0], {"V1 — Article 8", "V2 — Article 7"})


def _concept_embedder(calls: list):
    """Embeddings JOUETS (axes conceptuels ecrits a la main) : testent la plomberie
    (cache, fusion, repli), PAS la qualite d'embeddings reels."""
    from naftal.analysis.rules import norm
    concepts = [
        {"arreter", "collaboration", "resilier", "resilie", "resiliation", "rupture",
         "mettre", "fin", "motif", "raison"},
        {"couvert", "couvrant", "police", "sinistres", "accidents", "assurance", "risques"},
    ]

    class Resp:
        status_code = 200
        text = ""

        def __init__(self, d):
            self._d = d

        def json(self):
            return self._d

    def post(url, headers, json, timeout):
        calls.append(list(json["input"]))
        data = []
        for i, t in enumerate(json["input"]):
            toks = [w.strip(".,;:()«»") for w in norm(t).replace("'", " ").split()]
            data.append({"index": i, "embedding": [float(sum(w in c for w in toks)) + 1e-3 for c in concepts]})
        return Resp({"data": data})

    return post


class TestEmbeddings(unittest.TestCase):
    def _client(self, post, name):
        from naftal.llm.embeddings import EmbeddingClient
        return EmbeddingClient("fake", "sk-secret-key", "http://x/v1",
                               Path(_TMP) / f"{name}.sqlite", post=post, batch_size=8)

    def test_disabled_by_default(self):
        from naftal.llm.embeddings import embeddings_status, get_embedder
        self.assertFalse(embeddings_status()["enabled"])
        self.assertIsNone(get_embedder())

    def test_cache_avoids_resending_texts(self):
        calls = []
        cl = self._client(_concept_embedder(calls), "cache")
        cl(["premier texte", "second texte"])
        n = cl.api_calls
        cl(["premier texte", "second texte"])
        self.assertEqual(cl.api_calls, n)          # 2e passage : zero appel reseau

    def test_duplicate_texts_sent_once(self):
        calls = []
        cl = self._client(_concept_embedder(calls), "dedup")
        out = cl(["meme texte", "meme texte", "autre"])
        self.assertEqual(sum(len(c) for c in calls), 2)   # 2 textes uniques envoyes
        self.assertEqual(len(out), 3)
        self.assertEqual(out[0], out[1])

    def test_hybrid_recovers_pure_paraphrase_missed_by_lexical(self):
        from naftal.analysis.retrieval import build_corpus_retriever
        q = "peut-on arrêter la collaboration sans donner de raison"
        lexical = build_corpus_retriever(gold.load_corpus())
        self.assertNotIn("V2 — Article 7", [p.doc_id for p, _ in lexical.search(q, 10)])
        hybrid = build_corpus_retriever(
            gold.load_corpus(), embed_fn=self._client(_concept_embedder([]), "hyb"))
        self.assertEqual(hybrid.mode, "hybride")
        self.assertIn("V2 — Article 7", [p.doc_id for p, _ in hybrid.search(q, 5)])

    def test_failure_falls_back_to_lexical_and_says_so(self):
        from naftal.analysis.retrieval import build_corpus_retriever

        class Down:
            status_code, text = 503, "indisponible"

        r = build_corpus_retriever(
            gold.load_corpus(), embed_fn=self._client(lambda *a, **k: Down(), "down"))
        self.assertEqual(r.mode, "lexical (repli)")
        self.assertIn("503", r.dense_error)
        self.assertNotIn("sk-secret-key", r.dense_error)   # la cle ne fuit jamais
        self.assertTrue(r.search("force majeure", 3))      # la recherche continue


class TestAIPipeline(unittest.TestCase):
    def test_two_stage_with_self_verify(self):
        from naftal.analysis.ai_pipeline import deep_analysis
        from naftal.llm.provider import LLMResult
        calls = []

        def fake(system, prompt, max_tokens):
            self.assertIn("NAFTAL LEGAL INTELLIGENCE", system)
            is_crit = "auditeur" in prompt.lower()
            calls.append("crit" if is_crit else "ana")
            return LLMResult(ok=True, text=("AUDITÉ" if is_crit else "ANALYSE"), model="fake", provider="test")

        out = deep_analysis(V2, llm_fn=fake)
        self.assertTrue(out["ok"])
        self.assertTrue(out["self_verified"])
        self.assertEqual(calls, ["ana", "crit"])
        self.assertEqual(out["analysis"], "AUDITÉ")
        self.assertGreaterEqual(out["rule_score"], 60)

    def test_fallback_when_llm_unavailable(self):
        from naftal.analysis.ai_pipeline import deep_analysis
        from naftal.llm.provider import LLMResult

        def dead(system, prompt, max_tokens):
            return LLMResult(ok=False, error="desactivee")

        out = deep_analysis(V2, llm_fn=dead)
        self.assertFalse(out["ok"])
        self.assertTrue(out["fallback"])
        self.assertFalse(out["used_llm"])
        self.assertIn("rule_summary", out)


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

    def test_search_requires_auth(self):
        c2 = self.__class__.client.__class__(self.__class__.client.app)
        self.assertEqual(c2.get("/api/search", params={"query": "force majeure"}).status_code, 401)

    def test_full_text_search(self):
        self._login()
        self.client.post("/api/documents/load-samples")
        r = self.client.get("/api/search", params={"query": "résiliation anticipée du contrat"})
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["mode"], "lexical")            # embeddings desactives
        self.assertIn("resiliation", body["groups"])
        self.assertTrue(body["results"])
        top = body["results"][0]
        self.assertEqual(top["relevance"], 1.0)
        self.assertTrue(top["label"] and top["snippet"])
        # portee « reference » : uniquement des references juridiques (a verifier)
        rr = self.client.get("/api/search", params={"query": "hydrocarbures", "scope": "reference"}).json()
        self.assertTrue(rr["results"])
        self.assertTrue(all(x["source"] == "reference" for x in rr["results"]))

    def test_search_validation(self):
        self._login()
        self.assertEqual(self.client.get("/api/search", params={"query": "a"}).status_code, 422)
        self.assertEqual(self.client.get("/api/search", params={"query": "force", "scope": "x"}).status_code, 422)

    def test_assistant_uses_stemming_and_vocabulary(self):
        self._login()
        docs = self.client.post("/api/documents/load-samples").json()["documents"]
        v1 = next(d["id"] for d in docs if d["filename"].endswith("v1.txt"))
        r = self.client.post("/api/assistant", json={
            "question": "que prévoit le contrat en cas de différend", "document_id": v1}).json()
        self.assertIn("Article 9", [c["article"] for c in r["citations"]])

    def test_settings_exposes_embeddings_status_without_key(self):
        self._login()
        s = self.client.get("/api/settings").json()
        self.assertFalse(s["embeddings"]["enabled"])
        self.assertTrue(s["local_only"])
        self.assertNotIn("api_key", str(s).lower().replace("api_key_present", ""))

    def test_ai_status_reports_disabled(self):
        self._login()
        r = self.client.get("/api/ai/status")
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.json()["enabled"])  # LLM off in tests -> no external calls

    def test_ai_analyze_fallback_without_llm(self):
        self._login()
        docs = self.client.post("/api/documents/load-samples").json()["documents"]
        did = docs[0]["id"]
        r = self.client.post("/api/ai/analyze", json={"document_id": did})
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertFalse(body["ok"])          # LLM disabled -> graceful fallback
        self.assertTrue(body["fallback"])
        self.assertIn("rule_summary", body)   # deterministic result still provided


if __name__ == "__main__":
    unittest.main(verbosity=2)
