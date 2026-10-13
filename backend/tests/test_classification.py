"""
Automated Unit Tests for Reportly Classifier
============================================
Tests boundary values, missing values, missing reference ranges,
invalid numbers, qualitative markers, and deterministic rules.
"""

import pytest
from classifier import (
    classify_status,
    STATUS_WITHIN_RANGE,
    STATUS_LOW,
    STATUS_HIGH,
    STATUS_NEEDS_VERIFICATION,
    STATUS_UNKNOWN,
    parse_numeric_value,
    parse_range_bounds,
    normalize_unit
)

def test_missing_values_never_normal():
    """Missing or empty values must NEVER default to Normal."""
    for empty_val in [None, "", "   ", "null", "none", "nan", "N/A", "-"]:
        result = classify_status(empty_val, range_min=12.0, range_max=16.0)
        assert result["status"] == STATUS_NEEDS_VERIFICATION
        assert result["needs_verification"] is True
        assert "missing" in result["reason"].lower()

def test_invalid_numerical_values():
    """Garbled or non-numeric tokens must be flagged for verification."""
    for bad_val in ["abc", "error", "++", "#$@"]:
        result = classify_status(bad_val, range_min=4.0, range_max=11.0)
        assert result["status"] == STATUS_NEEDS_VERIFICATION
        assert result["needs_verification"] is True

def test_missing_reference_ranges():
    """Missing range_min and range_max must NOT fabricate normal classification."""
    result = classify_status(14.5, range_min=None, range_max=None)
    assert result["status"] == STATUS_UNKNOWN
    assert result["needs_verification"] is True
    assert "cannot be classified" in result["reason"]

def test_exact_numerical_boundaries():
    """
    Boundary handling:
    val < min -> Low
    val == min -> Within Range
    min < val < max -> Within Range
    val == max -> Within Range
    val > max -> High
    """
    rmin, rmax = 12.0, 16.0

    # Below lower limit
    assert classify_status(11.9, rmin, rmax)["status"] == STATUS_LOW
    assert classify_status("11.99", rmin, rmax)["status"] == STATUS_LOW

    # Exact lower limit
    assert classify_status(12.0, rmin, rmax)["status"] == STATUS_WITHIN_RANGE

    # Inside interval
    assert classify_status(14.0, rmin, rmax)["status"] == STATUS_WITHIN_RANGE

    # Exact upper limit
    assert classify_status(16.0, rmin, rmax)["status"] == STATUS_WITHIN_RANGE

    # Above upper limit
    assert classify_status(16.01, rmin, rmax)["status"] == STATUS_HIGH
    assert classify_status(18.5, rmin, rmax)["status"] == STATUS_HIGH

def test_thousand_separator_formatting():
    """Values with commas like '150,000' must parse correctly."""
    result = classify_status("103,000", range_min=150000, range_max=450000)
    assert result["status"] == STATUS_LOW
    assert result["parsed_value"] == 103000.0

    result2 = classify_status("250,000", range_min="150,000", range_max="450,000")
    assert result2["status"] == STATUS_WITHIN_RANGE

def test_qualitative_tests():
    """Qualitative tests like Typhoid Serology must be recognized."""
    pos_res = classify_status("POSITIVE", range_min=None, range_max=None)
    assert pos_res["status"] == STATUS_HIGH
    assert pos_res["status_code"] == "QUALITATIVE_REACTIVE"

    neg_res = classify_status("NEGATIVE", range_min=None, range_max=None)
    assert neg_res["status"] == STATUS_WITHIN_RANGE
    assert neg_res["status_code"] == "QUALITATIVE_NON_REACTIVE"

def test_inverted_reference_range():
    """If OCR extracts an inverted range (e.g. min 20, max 10), flag as Needs Verification."""
    res = classify_status(15.0, range_min=20.0, range_max=10.0)
    assert res["status"] == STATUS_NEEDS_VERIFICATION
    assert res["status_code"] == "INVERTED_RANGE"

def test_reason_and_comparison_math_returned():
    """Every classification must provide a traceable explanation for the Evidence Trace."""
    res = classify_status(10.2, range_min=12.0, range_max=16.0)
    assert "comparison_math" in res
    assert "10.2 < 12.0" in res["comparison_math"]
    assert "reason" in res
    assert "below the lower reference limit" in res["reason"]

def test_unit_normalization():
    """Standard CBC units should be normalized properly."""
    assert normalize_unit("g/dl") == "g/dL"
    assert normalize_unit("10^3/ul") == "10^3/µL"
    assert normalize_unit("fl") == "fL"
    assert normalize_unit("pg") == "pg"
