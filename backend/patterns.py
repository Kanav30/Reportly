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
        elif any(term in name for term in ["EOSINOPHIL", "EOS%"]):
            param_map["EOS"] = p
        elif any(term in name for term in ["RDW", "RED CELL DISTRIBUTION"]):
            param_map["RDW"] = p
        elif "TYPHOID" in name:
            param_map["TYPHOID"] = p
        elif "RBC" in name:
            param_map["RBC"] = p

    hb_p = param_map.get("HB")
    mcv_p = param_map.get("MCV")
    mch_p = param_map.get("MCH")
    wbc_p = param_map.get("WBC")
    neutro_p = param_map.get("NEUTRO")
    lymph_p = param_map.get("LYMPH")
    eos_p = param_map.get("EOS")
    rdw_p = param_map.get("RDW")
    plt_p = param_map.get("PLT")
    typhoid_p = param_map.get("TYPHOID")

    # 1. Pattern: Low Hemoglobin + Low MCV (Microcytic Pattern)
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
            "title_hi": "अवलोकन: कम हीमोग्लोबिन एवं छोटी लाल रक्त कोशिकाएं (माइक्रोसाइटिक पैटर्न)",
            "source_citation": "WHO Guidelines on Nutritional Anemia / MedlinePlus Laboratory Encyclopedia (MCV)",
            "prerequisites": ["Hemoglobin status is 'Low'", "Mean Corpuscular Volume (MCV) status is 'Low'"],
            "observation": "The report shows lower hemoglobin levels alongside smaller-than-typical red blood cell volume (MCV).",
            "observation_hi": "रिपोर्ट में हीमोग्लोबिन का स्तर सामान्य से कम और लाल रक्त कोशिकाओं का औसत आकार (MCV) छोटा देखा गया है।",
            "supporting_evidence": supporting,
            "clinical_context": "Hemoglobin provides oxygen-carrying capacity, while MCV measures average cell size. When hemoglobin synthesis is limited, red blood cells commonly develop with reduced volume.",
            "clinical_context_hi": "हीमोग्लोबिन शरीर में ऑक्सीजन पहुंचाता है, जबकि MCV कोशिकाओं के आकार को मापता है। हीमोग्लोबिन की कमी में कोशिकाएं अक्सर सामान्य से छोटी बनती हैं।",
            "uncertainty_and_limitations": "This observation does not establish a specific diagnosis or underlying cause. A standard CBC cannot measure iron stores, ferritin levels, or hemoglobin variants.",
            "uncertainty_and_limitations_hi": "यह अवलोकन किसी विशिष्ट बीमारी का निदान नहीं करता। सामान्य सीबीसी से शरीर के आयरन या फेरिटिन स्तर की पुष्टि नहीं होती।",
            "suggested_questions": [
                "Could this combination be related to nutritional factors such as iron levels, or another cause?",
                "Would a serum ferritin or iron profile test provide helpful clarification before considering any dietary changes?",
                "Are there any symptoms (such as fatigue or breathlessness) that we should discuss together?"
            ]
        })

    # 2. Pattern: Low Hemoglobin + High MCV (Macrocytic Pattern)
    elif (hb_p and hb_p.get("status") == "Low" and 
          mcv_p and mcv_p.get("status") == "High"):
        
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

        patterns.append({
            "title": "Observation: Lower Hemoglobin with Elevated Red Cell Volume (Macrocytic Pattern)",
            "title_hi": "अवलोकन: कम हीमोग्लोबिन एवं बड़ी लाल रक्त कोशिकाएं (मैक्रोसाइटिक पैटर्न)",
            "source_citation": "MedlinePlus Medical Encyclopedia (Macrocytosis) / NIH Clinical Hematology",
            "prerequisites": ["Hemoglobin status is 'Low'", "Mean Corpuscular Volume (MCV) status is 'High'"],
            "observation": "Hemoglobin sits below reference thresholds alongside enlarged average red blood cell volume (MCV > reference range).",
            "observation_hi": "हीमोग्लोबिन स्तर कम है और लाल रक्त कोशिकाओं का औसत आयतन (MCV) सामान्य से बड़ा है।",
            "supporting_evidence": supporting,
            "clinical_context": "Enlarged red cells in the setting of decreased hemoglobin are frequently evaluated by clinicians for nutritional cofactor levels (such as vitamin B12 or folate) or liver metabolism.",
            "clinical_context_hi": "बड़ी लाल रक्त कोशिकाएं अक्सर विटामिन B12, फोलेट या चयापचय कारकों के संदर्भ में जांची जाती हैं।",
            "uncertainty_and_limitations": "A Complete Blood Count alone cannot identify the underlying metabolic or vitamin etiology; targeted serum testing is required.",
            "uncertainty_and_limitations_hi": "केवल सीबीसी से विटामिन या पोषण की स्थिति का पता नहीं चलता; विशेष जांच आवश्यक है।",
            "suggested_questions": [
                "Could dietary factors or vitamin B12/folate absorption be related to these larger cell sizes?",
                "Would an adjunctive vitamin B12 or liver panel provide helpful clinical context?"
            ]
        })

    # 3. Pattern: Low Hemoglobin + Normal MCV (Normocytic Pattern)
    elif (hb_p and hb_p.get("status") == "Low" and 
          mcv_p and mcv_p.get("status") == "Within Range"):
        
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

        patterns.append({
            "title": "Observation: Lower Hemoglobin with Standard Red Cell Volume (Normocytic Pattern)",
            "title_hi": "अवलोकन: कम हीमोग्लोबिन एवं सामान्य कोशिका आकार (नॉर्मोसाइटिक पैटर्न)",
            "source_citation": "Clinical Hematology Principles / MedlinePlus Laboratory Panel",
            "prerequisites": ["Hemoglobin status is 'Low'", "Mean Corpuscular Volume (MCV) status is 'Within Range'"],
            "observation": "Hemoglobin is reduced, but the physical size of circulating red blood cells remains within standard baseline intervals.",
            "observation_hi": "हीमोग्लोबिन कम है, लेकिन लाल रक्त कोशिकाओं का औसत आकार सामान्य सीमा में है।",
            "supporting_evidence": supporting,
            "clinical_context": "Normocytic patterns prompt physicians to explore acute blood loss, recent physiological recovery, or chronic inflammatory conditions.",
            "clinical_context_hi": "नॉर्मोसाइटिक पैटर्न पर डॉक्टर हालिया रिकवरी, सूजन या अन्य प्रणालीगत कारणों का मूल्यांकन करते हैं।",
            "uncertainty_and_limitations": "CBC numbers cannot differentiate between post-illness dilution, early nutritional shifts, or other causes.",
            "uncertainty_and_limitations_hi": "सीबीसी से अंतर्निहित कारण की पुष्टि नहीं होती।",
            "suggested_questions": [
                "What clinical history or recent illness could best correlate with this finding?",
                "Do you recommend repeating this test in a few weeks to monitor stability?"
            ]
        })

    # 4. Pattern: Elevated White Blood Cells with High Neutrophils
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
            "title_hi": "अवलोकन: बढ़े हुए ल्यूकोसाइट्स / न्यूट्रोफिल प्रतिरक्षा प्रतिक्रिया",
            "source_citation": "MedlinePlus Medical Encyclopedia (WBC Count & Differential)",
            "prerequisites": ["WBC status is 'High' OR Neutrophils % status is 'High'"],
            "observation": "One or more white blood cell markers sit above the laboratory reference threshold.",
            "observation_hi": "श्वेत रक्त कोशिकाओं (WBC) या न्यूट्रोफिल्स की संख्या प्रयोगशाला सीमा से अधिक है।",
            "supporting_evidence": supporting,
            "clinical_context": "White blood cells, particularly neutrophils/granulocytes, are primary immune responders that often increase during acute bacterial illness, inflammation, or physical stress.",
            "clinical_context_hi": "न्यूट्रोफिल्स शरीर की अग्रिम रक्षा पंक्ति हैं जो बैक्टीरिया जनित संक्रमण, सूजन या शारीरिक तनाव में तेजी से बढ़ते हैं।",
            "uncertainty_and_limitations": "Elevated white cells indicate immune activity but cannot identify where in the body an infection or inflammation is situated, nor whether it is bacterial, viral, or reactive.",
            "uncertainty_and_limitations_hi": "बढ़ी हुई WBC केवल प्रतिरक्षा गतिविधि दर्शाती है, यह संक्रमण का स्थान या सटीक कारण नहीं बताती।",
            "suggested_questions": [
                "What clinical symptoms (such as fever, cough, or pain) best explain this immune response?",
                "Would an inflammatory marker test (such as CRP or ESR) or follow-up blood test be useful to monitor the trend?",
                "Are any specific precautions or rest recommendations appropriate while my body is recovering?"
            ]
        })

    # 5. Pattern: Lymphocytosis (High Lymphocytes)
    if lymph_p and lymph_p.get("status") == "High":
        supporting = [
            {
                "name": lymph_p.get("name"),
                "value": lymph_p.get("value"),
                "unit": lymph_p.get("unit"),
                "status": lymph_p.get("status"),
                "reference_range": lymph_p.get("range")
            }
        ]
        patterns.append({
            "title": "Observation: Elevated Lymphocytes (Lymphocytosis)",
            "title_hi": "अवलोकन: बढ़े हुए लिम्फोसाइट्स (लिम्फोसाइटोसिस)",
            "source_citation": "MedlinePlus (Lymphocyte Count) / CDC Laboratory Standards",
            "prerequisites": ["Lymphocytes % status is 'High'"],
            "observation": "Lymphocyte percentage is elevated above the reference upper bound.",
            "observation_hi": "लिम्फोसाइट्स का प्रतिशत सामान्य संदर्भ सीमा से अधिक पाया गया है।",
            "supporting_evidence": supporting,
            "clinical_context": "Lymphocytes coordinate adaptive immunity and viral defense; elevated proportions frequently accompany post-viral recovery or immune activation.",
            "clinical_context_hi": "लिम्फोसाइट्स वायरल संक्रमणों से बचाव में प्रमुख भूमिका निभाते हैं और अक्सर रिकवरी के दौरान बढ़े रहते हैं।",
            "uncertainty_and_limitations": "This finding does not establish an active infection without correlating clinical symptoms.",
            "uncertainty_and_limitations_hi": "लक्षणों के बिना यह किसी सक्रिय बीमारी की पुष्टि नहीं करता।",
            "suggested_questions": [
                "Does this elevated lymphocyte proportion correlate with recent viral symptoms or seasonal recovery?",
                "Is follow-up testing recommended if symptoms have already resolved?"
            ]
        })

    # 6. Pattern: Eosinophilia (High Eosinophils)
    if eos_p and eos_p.get("status") == "High":
        supporting = [
            {
                "name": eos_p.get("name"),
                "value": eos_p.get("value"),
                "unit": eos_p.get("unit"),
                "status": eos_p.get("status"),
                "reference_range": eos_p.get("range")
            }
        ]
        patterns.append({
            "title": "Observation: Elevated Eosinophils (Eosinophilia)",
            "title_hi": "अवलोकन: बढ़े हुए इओसिनोफिल्स (इओसिनोफिलिया)",
            "source_citation": "MedlinePlus (Eosinophil Count) / WHO Laboratory Guidance",
            "prerequisites": ["Eosinophils % status is 'High'"],
            "observation": "Eosinophil levels are elevated above reference parameters.",
            "observation_hi": "इओसिनोफिल्स का स्तर सामान्य संदर्भ सीमा से अधिक है।",
            "supporting_evidence": supporting,
            "clinical_context": "Eosinophils respond during allergic responses, skin conditions, asthma flare-ups, or parasitic defenses.",
            "clinical_context_hi": "इओसिनोफिल्स अक्सर एलर्जी, अस्थमा, त्वचा की संवेदनशीलता या परजीवी प्रतिक्रिया में बढ़ते हैं।",
            "uncertainty_and_limitations": "A blood count cannot isolate whether environmental allergens, medications, or other sensitivities triggered the elevation.",
            "uncertainty_and_limitations_hi": "सीबीसी से विशिष्ट एलर्जी या कारक की पहचान नहीं हो सकती।",
            "suggested_questions": [
                "Could seasonal allergies, medications, or skin sensitivities be contributing to this reading?",
                "Do you advise an allergy panel or follow-up CBC?"
            ]
        })

    # 7. Pattern: High RDW (Anisocytosis Pattern)
    if rdw_p and rdw_p.get("status") == "High":
        supporting = [
            {
                "name": rdw_p.get("name"),
                "value": rdw_p.get("value"),
                "unit": rdw_p.get("unit"),
                "status": rdw_p.get("status"),
                "reference_range": rdw_p.get("range")
            }
        ]
        patterns.append({
            "title": "Observation: Increased Variation in Red Cell Size (Elevated RDW)",
            "title_hi": "अवलोकन: लाल रक्त कोशिकाओं के आकार में अधिक भिन्नता (उच्च RDW)",
            "source_citation": "MedlinePlus Red Cell Distribution Width / Clinical Pathology",
            "prerequisites": ["Red Cell Distribution Width (RDW) status is 'High'"],
            "observation": "Red Cell Distribution Width (RDW) is higher than normal, indicating unequal red blood cell sizing (anisocytosis).",
            "observation_hi": "RDW का स्तर बढ़ा हुआ है, जो दर्शाता है कि लाल रक्त कोशिकाओं का आकार एक समान नहीं है।",
            "supporting_evidence": supporting,
            "clinical_context": "Elevated RDW indicates a mixed population of old and newly released red blood cells, often observed early in nutritional replenishment or mixed deficiencies.",
            "clinical_context_hi": "उच्च RDW नई और पुरानी कोशिकाओं के आकार में अंतर को दर्शाता है, जो पोषण संतुलन के दौरान देखा जाता है।",
            "uncertainty_and_limitations": "RDW must be interpreted alongside MCV and iron parameters; it does not constitute a standalone diagnosis.",
            "uncertainty_and_limitations_hi": "इसे केवल MCV और अन्य पैरामीटर के साथ ही समझा जाना चाहिए।",
            "suggested_questions": [
                "Does this elevated RDW suggest that our red cell population is in transition?",
                "Should we assess ferritin or reticulocyte count alongside this reading?"
            ]
        })

    # 8. Pattern: Low Platelets + Reactive Typhoid Serology (or isolated low platelets)
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
                "title_hi": "अवलोकन: टाइफाइड सीरोलॉजी के साथ प्लेटलेट्स में कमी",
                "source_citation": "WHO Guidelines on Enteric / Typhoid Fever Management",
                "prerequisites": ["Platelets status is 'Low'", "Typhoid Serology is 'Reactive/Positive'"],
                "observation": "Platelet count sits below the laboratory reference interval alongside a reactive serological test for Salmonella Typhi.",
                "observation_hi": "टाइफाइड टेस्ट में सकारात्मक प्रतिक्रिया के साथ प्लेटलेट काउंट प्रयोगशाला सीमा से कम है।",
                "supporting_evidence": supporting,
                "clinical_context": "Systemic bacterial illnesses such as enteric fever can transiently suppress bone marrow platelet production and increase peripheral clearance.",
                "clinical_context_hi": "टाइफाइड जैसे प्रणालीगत संक्रमण अस्थायी रूप से प्लेटलेट उत्पादन को प्रभावित कर सकते हैं।",
                "uncertainty_and_limitations": "Serological card tests alone are screening indicators. This combination does not confirm disease severity or complications, which require direct physician assessment.",
                "uncertainty_and_limitations_hi": "कार्ड टेस्ट केवल एक स्क्रीनिंग जांच है; यह बीमारी की गंभीरता की पुष्टि नहीं करता।",
                "suggested_questions": [
                    "What follow-up schedule do you recommend to monitor my platelet levels until they stabilize?",
                    "What specific signs (e.g. bleeding gums, dark stools, easy bruising) require immediate medical review?",
                    "What hydration or dietary support should I follow alongside any prescribed medical care?"
                ]
            })
        else:
            patterns.append({
                "title": "Observation: Reduced Platelet Count (Thrombocytopenia)",
                "title_hi": "अवलोकन: प्लेटलेट की संख्या में कमी (थ्रॉम्बोसाइटोपेनिया)",
                "source_citation": "MedlinePlus (Platelet Count) / NIH Hematology",
                "prerequisites": ["Platelets status is 'Low'"],
                "observation": "Platelet count is lower than the laboratory's lower reference threshold.",
                "observation_hi": "प्लेटलेट काउंट प्रयोगशाला की निचली संदर्भ सीमा से कम है।",
                "supporting_evidence": supporting,
                "clinical_context": "Platelets are essential blood components that assist with normal clotting and bleeding control.",
                "clinical_context_hi": "प्लेटलेट्स रक्त का थक्का बनाने और रक्तस्राव को नियंत्रित करने के लिए आवश्यक हैं।",
                "uncertainty_and_limitations": "A single laboratory count cannot determine whether a platelet reduction is acute, chronic, or related to a recent viral illness or medication.",
                "uncertainty_and_limitations_hi": "एक बार के टेस्ट से यह निर्धारित नहीं हो सकता कि यह हालिया वायरल बीमारी से है या किसी अन्य कारण से।",
                "suggested_questions": [
                    "Should we recheck the platelet count in 48 to 72 hours to evaluate whether the level is stable or improving?",
                    "Are there any activities or over-the-counter medications (such as NSAIDs) I should avoid right now?",
                    "What red-flag signs would necessitate an immediate hospital or clinic visit?"
                ]
            })

    # 9. Default: All Within Range or Unpatterned
    if not patterns:
        all_normal = all(p.get("status") == "Within Range" for p in parameters if p.get("status") not in ["Needs Verification", "Unknown"])
        if all_normal and len(parameters) > 0:
            patterns.append({
                "title": "Observation: Core CBC Lineages Within Reference Intervals",
                "title_hi": "अवलोकन: मुख्य सीबीसी पैरामीटर सामान्य संदर्भ सीमा में हैं",
                "source_citation": "WHO Complete Blood Count Reference Standards / MedlinePlus",
                "prerequisites": ["All tested parameters are classified as 'Within Range'"],
                "observation": "Extracted red blood cell, white blood cell, and platelet parameters fall within their respective laboratory reference intervals.",
                "observation_hi": "लाल रक्त कोशिकाएं, श्वेत रक्त कोशिकाएं और प्लेटलेट्स सभी सामान्य सीमा में हैं।",
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
                "clinical_context_hi": "ऑक्सीजन वितरण, प्रतिरक्षा और रक्त का थक्का बनाने वाले मुख्य संकेतक संतुलित हैं।",
                "uncertainty_and_limitations": "Normal blood counts do not rule out all medical conditions. Clinical symptoms, physical examination, and medical history remain essential.",
                "uncertainty_and_limitations_hi": "सामान्य रिपोर्ट सभी बीमारियों को खारिज नहीं करती। डॉक्टर द्वारा शारीरिक जांच आवश्यक है।",
                "suggested_questions": [
                    "Given that these baseline counts are within range, how often do you suggest routine preventive screening?",
                    "Do these results align with how I have been feeling clinically?"
                ]
            })

    return patterns
