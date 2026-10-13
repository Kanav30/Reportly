"""
Reportly Healthcare Hackathon Backend API (Aayu 2026 - Problem Statement T02)
=============================================================================
Team: Ctrl Alt Win
Tagline: We simplify the report. We connect the dots.

Security model:
- Every protected endpoint uses get_current_user() which verifies the Firebase
  ID token from the Authorization: Bearer header via the Admin SDK.
- The UID extracted from the verified token is the authoritative identity.
- No client-supplied UID, email, or ownerUid is ever trusted.
- Report ownership is enforced on every read, write, and delete operation.
- Firebase Admin SDK operations in firebase_config.py enforce ownership too.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Form, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
import google.generativeai as genai
from rapidocr_onnxruntime import RapidOCR
from PIL import Image
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

import re
import json
import tempfile
import shutil
import uuid

from classifier import classify_status, normalize_unit, STATUS_WITHIN_RANGE, STATUS_LOW, STATUS_HIGH, STATUS_NEEDS_VERIFICATION, STATUS_UNKNOWN
from patterns import analyze_patterns_safely
from ocr_extractor import parse_ocr_blocks, CBC_DEFINITIONS
from chat_assistant import process_chat_query
from datetime import datetime, timezone
from firebase_config import (
    db, is_firebase_available,
    verify_firebase_token,
    create_or_update_user_profile, get_user_profile,
    save_report_for_user, get_report_for_user, get_user_reports, delete_report_for_user,
    # Legacy helpers kept for existing tests
    save_report_summary, get_report_summary,
)

app = FastAPI(
    title="Reportly API",
    description="Educational Complete Blood Count (CBC) report decoder with deterministic clinical safety rules.",
    version="2.0.0"
)

# ---------------------------------------------------------------------------
# CORS — allow local development (localhost) and production (Render)
# ---------------------------------------------------------------------------
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://reportly-frontend.onrender.com",
    "https://reportly-backend-9xug.onrender.com",
]
env_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]
ALLOWED_ORIGINS = list(dict.fromkeys(DEFAULT_ALLOWED_ORIGINS + env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https://.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Engines and constants
# ---------------------------------------------------------------------------
ocr_engine = RapidOCR()
DEFAULT_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
MAX_UPLOAD_SIZE = 15 * 1024 * 1024  # 15 MB
SUPPORTED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}

# ---------------------------------------------------------------------------
# Authentication dependency
# ---------------------------------------------------------------------------
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Dict[str, Any]:
    """
    FastAPI dependency that verifies the Firebase ID token from the
    Authorization: Bearer <token> header.

    Returns the decoded token dict (uid, email, ...) on success.
    Raises HTTP 401 for missing or invalid tokens.

    NEVER accepts a client-supplied UID — always uses Admin SDK verification.
    """
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in and include a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    decoded = verify_firebase_token(credentials.credentials)
    if decoded is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or revoked authentication token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return decoded


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[Dict[str, Any]]:
    """
    Optional auth dependency — returns decoded token if present and valid,
    None if missing. Used for endpoints that work for both authed and anon users.
    """
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None
    return verify_firebase_token(credentials.credentials)


# ---------------------------------------------------------------------------
# Gemini Vision prompt
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Health check (public)
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "ocr_engine": "RapidOCR Ready",
        "gemini_api_configured": bool(DEFAULT_API_KEY),
        "firebase_persistence": "Available" if is_firebase_available() else "Offline / Local Mode",
        "supported_formats": list(SUPPORTED_EXTENSIONS)
    }


# ---------------------------------------------------------------------------
# User profile endpoints (protected)
# ---------------------------------------------------------------------------

class CreateProfileRequest(BaseModel):
    displayName: Optional[str] = None
    phoneNumber: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[Union[int, str]] = None


@app.post("/api/users/profile")
async def create_user_profile_endpoint(
    body: CreateProfileRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Creates or updates the Firestore profile for the authenticated user.
    uid and email come from the verified Firebase token — never the request body.
    """
    uid = current_user["uid"]
    email = current_user.get("email", "")
    display_name = body.displayName.strip() if body.displayName is not None else None

    if body.displayName is not None and not display_name:
        raise HTTPException(status_code=400, detail="displayName cannot be empty.")

    clean_phone = None
    if body.phoneNumber is not None:
        raw_phone = body.phoneNumber.strip()
        if raw_phone:
            clean_digits = re.sub(r"\D", "", raw_phone)
            if len(clean_digits) != 10:
                raise HTTPException(status_code=400, detail="Mobile number must be a valid 10-digit number.")
            clean_phone = clean_digits
        else:
            clean_phone = ""

    normalized_age = None
    if body.age is not None:
        str_age = str(body.age).strip()
        if str_age:
            try:
                num_age = int(str_age)
                if num_age < 1 or num_age > 120:
                    raise HTTPException(status_code=400, detail="Age must be between 1 and 120.")
                normalized_age = num_age
            except ValueError:
                raise HTTPException(status_code=400, detail="Age must be a valid number.")
        else:
            normalized_age = None

    ok = create_or_update_user_profile(
        uid=uid,
        email=email,
        display_name=display_name,
        phone_number=clean_phone,
        gender=body.gender.strip() if body.gender is not None else None,
        age=normalized_age,
    )
    if not ok:
        raise HTTPException(status_code=503, detail="Profile service temporarily unavailable.")

    profile = get_user_profile(uid)
    return profile or {
        "uid": uid,
        "email": email,
        "displayName": display_name or (email.split("@")[0] if email else "User"),
        "phoneNumber": clean_phone or "",
        "gender": body.gender or "Male",
        "age": normalized_age,
    }


@app.put("/api/users/profile")
async def update_user_profile_put(
    body: CreateProfileRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Updates profile attributes (name, phone, gender, age) for authenticated user."""
    return await create_user_profile_endpoint(body, current_user)


@app.patch("/api/users/profile")
async def update_user_profile_patch(
    body: CreateProfileRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Partially updates profile attributes for authenticated user."""
    return await create_user_profile_endpoint(body, current_user)


@app.get("/api/users/profile")
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns the Firestore profile for the authenticated user."""
    uid = current_user["uid"]

    # Try to get stored profile
    profile = get_user_profile(uid)
    if profile:
        return profile

    # Profile doesn't exist yet — auto-create from token claims without blanking attributes
    email = current_user.get("email", "")
    name = current_user.get("name") or (email.split("@")[0] if email else "User")
    ok = create_or_update_user_profile(uid=uid, email=email, display_name=name)
    if not ok:
        raise HTTPException(status_code=503, detail="Profile service temporarily unavailable.")
    return get_user_profile(uid) or {"uid": uid, "email": email, "displayName": name}



# ---------------------------------------------------------------------------
# Report upload (supports both authenticated and unauthenticated)
# ---------------------------------------------------------------------------

@app.post("/api/upload")
async def upload_report(
    file: UploadFile = File(...),
    x_gemini_api_key: Optional[str] = Header(None),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user),
):
    """
    Processes an uploaded CBC report.
    - Works for both authenticated and unauthenticated users.
    - If authenticated, saves the report to Firestore with ownerUid from the
      verified token (never from client-supplied data).
    - Existing OCR/Gemini analysis pipeline is unchanged.
    """
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
        chunk_size = 1024 * 1024  # 1 MB chunks
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

        # PATH 1: Gemini Multimodal Vision API (if API key available)
        if active_key:
            try:
                genai.configure(api_key=active_key)
                vision_model = genai.GenerativeModel("gemini-flash-latest")

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
                print(f"Gemini API attempt error: {gemini_err}. Falling back to RapidOCR.")

        # PATH 2: Local RapidOCR Engine (fallback)
        if not parameters:
            ocr_results = None
            if ext == ".pdf":
                try:
                    import pypdfium2 as pdfium
                    pdf = pdfium.PdfDocument(temp_path)
                    ocr_results = []
                    max_pages = min(len(pdf), 3)
                    for page_idx in range(max_pages):
                        page = pdf[page_idx]
                        pil_img = page.render(scale=2).to_pil()
                        page_path = f"{temp_path}_page{page_idx}.png"
                        pil_img.save(page_path, "PNG")
                        page_results, _ = ocr_engine(page_path)
                        if page_results:
                            ocr_results.extend(page_results)
                        if os.path.exists(page_path):
                            os.remove(page_path)
                except Exception as pdfium_err:
                    print(f"pypdfium2 conversion error: {pdfium_err}")

                if not ocr_results:
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
                "message": "Please ensure the image or PDF is clear, well-lit, and contains a standard CBC laboratory panel."
            }

        # Analyze patterns
        patterns = analyze_patterns_safely(parameters)

        # Standard doctor discussion questions
        questions = [
            "What potential clinical factors could explain any parameters sitting outside the reference interval?",
            "Given these Complete Blood Count results, would you suggest repeating the test in 48-72 hours to evaluate trends?",
            "Are there any specific dietary, hydration, or activity adjustments I should make while monitoring these numbers?",
            "What warning signs or symptoms should prompt me to seek immediate medical consultation?"
        ]

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
            "is_sample": False,
        }

        # Persist to Firestore if authenticated and Firebase is available
        saved_to_firebase = False
        if current_user and is_firebase_available():
            owner_uid = current_user["uid"]  # Always from verified token
            saved_to_firebase = save_report_for_user(
                report_id=report_id,
                owner_uid=owner_uid,
                report_data=final_data,
                original_file_name=filename,
            )
        elif is_firebase_available() and not current_user:
            # Unauthenticated upload — save without owner (legacy mode)
            saved_to_firebase = save_report_summary(report_id, final_data)

        final_data["saved_to_firebase"] = saved_to_firebase
        if current_user:
            final_data["reportId"] = report_id

        return final_data

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


# ---------------------------------------------------------------------------
# Report history endpoint (protected)
# ---------------------------------------------------------------------------

@app.get("/api/reports")
async def list_user_reports(
    limit: int = 50,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Returns the authenticated user's report history, ordered by creation time.
    The query is scoped exclusively to the authenticated UID from the token.
    """
    if not is_firebase_available():
        raise HTTPException(status_code=503, detail="Report history service temporarily unavailable.")

    uid = current_user["uid"]
    reports = get_user_reports(uid, limit=min(limit, 100))
    return {"reports": reports, "count": len(reports)}


# ---------------------------------------------------------------------------
# Single report retrieval (protected, ownership-enforced)
# ---------------------------------------------------------------------------

@app.get("/api/reports/{report_id}")
async def get_saved_report(
    report_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Retrieves a single report by ID.
    Returns HTTP 404 if the report doesn't exist OR doesn't belong to the
    authenticated user (to avoid revealing existence of other users' reports).
    """
    if not is_firebase_available():
        raise HTTPException(status_code=503, detail="Firebase persistence is not available.")

    uid = current_user["uid"]
    report = get_report_for_user(report_id, requesting_uid=uid)
    if not report:
        # Return 404 regardless of whether the report exists but belongs to another user
        raise HTTPException(status_code=404, detail="Report not found.")
    return report


# ---------------------------------------------------------------------------
# Delete report (protected, ownership-enforced)
# ---------------------------------------------------------------------------

@app.delete("/api/reports/{report_id}")
async def delete_report(
    report_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Deletes a report. Only the owner can delete their own reports.
    Returns 404 if not found or not owned.
    """
    if not is_firebase_available():
        raise HTTPException(status_code=503, detail="Firebase persistence is not available.")

    uid = current_user["uid"]
    deleted = delete_report_for_user(report_id, requesting_uid=uid)
    if not deleted:
        raise HTTPException(status_code=404, detail="Report not found.")
    return {"success": True, "deletedId": report_id}


# ---------------------------------------------------------------------------
# Ask guardrail (public — AI safety layer unchanged)
# ---------------------------------------------------------------------------

class AskRequest(BaseModel):
    question: str
    language: Optional[str] = "en"
    context: Optional[Dict[str, Any]] = None


@app.post("/api/ask")
async def ask_guardrail(
    request: AskRequest,
    x_gemini_api_key: Optional[str] = Header(None),
):
    """
    Intelligent chatbot & clinical knowledge engine endpoint for Complete Blood Count inquiries.
    Enforces non-diagnostic safety guardrails, emergency symptom triage,
    multimodal Gemini AI generation, and extensive deterministic clinical knowledge fallback.
    """
    active_key = x_gemini_api_key or DEFAULT_API_KEY
    return process_chat_query(
        question=request.question,
        language=request.language or "en",
        context=request.context,
        api_key=active_key,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
