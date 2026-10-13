"""
Automated Unit Tests for Safe Medical Pattern Analysis
======================================================
Tests clinical pattern prerequisites, evidence grounding,
uncertainty limitation inclusion, and non-diagnostic wording.
"""

import pytest
from patterns import analyze_patterns_safely

def test_microcytic_pattern_requires_both_low_hb_and_low_mcv():
    """Pattern should only trigger when both Hb and MCV are Low."""
    # Only Low Hb, normal MCV -> should NOT trigger microcytic pattern
    params1 = [
        {"name": "Hemoglobin (HGB)", "value": "10.0", "unit": "g/dL", "status": "Low", "range": "12.0 - 16.0"},
        {"name": "Mean Corpuscular Volume (MCV)", "value": "90.0", "unit": "fL", "status": "Within Range", "range": "82.0 - 100.0"}
    ]
    patterns1 = analyze_patterns_safely(params1)
    assert not any("Microcytic" in p["title"] or "Reduced Red Cell Volume" in p["title"] for p in patterns1)

    # Both Low Hb and Low MCV -> Triggers pattern
    params2 = [
        {"name": "Hemoglobin (HGB)", "value": "10.0", "unit": "g/dL", "status": "Low", "range": "12.0 - 16.0"},
        {"name": "Mean Corpuscular Volume (MCV)", "value": "72.0", "unit": "fL", "status": "Low", "range": "82.0 - 100.0"}
    ]
    patterns2 = analyze_patterns_safely(params2)
    assert any("Reduced Red Cell Volume" in p["title"] for p in patterns2)
    p = [p for p in patterns2 if "Reduced Red Cell Volume" in p["title"]][0]
    
    # Check that limitations and doctor questions are included
    assert "uncertainty_and_limitations" in p
    assert "does not establish a specific diagnosis" in p["uncertainty_and_limitations"]
    assert len(p["suggested_questions"]) >= 2
    assert len(p["supporting_evidence"]) == 2

def test_no_diagnostic_confirmation_in_any_pattern():
    """Ensure patterns NEVER claim to definitively diagnose a disease or prescribe treatment."""
    forbidden_terms = [
        "confirms iron deficiency",
        "confirms typhoid",
        "take antibiotics",
        "prescribed antibiotics",
        "cure",
        "you have cancer",
        "diagnosed with"
    ]
    
    test_cases = [
        [
            {"name": "Hemoglobin", "value": "9.5", "unit": "g/dL", "status": "Low", "range": "12.0-16.0"},
            {"name": "MCV", "value": "70.0", "unit": "fL", "status": "Low", "range": "80.0-100.0"}
        ],
        [
            {"name": "Platelet Count", "value": "95", "unit": "10^3/µL", "status": "Low", "range": "150-450"},
            {"name": "Typhoid", "value": "POSITIVE", "unit": "Card Test", "status": "High", "range": "Negative"}
        ],
        [
            {"name": "WBC", "value": "16.5", "unit": "10^3/µL", "status": "High", "range": "4.0-11.0"},
            {"name": "Neutrophils %", "value": "85.0", "unit": "%", "status": "High", "range": "40.0-70.0"}
        ]
    ]

    for tc in test_cases:
        pats = analyze_patterns_safely(tc)
        for p in pats:
            full_text = f"{p['title']} {p['observation']} {p['clinical_context']} {p['uncertainty_and_limitations']}".lower()
            for term in forbidden_terms:
                assert term not in full_text, f"Forbidden diagnostic claim '{term}' found in pattern: {p['title']}"

def test_normal_profile_pattern():
    """When all tested markers are within range, display balanced baseline observation."""
    params = [
        {"name": "Hemoglobin (HGB)", "value": "14.2", "unit": "g/dL", "status": "Within Range", "range": "12.0 - 16.0"},
        {"name": "WBC", "value": "6.8", "unit": "10^3/µL", "status": "Within Range", "range": "4.0 - 11.0"},
        {"name": "Platelets", "value": "240", "unit": "10^3/µL", "status": "Within Range", "range": "150 - 450"}
    ]
    patterns = analyze_patterns_safely(params)
    assert len(patterns) == 1
    assert "Within Reference Intervals" in patterns[0]["title"]
    assert "Normal blood counts do not rule out all medical conditions" in patterns[0]["uncertainty_and_limitations"]
