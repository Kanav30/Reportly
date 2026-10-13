"""
Reportly Deterministic Reference-Range Classifier
==================================================
Strictly rule-based, deterministic classification engine for clinical CBC parameters.
AI text or LLM generation is NEVER allowed to determine or override parameter status.
"""

import re
from typing import Optional, Dict, Any, Tuple

# Valid explicit result states
STATUS_WITHIN_RANGE = "Within Range"
STATUS_LOW = "Low"
STATUS_HIGH = "High"
STATUS_NEEDS_VERIFICATION = "Needs Verification"
STATUS_UNKNOWN = "Unknown"

# Standard CBC parameter canonical units & synonyms
ACCEPTED_CBC_UNITS = {
    # Hemoglobin
    "g/dl": "g/dL",
    "gm/dl": "g/dL",
    "g/l": "g/L",
    "g%": "g/dL",
    # Cell counts (WBC, Platelets)
    "10^3/ul": "10^3/µL",
    "10^3/µl": "10^3/µL",
    "thous/mcl": "10^3/µL",
    "k/ul": "10^3/µL",
    "/cumm": "/cumm",
    "/mm3": "/mm3",
    "cells/cumm": "/cumm",
    "cells/ul": "/µL",
    # RBC
    "10^6/ul": "10^6/µL",
    "10^6/µl": "10^6/µL",
    "mil/ul": "10^6/µL",
    "mil/µl": "10^6/µL",
    "m/ul": "10^6/µL",
    # Indices
    "fl": "fL",
    "pg": "pg",
    "%": "%",
    "card test": "Card Test",
    "rapid test": "Rapid Test",
}


def normalize_unit(unit_str: Optional[str]) -> Optional[str]:
    if not unit_str:
        return None
    cleaned = unit_str.strip().lower()
    return ACCEPTED_CBC_UNITS.get(cleaned, unit_str.strip())


def parse_numeric_value(val_str: Any) -> Tuple[Optional[float], Optional[str]]:
    """
    Safely extracts a single float from string.
    Returns (float_value, error_or_warning)
    """
    if val_str is None:
        return None, "Value is missing"

    s = str(val_str).strip()
    if not s:
        return None, "Value is empty"

    # Remove thousands commas (e.g. '150,000' -> '150000')
    cleaned = s.replace(",", "")

    # Look for valid signed floating point or integer
    match = re.search(r"[-+]?\d*\.?\d+", cleaned)
    if not match:
        return None, f"No numerical value found in '{s}'"

    try:
        val = float(match.group(0))
        return val, None
    except (ValueError, TypeError) as e:
        return None, f"Unable to parse number: {e}"


def parse_range_bounds(
    range_min: Any, 
    range_max: Any, 
    range_string: Optional[str] = None
) -> Tuple[Optional[float], Optional[float], Optional[str]]:
    """
    Parses and validates lower and upper range bounds.
    If range_min or range_max are already provided, validates them.
    Otherwise attempts to parse from range_string (e.g. '12.0 - 16.0' or '150-450').
    """
    p_min, _ = parse_numeric_value(range_min) if range_min is not None else (None, None)
    p_max, _ = parse_numeric_value(range_max) if range_max is not None else (None, None)

    if p_min is not None and p_max is not None:
        return p_min, p_max, None

    if range_string:
        cleaned_rs = str(range_string).replace(",", "").strip()
        # Look for pattern 'min - max' or 'min to max'
        matches = re.findall(r"[-+]?\d*\.?\d+", cleaned_rs)
        if len(matches) >= 2:
            try:
                found_min = float(matches[0])
                found_max = float(matches[1])
                if found_min <= found_max:
                    return (p_min if p_min is not None else found_min,
                            p_max if p_max is not None else found_max,
                            None)
            except ValueError:
                pass

    return p_min, p_max, None


def classify_status(
    value_raw: Any,
    range_min: Optional[Any] = None,
    range_max: Optional[Any] = None,
    unit: Optional[str] = None,
    test_name: Optional[str] = None,
    range_string: Optional[str] = None
) -> Dict[str, Any]:
    """
    Deterministic reference range classification function.
    Returns complete metadata dictionary with status, reason, parsed values, and verification flags.
    """
    # 1. Check for missing value
    if value_raw is None or str(value_raw).strip() == "" or str(value_raw).strip().lower() in ["null", "none", "nan", "n/a", "-"]:
        return {
            "status": STATUS_NEEDS_VERIFICATION,
            "status_code": "MISSING_VALUE",
            "reason": "Test result value is missing from the report and requires manual verification.",
            "parsed_value": None,
            "parsed_min": None,
            "parsed_max": None,
            "is_numeric": False,
            "needs_verification": True,
            "unit_validated": False,
            "comparison_math": "No value provided"
        }

    val_str = str(value_raw).strip()
    val_upper = val_str.upper()

    # 2. Check qualitative tests (e.g. Serology, Card Tests, Blood Group, Stains)
    qualitative_reactive = ["POSITIVE", "REACTIVE", "DETECTED", "PRESENT"]
    qualitative_negative = ["NEGATIVE", "NON-REACTIVE", "NOT DETECTED", "ABSENT"]

    if val_upper in qualitative_reactive:
        return {
            "status": STATUS_HIGH,  # Or flagged reactive
            "status_code": "QUALITATIVE_REACTIVE",
            "reason": f"Qualitative finding '{val_str}' indicates a reactive or detected result.",
            "parsed_value": val_str,
            "parsed_min": None,
            "parsed_max": None,
            "is_numeric": False,
            "needs_verification": False,
            "unit_validated": True,
            "comparison_math": f"Qualitative check: '{val_str}' matches reactive pattern"
        }

    if val_upper in qualitative_negative:
        return {
            "status": STATUS_WITHIN_RANGE,
            "status_code": "QUALITATIVE_NON_REACTIVE",
            "reason": f"Qualitative finding '{val_str}' is non-reactive/negative, matching expected baseline.",
            "parsed_value": val_str,
            "parsed_min": None,
            "parsed_max": None,
            "is_numeric": False,
            "needs_verification": False,
            "unit_validated": True,
            "comparison_math": f"Qualitative check: '{val_str}' matches expected non-reactive"
        }

    # 3. Parse numerical value
    val_num, parse_err = parse_numeric_value(val_str)
    if val_num is None:
        return {
            "status": STATUS_NEEDS_VERIFICATION,
            "status_code": "INVALID_NUMERIC",
            "reason": f"Unable to parse a valid numeric result from '{val_str}'. {parse_err or ''}".strip(),
            "parsed_value": None,
            "parsed_min": None,
            "parsed_max": None,
            "is_numeric": False,
            "needs_verification": True,
            "unit_validated": False,
            "comparison_math": f"Failed numeric parse for '{val_str}'"
        }

    # 4. Parse reference range bounds
    p_min, p_max, _ = parse_range_bounds(range_min, range_max, range_string)

    # 5. Handle missing reference range - MUST NEVER FABRICATE NORMAL!
    if p_min is None and p_max is None:
        return {
            "status": STATUS_UNKNOWN,
            "status_code": "MISSING_RANGE",
            "reason": f"Report did not provide reference range for {test_name or 'parameter'}. Value {val_num} cannot be classified.",
            "parsed_value": val_num,
            "parsed_min": None,
            "parsed_max": None,
            "is_numeric": True,
            "needs_verification": True,
            "unit_validated": bool(unit),
            "comparison_math": "No reference interval defined"
        }

    # 6. Validate range boundaries logic (e.g. min > max error in OCR)
    if p_min is not None and p_max is not None and p_min > p_max:
        return {
            "status": STATUS_NEEDS_VERIFICATION,
            "status_code": "INVERTED_RANGE",
            "reason": f"Extracted reference interval ({p_min} - {p_max}) is inverted. OCR verification needed.",
            "parsed_value": val_num,
            "parsed_min": p_min,
            "parsed_max": p_max,
            "is_numeric": True,
            "needs_verification": True,
            "unit_validated": bool(unit),
            "comparison_math": f"Invalid bounds: lower ({p_min}) > upper ({p_max})"
        }

    # 6B. Detect and adjust 1000x scale mismatches (e.g. Platelets 150,000 against 150-450 range)
    adjusted_val = val_num
    scale_note = ""
    is_cell_count = bool(test_name and any(term in str(test_name).upper() for term in ["PLATELET", "PLT", "WBC", "LEUCOCYTE", "LEUKOCYTE", "TLC"]))
    
    if is_cell_count and p_max is not None and p_max > 0:
        if val_num > 100 * p_max and p_max <= 1000:
            adjusted_val = val_num / 1000.0
            scale_note = f" (normalized from count to 10^3/µL: {val_num} -> {adjusted_val})"
        elif p_min is not None and p_min >= 1000 and val_num < (p_min / 100):
            adjusted_val = val_num * 1000.0
            scale_note = f" (normalized from 10^3/µL to count: {val_num} -> {adjusted_val})"

    # 7. Exact deterministic mathematical comparison
    # Precision epsilon for floating point boundary equality
    EPS = 1e-6

    # Lower bound check
    if p_min is not None and adjusted_val < (p_min - EPS):
        return {
            "status": STATUS_LOW,
            "status_code": "BELOW_RANGE",
            "reason": f"Value {val_num}{scale_note} is below the lower reference limit of {p_min}.",
            "parsed_value": val_num,
            "parsed_min": p_min,
            "parsed_max": p_max,
            "is_numeric": True,
            "needs_verification": False,
            "unit_validated": bool(unit),
            "comparison_math": f"{adjusted_val} < {p_min} (Lower Limit)"
        }

    # Upper bound check
    if p_max is not None and adjusted_val > (p_max + EPS):
        return {
            "status": STATUS_HIGH,
            "status_code": "ABOVE_RANGE",
            "reason": f"Value {val_num}{scale_note} is above the upper reference limit of {p_max}.",
            "parsed_value": val_num,
            "parsed_min": p_min,
            "parsed_max": p_max,
            "is_numeric": True,
            "needs_verification": False,
            "unit_validated": bool(unit),
            "comparison_math": f"{adjusted_val} > {p_max} (Upper Limit)"
        }

    # Within bounds check (inclusive: p_min <= val <= p_max)
    range_desc = f"{p_min} to {p_max}" if (p_min is not None and p_max is not None) else (f">= {p_min}" if p_min is not None else f"<= {p_max}")
    return {
        "status": STATUS_WITHIN_RANGE,
        "status_code": "WITHIN_RANGE",
        "reason": f"Value {val_num}{scale_note} is within the laboratory reference interval of {range_desc}.",
        "parsed_value": val_num,
        "parsed_min": p_min,
        "parsed_max": p_max,
        "is_numeric": True,
        "needs_verification": False,
        "unit_validated": bool(unit),
        "comparison_math": f"{p_min if p_min is not None else '-inf'} <= {adjusted_val} <= {p_max if p_max is not None else '+inf'}"
    }
