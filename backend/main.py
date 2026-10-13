from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import google.generativeai as genai
from rapidocr_onnxruntime import RapidOCR
from PIL import Image
import os
import re
import json
import tempfile
import shutil

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ocr_engine = RapidOCR()

DEFAULT_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

prompt_template = """
You are an expert clinical laboratory report extractor.
Analyze the provided medical laboratory report (CBC, Blood Count, Serology, Pathology).
Extract EVERY tested parameter, its numeric/qualitative result, its laboratory reference range, and unit.

For each parameter:
- name: The canonical name and abbreviation (e.g., 'Platelet Count (PLT)', 'Hemoglobin (HGB)', 'Typhoid IgG IgM Serology')
- value: The exact extracted value (e.g. '103', '14.0', 'POSITIVE', 'NEGATIVE')
- unit: The unit of measurement (e.g. '10^3/uL', 'g/dL', '%', 'Card Test')
- range_min: The numeric lower bound of reference range as float/number, or null if qualitative/not applicable
- range_max: The numeric upper bound of reference range as float/number, or null if qualitative/not applicable
- range_string: The exact reference range string as printed on the report (e.g. '150-450', '12.0-16.0', 'Negative')
- explanation: A clear 1-2 sentence plain-language explanation of what this measures for a non-medical patient. Do not diagnose.

Also identify:
- patterns: An array of connected findings combining related parameters (e.g., Low Platelets + Positive Typhoid, or Low Hb + Low MCV). Explain the clinical evidence without diagnosing.
- questions: An array of 3-4 specific, relevant questions the patient should ask their physician regarding these exact results.
- patient_metadata: { name: "", age: "", gender: "", lab_name: "", date: "" }

Return strictly valid JSON matching this schema without markdown fences:
{
  "patient_metadata": { "name": "...", "age": "...", "gender": "...", "lab_name": "...", "date": "..." },
  "parameters": [
    {
      "name": "...",
      "value": "...",
      "unit": "...",
      "range_min": null,
      "range_max": null,
      "range_string": "...",
      "explanation": "..."
    }
  ],
  "patterns": [
    { "title": "...", "description": "..." }
  ],
  "questions": [
    "..."
  ]
}
"""

def classify_status(value_str, range_min, range_max):
    val_upper = str(value_str).strip().upper()
    if val_upper in ["POSITIVE", "REACTIVE", "DETECTED"]:
        return "High"
    if val_upper in ["NEGATIVE", "NON-REACTIVE", "NOT DETECTED"]:
        return "Normal"

    try:
        val = float(re.findall(r"[-+]?\d*\.\d+|\d+", str(value_str))[0])
        if range_min is not None and val < float(range_min):
            return "Low"
        if range_max is not None and val > float(range_max):
            return "High"
        if range_min is not None and range_max is not None:
            return "Normal"
    except (ValueError, TypeError, IndexError):
        pass
    return "Normal"

def analyze_patterns_rule_based(params):
    patterns = []
    has_typhoid = False
    plt_low = False
    gran_high = False
    hb_low = False
    mcv_low = False

    for p in params:
        name = p.get("name", "").upper()
        status = p.get("status", "")
        val = str(p.get("value", "")).upper()

        if "TYPHOID" in name and ("POS" in val or status == "High"):
            has_typhoid = True
        if ("PLT" in name or "PLATELET" in name) and status == "Low":
            plt_low = True
        if ("GRAN" in name or "NEUTRO" in name) and status == "High":
            gran_high = True
        if ("HGB" in name or "HEMOGLOBIN" in name) and status == "Low":
            hb_low = True
        if "MCV" in name and status == "Low":
            mcv_low = True

    if has_typhoid and plt_low:
        patterns.append({
            "title": "Thrombocytopenia Secondary to Enteric (Typhoid) Infection",
            "description": "Positive Typhoid serology accompanied by reduced Platelets is a recognized clinical pattern. Typhoid endotoxins often cause transient bone marrow suppression and platelet clearance, which typically reverses following appropriate medical treatment."
        })
    elif plt_low:
        patterns.append({
            "title": "Isolated Platelet Reduction (Thrombocytopenia)",
            "description": "Platelet count sits below the laboratory reference threshold. This warrants clinical review to prevent bleeding risks and monitor recovery."
        })

    if gran_high:
        patterns.append({
            "title": "Granulocytic / Neutrophil Immune Response",
            "description": "Elevated granulocyte percentage indicates frontline immune mobilization, typically responding to bacterial illness or systemic inflammation."
        })

    if hb_low and mcv_low:
        patterns.append({
            "title": "Microcytic Hypochromic Picture (Possible Iron Depletion)",
            "description": "Low hemoglobin matched with reduced cell size (MCV) frequently correlates with nutritional iron deficiency or blood loss."
        })

    if not patterns:
        patterns.append({
            "title": "General Laboratory Profile Evaluated",
            "description": "Parameters analyzed against laboratory reference ranges. Isolated variations should be reviewed in the context of physical symptoms."
        })

    return patterns

def parse_with_rapidocr(image_path):
    result, _ = ocr_engine(image_path)
    if not result:
        return None

    full_text = " ".join([line[1] for line in result])
    lines = [line[1] for line in result]

    # Rule-based field matching for standard CBC
    known_fields = [
        {"regex": r"WBC", "name": "Total Leucocyte Count (WBC)", "unit": "10^3/uL", "rmin": 4.0, "rmax": 11.0, "range": "4.00 - 11.00", "exp": "White blood cells defend against infections."},
        {"regex": r"Lym\s*%", "name": "Lymphocytes % (Lym%)", "unit": "%", "rmin": 20.0, "rmax": 50.0, "range": "20.0 - 50.0", "exp": "Immune cells essential for viral surveillance and antibody production."},
        {"regex": r"Gran\s*%", "name": "Granulocytes % (Gran%)", "unit": "%", "rmin": 40.0, "rmax": 70.0, "range": "40.0 - 70.0", "exp": "Frontline bacterial defense cells."},
        {"regex": r"Mid\s*%", "name": "Mid Cells % (Mid%)", "unit": "%", "rmin": 3.0, "rmax": 9.0, "range": "3.0 - 9.0", "exp": "Mixed intermediate immune cells (monocytes, eosinophils, basophils)."},
        {"regex": r"RBC", "name": "Red Blood Cell Count (RBC)", "unit": "10^6/uL", "rmin": 3.5, "rmax": 5.5, "range": "3.50 - 5.50", "exp": "Cells that transport oxygen throughout your body."},
        {"regex": r"HGB|HEMOGLOBIN", "name": "Hemoglobin (HGB)", "unit": "g/dL", "rmin": 12.0, "rmax": 16.0, "range": "12.0 - 16.0", "exp": "The iron protein in blood that binds and carries oxygen."},
        {"regex": r"HCT", "name": "Hematocrit (HCT)", "unit": "%", "rmin": 35.0, "rmax": 45.0, "range": "35.0 - 45.0", "exp": "Proportion of red cells relative to total liquid blood volume."},
        {"regex": r"MCV", "name": "Mean Corpuscular Volume (MCV)", "unit": "fL", "rmin": 82.0, "rmax": 100.0, "range": "82.0 - 100.0", "exp": "Average physical volume of individual red blood cells."},
        {"regex": r"MCH\b", "name": "Mean Corpuscular Hemoglobin (MCH)", "unit": "pg", "rmin": 27.0, "rmax": 34.0, "range": "27.0 - 34.0", "exp": "Average amount of hemoglobin inside each red blood cell."},
        {"regex": r"MCHC", "name": "MCHC", "unit": "g/dL", "rmin": 31.6, "rmax": 35.4, "range": "31.6 - 35.4", "exp": "Concentration of hemoglobin per unit volume of packed red cells."},
        {"regex": r"PLT|PLATELET", "name": "Platelet Count (PLT)", "unit": "10^3/uL", "rmin": 150.0, "rmax": 450.0, "range": "150 - 450", "exp": "Cells responsible for stopping bleeding and forming blood clots."},
        {"regex": r"PCT\b", "name": "Plateletcrit (PCT)", "unit": "%", "rmin": 0.108, "rmax": 0.282, "range": "0.108 - 0.282", "exp": "Total percentage volume occupied by platelets in blood."},
        {"regex": r"TYPHOID", "name": "Typhoid IgG IgM Serology", "unit": "Card Test", "rmin": None, "rmax": None, "range": "Negative", "exp": "Antibody response to Salmonella Typhi bacteria."},
        {"regex": r"MALARIA", "name": "Malaria by Card", "unit": "Card Test", "rmin": None, "rmax": None, "range": "Negative", "exp": "Screening for plasmodium malaria parasites."}
    ]

    extracted_params = []
    
    # Try finding each field in the OCR lines
    for field in known_fields:
        for idx, line in enumerate(lines):
            if re.search(field["regex"], line, re.IGNORECASE):
                # Look for numbers or POSITIVE/NEGATIVE in current line or next line
                search_text = line
                if idx + 1 < len(lines):
                    search_text += " " + lines[idx + 1]

                val = None
                if "TYPHOID" in field["regex"]:
                    if "POS" in search_text.upper():
                        val = "POSITIVE"
                    elif "NEG" in search_text.upper():
                        val = "NEGATIVE"
                elif "MALARIA" in field["regex"]:
                    if "NEG" in search_text.upper():
                        val = "NEGATIVE"
                    elif "POS" in search_text.upper():
                        val = "POSITIVE"
                else:
                    nums = re.findall(r"\b\d+\.?\d*\b", search_text)
                    if nums:
                        val = nums[0]

                if val:
                    status = classify_status(val, field["rmin"], field["rmax"])
                    extracted_params.append({
                        "name": field["name"],
                        "value": str(val),
                        "unit": field["unit"],
                        "range": field["range"],
                        "range_min": field["rmin"],
                        "range_max": field["rmax"],
                        "status": status,
                        "explanation": field["exp"]
                    })
                    break

    if not extracted_params:
        return None

    patterns = analyze_patterns_rule_based(extracted_params)
    
    questions = [
        "What specific medical factors explain these out-of-range values?",
        "Should we repeat any of these tests in 48-72 hours to evaluate trends?",
        "Are there any hydration or dietary precautions I should follow?"
    ]

    return {
        "title": "Decoded Laboratory Panel (OCR Extracted)",
        "subtitle": "Processed via Local RapidOCR Engine with Deterministic Rules",
        "parameters": extracted_params,
        "patterns": patterns,
        "questions": questions
    }

@app.post("/api/upload")
async def upload_report(
    file: UploadFile = File(...),
    x_gemini_api_key: Optional[str] = Header(None)
):
    active_key = x_gemini_api_key or DEFAULT_API_KEY

    suffix = os.path.splitext(file.filename)[1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name

    try:
        # PATH 1: Real Gemini Multimodal Vision API (High Precision)
        if active_key:
            try:
                genai.configure(api_key=active_key)
                vision_model = genai.GenerativeModel("gemini-1.5-flash")
                
                uploaded_media = genai.upload_file(path=temp_path)
                response = vision_model.generate_content([uploaded_media, prompt_template])
                
                try:
                    uploaded_media.delete()
                except Exception:
                    pass

                response_text = response.text.strip()
                if response_text.startswith("```json"):
                    response_text = response_text.replace("```json", "").replace("```", "").strip()
                elif response_text.startswith("```"):
                    response_text = response_text.replace("```", "").strip()

                data = json.loads(response_text)
                
                # Enforce DETERMINISTIC Rule-Based Range Classification
                for param in data.get("parameters", []):
                    param["status"] = classify_status(param.get("value"), param.get("range_min"), param.get("range_max"))
                    param["range"] = param.get("range_string") or f"{param.get('range_min')}-{param.get('range_max')}"

                # Enforce rule-based pattern cross-checks
                additional_patterns = analyze_patterns_rule_based(data.get("parameters", []))
                existing_titles = [p.get("title") for p in data.get("patterns", [])]
                for ap in additional_patterns:
                    if ap.get("title") not in existing_titles:
                        data["patterns"].append(ap)

                data["title"] = f"{data.get('patient_metadata', {}).get('name', 'Patient')} - {data.get('patient_metadata', {}).get('lab_name', 'Decoded Lab Report')}"
                data["subtitle"] = f"Age: {data.get('patient_metadata', {}).get('age', 'N/A')} • Gender: {data.get('patient_metadata', {}).get('gender', 'N/A')} • Gemini Vision Extracted"
                return data
            except Exception as gemini_err:
                print(f"Gemini API attempt error: {gemini_err}. Falling back to RapidOCR.")

        # PATH 2: Local RapidOCR Engine (No API Key Required)
        ocr_result = parse_with_rapidocr(temp_path)
        if ocr_result and len(ocr_result.get("parameters", [])) > 0:
            return ocr_result

        # Fallback if unreadable
        return {
            "error": "Could not extract laboratory parameters from the uploaded document.",
            "message": "Please ensure the image or PDF is clear and well-lit. To enable high-accuracy AI Vision extraction, enter a Google Gemini API Key in the settings."
        }

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

class AskRequest(BaseModel):
    question: str
    language: Optional[str] = "en"
    context: Optional[Dict[str, Any]] = None

DIAGNOSTIC_TRIGGERS = [
    "diagnos", "do i have", "am i suffering", "have i got", "is this cancer",
    "leukemia", "tumor", "cure me", "what disease", "which disease",
    "prescribe", "what medicine", "what drug", "can i take", "am i sick",
    "kya mujhe", "bimaari", "rog", "kya ye cancer"
]

@app.post("/api/ask")
async def ask_guardrail(request: AskRequest):
    q_lower = request.question.lower().strip()
    is_hindi = request.language == "hi"

    is_diagnostic_attempt = any(trigger in q_lower for trigger in DIAGNOSTIC_TRIGGERS)

    if is_diagnostic_attempt:
        if is_hindi:
            return {
                "refusal": True,
                "guardrail_triggered": "निदान अस्वीकरण सुरक्षा गार्डरेल (Diagnostic Refusal Guardrail)",
                "reason": "रिपोर्टली (Reportly) रोग निदान या दवा परामर्श देने के लिए पूरी तरह से प्रतिबंधित है।",
                "message": "मैं किसी बीमारी का निदान (Diagnosis) नहीं कर सकता और न ही यह बता सकता हूँ कि आपको कोई विशिष्ट बीमारी है या नहीं। लैब रिपोर्ट केवल आंकड़े और माप दर्शाती हैं। किसी भी बीमारी की सही पहचान के लिए डॉक्टर द्वारा शारीरिक जांच और संपूर्ण स्वास्थ्य इतिहास का मूल्यांकन अनिवार्य है।",
                "suggested_questions": [
                    "डॉक्टर साहब, मेरे इन असामान्य टेस्ट परिणामों के पीछे क्या संभावित कारण हो सकते हैं?",
                    "क्या मुझे किसी अन्य विशिष्ट जांच (जैसे रक्त संवर्धन या अल्ट्रासाउंड) की आवश्यकता है?",
                    "मेरी वर्तमान जीवनशैली या आहार में क्या सुधार मदद कर सकता है?"
                ]
            }
        else:
            return {
                "refusal": True,
                "guardrail_triggered": "Diagnostic Question Refusal Guardrail",
                "reason": "Reportly is strictly an educational tool and refuses diagnostic or prescriptive inquiries.",
                "message": "I cannot diagnose illnesses, predict diseases, or prescribe treatments. Lab reports only measure individual biological markers. A definitive diagnosis requires physical examinations, clinical history, and symptoms evaluation by a qualified doctor.",
                "suggested_questions": [
                    "What potential clinical factors could explain these specific numbers?",
                    "Do my reported symptoms align with any of these out-of-range parameters?",
                    "Would any follow-up tests (such as a repeat platelet count or physician review) be appropriate?"
                ]
            }

    if is_hindi:
        return {
            "refusal": False,
            "guardrail_triggered": None,
            "message": "यह प्रश्न स्वास्थ्य समझ के लिए महत्वपूर्ण है। आपकी सीबीसी रिपोर्ट में मापे गए पैरामीटर शरीर के सामान्य रक्त संचरण, प्रतिरक्षा प्रणाली और थक्का जमाने की स्थिति को दर्शाते हैं। यदि कोई संख्या सामान्य सीमा से बाहर है, तो यह केवल एक संकेत है जिसे डॉक्टर के साथ चर्चा करके समझना चाहिए।",
            "suggested_questions": [
                "क्या इस टेस्ट के नतीजे किसी अस्थायी कारण (जैसे निर्जलीकरण या संक्रमण) से प्रभावित हो सकते हैं?",
                "अगली बार यह टेस्ट मुझे कब दोहराना चाहिए?"
            ]
        }
    else:
        return {
            "refusal": False,
            "guardrail_triggered": None,
            "message": "Great clarifying question. Complete Blood Count (CBC) parameters provide a high-level picture of red cells (oxygen delivery), white cells (immune defense), and platelets (clotting). When a marker sits outside the lab's range, doctors evaluate it in the context of how you feel overall.",
            "suggested_questions": [
                "Could temporary infection or lifestyle factors affect this marker?",
                "What timeline do you recommend for repeating this lab test to monitor trends?"
            ]
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
