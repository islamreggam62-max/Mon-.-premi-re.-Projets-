"""Extraction de texte et segmentation en clauses."""
from .extractor import ExtractionResult, extract_text
from .segmentation import Clause, segment_clauses

__all__ = ["ExtractionResult", "extract_text", "Clause", "segment_clauses"]
