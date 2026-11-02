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
os.environ["NAFTAL_EMBED_ENABLED"] = "0"
# Un vrai fichier .env du developpeur ne doit jamais influencer les tests.
os.environ["NAFTAL_ENV_FILE"] = str(Path(_TMP) / "absent.env")

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


class TestEnvFile(unittest.TestCase):
    def test_windows_encodings_and_syntax(self):
        from naftal.envfile import _decode, parse_env_text
        for raw in (b"\xef\xbb\xbfNAFTAL_LLM_MODEL=m1\r\n",            # Bloc-notes (BOM)
                    "NAFTAL_LLM_MODEL=m1\r\n".encode("utf-16"),          # PowerShell 5 « > »
                    b"export NAFTAL_LLM_MODEL = m1   # commentaire\n",
                    b'NAFTAL_LLM_MODEL="m1"  # commentaire\n'):
            self.assertEqual(parse_env_text(_decode(raw)), {"NAFTAL_LLM_MODEL": "m1"}, raw)

    def test_example_file_lines_survive_uncommenting(self):
        # Un non-programmeur retire « # » devant la ligne : le commentaire de fin ne doit
        # PAS devenir une partie de la valeur (provider != « anthropic » = mauvais chemin).
        from naftal.envfile import parse_env_text
        got = parse_env_text('NAFTAL_LLM_PROVIDER=anthropic          # "anthropic" ou compatible OpenAI')
        self.assertEqual(got["NAFTAL_LLM_PROVIDER"], "anthropic")

    def test_real_environment_wins_and_foreign_keys_ignored(self):
        from naftal.envfile import load_env_file
        f = Path(_TMP) / "t1.env"
        f.write_text("NAFTAL_LLM_MODEL=fichier\nNAFTAL_LLM_PROVIDER=anthropic\nPATH=/evil\n"
                     "NAFTAL_EMBED_BASE_URL=\n")
        env = {"NAFTAL_LLM_MODEL": "reel"}
        loaded = load_env_file(f, env)
        self.assertEqual(loaded, ["NAFTAL_LLM_PROVIDER"])     # noms seulement, pas les valeurs
        self.assertEqual(env["NAFTAL_LLM_MODEL"], "reel")      # l'environnement reel prime
        self.assertNotIn("PATH", env)                          # cle etrangere ignoree
        self.assertNotIn("NAFTAL_EMBED_BASE_URL", env)         # valeur vide ignoree

    def test_missing_file_is_not_an_error(self):
        from naftal.envfile import load_env_file
        self.assertEqual(load_env_file(Path(_TMP) / "nexiste-pas.env", {}), [])

    def test_write_preserves_other_lines_and_is_private(self):
        from naftal.envfile import parse_env_text, write_env_values
        f = Path(_TMP) / "t2.env"
        f.write_text("# mon commentaire\nNAFTAL_ADMIN_EMAIL=moi@x.dz\nNAFTAL_LLM_MODEL=ancien\n")
        write_env_values(f, {"NAFTAL_LLM_MODEL": "nouveau", "NAFTAL_LLM_ENABLED": "1"})
        text = f.read_text()
        self.assertIn("# mon commentaire", text)
        self.assertEqual(parse_env_text(text), {
            "NAFTAL_ADMIN_EMAIL": "moi@x.dz", "NAFTAL_LLM_MODEL": "nouveau", "NAFTAL_LLM_ENABLED": "1"})
        self.assertEqual(text.count("NAFTAL_LLM_MODEL="), 1)    # remplace, ne duplique pas
        if os.name == "posix":
            self.assertEqual(f.stat().st_mode & 0o777, 0o600)

    def test_write_rejects_newline_injection(self):
        from naftal.envfile import write_env_values
        with self.assertRaises(ValueError):
            write_env_values(Path(_TMP) / "t3.env", {"NAFTAL_LLM_API_KEY": "abc\nNAFTAL_ADMIN_PASSWORD=pwned"})

    def test_default_model_is_not_the_stale_one(self):
        from naftal.llm.provider import DEFAULT_ANTHROPIC_MODEL
        self.assertNotIn("3-5", DEFAULT_ANTHROPIC_MODEL)


class TestSetupCli(unittest.TestCase):
    KEY = "sk-ant-SECRETKEY123456"

    def _settings(self, **kw):
        import types
        base = dict(llm_enabled=True, llm_api_key=self.KEY, llm_provider="anthropic",
                    llm_model="m", env_file=Path(_TMP) / "absent.env")
        base.update(kw)
        return types.SimpleNamespace(**base)

    def test_check_disabled_explains_how_to_fix(self):
        from naftal.setup_cli import check_llm
        ok, msg = check_llm(settings=self._settings(llm_enabled=False))
        self.assertFalse(ok)
        self.assertIn("--setup-llm", msg)
        self.assertIn("INTROUVABLE", msg)

    def test_check_success(self):
        from naftal.llm.provider import LLMResult
        from naftal.setup_cli import check_llm
        ok, msg = check_llm(run=lambda *a: LLMResult(ok=True, text="OK", provider="anthropic",
                                                     model="m", tokens_in=9, tokens_out=1),
                            settings=self._settings())
        self.assertTrue(ok)
        self.assertIn("Connexion reussie", msg)

    def test_check_failures_give_actionable_hints_and_never_leak_the_key(self):
        from naftal.llm.provider import LLMResult
        from naftal.setup_cli import check_llm
        cases = {
            401: "refusee", 403: "Acces refuse", 404: "Modele introuvable", 429: "limite",
            503: "indisponible",
        }
        for status, expected in cases.items():
            # le serveur « renvoie » la cle dans son message : elle doit etre masquee
            err = f"HTTP {status}: erreur avec {self.KEY} dedans"
            ok, msg = check_llm(run=lambda *a, e=err: LLMResult(ok=False, error=e),
                                settings=self._settings())
            self.assertFalse(ok)
            self.assertIn(expected, msg, status)
            self.assertNotIn(self.KEY, msg)
        ok, msg = check_llm(run=lambda *a: LLMResult(
            ok=False, error='HTTP 400: {"message":"Your credit balance is too low"}'),
            settings=self._settings())
        self.assertIn("Credit insuffisant", msg)

    def _run_wizard(self, answers, key, check=(True, "ok")):
        import io
        from contextlib import redirect_stdout
        from naftal.setup_cli import setup_llm
        path = Path(_TMP) / f"wiz-{abs(hash(tuple(answers))) % 10**6}.env"
        if path.exists():
            path.unlink()
        buf, env, it = io.StringIO(), {}, iter(answers)
        with redirect_stdout(buf):
            ok = setup_llm(path, input_fn=lambda _p: next(it), getpass_fn=lambda _p: key,
                           out=print, check_fn=lambda: check, environ=env)
        return ok, buf.getvalue(), path, env

    def test_wizard_writes_config_and_never_prints_the_key(self):
        from naftal.envfile import parse_env_text
        ok, out, path, env = self._run_wizard(["oui", ""], self.KEY)
        self.assertTrue(ok)
        cfg = parse_env_text(path.read_text())
        self.assertEqual(cfg["NAFTAL_LLM_ENABLED"], "1")
        self.assertEqual(cfg["NAFTAL_LLM_PROVIDER"], "anthropic")
        self.assertEqual(cfg["NAFTAL_LLM_API_KEY"], self.KEY)
        self.assertEqual(cfg["NAFTAL_LLM_MODEL"], "claude-opus-5-5")        # Entree = defaut
        self.assertEqual(env["NAFTAL_LLM_API_KEY"], self.KEY)               # actif sans redemarrer
        self.assertNotIn(self.KEY, out)                                     # jamais affichee
        self.assertIn("ne le partagez pas", out)

    def test_wizard_model_by_number_or_name(self):
        from naftal.envfile import parse_env_text
        _, _, p1, _ = self._run_wizard(["oui", "2"], self.KEY)
        self.assertEqual(parse_env_text(p1.read_text())["NAFTAL_LLM_MODEL"], "claude-sonnet-5-5")
        _, _, p2, _ = self._run_wizard(["oui", "un-autre-modele"], self.KEY)
        self.assertEqual(parse_env_text(p2.read_text())["NAFTAL_LLM_MODEL"], "un-autre-modele")

    def test_wizard_requires_explicit_consent(self):
        for answer in ("", "non", "peut-etre"):
            ok, out, path, env = self._run_wizard([answer], self.KEY)
            self.assertFalse(ok)
            self.assertFalse(path.exists())            # rien n'est ecrit sans consentement
            self.assertEqual(env, {})

    def test_wizard_rejects_blank_or_spaced_key(self):
        for bad in ("", "   ", "sk-ant-avec un espace"):
            ok, _out, path, env = self._run_wizard(["oui", ""], bad)
            self.assertFalse(ok)
            self.assertFalse(path.exists())
            self.assertEqual(env, {})

    def test_wizard_keeps_config_when_check_fails(self):
        ok, out, path, _env = self._run_wizard(["oui", ""], self.KEY, check=(False, "Echec: 401"))
        self.assertFalse(ok)
        self.assertTrue(path.exists())                 # on garde la config pour corriger
        self.assertIn("--check-llm", out)


class TestBakeoffMetrics(unittest.TestCase):
    """Les mesures objectives doivent distinguer le vrai du faux (sinon le banc d'essai ment)."""

    def test_fabricated_quote_is_caught_and_accents_are_ignored(self):
        from naftal.bakeoff import quote_stats
        out = ("« Le Fournisseur peut résilier le présent contrat à tout moment et sans motif » (vrai, accentué)\n"
               "« Le Fournisseur garantit une indemnisation intégrale en toute circonstance » (inventé)\n"
               "« tacitement » (trop court : ignoré)\n"
               "« Le Fournisseur peut résilier le présent contrat [...] moyennant un préavis de huit (8) jours » (ellipse)")
        self.assertEqual(quote_stats(out, V2), (3, 2))

    def test_article_refs_exclude_law_and_flag_nonexistent(self):
        from naftal.bakeoff import article_ref_stats
        out = "Article 5 est abusif ; l'article 127 du Code civil s'applique ; voir Article 12 et art. 3."
        # V2 a les articles 1 a 8 : « 12 » n'existe pas ; « 127 du Code civil » n'est pas un renvoi au contrat
        self.assertEqual(article_ref_stats(out, V2), (3, 2))

    def test_legal_refs_flagged_on_same_or_next_line(self):
        from naftal.bakeoff import legal_ref_stats
        out = ("Selon l'article 127 du Code civil (à vérifier), la force majeure s'applique.\n"
               "La loi n° 05-07 encadre le secteur.\n"
               "Ordonnance n° 75-58\n(à vérifier sur le JORADP)")
        self.assertEqual(legal_ref_stats(out), (3, 2))

    def test_truth_patterns_compile_and_discriminate(self):
        import json
        import re
        from naftal.bakeoff import SAMPLES, truth_recall
        truth = json.loads((SAMPLES / "contrat_demo_v2.truth.json").read_text(encoding="utf-8"))
        for issue in truth["issues"]:
            re.compile(issue["pattern"])
        self.assertEqual(truth_recall("Le contrat est équilibré. Rien à signaler.", truth)[:2], (0, 10))
        found, total, missed = truth_recall(
            "responsabilité du Client illimitée ; reconduction tacite ; arbitrage CCI", truth)
        self.assertEqual((found, total), (3, 10))
        self.assertTrue(any("confidentialite" in m for m in missed))

    def test_rules_engine_now_flags_cci_arbitration_clause(self):
        # Regression : « reglement d'arbitrage de la Chambre de commerce internationale (CCI) »
        # etait un faux negatif (motif trop etroit), revele par la verite terrain du banc d'essai.
        issues = analyze_text(V2).issues()
        self.assertTrue(any(f["article_ref"] == "Article 8" and "arbitrage" in f["problem"].lower()
                            for f in issues))
        self.assertLess(analyze_text(V1).risk_score, 20)        # pas de faux positif sur v1


class TestBakeoffRun(unittest.TestCase):
    def _fake(self, calls, ok=True):
        from naftal.llm.provider import LLMResult

        def fn(system, prompt, max_tokens):
            calls.append((system, prompt, max_tokens))
            if not ok:
                return LLMResult(ok=False, error="HTTP 401: invalid x-api-key")
            return LLMResult(ok=True, text=f"Analyse numero {len(calls)} : « Le Fournisseur peut résilier le "
                                           "présent contrat à tout moment et sans motif ».",
                             provider="fake", model="m", tokens_in=100, tokens_out=50)
        return fn

    def test_arms_differ_exactly_as_documented(self):
        from naftal.bakeoff import minimal_prompt, run_arm
        from naftal.llm import legal_brain
        calls = []
        a = run_arm("A", V2, self._fake(calls))
        self.assertEqual((calls[0][0], calls[0][1]), ("", minimal_prompt(V2)))        # aucun systeme
        calls.clear()
        run_arm("B", V2, self._fake(calls))
        self.assertEqual((calls[0][0], calls[0][1]), (legal_brain.SYSTEM_PROMPT, minimal_prompt(V2)))
        calls.clear()
        c = run_arm("C", V2, self._fake(calls))
        self.assertEqual(len(calls), 2)                                                # analyse + audit
        self.assertIn("Passe en revue", calls[0][1])                                   # checklist
        self.assertIn("auditeur", calls[1][1].lower())
        self.assertTrue(c["self_verified"])
        self.assertEqual({x[2] for x in calls}, {2600})                                # meme budget par appel
        self.assertEqual((a["calls"], a["tokens_in"], a["tokens_out"]), (1, 100, 50))
        self.assertEqual(c["calls"], 2)

    def test_packaging_is_blind_complete_and_reproducible(self):
        import json
        from naftal.bakeoff import ARM_LABELS, load_demo, run_bakeoff
        text, name, truth = load_demo()
        root = run_bakeoff(text, name, runs=2, llm_fn=self._fake([]), truth=truth, seed=7,
                           out_dir=Path(_TMP) / "bk1", progress=lambda *_: None)
        outs = sorted(p.name for p in (root / "sorties").iterdir())
        self.assertEqual(outs, [f"S{i:02d}.md" for i in range(1, 7)])                 # 3 bras x 2 runs
        key = json.loads((root / "a_ouvrir_apres_le_classement" / "cle.json").read_text(encoding="utf-8"))
        self.assertEqual(sorted(key), [f"S{i:02d}" for i in range(1, 7)])
        self.assertEqual(sorted(v["bras"] for v in key.values()), ["A", "A", "B", "B", "C", "C"])
        for f in (root / "sorties").iterdir():                                         # aucun indice de bras
            body = f.read_text(encoding="utf-8").lower()
            for label in ARM_LABELS.values():
                self.assertNotIn(label.split(" (")[0].lower(), body)
        sheet = (root / "fiche_notation.md").read_text(encoding="utf-8")
        self.assertTrue(all(f"| S{i:02d} |" in sheet for i in range(1, 7)))
        self.assertNotIn("bras", sheet.lower().replace("a_ouvrir_apres", ""))         # la fiche ne trahit rien
        # meme graine => meme melange
        root2 = run_bakeoff(text, name, runs=2, llm_fn=self._fake([]), truth=truth, seed=7,
                            out_dir=Path(_TMP) / "bk2", progress=lambda *_: None)
        key2 = json.loads((root2 / "a_ouvrir_apres_le_classement" / "cle.json").read_text(encoding="utf-8"))
        self.assertEqual(key, key2)
        from naftal.bakeoff import reveal
        self.assertIn("bras A", reveal(root))

    def test_stops_at_first_failure_to_avoid_wasting_calls(self):
        from naftal.bakeoff import BakeoffError, run_bakeoff
        calls = []
        with self.assertRaises(BakeoffError) as cm:
            run_bakeoff(V2, "x", runs=3, llm_fn=self._fake(calls, ok=False), out_dir=Path(_TMP) / "bk3",
                        progress=lambda *_: None)
        self.assertEqual(len(calls), 1)
        self.assertIn("401", str(cm.exception))

    def test_cli_requires_llm_and_explicit_consent_for_real_documents(self):
        from naftal.bakeoff import cli
        msgs, calls = [], []
        # IA non activee (tests) -> refus net, aucun appel
        self.assertEqual(cli("demo", out=msgs.append), 1)
        self.assertTrue(any("--setup-llm" in m for m in msgs))
        # document reel : sans « OUI », rien n'est envoye
        real = Path(_TMP) / "contrat_reel.txt"
        real.write_text(V1, encoding="utf-8")
        self.assertEqual(cli(str(real), llm_fn=self._fake(calls), input_fn=lambda _p: "non", out=msgs.append), 1)
        self.assertEqual(calls, [])
        # avec consentement : s'execute
        self.assertEqual(cli(str(real), llm_fn=self._fake(calls), input_fn=lambda _p: "oui",
                             out=msgs.append), 0)
        self.assertEqual(len(calls), 4)                                                # 1 + 1 + 2
        # demo : synthetique, pas de question
        calls.clear()
        self.assertEqual(cli("demo", llm_fn=self._fake(calls), input_fn=lambda _p: self.fail("question inattendue"),
                             out=msgs.append), 0)


class TestProviderSystemField(unittest.TestCase):
    def _capture(self, fn_name, system):
        import types
        from unittest import mock
        from naftal.llm import provider
        s = types.SimpleNamespace(llm_model="m", llm_base_url="", llm_api_key="k", llm_provider="x")
        seen = {}

        class R:
            status_code = 200
            text = ""

            def json(self):
                return {"content": [{"text": "ok"}], "usage": {},
                        "choices": [{"message": {"content": "ok"}}]}

        def post(url, headers=None, json=None, timeout=None):
            seen.update(json)
            return R()

        with mock.patch("requests.post", post):
            getattr(provider, fn_name)(s, system, "bonjour", 10)
        return seen

    def test_empty_system_is_omitted_for_both_providers(self):
        self.assertNotIn("system", self._capture("_call_anthropic", ""))
        self.assertIn("system", self._capture("_call_anthropic", "regles"))
        self.assertEqual([m["role"] for m in self._capture("_call_openai_compatible", "")["messages"]], ["user"])
        self.assertEqual([m["role"] for m in self._capture("_call_openai_compatible", "r")["messages"]],
                         ["system", "user"])


def _mcp_available() -> bool:
    try:
        import mcp.server.mcpserver  # noqa: F401
        return True
    except ImportError:
        return False


class TestMCPTools(unittest.TestCase):
    """Outils exposes a la conversation Claude (appeles ici directement, sans protocole)."""

    @classmethod
    def setUpClass(cls):
        from naftal import mcp_server as M
        from naftal.db import create_all
        create_all()
        cls.M = M
        s = _SAMPLES
        cls.v1 = M.naftal_import_file(path=str(s / "contrat_demo_v1.txt"), contract_title="MCP demo",
                                      version_label="V1")["importe"]
        cls.v2 = M.naftal_import_file(path=str(s / "contrat_demo_v2.txt"), contract_id=cls.v1["contract_id"],
                                      version_label="V2")["importe"]

    def test_import_attaches_versions_to_same_contract(self):
        self.assertEqual(self.v1["contract_id"], self.v2["contract_id"])
        self.assertTrue(self.v2["texte_extrait"])
        listed = self.M.naftal_list_documents(query="MCP demo")
        self.assertGreaterEqual(listed["nombre"], 2)

    def test_read_article_and_pagination(self):
        r = self.M.naftal_read_document(document_id=self.v2["document_id"], article="Article 5")
        self.assertIn("illimitee", r["texte"])
        self.assertIn("Article 8", [p["ref"] for p in r["plan"]])
        page = self.M.naftal_read_document(document_id=self.v2["document_id"], max_chars=500)
        self.assertEqual(len(page["texte"]), 500)
        self.assertEqual(page["suite"], 500)
        last = self.M.naftal_read_document(document_id=self.v2["document_id"], offset=page["longueur_totale"] - 10)
        self.assertIsNone(last["suite"])

    def test_analysis_is_grounded_and_persisted(self):
        from sqlalchemy import func, select
        from naftal.db import session_scope
        from naftal.models import Analysis
        with session_scope() as db:
            before = db.scalar(select(func.count()).select_from(Analysis))
        a = self.M.naftal_analyze_document(document_id=self.v2["document_id"])
        self.assertGreaterEqual(a["score_de_risque"], 60)
        self.assertIn("Garanties et assurances", [x["categorie"] for x in a["provisions_absentes"]])
        self.assertIn("Article 8", [x["article"] for x in a["points_d_attention"]])     # arbitrage CCI
        self.assertIn("filet de securite", a["moteur"])
        with session_scope() as db:
            self.assertEqual(db.scalar(select(func.count()).select_from(Analysis)), before + 1)

    def test_compare_risk_search_references_report(self):
        c = self.M.naftal_compare_documents(document_id_a=self.v1["document_id"], document_id_b=self.v2["document_id"])
        self.assertLess(c["score_de_risque"]["version_a"], c["score_de_risque"]["version_b"])
        self.assertIn(("Article 7", "Article 6"), [(x["article_a"], x["article_b"]) for x in c["changements"]])
        self.assertEqual(self.M.naftal_risk_report(document_id=self.v2["document_id"])["niveau_global"], "CRITICAL")
        s = self.M.naftal_search(query="résiliation anticipée", scope="contrat")
        self.assertTrue(s["resultats"])
        self.assertTrue(all(x["type"] == "contrat" for x in s["resultats"]))
        refs = self.M.naftal_legal_references(query="hydrocarbures")
        self.assertIn("a verifier", refs["avertissement"])
        self.assertTrue(all(r["statut"] == "a_verifier" for r in refs["references"]))
        rep = self.M.naftal_generate_report(kind="comparaison", document_id=self.v1["document_id"],
                                            document_id_b=self.v2["document_id"], fmt="docx")
        self.assertTrue(Path(rep["fichier"]).is_file())

    def test_pasted_text_tools(self):
        self.assertGreaterEqual(self.M.naftal_analyze_text(text=V2)["score_de_risque"], 60)
        self.assertTrue(self.M.naftal_compare_texts(text_a=V1, text_b=V2)["changements"])

    def test_errors_are_explicit(self):
        M = self.M
        cases = [
            (lambda: M.naftal_read_document(document_id=999999), "introuvable"),
            (lambda: M.naftal_read_document(document_id=self.v2["document_id"], article="42"), "Articles disponibles"),
            (lambda: M.naftal_import_file(path=str(Path(_TMP) / "absent.docx")), "introuvable"),
            (lambda: M.naftal_import_file(path=__file__), "Format non pris en charge"),
            (lambda: M.naftal_analyze_text(text="   "), "vide"),
            (lambda: M.naftal_analyze_text(text="x" * (M.MAX_TEXT + 1)), "depasse"),
            (lambda: M.naftal_compare_documents(document_id_a=1, document_id_b=1), "differents"),
            (lambda: M.naftal_search(query="force", scope="ailleurs"), "scope"),
            (lambda: M.naftal_generate_report(kind="autre", document_id=self.v1["document_id"]), "kind"),
        ]
        for call, expected in cases:
            with self.assertRaises(M.ToolError) as cm:
                call()
            self.assertIn(expected, str(cm.exception))

    def test_every_call_is_audited(self):
        from sqlalchemy import select
        from naftal.db import session_scope
        from naftal.models import AuditLog
        self.M.naftal_legal_references(query="audit-marqueur")
        with session_scope() as db:
            row = db.scalars(select(AuditLog).where(AuditLog.action == "mcp_legal_references")
                             .order_by(AuditLog.id.desc())).first()
        self.assertEqual(row.user_email, self.M.MCP_USER)
        self.assertIn("audit-marqueur", row.detail)

    def test_prompts_carry_the_naftal_method(self):
        from naftal.llm import legal_brain
        p = self.M.prompt_revue_contrat("7")
        self.assertIn(legal_brain.SYSTEM_PROMPT, p)
        self.assertIn("document_id = 7", p)
        self.assertIn("auditeur independant", p)
        self.assertIn("Ne retouche PAS les conditions", self.M.prompt_correction_avenant("3"))


class TestClaudeDesktopConfig(unittest.TestCase):
    def test_entry_uses_absolute_paths_of_this_machine(self):
        import sys
        from naftal.claude_desktop import PROJECT_ROOT, server_entry
        e = server_entry()
        self.assertEqual(e["command"], sys.executable)
        self.assertEqual(e["args"], ["-m", "naftal.mcp_server"])
        self.assertEqual(Path(e["env"]["PYTHONPATH"]), PROJECT_ROOT)
        self.assertTrue((PROJECT_ROOT / "naftal" / "mcp_server.py").is_file())
        for k in ("NAFTAL_DATA_DIR", "NAFTAL_ENV_FILE"):
            self.assertTrue(Path(e["env"][k]).is_absolute(), k)

    def test_install_creates_merges_and_backs_up(self):
        import json
        from naftal.claude_desktop import SERVER_KEY, install
        cfg = Path(_TMP) / "claude" / "claude_desktop_config.json"
        r = install(cfg, {"command": "py", "args": []})
        self.assertIsNone(r["backup"])
        self.assertIn(SERVER_KEY, json.loads(cfg.read_text())["mcpServers"])
        # config existante (avec BOM, comme le Bloc-notes) : autres serveurs et reglages conserves
        cfg.write_bytes(b"\xef\xbb\xbf" + json.dumps(
            {"mcpServers": {"autre": {"command": "x"}}, "theme": "dark"}).encode())
        r = install(cfg, {"command": "py2", "args": []})
        data = json.loads(cfg.read_text(encoding="utf-8"))
        self.assertEqual(data["mcpServers"]["autre"], {"command": "x"})
        self.assertEqual(data["theme"], "dark")
        self.assertEqual(data["mcpServers"][SERVER_KEY]["command"], "py2")
        self.assertEqual(r["other_servers"], ["autre"])
        self.assertTrue(Path(r["backup"]).is_file())
        # reinstallation : remplace, ne duplique pas
        self.assertTrue(install(cfg, {"command": "py3", "args": []})["replaced"])

    def test_install_refuses_to_touch_an_unreadable_config(self):
        from naftal.claude_desktop import InstallError, install
        cfg = Path(_TMP) / "claude-bad.json"
        cfg.write_text('{"mcpServers": {"autre": ')          # JSON tronque
        with self.assertRaises(InstallError):
            install(cfg, {"command": "py"})
        self.assertEqual(cfg.read_text(), '{"mcpServers": {"autre": ')
        cfg.write_text('{"mcpServers": ["pas", "un", "objet"]}')
        with self.assertRaises(InstallError):
            install(cfg, {"command": "py"})


@unittest.skipUnless(_mcp_available(), "bibliotheque mcp non installee")
class TestMCPProtocolEndToEnd(unittest.TestCase):
    """Vrai protocole MCP sur stdio, serveur lance comme Claude Desktop le ferait."""

    def test_full_session(self):
        import asyncio
        import json
        import os
        import sys
        from mcp.client.session import ClientSession
        from mcp.client.stdio import StdioServerParameters, stdio_client
        from naftal.claude_desktop import PROJECT_ROOT

        async def session():
            env = {**os.environ, "PYTHONPATH": str(PROJECT_ROOT)}
            params = StdioServerParameters(command=sys.executable, args=["-m", "naftal.mcp_server"],
                                           env=env, cwd=str(Path(_TMP)))          # autre dossier courant
            with open(os.devnull, "w") as dn:
                async with stdio_client(params, errlog=dn) as (r, w):
                    async with ClientSession(r, w) as s:
                        init = await s.initialize()
                        tools = (await s.list_tools()).tools
                        ok = await s.call_tool("naftal_analyze_text", {"text": V2})
                        bad = await s.call_tool("naftal_read_document", {"document_id": 999999})
                        prompt = await s.get_prompt("revue_contrat", {"document_id": "1"})
                        return init, tools, ok, bad, prompt

        init, tools, ok, bad, prompt = asyncio.run(session())
        self.assertIn("NE PAS", init.instructions.upper().replace("N'INVENTE", "NE PAS"))
        self.assertEqual(len(tools), 11)
        self.assertTrue(all(t.input_schema.get("type") == "object" for t in tools))
        self.assertFalse(ok.is_error)
        self.assertGreaterEqual(ok.structured_content["score_de_risque"], 60)
        self.assertEqual(json.loads(ok.content[0].text)["score_de_risque"], ok.structured_content["score_de_risque"])
        self.assertTrue(bad.is_error)
        self.assertIn("introuvable", bad.content[0].text)        # le motif atteint la conversation
        self.assertIn("auditeur independant", prompt.messages[0].content.text)

    def test_check_command_does_a_real_handshake(self):
        from naftal.claude_desktop import check
        ok, msg = check()
        self.assertTrue(ok, msg)
        self.assertIn("11 outils", msg)


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
