"""
Reportly Robust CBC OCR Extraction Engine
==========================================
Advanced, deterministic extraction pipeline for Complete Blood Count (CBC) laboratory reports.
Associates test names with exact test results, units, and laboratory-printed reference ranges.
Preserves original OCR line text and coordinate bounding boxes.
"""

import re
from typing import List, Dict, Any, Optional, Tuple
from classifier import classify_status, normalize_unit

# Standard CBC parameter definitions, aliases, and normal educational descriptions
CBC_DEFINITIONS = [
    {
        "key": "WBC",
        "aliases": [r"\bWBC\b", r"\bTOTAL LEUCOCYTE\b", r"\bTOTAL LEUKOCYTE\b", r"\bTLC\b", r"\bWHITE BLOOD CELLS?\b", r"\bWHITE BLOOD COUNT\b"],
        "canonical_name": "Total Leucocyte Count (WBC)",
        "canonical_unit": "10^3/µL",
        "explanation": "White blood cells defend the body against infections and inflammation."
    },
    {
        "key": "NEUTRO",
        "aliases": [r"\bNEUTROPHILS?\b", r"\bNEUT\b", r"\bGRANULOCYTES?\b", r"\bGRAN%?\b", r"\bNEUT%?\b"],
        "canonical_name": "Neutrophils / Granulocytes %",
        "canonical_unit": "%",
        "explanation": "Frontline white blood cells dispatched rapidly to combat bacterial illness and acute inflammation."
    },
    {
        "key": "LYMPH",
        "aliases": [r"\bLYMPHOCYTES?\b", r"\bLYMPH%?\b", r"\bLYM%?\b", r"\bLYM\b"],
        "canonical_name": "Lymphocytes %",
        "canonical_unit": "%",
        "explanation": "Specialized immune cells that provide targeted viral defense and produce antibodies."
    },
    {
        "key": "MONO",
        "aliases": [r"\bMONOCYTES?\b", r"\bMONO%?\b", r"\bMID CELLS?\b", r"\bMID%?\b", r"\bMONO\b"],
        "canonical_name": "Monocytes / Mid Cells %",
        "canonical_unit": "%",
        "explanation": "Intermediate immune cells that clear cellular debris and support long-term defense."
    },
    {
        "key": "EOS",
        "aliases": [r"\bEOSINOPHILS?\b", r"\bEOS%?\b", r"\bEOS\b"],
        "canonical_name": "Eosinophils %",
        "canonical_unit": "%",
        "explanation": "Immune cells involved in combating parasitic infections and regulating allergic responses."
    },
    {
        "key": "BASO",
        "aliases": [r"\bBASOPHILS?\b", r"\bBASO%?\b", r"\bBASO\b"],
        "canonical_name": "Basophils %",
        "canonical_unit": "%",
        "explanation": "White blood cells involved in inflammatory and histamine responses."
    },
    {
        "key": "RBC",
        "aliases": [r"\bRBC\b", r"\bRED BLOOD CELLS?\b", r"\bTOTAL RBC\b", r"\bERYTHROCYTES?\b"],
        "canonical_name": "Red Blood Cell Count (RBC)",
        "canonical_unit": "10^6/µL",
        "explanation": "Specialized disc-shaped cells that transport oxygen from your lungs to tissues."
    },
    {
        "key": "HGB",
        "aliases": [r"\bHEMOGLOBIN\b", r"\bHAEMOGLOBIN\b", r"\bHGB\b", r"\bHB\b"],
        "canonical_name": "Hemoglobin (HGB)",
        "canonical_unit": "g/dL",
        "explanation": "The iron-rich protein in red blood cells that binds oxygen for cellular delivery."
    },
    {
        "key": "HCT",
        "aliases": [r"\bHEMATOCRIT\b", r"\bHAEMATOCRIT\b", r"\bHCT\b", r"\bPCV\b", r"\bPACKED CELL VOLUME\b"],
        "canonical_name": "Hematocrit / PCV (HCT)",
        "canonical_unit": "%",
        "explanation": "The percentage of whole blood volume occupied by red blood cells."
    },
    {
        "key": "MCV",
        "aliases": [r"\bMCV\b", r"\bMEAN CORPUSCULAR VOLUME\b"],
        "canonical_name": "Mean Corpuscular Volume (MCV)",
        "canonical_unit": "fL",
        "explanation": "The average physical size or volume of individual red blood cells."
    },
    {
        "key": "MCH",
        "aliases": [r"\bMCH\b", r"\bMEAN CORPUSCULAR HEMOGLOBIN\b"],
        "canonical_name": "Mean Corpuscular Hemoglobin (MCH)",
        "canonical_unit": "pg",
        "explanation": "The average mass of hemoglobin contained inside each individual red cell."
    },
    {
        "key": "MCHC",
        "aliases": [r"\bMCHC\b", r"\bMEAN CORPUSCULAR HEMOGLOBIN CONC\b"],
        "canonical_name": "MCHC",
        "canonical_unit": "g/dL",
        "explanation": "The concentration of hemoglobin relative to packed red blood cell volume."
    },
    {
        "key": "RDW",
        "aliases": [r"\bRDW\b", r"\bRDW-CV\b", r"\bRDW-SD\b", r"\bRED CELL DISTRIBUTION WIDTH\b"],
        "canonical_name": "Red Cell Distribution Width (RDW)",
        "canonical_unit": "%",
        "explanation": "A measurement of variation in red blood cell volume and size (anisocytosis)."
    },
    {
        "key": "PLT",
        "aliases": [r"\bPLATELET COUNT\b", r"\bPLATELETS?\b", r"\bPLT\b", r"\bTHROMBOCYTES?\b"],
        "canonical_name": "Platelet Count (PLT)",
        "canonical_unit": "10^3/µL",
        "explanation": "Cell fragments vital for blood clot formation and vascular wound sealing."
    },
    {
        "key": "MPV",
        "aliases": [r"\bMPV\b", r"\bMEAN PLATELET VOLUME\b"],
        "canonical_name": "Mean Platelet Volume (MPV)",
        "canonical_unit": "fL",
        "explanation": "The average physical size of circulating platelets in the bloodstream."
    },
    {
        "key": "PCT",
        "aliases": [r"\bPCT\b", r"\bPLATELETCRIT\b"],
        "canonical_name": "Plateletcrit (PCT)",
        "canonical_unit": "%",
        "explanation": "The total volume percentage occupied by platelets in blood volume."
    },
    {
        "key": "TYPHOID",
        "aliases": [r"\bTYPHOID\b", r"\bSALMONELLA TYPHI\b", r"\bWIDAL\b", r"\bTYPHIDOT\b"],
        "canonical_name": "Typhoid Serology",
        "canonical_unit": "Card Test",
        "explanation": "Serological evaluation for antibodies reactive to Salmonella Typhi bacteria."
    },
    {
        "key": "MALARIA",
        "aliases": [r"\bMALARIA\b", r"\bPLASMODIUM\b", r"\bMALARIAL PARASITE\b"],
        "canonical_name": "Malaria Screen",
        "canonical_unit": "Card Test",
        "explanation": "Screening for plasmodium malaria parasites in whole blood."
    }
]


def extract_unit_from_text(text: str) -> Optional[str]:
    """Extracts known medical unit if present in text line."""
    units_regex = r"(10\^[36]/[µu]L|thous/mcl|mil/[µu]L|cells/cumm|/cumm|/mm3|g/dL|gm/dL|g/L|fL|pg|%|Card Test|Rapid Test)"
    m = re.search(units_regex, text, re.IGNORECASE)
    if m:
        return normalize_unit(m.group(0))
    return None


def extract_range_from_text(text: str) -> Tuple[Optional[float], Optional[float], Optional[str]]:
    """
    Finds printed reference range interval like '12.0 - 16.0', '150 - 450', or 'Negative'.
    """
    # 1. Qualitative range
    if re.search(r"\b(Negative|Non-Reactive|Nil)\b", text, re.IGNORECASE):
        return None, None, "Negative"

    # 2. Interval pattern e.g. 12.0 - 16.0 or 12.0 to 16.0
    interval_match = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)",
        text.replace(",", "")
    )
    if interval_match:
        try:
            rmin = float(interval_match.group(1))
            rmax = float(interval_match.group(2))
            if rmin <= rmax:
                return rmin, rmax, f"{rmin} - {rmax}"
        except ValueError:
            pass

    return None, None, None


def parse_ocr_blocks(ocr_results: List[Any]) -> Dict[str, Any]:
    """
    Parses OCR blocks returned by RapidOCR:
    Each item in ocr_results is: [coordinates_box, text, confidence]
    Returns structured parameters with evidence tracing.
    """
    if not ocr_results:
        return {"parameters": [], "metadata": {}}

    lines_with_boxes = []
    full_text_lines = []

    for item in ocr_results:
        box = item[0] if len(item) > 0 else None
        text = str(item[1]).strip() if len(item) > 1 else ""
        confidence = float(item[2]) if len(item) > 2 else 1.0
        if text:
            lines_with_boxes.append({"text": text, "box": box, "conf": confidence})
            full_text_lines.append(text)

    extracted_params = []
    seen_keys = set()

    for defn in CBC_DEFINITIONS:
        key = defn["key"]
        if key in seen_keys:
            continue

        for idx, line_item in enumerate(lines_with_boxes):
            line_text = line_item["text"]

            # Check if any alias matches this line
            alias_matched = False
            for alias in defn["aliases"]:
                if re.search(alias, line_text, re.IGNORECASE):
                    # Guard: avoid matching MCH when token is MCHC
                    if key == "MCH" and re.search(r"\bMCHC\b", line_text, re.IGNORECASE):
                        continue
                    # Guard: avoid matching Hb when token is HbA1c
                    if key == "HGB" and re.search(r"\bHBA1C\b", line_text, re.IGNORECASE):
                        continue
                    alias_matched = True
                    break

            if not alias_matched:
                continue

            # We found a matching line! Build search window (current line + next 2 lines if needed)
            combined_window = line_text
            combined_boxes = [line_item["box"]] if line_item["box"] else []
            min_conf = line_item["conf"]

            lookahead_limit = min(idx + 3, len(lines_with_boxes))
            for next_idx in range(idx + 1, lookahead_limit):
                next_item = lines_with_boxes[next_idx]
                # If next line starts another distinct test name, don't combine
                if any(re.search(other["aliases"][0], next_item["text"], re.IGNORECASE) 
                       for other in CBC_DEFINITIONS if other["key"] != key):
                    break
                combined_window += " " + next_item["text"]
                if next_item["box"]:
                    combined_boxes.append(next_item["box"])
                min_conf = min(min_conf, next_item["conf"])

            # 1. Parse Range from combined window
            rmin, rmax, rstring = extract_range_from_text(combined_window)

            # 2. Parse Qualitative Result
            val = None
            if key in ["TYPHOID", "MALARIA"]:
                if re.search(r"\b(POS|POSITIVE|REACTIVE|DETECTED)\b", combined_window, re.IGNORECASE):
                    val = "POSITIVE"
                elif re.search(r"\b(NEG|NEGATIVE|NON-REACTIVE|NOT DETECTED)\b", combined_window, re.IGNORECASE):
                    val = "NEGATIVE"
            else:
                # 3. Parse Quantitative Result:
                # Remove line index if present (e.g., '1.', '2.')
                cleaned_window = re.sub(r"^\s*\d+[\.\)]\s*", "", combined_window)
                
                # If range was found e.g. '12.0 - 16.0', mask it temporarily to avoid picking range numbers as value!
                masked_window = cleaned_window
                if rstring and (rmin is not None and rmax is not None):
                    # Replace the exact range interval with spaces
                    masked_window = re.sub(r"(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)", " ", masked_window)

                # Numbers in the remaining text
                numbers = re.findall(r"\b\d+(?:[\.,]\d+)?\b", masked_window)
                if numbers:
                    val = numbers[0].replace(",", "")
                elif not numbers and (rmin is not None or rmax is not None):
                    # If all numbers were masked by range, look if there was a leading result number
                    raw_nums = re.findall(r"\b\d+(?:[\.,]\d+)?\b", cleaned_window)
                    if len(raw_nums) >= 3:
                        val = raw_nums[0].replace(",", "")

            if val is not None:
                # Extract or fallback unit
                extracted_unit = extract_unit_from_text(combined_window) or defn["canonical_unit"]
                
                # Classify deterministically
                classification = classify_status(
                    value_raw=val,
                    range_min=rmin,
                    range_max=rmax,
                    unit=extracted_unit,
                    test_name=defn["canonical_name"],
                    range_string=rstring
                )

                param_entry = {
                    "name": defn["canonical_name"],
                    "value": str(val),
                    "unit": extracted_unit,
                    "range": rstring or (f"{rmin} - {rmax}" if (rmin is not None and rmax is not None) else "Not Specified"),
                    "range_min": rmin,
                    "range_max": rmax,
                    "status": classification["status"],
                    "status_code": classification["status_code"],
                    "explanation": defn["explanation"],
                    "evidence_trace": {
                        "source_text": combined_window.strip(),
                        "ocr_confidence": round(min_conf, 3),
                        "coordinates": combined_boxes[0] if combined_boxes else None,
                        "comparison_math": classification["comparison_math"],
                        "rule_reason": classification["reason"],
                        "needs_verification": classification["needs_verification"],
                        "unit_validated": classification["unit_validated"]
                    }
                }

                extracted_params.append(param_entry)
                seen_keys.add(key)
                break

    return {
        "parameters": extracted_params,
        "full_text": "\n".join(full_text_lines)
    }
