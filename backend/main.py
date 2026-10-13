"""
Reportly Healthcare Hackathon Backend API (Aayu 2026 - Problem Statement T02)
=============================================================================
Team: Ctrl Alt Win
Tagline: We simplify the report. We connect the dots.

Features:
- Deterministic reference-range classification (AI never classifies status).
- Safe, non-diagnostic multi-parameter pattern analysis with explicit limitations.
- High-precision OCR extraction with original source text preservation & evidence tracing.
- Clinical safety guardrails refusing diagnostic / prescriptive inquiries.
- Emergency symptom detection directing patients to urgent medical care.
- Robust file validation (size limits, MIME types, empty check).
- Graceful offline fallback if cloud APIs are unavailable.
"""

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
import uuid

from classifier import classify_status, normalize_unit, STATUS_WITHIN_RANGE, STATUS_LOW, STATUS_HIGH, STATUS_NEEDS_VERIFICATION, STATUS_UNKNOWN
from patterns import analyze_patterns_safely
from ocr_extractor import parse_ocr_blocks, CBC_DEFINITIONS
from datetime import datetime, timezone
from firebase_config import db, is_firebase_available, save_report_summary, get_report_summary

app = FastAPI(
    title="Reportly API",
    description="Educational Complete Blood Count (CBC) report decoder with deterministic clinical safety rules.",
    version="2.0.0"
)

# CORS Configuration
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize local RapidOCR engine
ocr_engine = RapidOCR()

DEFAULT_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
MAX_UPLOAD_SIZE = 15 * 1024 * 1024  # 15 MB limit
SUPPORTED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}

GEMINI_VISION_PROMPT = """
You are a precise clinical laboratory report extractor specializing strictly in Complete Blood Count (CBC) reports.
Analyze the provided medical laboratory report and extract EVERY tested CBC parameter.

For each parameter:
- name: The canonical CBC parameter name and abbreviation (e.g., 'Hemoglobin (HGB)', 'Total Leucocyte Count (WBC)', 'Platelet Count (PLT)', 'Mean Corpuscular Volume (MCV)', 'Hematocrit (HCT)', 'Neutrophils %')
- value: The exact extracted result number or qualitative finding (e.g., '14.0', '103', 'POSITIVE', 'NEGATIVE')
- unit: The unit of measurement (e.g., 'g/dL', '10^3/µL', '10^6/µL', '%', 'fL', 'pg', '/cumm')
- range_min: The numeric lower bound of the laboratory reference range as a float/number, or null if qualitative or not printed
- range_max: The numeric upper bound of the laboratory reference range as a float/number, or null if qualitative or not printed
- range_string: The exact reference range string as printed on the report (e.g., '12.0 - 16.0', '150 - 450')
- source_text: The exact raw text line from the report where this parameter and value were found
- explanation: A clear 1-2 sentence plain-language explanation of what this measures for a non-medical reader. DO NOT DIAGNOSE.

Also extract:
- patient_metadata: { name: "", age: "", gender: "", lab_name: "", date: "" }

Return strictly valid JSON matching this schema without markdown code blocks:
{
  "patient_metadata": { "name": "", "age": "", "gender": "", "lab_name": "", "date": "" },
  "parameters": [
    {
      "name": "...",
      "value": "...",
      "unit": "...",
      "range_min": null,
      "range_max": null,
      "range_string": "...",
      "source_text": "...",
      "explanation": "..."
    }
  ]
}
"""


def calculate_report_summary(parameters: List[Dict[str, Any]]) -> Dict[str, int]:
    """Calculates dynamic verified parameter counts."""
    total = len(parameters)
    within_range = 0
    low = 0
    high = 0
    needs_verification = 0

    for p in parameters:
        st = p.get("status", "")
        if st == STATUS_WITHIN_RANGE:
            within_range += 1
        elif st == STATUS_LOW:
            low += 1
        elif st == STATUS_HIGH:
            high += 1
        else:
            needs_verification += 1

    return {
        "total_parameters": total,
        "within_range_count": within_range,
        "low_count": low,
        "high_count": high,
        "needs_verification_count": needs_verification
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "ocr_engine": "RapidOCR Ready",
        "gemini_api_configured": bool(DEFAULT_API_KEY),
        "firebase_persistence": "Available" if is_firebase_available() else "Offline / Local Mode",
        "supported_formats": list(SUPPORTED_EXTENSIONS)
    }


@app.post("/api/upload")
async def upload_report(
    file: UploadFile = File(...),
    x_gemini_api_key: Optional[str] = Header(None)
):
    active_key = x_gemini_api_key or DEFAULT_API_KEY

    # 1. Validate file extension
    filename = file.filename or "uploaded_report"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Please upload a CBC report as a PDF, JPG, PNG, or WebP document."
        )

    # 2. Buffer file and validate size
    suffix = ext if ext else ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        file_size = 0
        chunk_size = 1024 * 1024  # 1MB chunks
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            file_size += len(chunk)
            if file_size > MAX_UPLOAD_SIZE:
                temp_file.close()
                os.remove(temp_file.name)
                raise HTTPException(
                    status_code=413,
                    detail=f"File exceeds maximum size limit of 15MB (uploaded size: {round(file_size / (1024*1024), 2)}MB)."
                )
            temp_file.write(chunk)
        temp_path = temp_file.name

    if file_size == 0:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=400, detail="The uploaded file is empty. Please select a valid document.")

    try:
        report_id = str(uuid.uuid4())
        parameters = []
        patient_metadata = {"name": "Patient", "age": "N/A", "gender": "N/A", "lab_name": "Decoded Lab Report", "date": ""}
        extraction_source = "RapidOCR Engine"

        # PATH 1: Real Gemini Multimodal Vision API (if API key available)
        if active_key:
            try:
                genai.configure(api_key=active_key)
                vision_model = genai.GenerativeModel("gemini-1.5-flash")
                
                uploaded_media = genai.upload_file(path=temp_path)
                response = vision_model.generate_content([uploaded_media, GEMINI_VISION_PROMPT])
                
                try:
                    uploaded_media.delete()
                except Exception:
                    pass

                response_text = response.text.strip()
                if response_text.startswith("```json"):
                    response_text = response_text.replace("```json", "").replace("```", "").strip()
                elif response_text.startswith("```"):
                    response_text = response_text.replace("```", "").strip()

                parsed_json = json.loads(response_text)
                patient_metadata.update(parsed_json.get("patient_metadata", {}))
                
                # ENFORCE DETERMINISTIC RULE-BASED RANGE CLASSIFICATION
                # The LLM is never allowed to determine status!
                for raw_param in parsed_json.get("parameters", []):
                    classification = classify_status(
                        value_raw=raw_param.get("value"),
                        range_min=raw_param.get("range_min"),
                        range_max=raw_param.get("range_max"),
                        unit=raw_param.get("unit"),
                        test_name=raw_param.get("name"),
                        range_string=raw_param.get("range_string")
                    )

                    rstring = raw_param.get("range_string") or (
                        f"{raw_param.get('range_min')} - {raw_param.get('range_max')}"
                        if (raw_param.get('range_min') is not None and raw_param.get('range_max') is not None)
                        else "Not Specified"
                    )

                    param_obj = {
                        "name": raw_param.get("name", "Unknown Parameter"),
                        "value": str(raw_param.get("value", "")),
                        "unit": normalize_unit(raw_param.get("unit")) or raw_param.get("unit", ""),
                        "range": rstring,
                        "range_min": classification.get("parsed_min"),
                        "range_max": classification.get("parsed_max"),
                        "status": classification["status"],
                        "status_code": classification["status_code"],
                        "explanation": raw_param.get("explanation", "Measures blood component levels."),
                        "evidence_trace": {
                            "source_text": raw_param.get("source_text") or f"{raw_param.get('name')}: {raw_param.get('value')} {raw_param.get('unit')} (Ref: {rstring})",
                            "ocr_confidence": 0.98,
                            "coordinates": None,
                            "comparison_math": classification["comparison_math"],
                            "rule_reason": classification["reason"],
                            "needs_verification": classification["needs_verification"],
                            "unit_validated": classification["unit_validated"]
                        }
                    }
                    parameters.append(param_obj)

                extraction_source = "Gemini Vision with Deterministic Rule Validation"
            except Exception as gemini_err:
                print(f"Gemini API attempt error: {gemini_err}. Gracefully falling back to RapidOCR.")

        # PATH 2: Local RapidOCR Engine (No API key needed / fallback)
        if not parameters:
            # Handle images or PDF conversion
            ocr_results = None
            if ext == ".pdf":
                try:
                    from pdf2image import convert_from_path
                    images = convert_from_path(temp_path, first_page=1, last_page=1)
                    if images:
                        page_path = temp_path + "_page1.png"
                        images[0].save(page_path, "PNG")
                        ocr_results, _ = ocr_engine(page_path)
                        if os.path.exists(page_path):
                            os.remove(page_path)
                except Exception as pdf_err:
                    print(f"pdf2image conversion error: {pdf_err}. Attempting direct file read.")

            if not ocr_results:
                try:
                    ocr_results, _ = ocr_engine(temp_path)
                except Exception as direct_ocr_err:
                    print(f"Direct OCR error: {direct_ocr_err}")

            if ocr_results:
                parsed_ocr = parse_ocr_blocks(ocr_results)
                parameters = parsed_ocr.get("parameters", [])
                extraction_source = "Local RapidOCR Engine with Deterministic Rules"

        if not parameters:
            return {
                "error": "Could not extract laboratory parameters from the uploaded document.",
                "message": "Please ensure the image or PDF is clear, well-lit, and contains a standard CBC laboratory panel. To enable high-accuracy AI Vision extraction, you can also provide a Gemini API Key in the settings."
            }

        # Analyze Multi-Parameter Patterns Deterministically & Safely
        patterns = analyze_patterns_safely(parameters)

        # Standard Doctor Discussion Questions
        questions = [
            "What potential clinical factors could explain any parameters sitting outside the reference interval?",
            "Given these Complete Blood Count results, would you suggest repeating the test in 48-72 hours to evaluate trends?",
            "Are there any specific dietary, hydration, or activity adjustments I should make while monitoring these numbers?",
            "What warning signs or symptoms should prompt me to seek immediate medical consultation?"
        ]

        # Calculate Verified Summary Counts
        summary_counts = calculate_report_summary(parameters)

        p_name = patient_metadata.get("name") or "Patient"
        p_lab = patient_metadata.get("lab_name") or "CBC Laboratory Panel"
        p_age = patient_metadata.get("age", "N/A")
        p_gender = patient_metadata.get("gender", "N/A")

        final_data = {
            "id": report_id,
            "title": f"{p_name} — {p_lab}",
            "subtitle": f"Age: {p_age} • Gender: {p_gender} • Extracted via {extraction_source}",
            "extraction_source": extraction_source,
            "summary_counts": summary_counts,
            "parameters": parameters,
            "patterns": patterns,
            "questions": questions,
            "is_sample": False
        }

        # Persist to Firebase if configured
        saved_to_firebase = False
        if is_firebase_available():
            saved_to_firebase = save_report_summary(report_id, final_data)
        final_data["saved_to_firebase"] = saved_to_firebase

        return final_data

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@app.get("/api/reports/{report_id}")
async def get_saved_report(report_id: str):
    """Retrieves a previously stored report by ID from Firestore."""
    if not is_firebase_available():
        raise HTTPException(status_code=503, detail="Firebase persistence is not available.")
    report = get_report_summary(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found in database.")
    return report


class AskRequest(BaseModel):
    question: str
    language: Optional[str] = "en"
    context: Optional[Dict[str, Any]] = None


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

# Red-flag emergency symptoms
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


@app.post("/api/ask")
async def ask_guardrail(
    request: AskRequest,
    x_gemini_api_key: Optional[str] = Header(None)
):
    q_lower = request.question.lower().strip()
    is_hindi = request.language == "hi"

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

    # 3. GROUNDED EDUCATIONAL QUESTION ANSWERING
    active_key = x_gemini_api_key or DEFAULT_API_KEY
    if active_key and request.context:
        try:
            genai.configure(api_key=active_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            # Extract compact parameter context
            context_summary = []
            for p in request.context.get("parameters", [])[:10]:
                context_summary.append(f"{p.get('name')}: {p.get('value')} {p.get('unit')} (Range: {p.get('range')}, Status: {p.get('status')})")
            ctx_str = "\n".join(context_summary)

            prompt = f"""
You are Reportly, an educational laboratory report explanation assistant.
CRITICAL MEDICAL SAFETY RULES:
1. NEVER diagnose a disease, condition, or illness.
2. NEVER prescribe medications, drugs, herbs, or dosages.
3. NEVER tell the user they definitely have or do not have a condition.
4. Ground your response ONLY in what standard Complete Blood Count parameters measure.
5. If the user asks in Hindi, answer in clear Hindi. If in English, answer in English.
6. Keep the response concise (2-3 paragraphs max), educational, and reassuring. Always emphasize discussing with a doctor.

REPORT PARAMETERS:
{ctx_str}

USER QUESTION:
{request.question}
"""
            llm_response = model.generate_content(prompt)
            return {
                "refusal": False,
                "is_emergency": False,
                "guardrail_triggered": None,
                "message": llm_response.text.strip(),
                "suggested_questions": [
                    "Could temporary lifestyle or hydration factors influence this parameter?",
                    "What timeframe would you advise for a follow-up blood count?"
                ]
            }
        except Exception as e:
            print(f"Gemini LLM ask error: {e}. Falling back to safe deterministic response.")

    # 4. DETERMINISTIC SAFE FALLBACK RESPONSE
    if is_hindi:
        return {
            "refusal": False,
            "is_emergency": False,
            "guardrail_triggered": None,
            "message": "यह प्रश्न स्वास्थ्य समझ के लिए उपयोगी है। आपकी सीबीसी रिपोर्ट में मापे गए पैरामीटर शरीर में लाल रक्त कोशिकाओं (ऑक्सीजन वितरण), श्वेत रक्त कोशिकाओं (रोग प्रतिरोध) और प्लेटलेट्स (रक्त का थक्का जमना) की वर्तमान स्थिति दर्शाते हैं। यदि कोई संख्या सामान्य सीमा से बाहर है, तो यह केवल एक संकेत है जिसे अपने चिकित्सक के साथ चर्चा करके समझना चाहिए।",
            "suggested_questions": [
                "क्या इस टेस्ट के नतीजे किसी अस्थायी कारण (जैसे निर्जलीकरण या हालिया संक्रमण) से प्रभावित हो सकते हैं?",
                "अगली बार यह टेस्ट मुझे कब दोहराना चाहिए?"
            ]
        }
    else:
        return {
            "refusal": False,
            "is_emergency": False,
            "guardrail_triggered": None,
            "message": "This is a great clarifying question. Complete Blood Count (CBC) parameters provide a high-level view of your red blood cells (oxygen delivery), white blood cells (immune defense), and platelets (clotting). When a marker sits outside the lab's reference range, physicians evaluate it in the context of your overall physical health, symptoms, and medical history.",
            "suggested_questions": [
                "Could temporary lifestyle or hydration factors have influenced this marker?",
                "What timeline do you recommend for repeating this lab test to monitor trends?"
            ]
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
