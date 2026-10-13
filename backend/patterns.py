"""
Reportly Safe Medical Pattern-Analysis Engine
============================================
Responsible, educational pattern recognition for Complete Blood Count (CBC) parameters.
STRICT SAFETY RULES:
- Refuses to diagnose patients or confirm specific diseases.
- Refuses to prescribe treatments, drugs, or dosages.
- Explicitly details supporting laboratory parameters and numerical values.
- Explicitly states what CANNOT be concluded from the findings.
- Provides grounded, constructive questions for a healthcare professional.
"""

from typing import List, Dict, Any, Optional

def analyze_patterns_safely(parameters: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Analyzes validated CBC parameters using transparent, deterministic clinical rules.
    Only evaluates parameters with valid classifications; ignores missing/uncertain data.
    """
    patterns = []
    
    # Map parameters by standardized key for safe lookup
    param_map = {}
    for p in parameters:
        name = str(p.get("name", "")).upper()
        status = p.get("status", "")
        val = p.get("value")
        unit = p.get("unit", "")
        
        # Identify key markers
        if any(term in name for term in ["HEMOGLOBIN", "HGB", "HB\b", "HB "]):
            param_map["HB"] = p
        elif "MCV" in name:
            param_map["MCV"] = p
        elif "MCH" in name and "MCHC" not in name:
            param_map["MCH"] = p
        elif "MCHC" in name:
            param_map["MCHC"] = p
        elif any(term in name for term in ["PLATELET", "PLT"]):
            param_map["PLT"] = p
        elif any(term in name for term in ["LEUCOCYTE", "LEUKOCYTE", "WBC", "TLC"]):
            param_map["WBC"] = p
        elif any(term in name for term in ["NEUTROPHIL", "GRANULOCYTE", "GRAN%"]):
            param_map["NEUTRO"] = p
        elif any(term in name for term in ["LYMPHOCYTE", "LYM%"]):
            param_map["LYMPH"] = p
        elif "TYPHOID" in name:
            param_map["TYPHOID"] = p
        elif "RBC" in name:
            param_map["RBC"] = p

    # 1. Pattern: Low Hemoglobin + Low MCV (Microcytic Pattern)
    hb_p = param_map.get("HB")
    mcv_p = param_map.get("MCV")
    mch_p = param_map.get("MCH")
    
    if (hb_p and hb_p.get("status") == "Low" and 
        mcv_p and mcv_p.get("status") == "Low"):
        
        supporting = [
            {
                "name": hb_p.get("name"),
                "value": hb_p.get("value"),
                "unit": hb_p.get("unit"),
                "status": hb_p.get("status"),
                "reference_range": hb_p.get("range")
            },
            {
                "name": mcv_p.get("name"),
                "value": mcv_p.get("value"),
                "unit": mcv_p.get("unit"),
                "status": mcv_p.get("status"),
                "reference_range": mcv_p.get("range")
            }
        ]
        if mch_p and mch_p.get("status") == "Low":
            supporting.append({
                "name": mch_p.get("name"),
                "value": mch_p.get("value"),
                "unit": mch_p.get("unit"),
                "status": mch_p.get("status"),
                "reference_range": mch_p.get("range")
            })

        patterns.append({
            "title": "Observation: Lower Hemoglobin with Reduced Red Cell Volume (MCV)",
            "observation": "The report shows lower hemoglobin levels alongside smaller-than-typical red blood cell volume (MCV).",
            "supporting_evidence": supporting,
            "clinical_context": "Hemoglobin provides oxygen-carrying capacity, while MCV measures average cell size. When hemoglobin synthesis is limited, red blood cells commonly develop with reduced volume.",
            "uncertainty_and_limitations": "This observation does not establish a specific diagnosis or underlying cause. A standard CBC cannot measure iron stores, ferritin levels, or hemoglobin variants.",
            "suggested_questions": [
                "Could this combination be related to nutritional factors such as iron levels, or another cause?",
                "Would a serum ferritin or iron profile test provide helpful clarification before considering any dietary changes?",
                "Are there any symptoms (such as fatigue or breathlessness) that we should discuss together?"
            ]
        })

    # 2. Pattern: Elevated White Blood Cells with High Neutrophils / Granulocytes
    wbc_p = param_map.get("WBC")
    neutro_p = param_map.get("NEUTRO")
    
    if ((wbc_p and wbc_p.get("status") == "High") or 
        (neutro_p and neutro_p.get("status") == "High")):
        
        supporting = []
        if wbc_p:
            supporting.append({
                "name": wbc_p.get("name"),
                "value": wbc_p.get("value"),
                "unit": wbc_p.get("unit"),
                "status": wbc_p.get("status"),
                "reference_range": wbc_p.get("range")
            })
        if neutro_p:
            supporting.append({
                "name": neutro_p.get("name"),
                "value": neutro_p.get("value"),
                "unit": neutro_p.get("unit"),
                "status": neutro_p.get("status"),
                "reference_range": neutro_p.get("range")
            })

        patterns.append({
            "title": "Observation: Elevated Leukocytes / Neutrophil Immune Response",
            "observation": "One or more white blood cell markers sit above the laboratory reference threshold.",
            "supporting_evidence": supporting,
            "clinical_context": "White blood cells, particularly neutrophils/granulocytes, are primary immune responders that often increase during acute bacterial illness, inflammation, or physical stress.",
            "uncertainty_and_limitations": "Elevated white cells indicate immune activity but cannot identify where in the body an infection or inflammation is situated, nor whether it is bacterial, viral, or reactive.",
            "suggested_questions": [
                "What clinical symptoms (such as fever, cough, or pain) best explain this immune response?",
                "Would an inflammatory marker test (such as CRP or ESR) or follow-up blood test be useful to monitor the trend?",
                "Are any specific precautions or rest recommendations appropriate while my body is recovering?"
            ]
        })

    # 3. Pattern: Low Platelets + Reactive Typhoid Serology (or isolated low platelets)
    plt_p = param_map.get("PLT")
    typhoid_p = param_map.get("TYPHOID")
    
    if plt_p and plt_p.get("status") == "Low":
        is_typhoid_positive = False
        if typhoid_p:
            t_val = str(typhoid_p.get("value", "")).upper()
            if "POS" in t_val or typhoid_p.get("status") == "High":
                is_typhoid_positive = True

        supporting = [
            {
                "name": plt_p.get("name"),
                "value": plt_p.get("value"),
                "unit": plt_p.get("unit"),
                "status": plt_p.get("status"),
                "reference_range": plt_p.get("range")
            }
        ]

        if is_typhoid_positive:
            supporting.append({
                "name": typhoid_p.get("name"),
                "value": typhoid_p.get("value"),
                "unit": typhoid_p.get("unit"),
                "status": typhoid_p.get("status"),
                "reference_range": typhoid_p.get("range")
            })
            patterns.append({
                "title": "Observation: Reduced Platelet Count in the Setting of Reactive Enteric Serology",
                "observation": "Platelet count sits below the laboratory reference interval alongside a reactive serological test for Salmonella Typhi.",
                "supporting_evidence": supporting,
                "clinical_context": "Systemic bacterial illnesses such as enteric fever can transiently suppress bone marrow platelet production and increase peripheral clearance.",
                "uncertainty_and_limitations": "Serological card tests alone are screening indicators. This combination does not confirm disease severity or complications, which require direct physician assessment.",
                "suggested_questions": [
                    "What follow-up schedule do you recommend to monitor my platelet levels until they stabilize?",
                    "What specific signs (e.g. bleeding gums, dark stools, easy bruising) require immediate medical review?",
                    "What hydration or dietary support should I follow alongside any prescribed medical care?"
                ]
            })
        else:
            patterns.append({
                "title": "Observation: Reduced Platelet Count (Thrombocytopenia)",
                "observation": "Platelet count is lower than the laboratory's lower reference threshold.",
                "supporting_evidence": supporting,
                "clinical_context": "Platelets are essential blood components that assist with normal clotting and bleeding control.",
                "uncertainty_and_limitations": "A single laboratory count cannot determine whether a platelet reduction is acute, chronic, or related to a recent viral illness or medication.",
                "suggested_questions": [
                    "Should we recheck the platelet count in 48 to 72 hours to evaluate whether the level is stable or improving?",
                    "Are there any activities or over-the-counter medications (such as NSAIDs) I should avoid right now?",
                    "What red-flag signs would necessitate an immediate hospital or clinic visit?"
                ]
            })

    # 4. Default: All Within Range or Unpatterned
    if not patterns:
        all_normal = all(p.get("status") == "Within Range" for p in parameters if p.get("status") not in ["Needs Verification", "Unknown"])
        if all_normal and len(parameters) > 0:
            patterns.append({
                "title": "Observation: Core CBC Lineages Within Reference Intervals",
                "observation": "Extracted red blood cell, white blood cell, and platelet parameters fall within their respective laboratory reference intervals.",
                "supporting_evidence": [
                    {
                        "name": p.get("name"),
                        "value": p.get("value"),
                        "unit": p.get("unit"),
                        "status": p.get("status"),
                        "reference_range": p.get("range")
                    }
                    for p in parameters[:4]
                ],
                "clinical_context": "Oxygen carriage (erythroid), immune defense (leukocyte), and primary clotting (platelet) indicators align with standard baseline thresholds.",
                "uncertainty_and_limitations": "Normal blood counts do not rule out all medical conditions. Clinical symptoms, physical examination, and medical history remain essential.",
                "suggested_questions": [
                    "Given that these baseline counts are within range, how often do you suggest routine preventive screening?",
                    "Do these results align with how I have been feeling clinically?"
                ]
            })

    return patterns
