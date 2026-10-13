"""
Reportly Intelligent Chatbot & CBC Clinical Knowledge Engine
============================================================
Provides lively, responsive, parameter-grounded answers for Complete Blood Count (CBC) inquiries.
Supports multimodal AI generation (via Google Gemini) with a comprehensive deterministic
clinical knowledge engine for offline / unkeyed operation.
Strictly adheres to non-diagnostic and non-prescriptive safety guardrails.
"""

import os
import re
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from dotenv import load_dotenv
import google.generativeai as genai

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# Red-flag emergency symptoms requiring immediate emergency clinical triage
EMERGENCY_TRIGGERS = [
    # English terms
    "chest pain", "difficulty breathing", "shortness of breath", "fainted",
    "passing out", "unconscious", "coughing blood", "vomiting blood",
    "heavy bleeding", "severe abdominal pain", "stroke", "paralysis", "heart attack",
    # Hinglish terms
    "chhati me dard", "chhati mein dard", "seene me dard", "seene mein dard", 
    "saans lene me takleef", "saans phool", "behosh", "khoon ki ulti",
    # Devanagari terms
    "सीने में दर्द", "छाती में दर्द", "सांस लेने में तकलीफ", "सांस फूलना", "बेहोश", "खून की उल्टी", "खून बहना"
]

# Diagnostic & prescriptive intent triggers
DIAGNOSTIC_TRIGGERS = [
    # English terms
    "diagnos", "do i have", "am i suffering", "have i got", "is this cancer",
    "leukemia", "tumor", "cure me", "what disease", "which disease",
    "prescribe", "what medicine", "what drug", "can i take", "am i sick",
    "how to treat", "treatment for", "dosage", "tablet", "antibiotic",
    "pill", "medication", "remedy",
    # Hinglish terms
    "kya mujhe", "bimaari", "bimari", "rog", "kya ye cancer", "dawa", "dawai", "ilaj", "ilaaj", "konsi bimari",
    # Hindi Devanagari terms
    "क्या मुझे", "बीमारी", "रोग", "कैंसर", "दवा", "दवाई", "इलाज", "एंटीबायोटिक", "गोली", "उपचार", "लक्षण क्या बताते हैं"
]


def find_parameter_in_context(param_key: str, context: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Finds a matching parameter from current report context."""
    if not context or not context.get("parameters"):
        return None
    
    key_upper = param_key.upper()
    for p in context.get("parameters", []):
        name_upper = p.get("name", "").upper()
        if key_upper == "MCHC" and "MCHC" in name_upper:
            return p
        if key_upper == "MCH" and "MCH" in name_upper and "MCHC" not in name_upper:
            return p
        if key_upper == "RDW" and "RDW" in name_upper:
            return p
        if key_upper in ["EOSIN", "EOS"] and "EOSIN" in name_upper:
            return p
        if key_upper in ["MONO", "MONOCYTE"] and "MONO" in name_upper:
            return p
        if key_upper in ["BASO", "BASOPHIL"] and "BASO" in name_upper:
            return p
        if key_upper == "MCV" and "MCV" in name_upper:
            return p
        if key_upper == "RBC" and ("RBC" in name_upper or "RED BLOOD" in name_upper or "ERYTHROCYTE" in name_upper):
            return p
        if key_upper == "WBC" and ("WBC" in name_upper or "WHITE BLOOD" in name_upper or "LEUCOCYTE" in name_upper or "TLC" in name_upper):
            return p
        if key_upper in ["HGB", "HB"] and ("HEMOGLOBIN" in name_upper or "HAEMOGLOBIN" in name_upper or "HGB" in name_upper):
            return p
        if key_upper in ["PLT", "PLATELET"] and ("PLATELET" in name_upper or "PLT" in name_upper):
            return p
        if key_upper in ["NEUTRO", "GRAN"] and ("NEUTROPHIL" in name_upper or "GRANULOCYTE" in name_upper):
            return p
        if key_upper in ["LYMPH", "LYMPHOCYTE"] and "LYMPH" in name_upper:
            return p
        if key_upper == "HCT" and ("HEMATOCRIT" in name_upper or "PCV" in name_upper or "HCT" in name_upper):
            return p
        if key_upper in name_upper:
            return p
    return None


def generate_semantic_response(question: str, language: str, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Intelligent semantic knowledge engine for Complete Blood Count parameters.
    Provides lively, personalized explanations with patient lab context and targeted questions.
    """
    q_lower = question.lower()
    is_hindi = language == "hi"

    # 1. MEAN CORPUSCULAR VOLUME (MCV)
    if any(k in q_lower for k in ["mcv", "mean corpuscular volume", "cell size", "कोशिका आकार", "माइक्रोसाइटिक", "macrocyte", "microcytic"]):
        p = find_parameter_in_context("MCV", context)
        context_note_en = ""
        context_note_hi = ""
        if p:
            context_note_en = f" In your uploaded report, your MCV is **{p.get('value')} {p.get('unit', 'fL')}** (classified as *{p.get('status')}* against the {p.get('range', '80.0-100.0')} reference range)."
            context_note_hi = f" आपकी रिपोर्ट में आपका MCV **{p.get('value')} {p.get('unit', 'fL')}** दर्ज है (स्थिति: *{p.get('status')}*, संदर्भ सीमा: {p.get('range', '80.0-100.0')})।"

        if is_hindi:
            msg = (
                f"**एमसीवी (MCV - Mean Corpuscular Volume)** सीबीसी का एक प्रमुख पैरामीटर (Parameter) है जो आपकी लाल रक्त कोशिकाओं (RBC) के औसत शारीरिक आकार को फेम्प्टोलीटर (fL) में मापता है। "
                f"सरल शब्दों में, यह बताता है कि आपकी खून की कोशिकाएं सामान्य आकार की हैं, छोटी हैं या बड़ी।{context_note_hi}\n\n"
                f"• **कम MCV (< 80 fL - Microcytic):** लाल कोशिकाएं सामान्य से छोटी हैं। यह स्थिति अक्सर तब होती है जब शरीर में हीमोग्लोबिन बनाने के लिए आयरन की कमी हो (जैसे आयरन की कमी से एनीमिया) या थैलेसीमिया माइनर जैसे आनुवंशिक कारणों से।\n"
                f"• **सामान्य MCV (80 - 100 fL - Normocytic):** लाल रक्त कोशिकाएं स्वस्थ और संतुलित आकार की हैं।\n"
                f"• **अधिक MCV (> 100 fL - Macrocytic):** लाल कोशिकाएं सामान्य से बड़ी होती हैं, जो प्रायः विटामिन B12 या फोलेट (Folate) की कमी, थायरॉयड असंतुलन या कुछ दवाओं के प्रभाव में देखा जाता है।"
            )
            questions = [
                "क्या मेरा यह MCV स्तर आयरन, फेरिटिन या विटामिन B12 की कमी से संबंधित हो सकता है?",
                "क्या मुझे सीरम फेरिटिन या आयरन प्रोफाइल टेस्ट कराने की आवश्यकता है?",
                "क्या इस रीडिंग के आधार पर खान-पान में कोई विशिष्ट सुधार मददगार होगा?"
            ]
        else:
            msg = (
                f"**MCV (Mean Corpuscular Volume)** is an essential Complete Blood Count parameter that measures the average physical size or volume of your individual red blood cells in femtoliters (fL). "
                f"Think of it as the physical 'cup size' of your red blood cells.{context_note_en}\n\n"
                f"• **Low MCV (< 80 fL):** Known as *microcytosis* (smaller cells). This commonly happens when the bone marrow has insufficient raw materials—primarily dietary iron or ferritin—to build full-sized hemoglobin, or in genetic traits like thalassemia minor.\n"
                f"• **Normal MCV (80 - 100 fL):** Known as *normocytic*. Red cells have healthy physical dimensions.\n"
                f"• **Elevated MCV (> 100 fL):** Known as *macrocytosis* (larger cells). Often evaluated alongside Vitamin B12 or folate levels, liver health, or thyroid function."
            )
            questions = [
                "Could my MCV reading be related to dietary iron, ferritin, or vitamin levels?",
                "Would a complete iron profile or serum ferritin test provide helpful clarification?",
                "Do you recommend repeating this CBC in a few weeks to monitor any changes?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 2. RED BLOOD CELLS (RBC)
    if re.search(r"\brbcs?\b", q_lower) or any(k in q_lower for k in ["what are rbc", "what is rbc", "rbc count", "red blood cell", "red blood count", "red cell", "erythrocyte", "लाल रक्त", "खून की कोशिका"]):
        p = find_parameter_in_context("RBC", context)
        context_note_en = ""
        context_note_hi = ""
        if p:
            context_note_en = f" In your uploaded report, your RBC count is **{p.get('value')} {p.get('unit', '10^6/µL')}** (status: *{p.get('status')}*, normal reference range: {p.get('range', '3.5 - 5.5')})."
            context_note_hi = f" आपकी रिपोर्ट में आरबीसी की संख्या **{p.get('value')} {p.get('unit', '10^6/µL')}** है (स्थिति: *{p.get('status')}*, संदर्भ सीमा: {p.get('range', '3.5 - 5.5')})।"

        if is_hindi:
            msg = (
                f"**लाल रक्त कोशिकाएं (RBC - Red Blood Cells)**, जिन्हें एरिथ्रोसाइट्स (Erythrocytes) भी कहा जाता है, Complete Blood Count का केंद्रीय पैरामीटर हैं। इनका प्राथमिक कार्य फेफड़ों से ऑक्सीजन को अवशोषित करके मस्तिष्क, हृदय और मांसपेशियों तक पहुंचाना है।{context_note_hi}\n\n"
                f"• **संरचना एवं जीवनकाल:** ये सूक्ष्म द्वि-अवतल (Biconcave) डिस्क जैसी होती हैं जो हीमोग्लोबिन से भरी होती हैं। इनका निर्माण अस्थि मज्जा (Bone Marrow) में होता है और ये लगभग 120 दिनों तक जीवित रहती हैं।\n"
                f"• **कम RBC संख्या:** शरीर के ऊतकों तक ऑक्सीजन कम पहुंचती है, जिससे थकान, कमजोरी, चक्कर आना या सांस फूलने जैसे लक्षण महसूस हो सकते हैं।\n"
                f"• **अधिक RBC संख्या:** निर्जलीकरण (कम पानी पीना), उच्च ऊंचाई वाले स्थानों पर रहना, या शरीर द्वारा अतिरिक्त ऑक्सीजन की मांग के कारण संख्या बढ़ सकती है।"
            )
            questions = [
                "क्या मेरे आरबीसी (RBC) और हीमोग्लोबिन के स्तर आपस में मेल खाते हैं?",
                "क्या निर्जलीकरण (कम पानी पीना) या हाल की जीवनशैली ने इस संख्या को प्रभावित किया हो सकता है?",
                "इस स्तर को सामान्य बनाए रखने के लिए क्या सावधानियां जरूरी हैं?"
            ]
        else:
            msg = (
                f"**Red Blood Cells (RBCs)**, or erythrocytes, are the cornerstone Complete Blood Count parameter responsible for tissue oxygenation. "
                f"They act as your body's oxygen delivery fleet, absorbing oxygen in your lungs and transporting it to every muscle, organ, and tissue.{context_note_en}\n\n"
                f"• **Structure & Lifespan:** Shaped like microscopic flexible discs filled with hemoglobin, red blood cells are continuously produced by your bone marrow and circulate for approximately 120 days before being recycled by the spleen.\n"
                f"• **Lower RBC:** Associated with anemia, blood loss, or nutrient deficiencies, leading to symptoms like fatigue or shortness of breath.\n"
                f"• **Higher RBC:** Can occur temporarily with dehydration (hemoconcentration), high-altitude living, or cardiopulmonary factors."
            )
            questions = [
                "How does my RBC count correlate with my overall hemoglobin and hematocrit?",
                "Could dehydration or temporary lifestyle factors have influenced this number?",
                "What timeline do you advise for checking this count again?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 3. PLATELETS (PLT) / THROMBOCYTES
    if any(k in q_lower for k in ["platelet", "plt", "thrombocyte", "प्लेटलेट", "थक्का", "clot"]):
        p = find_parameter_in_context("PLT", context)
        context_note_en = ""
        context_note_hi = ""
        if p:
            context_note_en = f" In your uploaded report, your Platelet Count is **{p.get('value')} {p.get('unit', '10^3/µL')}** (status: *{p.get('status')}* vs reference {p.get('range', '150 - 450')})."
            context_note_hi = f" आपकी रिपोर्ट में प्लेटलेट्स की संख्या **{p.get('value')} {p.get('unit', '10^3/µL')}** है (स्थिति: *{p.get('status')}*, सामान्य सीमा: {p.get('range', '150 - 450')})।"

        if is_hindi:
            msg = (
                f"**प्लेटलेट्स (Platelets / PLT)**, जिन्हें थ्रोम्बोसाइट्स भी कहा जाता है, रक्त के महत्वपूर्ण सूक्ष्म घटक हैं जो चोट लगने पर रक्त का थक्का (Blood Clot) जमाकर रक्तस्राव को रोकते हैं।{context_note_hi}\n\n"
                f"• **कम प्लेटलेट्स (Thrombocytopenia, < 150):** वायरल संक्रमण (जैसे डेंगू, चिकनगुनिया), टाइफाइड बुखार, या प्रतिरक्षा प्रतिक्रिया के कारण प्लेटलेट्स तेजी से गिर सकते हैं।\n"
                f"• **सामान्य सीमा (150 - 450 हज़ार / µL):** यह सुरक्षित रक्तस्राव नियंत्रण का संकेत है।\n"
                f"• **क्लीनिकल सावधानी:** प्लेटलेट्स की संख्या तेजी से बदलती है। डॉक्टर अक्सर 48 से 72 घंटों में दोबारा टेस्ट कराने की सलाह देते हैं ताकि यह देखा जा सके कि संख्या स्थिर है या सुधर रही है।"
            )
            questions = [
                "क्या मुझे 48 से 72 घंटों में दोबारा प्लेटलेट्स टेस्ट कराना चाहिए?",
                "क्या मसूड़ों से खून आना या असामान्य नील पड़ना जैसे कोई लक्षण हैं जिन पर मुझे नजर रखनी चाहिए?",
                "प्लेटलेट्स के सुधार के दौरान पर्याप्त पानी और आहार को लेकर क्या सावधानियां रखनी चाहिए?"
            ]
        else:
            msg = (
                f"**Platelets (PLT)**, or thrombocytes, are cellular fragments essential for hemostasis and vascular integrity. "
                f"When a blood vessel is injured, platelets rapidly adhere to the damaged surface, activate, and clump together to form a primary clot.{context_note_en}\n\n"
                f"• **Lower Platelets (Thrombocytopenia, < 150k):** Frequently observed during or following viral infections (such as dengue, flu, or typhoid), medication reactions, or immune clearance.\n"
                f"• **Normal Platelets (150k - 450k / µL):** Baseline adequate clotting reserve.\n"
                f"• **Clinical Best Practice:** Because platelets have a rapid turnover (7-10 days lifespan), physicians routinely track trends by repeating the count within 48 to 72 hours."
            )
            questions = [
                "Do you recommend repeating the platelet count in 48 to 72 hours to evaluate the trend?",
                "Are there any activities or over-the-counter pain relievers (like ibuprofen) I should avoid right now?",
                "What red-flag signs (e.g. bleeding gums, easy bruising) require immediate clinical attention?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 4. HEMOGLOBIN (HB / HGB)
    if any(k in q_lower for k in ["hemoglobin", "haemoglobin", "hgb", "hb", "हीमोग्लोबिन", "anemia", "एनीमिया"]):
        p = find_parameter_in_context("HGB", context) or find_parameter_in_context("HB", context)
        context_note_en = ""
        context_note_hi = ""
        if p:
            context_note_en = f" In your uploaded report, Hemoglobin is **{p.get('value')} {p.get('unit', 'g/dL')}** (status: *{p.get('status')}*, reference range: {p.get('range', '12.0 - 16.0')})."
            context_note_hi = f" आपकी रिपोर्ट में हीमोग्लोबिन **{p.get('value')} {p.get('unit', 'g/dL')}** दर्ज है (स्थिति: *{p.get('status')}*, संदर्भ सीमा: {p.get('range', '12.0 - 16.0')})।"

        if is_hindi:
            msg = (
                f"**हीमोग्लोबिन (Hemoglobin / Hb)** लाल रक्त कोशिकाओं में मौजूद मुख्य आयरन-युक्त प्रोटीन है जो फेफड़ों से ऑक्सीजन को बांधकर पूरे शरीर के अंगों तक पहुंचाता है।{context_note_hi}\n\n"
                f"• **कम हीमोग्लोबिन (एनीमिया):** इसके मुख्य कारणों में आहार में आयरन की कमी, विटामिन B12 या फोलेट की कमी, या शरीर से आंतरिक रक्तस्राव शामिल हो सकते हैं।\n"
                f"• **सामान्य स्तर:** आमतौर पर पुरुषों में 13.0 - 17.0 g/dL और महिलाओं में 12.0 - 15.5 g/dL होता है।\n"
                f"• **समझने का तरीका:** हीमोग्लोबिन को हमेशा MCV (कोशिका आकार) और MCH (रंग) के साथ मिलाकर देखा जाता है ताकि एनीमिया के सटीक प्रकार को समझा जा सके।"
            )
            questions = [
                "क्या मेरा हीमोग्लोबिन स्तर किसी विशिष्ट पोषण संबंधी कारण (जैसे आयरन या B12) से जुड़ा हो सकता है?",
                "क्या सप्लीमेंट लेने से पहले सीरम फेरिटिन या आयरन प्रोफाइल टेस्ट कराना बेहतर रहेगा?",
                "स्वस्थ हीमोग्लोबिन के लिए मुझे अपने आहार में किन खाद्य पदार्थों को शामिल करना चाहिए?"
            ]
        else:
            msg = (
                f"**Hemoglobin (HGB)** is the vital iron-rich protein complex inside red blood cells responsible for capturing oxygen in the lungs and releasing it into surrounding tissues.{context_note_en}\n\n"
                f"• **Lower Hemoglobin:** Signals decreased oxygen delivery capacity (anemia). Common contributing factors include low nutritional iron stores, B12/folate deficiency, or chronic blood loss.\n"
                f"• **Normal Range:** Typically 12.0 to 16.0 g/dL (varies slightly by sex and testing laboratory).\n"
                f"• **Key Diagnostic Pattern:** Physicians evaluate hemoglobin alongside MCV (cell volume) and MCH (cell color) to differentiate iron deficiency from other causes."
            )
            questions = [
                "What clinical or dietary factors could explain this hemoglobin reading?",
                "Would a serum ferritin or iron saturation test be helpful before adjusting any supplements?",
                "Are there dietary habits that would best support optimal red blood cell production?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 5. WHITE BLOOD CELLS (WBC / TLC) & NEUTROPHILS / LYMPHOCYTES
    if any(k in q_lower for k in ["wbc", "tlc", "white blood", "leukocyte", "neutrophil", "lymphocyte", "श्वेत रक्त", "न्यूट्रोफिल", "संक्रमण", "infection"]):
        p = find_parameter_in_context("WBC", context)
        context_note_en = ""
        context_note_hi = ""
        if p:
            context_note_en = f" In your uploaded report, Total WBC is **{p.get('value')} {p.get('unit', '10^3/µL')}** (status: *{p.get('status')}*, reference: {p.get('range', '4.0 - 11.0')})."
            context_note_hi = f" आपकी रिपोर्ट में कुल WBC की संख्या **{p.get('value')} {p.get('unit', '10^3/µL')}** है (स्थिति: *{p.get('status')}*, सामान्य सीमा: {p.get('range', '4.0 - 11.0')})।"

        if is_hindi:
            msg = (
                f"**श्वेत रक्त कोशिकाएं (WBC - White Blood Cells / TLC)** आपके शरीर की रक्षात्मक प्रतिरक्षा सेना (Immune System) हैं जो बैक्टीरिया, वायरस और बाहरी संक्रमणों से मुकाबला करती हैं।{context_note_hi}\n\n"
                f"• **न्यूट्रोफिल्स (Neutrophils):** पहली रक्षा पंक्ति हैं जो जीवाणु (Bacterial) संक्रमण और तीव्र सूजन में बढ़ जाती हैं।\n"
                f"• **लिम्फोसाइट्स (Lymphocytes):** वायरल संक्रमण से लड़ने और शरीर में दीर्घकालिक एंटीबॉडी बनाने का कार्य करती हैं।\n"
                f"• **उच्च WBC (Leukocytosis):** यह दर्शाता है कि शरीर किसी सक्रिय संक्रमण, एलर्जी या शारीरिक तनाव से मुकाबला कर रहा है।"
            )
            questions = [
                "क्या यह WBC संख्या किसी हालिया संक्रमण या सूजन की प्रतिक्रिया को दर्शाती है?",
                "क्या सीआरपी (CRP) जैसे सूजन संकेतक टेस्ट से स्थिति की बेहतर निगरानी हो सकती है?",
                "संक्रमण के ठीक होने की जांच के लिए दोबारा टेस्ट कब कराना चाहिए?"
            ]
        else:
            msg = (
                f"**White Blood Cells (WBCs)**, or leukocytes, constitute your body's immune surveillance defense system against viral pathogens, bacteria, and tissue inflammation.{context_note_en}\n\n"
                f"• **Neutrophils:** Fast-acting responders that spike rapidly during acute bacterial infections or physical stress.\n"
                f"• **Lymphocytes:** Specialized adaptive immune cells that coordinate antibody production and viral clearance.\n"
                f"• **High WBC (Leukocytosis):** Indicates active immune mobilization, commonly seen with infections, inflammation, or physical exertion."
            )
            questions = [
                "What clinical symptoms (such as fever, cough, or fatigue) best align with this immune marker?",
                "Would an inflammatory marker test like CRP or ESR help evaluate the recovery progress?",
                "What timeframe do you recommend for follow-up testing?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 6. HEMATOCRIT (HCT / PCV)
    if any(k in q_lower for k in ["hematocrit", "haematocrit", "hct", "pcv", "packed cell volume"]):
        p = find_parameter_in_context("HCT", context)
        context_note_en = ""
        context_note_hi = ""
        if p:
            context_note_en = f" In your uploaded report, Hematocrit is **{p.get('value')} {p.get('unit', '%')}** (status: *{p.get('status')}*, reference: {p.get('range', '35.0 - 45.0')})."
            context_note_hi = f" आपकी रिपोर्ट में हेमाटोक्रिट **{p.get('value')} {p.get('unit', '%')}** है (स्थिति: *{p.get('status')}*, संदर्भ सीमा: {p.get('range', '35.0 - 45.0')})।"

        if is_hindi:
            msg = (
                f"**हेमाटोक्रिट (HCT / PCV - Packed Cell Volume)** यह मापता है कि आपके पूरे रक्त में लाल रक्त कोशिकाओं का प्रतिशत कितना है (सामान्यतः 36% - 48%)।{context_note_hi}\n\n"
                f"• **पानी की मात्रा का सीधा प्रभाव:** रक्त का 55% हिस्सा तरल प्लाज्मा (पानी) होता है। यदि आप पानी कम पीते हैं, तो प्लाज्मा कम होने से हेमाटोक्रिट कृत्रिम रूप से बढ़ा हुआ दिख सकता है।\n"
                f"• **कम HCT:** आमतौर पर कम हीमोग्लोबिन या एनीमिया के समानांतर चलता है।"
            )
            questions = [
                "क्या निर्जलीकरण ने मेरे हेमाटोक्रिट और हीमोग्लोबिन के स्तर को प्रभावित किया हो सकता है?",
                "क्या यह HCT मान मेरी समग्र लाल रक्त कोशिकाओं की संख्या से मेल खाता है?"
            ]
        else:
            msg = (
                f"**Hematocrit (HCT)**, also called Packed Cell Volume (PCV), is the percentage of total blood volume occupied by red blood cells.{context_note_en}\n\n"
                f"• **Fluid Balance Sensitivity:** Because hematocrit is a ratio of cellular volume to liquid plasma, mild dehydration concentrates the sample and makes HCT read higher than baseline.\n"
                f"• **Lower HCT:** Parallels reduced hemoglobin and red cell mass, common in anemia."
            )
            questions = [
                "Could hydration or fluid balance have influenced this hematocrit reading?",
                "How does this HCT result correlate with my hemoglobin?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 7. MCH & MCHC (MEAN CORPUSCULAR HEMOGLOBIN / CONCENTRATION)
    if any(k in q_lower for k in ["mch", "mchc", "chromic", "hypochromic"]):
        p = find_parameter_in_context("MCHC" if "mchc" in q_lower else "MCH", context)
        context_note_en = ""
        context_note_hi = ""
        if p:
            context_note_en = f" In your uploaded report, {p.get('name')} is **{p.get('value')} {p.get('unit')}** (status: *{p.get('status')}*, reference: {p.get('range')})."
            context_note_hi = f" आपकी रिपोर्ट में {p.get('name')} **{p.get('value')} {p.get('unit')}** है (स्थिति: *{p.get('status')}*, संदर्भ सीमा: {p.get('range')})।"

        if is_hindi:
            msg = (
                f"**MCH और MCHC** यह दर्शाते हैं कि प्रत्येक लाल रक्त कोशिका के अंदर हीमोग्लोबिन की मात्रा और सांद्रता (Concentration) कितनी है। आसान शब्दों में, यह कोशिका के 'रंग' को परिभाषित करता है।{context_note_hi}\n\n"
                f"• **कम MCH/MCHC (Hypochromic):** कोशिकाएं हल्की या पीली दिखती हैं, जो शरीर में आयरन की कमी का क्लासिक संकेत है।\n"
                f"• **सामान्य (Normochromic):** कोशिकाओं में हीमोग्लोबिन का घनत्व संतुलित है।"
            )
            questions = [
                "क्या मेरा MCH/MCHC स्तर आयरन की कमी या कम हीमोग्लोबिन से मेल खाता है?",
                "क्या इसके लिए सीरम फेरिटिन टेस्ट उपयोगी रहेगा?"
            ]
        else:
            msg = (
                f"**MCH (Mean Corpuscular Hemoglobin)** and **MCHC (Mean Corpuscular Hemoglobin Concentration)** measure the average mass and density of hemoglobin packed inside each red blood cell.{context_note_en}\n\n"
                f"• **Low MCH / MCHC (Hypochromia):** Cells appear paler under microscopy because they carry less hemoglobin pigment, highly characteristic of iron deficiency anemia.\n"
                f"• **Normal MCH / MCHC (Normochromic):** Indicates normal hemoglobin saturation within cells."
            )
            questions = [
                "Does my MCH/MCHC align with an iron deficiency or hemoglobin synthesis pattern?",
                "Would a serum ferritin test clarify whether iron stores are depleted?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 8. RDW (RED CELL DISTRIBUTION WIDTH)
    if any(k in q_lower for k in ["rdw", "distribution width", "variation in size"]):
        p = find_parameter_in_context("RDW", context)
        context_note_en = ""
        context_note_hi = ""
        if p:
            context_note_en = f" In your report, RDW is **{p.get('value')} {p.get('unit', '%')}** (status: *{p.get('status')}*, reference: {p.get('range', '11.5 - 14.5')})."
            context_note_hi = f" आपकी रिपोर्ट में RDW **{p.get('value')} {p.get('unit', '%')}** है (स्थिति: *{p.get('status')}*, संदर्भ सीमा: {p.get('range', '11.5 - 14.5')})।"

        if is_hindi:
            msg = (
                f"**RDW (Red Cell Distribution Width)** यह मापता है कि आपकी लाल रक्त कोशिकाओं के आकार में कितना अंतर (Variation) है।{context_note_hi}\n\n"
                f"• **उच्च RDW (Anisocytosis):** इसका मतलब है कि रक्त में छोटी और बड़ी कोशिकाओं का मिश्रण है। यह अक्सर आयरन, B12 या फोलेट की कमी की शुरुआती पहचान में मदद करता है।\n"
                f"• **सामान्य RDW:** अधिकांश लाल रक्त कोशिकाएं एक समान आकार की हैं।"
            )
            questions = [
                "क्या उच्च RDW किसी पोषण संबंधी कमी (जैसे आयरन या B12) का शुरुआती संकेत हो सकता है?",
                "क्या इसे MCV के साथ मिलाकर देखा गया है?"
            ]
        else:
            msg = (
                f"**RDW (Red Cell Distribution Width)** measures the variation in size and volume among your circulating red blood cells (anisocytosis).{context_note_en}\n\n"
                f"• **Elevated RDW:** Indicates an uneven mixture of cell sizes. A high RDW paired with low MCV strongly suggests nutritional iron deficiency, as new smaller cells mix with older normal cells.\n"
                f"• **Normal RDW:** Red blood cells are relatively uniform in dimension."
            )
            questions = [
                "Could an elevated RDW be an early indicator of nutritional depletion?",
                "How does my RDW compare alongside my MCV value?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 9. EOSINOPHILS / MONOCYTES / BASOPHILS
    if any(k in q_lower for k in ["eosinophil", "monocyte", "basophil", "allergy", "एलर्जी"]):
        p = find_parameter_in_context("EOSIN", context) or find_parameter_in_context("MONO", context)
        context_note_en = ""
        context_note_hi = ""
        if p:
            context_note_en = f" In your uploaded report, {p.get('name')} is **{p.get('value')} {p.get('unit', '%')}** (status: *{p.get('status')}*)."
            context_note_hi = f" आपकी रिपोर्ट में {p.get('name')} **{p.get('value')} {p.get('unit', '%')}** है (स्थिति: *{p.get('status')}*)।"

        if is_hindi:
            msg = (
                f"**इओसिनोफिल्स (Eosinophils) एवं मोनोसाइट्स:** यह श्वेत रक्त कोशिकाओं (WBC) के विशेष प्रकार हैं।{context_note_hi}\n\n"
                f"• **इओसिनोफिल्स:** एलर्जी (जैसे दमा, धूल से छींकें, त्वचा पर खुजली) या परजीवी संक्रमण की प्रतिक्रिया में बढ़ते हैं।\n"
                f"• **मोनोसाइट्स:** शरीर के 'सफाई कर्मचारी' की तरह काम करते हैं और पुरानी सूजन या संक्रमण के बाद ऊतकों की मरम्मत करते हैं।"
            )
            questions = [
                "क्या यह स्तर किसी सक्रिय एलर्जी (जैसे छींकें या त्वचा पर चकत्ते) से संबंधित हो सकता है?",
                "क्या इसके लिए किसी एलर्जी टेस्ट की आवश्यकता है?"
            ]
        else:
            msg = (
                f"**Eosinophils, Monocytes & Differential WBCs:** These are specialized subtypes of your immune defense system.{context_note_en}\n\n"
                f"• **Eosinophils:** Typically elevate in response to allergic conditions (asthma, hay fever, eczema) or parasitic immune defense.\n"
                f"• **Monocytes:** Cellular scavengers that migrate into tissues to engulf cellular debris and fight sustained infections."
            )
            questions = [
                "Could seasonal allergies, asthma, or skin sensitivity be driving this count?",
                "Are there additional targeted tests recommended based on my symptoms?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 10. HYDRATION & WATER INTAKE
    if any(k in q_lower for k in ["hydration", "dehydration", "water", "drinking", "पानी", "निर्जलीकरण", "डिहाइड्रेशन"]):
        if is_hindi:
            msg = (
                f"**पानी और निर्जलीकरण का लैब रिपोर्ट पर प्रभाव:**\n\n"
                f"रक्त का लगभग 55% हिस्सा तरल प्लाज्मा (पानी) होता है। जब शरीर में पानी की कमी (Dehydration) होती है, तो रक्त का तरल हिस्सा कम हो जाता है, जिससे हीमोग्लोबिन, हेमाटोक्रिट और लाल रक्त कोशिकाओं की संख्या अस्थायी रूप से बढ़ी हुई दिखाई दे सकती है (इसे 'हेमोकंसंट्रेशन' कहा जाता है)।\n\n"
                f"पर्याप्त पानी पीने और शरीर को हाइड्रेटेड रखने से रक्त अपनी स्वाभाविक और वास्तविक सांद्रता में वापस आ जाता है।"
            )
            questions = [
                "क्या इस टेस्ट से पहले कम पानी पीने से मेरे परिणामों में अस्थायी बदलाव हो सकता है?",
                "अगली बार टेस्ट कराने से पहले हाइड्रेशन को लेकर क्या दिशा-निर्देश होने चाहिए?"
            ]
        else:
            msg = (
                f"**How Hydration Directly Affects Blood Count Results:**\n\n"
                f"Approximately 55% of your blood volume is liquid plasma (mostly water). When you are under-hydrated or dehydrated, plasma volume shrinks while the number of cells remains unchanged. "
                f"This creates *relative hemoconcentration*, making Hemoglobin, Hematocrit, and RBC counts appear artificially higher than baseline.\n\n"
                f"Conversely, proper hydration restores true plasma equilibrium, giving an accurate representation of your cellular health."
            )
            questions = [
                "Could dehydration before this blood draw have concentrated these markers?",
                "What fluid guidelines do you recommend before a follow-up test?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 11. DIET & NUTRITION (IRON, B12, GREENS)
    if any(k in q_lower for k in ["diet", "food", "eat", "nutrition", "khana", "आहार", "खानपान", "सब्जी", "फल", "iron rich"]):
        if is_hindi:
            msg = (
                f"**रक्त स्वास्थ्य के लिए सामान्य संतुलित आहार मार्गदर्शन:**\n\n"
                f"स्वस्थ रक्त कोशिकाओं और हीमोग्लोबिन के निर्माण के लिए शरीर को कुछ प्रमुख पोषक तत्वों की आवश्यकता होती है:\n"
                f"• **आयरन युक्त आहार:** हरी पत्तेदार सब्जियां (पालक, मेथी), दालें, चने, गुड़, चुकंदर और अनार।\n"
                f"• **विटामिन सी (आंवला, नींबू, संतरा):** यह पौधों से मिलने वाले आयरन को शरीर में अवशोषित करने में मदद करता है।\n"
                f"• **विटामिन B12 एवं फोलेट:** साबुत अनाज, दूध, दही, पनीर और अंडे स्वस्थ लाल कोशिकाओं के आकार (MCV) के लिए आवश्यक हैं।\n\n"
                f"*नोट: किसी भी दवा या आयरन सप्लीमेंट को शुरू करने से पहले डॉक्टर से परामर्श अवश्य लें।*"
            )
            questions = [
                "क्या मेरे इन परिणामों को देखते हुए मुझे आहार में आयरन या विटामिन बढ़ाने की आवश्यकता है?",
                "क्या किसी सप्लीमेंट से पहले सीरम फेरिटिन या B12 की जांच कराना ठीक रहेगा?"
            ]
        else:
            msg = (
                f"**General Nutritional Support for Blood Cell Health:**\n\n"
                f"Red blood cell synthesis relies on three fundamental nutritional co-factors:\n"
                f"• **Dietary Iron:** Found in legumes, lentils, spinach, beans, fortified grains, and lean proteins.\n"
                f"• **Vitamin C (Citrus, bell peppers, amla):** Significantly enhances the absorption of non-heme (plant) iron when consumed together.\n"
                f"• **Vitamin B12 & Folate:** Essential for healthy red cell DNA synthesis and volume (MCV) regulation.\n\n"
                f"*Medical Reminder: Nutritional adjustments should complement clinical evaluation; always discuss any supplements with your physician.*"
            )
            questions = [
                "Do these laboratory results indicate that dietary adjustments or nutritional tests would be beneficial?",
                "Would checking my iron stores (serum ferritin) be appropriate before considering supplements?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 12. RETESTING TIMELINE
    if any(k in q_lower for k in ["repeat", "retest", "timeline", "how often", "when should i", "dobara", "दोबारा", "कब कराएं"]):
        if is_hindi:
            msg = (
                f"**सीबीसी टेस्ट को दोहराने का अनुशंसित समय:**\n\n"
                f"• **तीव्र परिवर्तन (जैसे कम प्लेटलेट्स या संक्रमण):** डॉक्टर अक्सर 48 से 72 घंटों में टेस्ट दोहराने की सलाह देते हैं ताकि यह देखा जा सके कि स्थिति स्थिर हो रही है।\n"
                f"• **लाल रक्त कोशिकाएं एवं हीमोग्लोबिन:** नई लाल रक्त कोशिकाओं को बनने और परिपक्व होने में 3 से 6 सप्ताह का समय लगता है, इसलिए एनीमिया के सुधार की निगरानी 4 से 8 सप्ताह बाद की जाती है।\n"
                f"• **नियमित वार्षिक जांच:** यदि सभी टेस्ट सामान्य हैं, तो वार्षिक जांच पर्याप्त होती है।"
            )
            questions = [
                "मेरे इन विशेष परिणामों के आधार पर दोबारा टेस्ट कब कराना सबसे उपयुक्त रहेगा?",
                "इस दौरान किन शारीरिक लक्षणों पर नजर रखनी चाहिए?"
            ]
        else:
            msg = (
                f"**Clinical Timelines for Follow-up CBC Testing:**\n\n"
                f"• **Acute Markers (Platelets, WBCs):** Evaluated rapidly—often repeated within **48 to 72 hours** to verify that platelets are stabilizing and acute immune mobilization is resolving.\n"
                f"• **Erythroid Markers (Hemoglobin, RBC, MCV):** Red blood cells mature over several weeks. Doctors typically schedule rechecks in **4 to 8 weeks** to observe genuine red cell regeneration.\n"
                f"• **Routine Prevention:** If markers are within range, an annual preventive screen is standard."
            )
            questions = [
                "What timeline do you recommend for repeating this lab test to monitor trends?",
                "What specific physical symptoms should prompt me to seek an earlier follow-up visit?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 13. REPORT OVERVIEW / "IS MY REPORT NORMAL" / SUMMARY
    if any(k in q_lower for k in ["is my report normal", "explain my report", "overall", "summary", "kya report normal hai", "रिपोर्ट कैसी है", "all normal"]):
        flagged_params = []
        normal_params = []
        if context and context.get("parameters"):
            for p in context.get("parameters", []):
                st = (p.get("status") or "").upper()
                if "LOW" in st or "HIGH" in st:
                    flagged_params.append(f"• **{p.get('name')}**: {p.get('value')} {p.get('unit', '')} ({p.get('status')})")
                else:
                    normal_params.append(p.get("name"))

        if is_hindi:
            if flagged_params:
                flagged_str = "\n".join(flagged_params)
                msg = (
                    f"**आपकी सीबीसी रिपोर्ट का त्वरित अवलोकन:**\n\n"
                    f"आपकी रिपोर्ट में कुल {len(context.get('parameters', []))} पैरामीटर दर्ज हैं। इनमें से अधिकांश सामान्य सीमा में हैं, लेकिन निम्नलिखित मान सामान्य संदर्भ सीमा से बाहर (Flagged) हैं:\n\n"
                    f"{flagged_str}\n\n"
                    f"**महत्वपूर्ण:** एक या दो मानों का सीमा से बाहर होना किसी बीमारी की पुष्टि नहीं करता। लैब रिपोर्ट की व्याख्या हमेशा आपके व्यक्तिगत लक्षणों और डॉक्टर की सलाह के साथ ही की जानी चाहिए।"
                )
            else:
                msg = (
                    f"**आपकी सीबीसी रिपोर्ट का त्वरित अवलोकन:**\n\n"
                    f"आपकी रिपोर्ट में विश्लेषित सभी मुख्य पैरामीटर प्रयोगशाला की मानक संदर्भ सीमाओं के भीतर प्रतीत होते हैं। अपने नियमित स्वास्थ्य परीक्षण के लिए अपने डॉक्टर से इसकी समीक्षा अवश्य कराएं।"
                )
            questions = [
                "क्या इन असामान्य टेस्ट नतीजों के पीछे कोई अस्थायी कारण हो सकता है?",
                "अगली बार यह जांच मुझे कब दोहरानी चाहिए?"
            ]
        else:
            if flagged_params:
                flagged_str = "\n".join(flagged_params)
                msg = (
                    f"**Overall Snapshot of Your Blood Count Report:**\n\n"
                    f"Out of {len(context.get('parameters', []))} parameters captured, here are the key markers that sit outside the laboratory's reference range:\n\n"
                    f"{flagged_str}\n\n"
                    f"**Clinical Note:** Out-of-range values often reflect temporary physiological variations (such as hydration status, recent viral recovery, or nutritional intake) rather than chronic disease. Always correlate these findings with your physician."
                )
            else:
                msg = (
                    f"**Overall Snapshot of Your Blood Count Report:**\n\n"
                    f"All key parameters evaluated appear within the standard laboratory reference ranges. Routine preventive checkups and discussing your lifestyle with your doctor remain the best approach."
                )
            questions = [
                "What clinical symptoms should I monitor in connection with these flagged markers?",
                "What timeline do you recommend for repeating this lab test to monitor trends?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 13B. OUT OF RANGE / ABNORMAL / REFERENCE INTERVALS
    if any(k in q_lower for k in ["out of range", "abnormal", "reference range", "reference interval", "what does high mean", "what does low mean", "flagged", "असामान्य", "संदर्भ सीमा"]):
        if is_hindi:
            msg = (
                f"**लैब रेफरेंस रेंज, 'High' (उच्च) और 'Low' (कम) का सही अर्थ:**\n\n"
                f"प्रयोगशाला की संदर्भ सीमा (Reference Range) 95% स्वस्थ व्यक्तियों के सांख्यिकीय औसत आंकड़ों पर आधारित होती है:\n"
                f"• **हाई (High):** मान ऊपरी सीमा से अधिक है। यह किसी गंभीर बीमारी का निश्चित संकेत नहीं है; यह निर्जलीकरण (कम पानी पीना), हालिया व्यायाम, तनाव या शरीर की स्वाभाविक रोग प्रतिरोधक प्रतिक्रिया के कारण हो सकता है।\n"
                f"• **लो (Low):** मान निचली सीमा से कम है। यह अक्सर पोषण संबंधी कारकों (जैसे आयरन, B12), हालिया वायरल बीमारी के बाद की रिकवरी या शारीरिक भिन्नता से संबंधित होता है।\n"
                f"• **क्लीनिकल समझ:** डॉक्टर कभी भी किसी एक नंबर को अलग से नहीं देखते। वे आपके शारीरिक लक्षणों और स्वास्थ्य इतिहास के साथ मिलाकर ही इसका विश्लेषण करते हैं।"
            )
            questions = [
                "क्या मेरे इन असामान्य परिणामों के पीछे कोई अस्थायी कारण (जैसे निर्जलीकरण या हालिया संक्रमण) हो सकता है?",
                "क्या मुझे किसी अनुवर्ती जांच की आवश्यकता है?"
            ]
        else:
            msg = (
                f"**Understanding Laboratory Reference Ranges, 'High', and 'Low' Flags:**\n\n"
                f"A laboratory reference range represents the expected statistical interval for 95% of a healthy reference population tested using the same equipment and method:\n"
                f"• **High (Elevated):** The reading sits above the statistical upper bound. This does not automatically indicate pathology; temporary factors like dehydration (hemoconcentration), vigorous exertion, stress, or normal immune defense frequently elevate cell counts.\n"
                f"• **Low (Decreased):** The reading sits below the lower bound. This is often associated with nutritional factors (iron, ferritin, B12), post-viral recovery periods, or individual baseline variation.\n"
                f"• **Clinical Principle:** Physicians treat patients, not numbers. A slightly out-of-range value is a clinical clue evaluated alongside your symptoms, timeline, and physical examination."
            )
            questions = [
                "Could temporary lifestyle or hydration factors explain these out-of-range numbers?",
                "What timeline do you advise for repeating this CBC to monitor whether the level is stable?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 13C. DOCTOR DISCUSSION / WHAT TO ASK
    if any(k in q_lower for k in ["ask my doctor", "ask doctor", "questions for doctor", "डॉक्टर से क्या पूछें"]):
        if is_hindi:
            msg = (
                f"**अपने डॉक्टर से सीबीसी रिपोर्ट पर चर्चा करने के लिए मुख्य सुझाव:**\n\n"
                f"अपने चिकित्सक के साथ परामर्श करते समय ये 4 प्रमुख बिंदु सबसे उपयोगी रहते हैं:\n"
                f"1. *'क्या मेरी असामान्य रीडिंग मेरे वर्तमान लक्षणों (जैसे थकान या बुखार) से मेल खाती हैं?'*\n"
                f"2. *'क्या मुझे कोई फॉलो-अप टेस्ट (जैसे सीरम फेरिटिन या सीआरपी) कराने की सलाह देंगे?'*\n"
                f"3. *'क्या खानपान या पानी की मात्रा से इन स्तरों को संतुलित करने में मदद मिलेगी?'*\n"
                f"4. *'प्रगति की निगरानी के लिए यह टेस्ट दोबारा कब दोहराना चाहिए?'*"
            )
            questions = [
                "क्या मेरे वर्तमान लक्षण इन लैब परिणामों से सीधे संबंधित हैं?",
                "क्या मुझे किसी अन्य विशिष्ट जांच की आवश्यकता है?"
            ]
        else:
            msg = (
                f"**Top Strategic Questions for Your Doctor Regarding Your CBC Report:**\n\n"
                f"When discussing your laboratory panel with your physician, focus on clinical correlation:\n"
                f"1. *'Do any out-of-range markers correlate directly with how I have been feeling physically?'*\n"
                f"2. *'Could temporary lifestyle, hydration, or recent viral illness have influenced these results?'*\n"
                f"3. *'Would an adjunctive test (such as ferritin, iron saturation, or CRP) provide helpful clarity?'*\n"
                f"4. *'What timeline do you recommend for repeating this CBC to confirm stability?'*"
            )
            questions = [
                "How do these laboratory results fit into my overall health baseline?",
                "Are there specific warning signs I should watch out for between now and follow-up?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 13D. FASTING & TEST PREPARATION
    if any(k in q_lower for k in ["fasting", "fast", "empty stomach", "bhukhe pet", "भूखे पेट", "उपवास", "prep"]):
        if is_hindi:
            msg = (
                f"**क्या सीबीसी (CBC) टेस्ट के लिए भूखे पेट (Fasting) रहना जरूरी है?**\n\n"
                f"• **सीबीसी के लिए फास्टिंग आवश्यक नहीं:** सामान्य कम्प्लीट ब्लड काउंट टेस्ट के लिए फास्टिंग की आवश्यकता नहीं होती। आप सामान्य रूप से भोजन कर सकते हैं।\n"
                f"• **पानी पीना लाभदायक है:** टेस्ट से पहले पर्याप्त पानी पीना बहुत जरूरी है। डिहाइड्रेशन (पानी की कमी) से रक्त गाढ़ा हो जाता है जिससे हीमोग्लोबिन और हेमाटोक्रिट कृत्रिम रूप से बढ़े हुए दिख सकते हैं।\n"
                f"• **संयुक्त टेस्ट:** यदि सीबीसी के साथ लिपिड प्रोफाइल (कोलेस्ट्रॉल) या फास्टिंग ब्लड शुगर भी कराया जा रहा है, तो 8-12 घंटे का उपवास आवश्यक हो सकता है।"
            )
            questions = [
                "क्या मेरे इस टेस्ट के साथ कोई अन्य जांच (जैसे शुगर या लिपिड) भी जुड़ी हुई थी?",
                "टेस्ट से पहले पानी पीने के क्या दिशा-निर्देश होने चाहिए?"
            ]
        else:
            msg = (
                f"**Fasting Guidelines & Preparation for a Complete Blood Count (CBC):**\n\n"
                f"• **Fasting is generally NOT required:** A standalone CBC measures cellular components (RBCs, WBCs, Platelets) which do not change immediately following a standard meal.\n"
                f"• **Drink Plenty of Water:** Hydration is strongly recommended. Dehydration shrinks plasma volume and artificially inflates cell concentrations (relative hemoconcentration).\n"
                f"• **Combined Lab Panels:** If your CBC is ordered alongside a lipid profile, metabolic panel, or fasting glucose, an 8 to 12-hour fast may be required for those specific tests."
            )
            questions = [
                "Were other fasting-sensitive tests ordered alongside this CBC?",
                "What hydration routine do you recommend before future lab draws?"
            ]
        return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}

    # 14. GENERAL OVERVIEW OF CBC / DEFAULT PERSONALIZED RESPONSE
    param_summary_en = []
    param_summary_hi = []
    if context and context.get("parameters"):
        for p in context.get("parameters", [])[:4]:
            param_summary_en.append(f"• **{p.get('name')}**: {p.get('value')} {p.get('unit')} ({p.get('status')})")
            param_summary_hi.append(f"• **{p.get('name')}**: {p.get('value')} {p.get('unit')} ({p.get('status')})")

    report_context_str_en = ""
    report_context_str_hi = ""
    if param_summary_en:
        report_context_str_en = "\n\n**Key parameters from your loaded report:**\n" + "\n".join(param_summary_en)
        report_context_str_hi = "\n\n**आपकी वर्तमान रिपोर्ट के प्रमुख पैरामीटर:**\n" + "\n".join(param_summary_hi)

    if is_hindi:
        msg = (
            f"**सीबीसी (Complete Blood Count) रिपोर्ट का सार:**\n\n"
            f"यह टेस्ट आपके रक्त की तीन मुख्य कोशिकाओं की स्वास्थ्य स्थिति का व्यापक मूल्यांकन करता है:\n"
            f"1. **लाल कोशिकाएं (RBC & Hb):** शरीर में ऑक्सीजन का प्रवाह बनाए रखती हैं।\n"
            f"2. **सफेद कोशिकाएं (WBC):** संक्रमण और बीमारियों से रक्षा करती हैं।\n"
            f"3. **प्लेटलेट्स (PLT):** रक्त का थक्का जमाकर आंतरिक व बाहरी रक्तस्राव को रोकते हैं।{report_context_str_hi}\n\n"
            f"यदि कोई संख्या सामान्य सीमा से बाहर है, तो यह केवल एक संकेत है जिसे अपने चिकित्सक के साथ चर्चा करके समझना चाहिए।"
        )
        questions = [
            "क्या इन असामान्य टेस्ट परिणामों के पीछे कोई अस्थायी कारण (जैसे निर्जलीकरण या हालिया संक्रमण) हो सकता है?",
            "अगली बार यह टेस्ट मुझे कब दोहराना चाहिए?"
        ]
    else:
        msg = (
            f"**Understanding Your Complete Blood Count (CBC):**\n\n"
            f"A Complete Blood Count provides an essential snapshot of three core biological lineages in your bloodstream:\n"
            f"1. **Erythroid Lineage (RBC, Hemoglobin, MCV, Hematocrit):** Oxygen transport and energy delivery to tissues.\n"
            f"2. **Leukocyte Lineage (WBC, Neutrophils, Lymphocytes):** Active immune surveillance and defense against microbial threats.\n"
            f"3. **Thrombocyte Lineage (Platelets):** Primary hemostasis and blood clot formation.{report_context_str_en}\n\n"
            f"When individual markers sit outside the laboratory's reference range, physicians evaluate them alongside physical symptoms, hydration status, and clinical history."
        )
        questions = [
            "Could temporary lifestyle or hydration factors have influenced any of these markers?",
            "What timeline do you recommend for repeating this lab test to monitor trends?"
        ]

    return {"refusal": False, "is_emergency": False, "guardrail_triggered": None, "message": msg, "suggested_questions": questions}


def process_chat_query(
    question: str,
    language: str = "en",
    context: Optional[Dict[str, Any]] = None,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main entry point for processing a chatbot question.
    Enforces emergency triage, diagnostic refusals, Gemini AI generation (if available),
    and semantic knowledge engine fallback.
    """
    q_lower = question.lower().strip()
    is_hindi = language == "hi"

    # 1. EMERGENCY SYMPTOM CHECK
    is_emergency = any(trig in q_lower for trig in EMERGENCY_TRIGGERS)
    if is_emergency:
        if is_hindi:
            return {
                "refusal": True,
                "is_emergency": True,
                "guardrail_triggered": "आपातकालीन चिकित्सा सुरक्षा चेतावनी (Emergency Care Protocol)",
                "reason": "संभावित रूप से गंभीर आपातकालीन लक्षण पाए गए।",
                "message": "⚠️ ध्यान दें: आपने जिन लक्षणों (जैसे सीने में दर्द, सांस लेने में अत्यधिक कठिनाई या गंभीर रक्तस्राव) का उल्लेख किया है, वे संभावित रूप से आपातकालीन स्थिति का संकेत हो सकते हैं। कृपया किसी भी मोबाइल ऐप पर निर्भर रहने के बजाय तुरंत आपातकालीन चिकित्सा सेवा (112) या नजदीकी अस्पताल के आपातकालीन विभाग (ER) से संपर्क करें।",
                "suggested_questions": [
                    "नजदीकी आपातकालीन अस्पताल कहाँ है?",
                    "आपातकालीन चिकित्सक को वर्तमान में लिए जा रहे सभी लक्षण बताएं।"
                ]
            }
        else:
            return {
                "refusal": True,
                "is_emergency": True,
                "guardrail_triggered": "Emergency Clinical Warning Guardrail",
                "reason": "Potential life-threatening symptoms detected.",
                "message": "⚠️ CRITICAL SAFETY NOTICE: The symptoms you described (such as chest pain, severe shortness of breath, heavy bleeding, or loss of consciousness) may require urgent medical intervention. Please do NOT rely on an educational application. Contact emergency services (911 / 112) or proceed to the nearest emergency room immediately.",
                "suggested_questions": [
                    "What is the nearest urgent care or emergency facility?",
                    "Alert attending staff to all acute symptoms and medications immediately."
                ]
            }

    # 2. DIAGNOSTIC OR TREATMENT REFUSAL CHECK
    is_diagnostic_attempt = any(trigger in q_lower for trigger in DIAGNOSTIC_TRIGGERS)
    if is_diagnostic_attempt:
        if is_hindi:
            return {
                "refusal": True,
                "is_emergency": False,
                "guardrail_triggered": "निदान एवं उपचार अस्वीकरण गार्डरेल (Diagnostic Refusal Guardrail)",
                "reason": "रिपोर्टली (Reportly) रोग का निदान करने या दवा परामर्श देने के लिए पूरी तरह से प्रतिबंधित है।",
                "message": "मैं किसी बीमारी का निदान (Diagnosis) नहीं कर सकता और न ही कोई दवा लिख सकता हूँ। लैब रिपोर्ट केवल व्यक्तिगत बायोमार्कर दर्शाती हैं। किसी भी बीमारी का सही निदान डॉक्टर द्वारा शारीरिक परीक्षण, रोगी के लक्षणों और चिकित्सीय इतिहास के आधार पर ही संभव है।",
                "suggested_questions": [
                    "डॉक्टर साहब, मेरे इन असामान्य टेस्ट परिणामों के पीछे क्या संभावित कारण हो सकते हैं?",
                    "क्या मुझे किसी अन्य विशिष्ट जांच (जैसे आयरन प्रोफाइल या अल्ट्रासाउंड) की आवश्यकता है?",
                    "मेरी वर्तमान जीवनशैली या आहार में क्या सुधार मदद कर सकता है?"
                ]
            }
        else:
            return {
                "refusal": True,
                "is_emergency": False,
                "guardrail_triggered": "Diagnostic & Treatment Refusal Guardrail",
                "reason": "Reportly is strictly an educational tool and strictly refuses diagnostic or prescriptive inquiries.",
                "message": "I cannot diagnose illnesses, confirm specific diseases, or recommend medications. Complete Blood Count reports measure cell counts, but accurate medical diagnosis requires an evaluation of your physical symptoms, medical history, and clinical exam by a licensed physician.",
                "suggested_questions": [
                    "What potential clinical factors could explain these specific numbers?",
                    "Do my physical symptoms align with any of these out-of-range parameters?",
                    "Would any follow-up tests (such as a repeat blood count in a few weeks) be appropriate?"
                ]
            }

    # 3. GEMINI MULTIMODAL / LLM GENERATION (IF API KEY AVAILABLE)
    active_key = api_key or os.environ.get("GOOGLE_API_KEY", "")
    if active_key:
        try:
            genai.configure(api_key=active_key, transport="rest")
            model = genai.GenerativeModel("gemini-flash-latest")

            context_summary = []
            if context and context.get("parameters"):
                for p in context.get("parameters", [])[:12]:
                    context_summary.append(f"- {p.get('name')}: {p.get('value')} {p.get('unit')} (Ref: {p.get('range')}, Status: {p.get('status')})")
            ctx_str = "\n".join(context_summary) if context_summary else "No specific patient report context provided."

            lang_instr = "Respond in clear, natural Hindi (Devanagari)." if is_hindi else "Respond in clear, accessible, empathetic English."

            prompt = f"""
You are Reportly, an elite clinical laboratory educator specializing in Complete Blood Count (CBC) understanding.
Your goal is to answer the user's question directly, accurately, engagingly, and responsively.

CRITICAL MEDICAL SAFETY RULES:
1. NEVER diagnose a disease, condition, or illness.
2. NEVER prescribe medications, drugs, herbs, or dosages.
3. NEVER claim a condition is definitively confirmed or ruled out.
4. Ground your explanation in verified Complete Blood Count (CBC) biological science, referencing how this laboratory parameter functions in blood health.
5. If the user asks about a parameter present in their report, reference their exact value and status naturally.
6. {lang_instr}
7. Format with clean bullet points or short paragraphs. End with 2-3 tailored discussion questions for a physician.

ACTIVE REPORT PARAMETERS:
{ctx_str}

USER QUESTION:
{question}
"""
            llm_response = model.generate_content(prompt, request_options={"timeout": 5.0})
            resp_text = llm_response.text.strip()
            
            return {
                "refusal": False,
                "is_emergency": False,
                "guardrail_triggered": None,
                "message": resp_text,
                "suggested_questions": [
                    "Could temporary lifestyle or hydration factors have influenced this marker?",
                    "What timeline do you recommend for repeating this lab test to monitor trends?"
                ]
            }
        except Exception as e:
            # Non-blocking graceful degradation to the clinical knowledge engine
            print(f"Notice: Gemini LLM call skipped or timed out ({type(e).__name__}). Using Reportly Clinical Engine.")

    # 4. INTELLIGENT SEMANTIC CBC KNOWLEDGE ENGINE (NO API KEY / OFFLINE / TIMEOUT)
    return generate_semantic_response(question, language, context)