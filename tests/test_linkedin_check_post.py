import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location(
    "check_post", ROOT / "marketing" / "linkedin" / "tools" / "check_post.py"
)
check_post = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(check_post)


def test_emoji_counts_as_two_units():
    assert check_post.utf16_len("ok") == 2
    assert check_post.utf16_len("🚀") == 2
    assert check_post.utf16_len("é") == 1


def test_only_the_post_block_is_measured():
    text = "# Draft\nnotes here\n<!-- post -->\nHello LinkedIn\n<!-- /post -->\nmore notes"
    result = check_post.check(text)
    assert result["length_utf16"] == len("Hello LinkedIn")


def test_limits_per_field():
    assert check_post.check("x" * 3000)["within_limit"] is True
    assert check_post.check("x" * 3001)["within_limit"] is False
    assert check_post.check("x" * 1251, kind="comment")["within_limit"] is False
    assert check_post.check("x" * 120, kind="tagline")["remaining"] == 0


def test_fold_cuts_on_a_word_boundary():
    text = ("word " * 60).strip()
    shown = check_post.fold(text, 140)
    assert shown.endswith("…")
    assert check_post.utf16_len(shown[:-1]) <= 140
    assert not shown[:-1].endswith(" wor")


def test_short_text_is_not_folded():
    assert check_post.fold("Short post.", 140) == "Short post."


def test_ai_phrases_are_loaded_and_found():
    phrases = check_post.load_phrases()
    assert "game-changer" in phrases
    assert "Dans un monde où" in phrases
    found = check_post.check("This is a game-changer for teams. Let's dive in.")["ai_phrases_found"]
    assert "game-changer" in found
    assert "Let's dive in" in found


def test_phrase_match_is_whole_word():
    found = check_post.check("We leveraged nothing; the robustness test passed.")["ai_phrases_found"]
    assert "robust" not in found


def test_hashtags_and_links():
    result = check_post.check("Try it: https://example.com/demo #SaaS #Leadership")
    assert result["links"] == ["https://example.com/demo"]
    assert result["hashtags"] == ["#SaaS", "#Leadership"]
