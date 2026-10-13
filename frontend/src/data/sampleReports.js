/**
 * Reportly Synthetic Laboratory Demonstration Reports
 * ====================================================
 * All data in this file is strictly FICTIONAL / SYNTHETIC for educational and hackathon demonstration purposes.
 * Contains no real protected health information (PHI).
 *
 * Each sample includes:
 * - Dynamic summary counts matching parameter statuses
 * - Evidence trace metadata enabling the interactive "View Evidence" panel
 * - Responsible, non-diagnostic observations with explicit limitations
 * - Bilingual support (English & Hindi)
 */

export const SAMPLE_REPORTS = [
  {
    id: 'sample-kanav-typhoid',
    is_sample: true,
    sample_label: {
      en: "Synthetic Fictional Sample Report (Enteric Serology + Platelet Pattern)",
      hi: "काल्पनिक प्रदर्शन रिपोर्ट (टाइफाइड सीरोलॉजी एवं प्लेटलेट पैटर्न)"
    },
    title: {
      en: "Kanav Mathur — Complete Blood Count with Enteric Screen",
      hi: "कणव माथुर — सम्पूर्ण रक्त गणना एवं टाइफाइड जांच"
    },
    subtitle: {
      en: "Fictional Patient: 18M • Lab: Shiv Pathology, Degana • Synthetic Demo Panel",
      hi: "काल्पनिक मरीज: 18 पुरुष • लैब: शिव पैथोलॉजी, डेगाना • सिंथेटिक डेमो रिपोर्ट"
    },
    tag: {
      en: "Platelets (103) + Reactive Typhoid",
      hi: "प्लेटलेट्स (103) + टाइफाइड रिएक्टिव"
    },
    severity: "warning",
    summary: {
      en: "Reactive Typhoid serology screen accompanied by mildly reduced platelets (103,000/µL) and elevated granulocytes (75.5%). Hemoglobin is well-preserved at 14.0 g/dL.",
      hi: "टाइफाइड रिएक्टिव स्क्रीन के साथ प्लेटलेट्स में हल्की कमी (103,000/µL) और ग्रैनुलोसाइट्स (75.5%) में वृद्धि। हीमोग्लोबिन 14.0 g/dL सामान्य है।"
    },
    summary_counts: {
      total_parameters: 10,
      within_range_count: 6,
      low_count: 2,
      high_count: 2,
      needs_verification_count: 0
    },
    parameters: [
      {
        name: "Typhoid IgG IgM Serology",
        name_hi: "टाइफाइड एंटीबॉडी जांच (IgG/IgM)",
        value: "POSITIVE",
        unit: "Card Test",
        range: "Negative",
        range_min: null,
        range_max: null,
        status: "High",
        explanation: {
          en: "Qualitative antibody screen showing reactivity to Salmonella Typhi bacterial antigens.",
          hi: "यह टेस्ट साल्मोनेला टाइफी बैक्टीरिया के खिलाफ एंटीबॉडी प्रतिक्रिया दर्शाता है।"
        },
        evidence_trace: {
          source_text: "Typhoid IgG/IgM Rapid Card: POSITIVE (Reference: Negative)",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "Qualitative check: 'POSITIVE' indicates reactive screen",
          rule_reason: "Qualitative result matches reactive antibody trigger.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Platelet Count (PLT)",
        name_hi: "प्लेटलेट्स संख्या (PLT)",
        value: "103",
        unit: "10^3/µL",
        range: "150 - 450",
        range_min: 150,
        range_max: 450,
        status: "Low",
        explanation: {
          en: "Platelets are cell fragments that facilitate normal blood clotting. Your level is mildly lower than the 150 laboratory threshold.",
          hi: "प्लेटलेट्स रक्त का थक्का जमाने में मदद करते हैं। आपका मान 103 है, जो 150 की न्यूनतम सीमा से कम है।"
        },
        evidence_trace: {
          source_text: "Platelet Count (PLT)  103  10^3/uL  150 - 450",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "103.0 < 150.0 (Lower Limit)",
          rule_reason: "Extracted value 103 is below the reference lower limit of 150.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Granulocytes % (Gran%)",
        name_hi: "ग्रैनुलोसाइट्स % (Gran%)",
        value: "75.5",
        unit: "%",
        range: "40.0 - 70.0",
        range_min: 40.0,
        range_max: 70.0,
        status: "High",
        explanation: {
          en: "Granulocytes (primarily neutrophils) are frontline immune cells that mobilize during acute immune defense.",
          hi: "ग्रैनुलोसाइट्स संक्रमण से लड़ने वाली मुख्य श्वेत रक्त कोशिकाएं हैं। यह 75.5% है जो 70% की सामान्य सीमा से अधिक है।"
        },
        evidence_trace: {
          source_text: "Granulocytes % (Gran%)  75.5  %  40.0 - 70.0",
          ocr_confidence: 0.98,
          coordinates: null,
          comparison_math: "75.5 > 70.0 (Upper Limit)",
          rule_reason: "Extracted value 75.5 is above the reference upper limit of 70.0.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Mid Cells % (Mid%)",
        name_hi: "मध्यम कोशिकाएं % (Mid%)",
        value: "2.8",
        unit: "%",
        range: "3.0 - 9.0",
        range_min: 3.0,
        range_max: 9.0,
        status: "Low",
        explanation: {
          en: "Proportion of monocytes, eosinophils, and basophils. Slightly lower relative percentage as granulocytes occupy an increased share.",
          hi: "ग्रैनुलोसाइट्स का अनुपात बढ़ने से मिड कोशिकाओं का प्रतिशत थोड़ा कम (2.8%) दिखाई दे रहा है।"
        },
        evidence_trace: {
          source_text: "Mid Cells % (Mid%)  2.8  %  3.0 - 9.0",
          ocr_confidence: 0.97,
          coordinates: null,
          comparison_math: "2.8 < 3.0 (Lower Limit)",
          rule_reason: "Extracted value 2.8 is below the reference lower limit of 3.0.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Hemoglobin (HGB)",
        name_hi: "हीमोग्लोबिन (HGB)",
        value: "14.0",
        unit: "g/dL",
        range: "12.0 - 16.0",
        range_min: 12.0,
        range_max: 16.0,
        status: "Within Range",
        explanation: {
          en: "Oxygen-carrying protein in red blood cells. Comfortably within healthy boundaries.",
          hi: "शरीर में ऑक्सीजन संचरण क्षमता पूरी तरह सामान्य और स्वस्थ (14.0 g/dL) है।"
        },
        evidence_trace: {
          source_text: "Hemoglobin (HGB)  14.0  g/dL  12.0 - 16.0",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "12.0 <= 14.0 <= 16.0 (Within Range)",
          rule_reason: "Extracted value 14.0 is comfortably within reference limits 12.0 - 16.0.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Total Leucocyte Count (WBC)",
        name_hi: "कुल श्वेत रक्त कोशिकाएं (WBC)",
        value: "6.72",
        unit: "10^3/µL",
        range: "4.00 - 11.00",
        range_min: 4.0,
        range_max: 11.0,
        status: "Within Range",
        explanation: {
          en: "Total count of immune defense white blood cells is in the normal range.",
          hi: "कुल श्वेत रक्त कोशिकाएं सुरक्षित एवं सामान्य सीमा के मध्य में हैं।"
        },
        evidence_trace: {
          source_text: "Total Leucocyte Count (WBC)  6.72  10^3/uL  4.00 - 11.00",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "4.0 <= 6.72 <= 11.0 (Within Range)",
          rule_reason: "Extracted value 6.72 is within normal reference bounds.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "RBC Count",
        name_hi: "लाल रक्त कोशिकाएं (RBC)",
        value: "4.61",
        unit: "10^6/µL",
        range: "3.50 - 5.50",
        range_min: 3.5,
        range_max: 5.5,
        status: "Within Range",
        explanation: {
          en: "Red blood cell production is consistent and within expected reference bounds.",
          hi: "लाल रक्त कोशिकाओं का उत्पादन सामान्य और स्थिर है।"
        },
        evidence_trace: {
          source_text: "RBC Count  4.61  10^6/uL  3.50 - 5.50",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "3.50 <= 4.61 <= 5.50 (Within Range)",
          rule_reason: "Extracted value 4.61 is within reference boundaries.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "MCV (Mean Corpuscular Volume)",
        name_hi: "कोशिका आकार (MCV)",
        value: "88.0",
        unit: "fL",
        range: "82.0 - 100.0",
        range_min: 82.0,
        range_max: 100.0,
        status: "Within Range",
        explanation: {
          en: "Average size of red blood cells is balanced and typical.",
          hi: "लाल रक्त कोशिकाओं का औसत आकार सामान्य और संतुलित है।"
        },
        evidence_trace: {
          source_text: "MCV  88.0  fL  82.0 - 100.0",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "82.0 <= 88.0 <= 100.0 (Within Range)",
          rule_reason: "Extracted value 88.0 is within reference limits.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Plateletcrit (PCT)",
        name_hi: "प्लेटलेटक्रिट (PCT)",
        value: "0.180",
        unit: "%",
        range: "0.108 - 0.282",
        range_min: 0.108,
        range_max: 0.282,
        status: "Within Range",
        explanation: {
          en: "Total percentage volume occupied by platelets is within expected limits.",
          hi: "रक्त में प्लेटलेट्स द्वारा घेरा गया आयतन सामान्य सीमा में है।"
        },
        evidence_trace: {
          source_text: "Plateletcrit (PCT)  0.180  %  0.108 - 0.282",
          ocr_confidence: 0.98,
          coordinates: null,
          comparison_math: "0.108 <= 0.180 <= 0.282 (Within Range)",
          rule_reason: "Extracted value 0.180 is within reference boundaries.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Malaria Screening Card",
        name_hi: "मलेरिया स्क्रीनिंग कार्ड टेस्ट",
        value: "NEGATIVE",
        unit: "Card Test",
        range: "Negative",
        range_min: null,
        range_max: null,
        status: "Within Range",
        explanation: {
          en: "No plasmodium parasite antigen detected on the rapid screening test.",
          hi: "मलेरिया परजीवी एंटीजन के लिए जांच नकारात्मक (नेगेटिव) पाई गई।"
        },
        evidence_trace: {
          source_text: "Malaria by Card: NEGATIVE (Reference: Negative)",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "Qualitative check: 'NEGATIVE' matches non-reactive baseline",
          rule_reason: "Qualitative test matches expected negative reference.",
          needs_verification: false,
          unit_validated: true
        }
      }
    ],
    patterns: [
      {
        title: {
          en: "Observation: Platelet Reduction in Setting of Reactive Enteric Serology",
          hi: "अवलोकन: टाइफाइड सीरोलॉजी के साथ प्लेटलेट में कमी"
        },
        observation: {
          en: "Platelet count (103,000/µL) sits below the reference range alongside a reactive Typhoid antibody screen and elevated Granulocytes (75.5%).",
          hi: "टाइफाइड पॉजिटिव होने के साथ प्लेटलेट्स (103,000/µL) सामान्य से कम हैं और ग्रैनुलोसाइट्स (75.5%) बढ़े हुए हैं।"
        },
        supporting_evidence: [
          { name: "Platelet Count (PLT)", value: "103", unit: "10^3/µL", status: "Low" },
          { name: "Typhoid IgG IgM Serology", value: "POSITIVE", unit: "Card Test", status: "High" },
          { name: "Granulocytes %", value: "75.5", unit: "%", status: "High" }
        ],
        clinical_context: {
          en: "During acute systemic infections, immune activation and transient bone marrow suppression can temporarily reduce circulating platelets.",
          hi: "सक्रिय संक्रमण के दौरान प्रतिरक्षा प्रतिक्रिया से प्लेटलेट्स में अस्थायी गिरावट देखी जा सकती है।"
        },
        uncertainty_and_limitations: {
          en: "This observation does not constitute a disease diagnosis or treatment plan. Rapid antibody cards are screening tools that require medical history and physician evaluation.",
          hi: "यह अवलोकन कोई अंतिम निदान नहीं है। किसी भी निष्कर्ष के लिए डॉक्टर द्वारा शारीरिक जांच अनिवार्य है।"
        },
        suggested_questions: [
          {
            en: "Should we recheck my platelet count in 48 to 72 hours to evaluate the recovery trend?",
            hi: "क्या 48 से 72 घंटे बाद दोबारा प्लेटलेट्स टेस्ट कराना चाहिए ताकि प्रवृत्ति का पता चले?"
          },
          {
            en: "What specific symptoms (such as easy bruising or fever) warrant immediate hospital review?",
            hi: "किन गंभीर लक्षणों (जैसे रक्तस्राव या तेज बुखार) पर तुरंत अस्पताल जाना चाहिए?"
          },
          {
            en: "What hydration and dietary precautions should I follow while recovering?",
            hi: "स्वास्थ्य लाभ के दौरान पानी और खान-पान को लेकर क्या सावधानियां रखनी चाहिए?"
          }
        ]
      }
    ],
    questions: [
      {
        en: "Given the reactive Typhoid screen and platelet count of 103, what follow-up timeline do you recommend?",
        hi: "टाइफाइड रिएक्टिव स्क्रीन और 103 प्लेटलेट्स को देखते हुए आप आगे क्या सलाह देते हैं?"
      },
      {
        en: "Should we recheck my platelet count in 48 to 72 hours to ensure it is stabilizing?",
        hi: "क्या 48 से 72 घंटे बाद दोबारा प्लेटलेट्स टेस्ट कराकर देखना चाहिए?"
      },
      {
        en: "What hydration and nutrition guidelines should I follow during recovery?",
        hi: "ठीक होने के दौरान खान-पान और पानी के सेवन को लेकर क्या सावधानियां रखनी चाहिए?"
      },
      {
        en: "What warning signs (e.g. bleeding gums, unusual bruising, persistent vomiting) require urgent medical care?",
        hi: "किन गंभीर लक्षणों (जैसे मसूड़ों से खून आना या उल्टी) के दिखने पर तुरंत डॉक्टर को दिखाना चाहिए?"
      }
    ]
  },
  {
    id: 'sample-anemia',
    is_sample: true,
    sample_label: {
      en: "Synthetic Fictional Sample Report (Microcytic Erythroid Pattern)",
      hi: "काल्पनिक प्रदर्शन रिपोर्ट (माइक्रोसाइटिक एरिथ्रोइड पैटर्न)"
    },
    title: {
      en: "Shanti Devi — Routine CBC Panel",
      hi: "शांति देवी — नियमित सीबीसी प्रोफाइल"
    },
    subtitle: {
      en: "Fictional Patient: 58F • Lab: Pali Diagnostics • Synthetic Demo Panel",
      hi: "काल्पनिक मरीज: 58 महिला • लैब: पाली डायग्नोस्टिक्स • सिंथेटिक डेमो रिपोर्ट"
    },
    tag: {
      en: "Low Hemoglobin (10.2) + Low MCV",
      hi: "कम हीमोग्लोबिन (10.2) + कम MCV"
    },
    severity: "warning",
    summary: {
      en: "Lower hemoglobin (10.2 g/dL) accompanied by reduced red cell volume (MCV 74.2 fL) and cell hemoglobin (MCH 23.8 pg). White cells and platelets are normal.",
      hi: "कम हीमोग्लोबिन (10.2 g/dL) के साथ लाल रक्त कोशिकाओं का छोटा आकार (MCV 74.2 fL) और कम हीमोग्लोबिन (MCH 23.8 pg)। डब्ल्यूबीसी और प्लेटलेट्स सामान्य हैं।"
    },
    summary_counts: {
      total_parameters: 6,
      within_range_count: 2,
      low_count: 4,
      high_count: 0,
      needs_verification_count: 0
    },
    parameters: [
      {
        name: "Hemoglobin (Hb)",
        name_hi: "हीमोग्लोबिन (Hb)",
        value: "10.2",
        unit: "g/dL",
        range: "12.0 - 15.5",
        range_min: 12.0,
        range_max: 15.5,
        status: "Low",
        explanation: {
          en: "The oxygen-carrying protein in red blood cells. Value is below the 12.0 g/dL lower limit.",
          hi: "लाल रक्त कोशिकाओं में ऑक्सीजन ले जाने वाला प्रोटीन। यह 12.0 g/dL की सामान्य सीमा से कम है।"
        },
        evidence_trace: {
          source_text: "Hemoglobin (Hb)  10.2  g/dL  12.0 - 15.5",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "10.2 < 12.0 (Lower Limit)",
          rule_reason: "Value 10.2 is below the lower reference limit of 12.0.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "RBC Count",
        name_hi: "लाल रक्त कोशिकाएं (RBC)",
        value: "3.8",
        unit: "10^6/µL",
        range: "4.0 - 5.2",
        range_min: 4.0,
        range_max: 5.2,
        status: "Low",
        explanation: {
          en: "Circulating red blood cell count sits slightly below the expected threshold.",
          hi: "रक्त में लाल रक्त कोशिकाओं की कुल संख्या सामान्य सीमा (4.0) से थोड़ी कम है।"
        },
        evidence_trace: {
          source_text: "RBC Count  3.8  mil/uL  4.0 - 5.2",
          ocr_confidence: 0.98,
          coordinates: null,
          comparison_math: "3.8 < 4.0 (Lower Limit)",
          rule_reason: "Value 3.8 is below the lower reference limit of 4.0.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "MCV (Mean Corpuscular Volume)",
        name_hi: "कोशिका आकार (MCV)",
        value: "74.2",
        unit: "fL",
        range: "80.0 - 96.0",
        range_min: 80.0,
        range_max: 96.0,
        status: "Low",
        explanation: {
          en: "Measures average red blood cell size. A lower value indicates smaller-than-typical cells.",
          hi: "यह लाल रक्त कोशिकाओं के औसत आकार को दर्शाता है। 74.2 कम होने का मतलब है कि कोशिकाएं सामान्य से छोटी हैं।"
        },
        evidence_trace: {
          source_text: "MCV  74.2  fL  80.0 - 96.0",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "74.2 < 80.0 (Lower Limit)",
          rule_reason: "Value 74.2 is below the lower reference limit of 80.0.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "MCH (Mean Corpuscular Hemoglobin)",
        name_hi: "प्रति कोशिका हीमोग्लोबिन (MCH)",
        value: "23.8",
        unit: "pg",
        range: "27.0 - 33.0",
        range_min: 27.0,
        range_max: 33.0,
        status: "Low",
        explanation: {
          en: "Measures average amount of hemoglobin inside each red blood cell.",
          hi: "यह बताता है कि प्रत्येक लाल कोशिका के अंदर कितना हीमोग्लोबिन है। 23.8 सामान्य सीमा 27.0 से कम है।"
        },
        evidence_trace: {
          source_text: "MCH  23.8  pg  27.0 - 33.0",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "23.8 < 27.0 (Lower Limit)",
          rule_reason: "Value 23.8 is below the lower reference limit of 27.0.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Total Leucocyte Count (WBC)",
        name_hi: "श्वेत रक्त कोशिकाएं (WBC)",
        value: "6800",
        unit: "/cumm",
        range: "4000 - 11000",
        range_min: 4000,
        range_max: 11000,
        status: "Within Range",
        explanation: {
          en: "White blood cell count is comfortably situated within standard reference boundaries.",
          hi: "सफेद रक्त कोशिकाएं सुरक्षित एवं सामान्य सीमा में हैं।"
        },
        evidence_trace: {
          source_text: "Total Leucocyte Count (WBC)  6,800  /cumm  4,000 - 11,000",
          ocr_confidence: 0.98,
          coordinates: null,
          comparison_math: "4000 <= 6800 <= 11000 (Within Range)",
          rule_reason: "Value 6800 is within reference limits 4000 to 11000.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Platelet Count (PLT)",
        name_hi: "प्लेटलेट्स संख्या (PLT)",
        value: "245000",
        unit: "/µL",
        range: "150000 - 450000",
        range_min: 150000,
        range_max: 450000,
        status: "Within Range",
        explanation: {
          en: "Platelet count is well-preserved within standard reference limits.",
          hi: "प्लेटलेट्स की संख्या पूरी तरह सामान्य और सुरक्षित है।"
        },
        evidence_trace: {
          source_text: "Platelet Count  245,000  /uL  150,000 - 450,000",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "150000 <= 245000 <= 450000 (Within Range)",
          rule_reason: "Value 245000 is within normal reference bounds.",
          needs_verification: false,
          unit_validated: true
        }
      }
    ],
    patterns: [
      {
        title: {
          en: "Observation: Lower Hemoglobin with Reduced Red Cell Volume (MCV)",
          hi: "अवलोकन: कम हीमोग्लोबिन के साथ छोटा लाल कोशिका आकार (MCV)"
        },
        observation: {
          en: "Hemoglobin (10.2 g/dL) is reduced alongside smaller average red cell volume (MCV 74.2 fL) and lower cellular pigment (MCH 23.8 pg).",
          hi: "कम हीमोग्लोबिन (10.2) के साथ लाल रक्त कोशिकाओं का आकार (MCV 74.2) और वर्णक (MCH 23.8) दोनों कम पाए गए हैं।"
        },
        supporting_evidence: [
          { name: "Hemoglobin (Hb)", value: "10.2", unit: "g/dL", status: "Low" },
          { name: "MCV", value: "74.2", unit: "fL", status: "Low" },
          { name: "MCH", value: "23.8", unit: "pg", status: "Low" }
        ],
        clinical_context: {
          en: "When hemoglobin synthesis is restricted, developing red blood cells typically mature with reduced physical volume.",
          hi: "हीमोग्लोबिन के निर्माण में कमी होने पर लाल रक्त कोशिकाएं सामान्य से छोटी बनती हैं।"
        },
        uncertainty_and_limitations: {
          en: "A standard CBC report does not measure ferritin or iron stores directly. This finding warrants discussion with a physician to explore potential causes.",
          hi: "यह सीबीसी रिपोर्ट शरीर में आयरन या फेरिटिन के स्तर को सीधे नहीं मापती। इसके कारणों को समझने के लिए डॉक्टर से परामर्श जरूरी है।"
        },
        suggested_questions: [
          {
            en: "Could this combination be related to nutritional factors such as dietary iron, or another cause?",
            hi: "क्या यह कम हीमोग्लोबिन और छोटा आकार आयरन या पोषण की कमी से संबंधित हो सकता है?"
          },
          {
            en: "Would an iron profile or serum ferritin test be appropriate before considering any adjustments?",
            hi: "क्या कोई सप्लीमेंट लेने से पहले सीरम फेरिटिन या आयरन प्रोफाइल टेस्ट कराना ठीक रहेगा?"
          },
          {
            en: "Are there any physical symptoms (such as fatigue or cold sensitivity) that we should review together?",
            hi: "क्या थकान या कमजोरी जैसे लक्षणों को लेकर डॉक्टर से चर्चा करनी चाहिए?"
          }
        ]
      }
    ],
    questions: [
      {
        en: "Could this lower hemoglobin and smaller red cell volume be related to iron levels?",
        hi: "क्या यह कम हीमोग्लोबिन और छोटा एमसीवी आयरन की कमी के कारण हो सकता है?"
      },
      {
        en: "Do you recommend a serum ferritin or iron profile test before making any decisions?",
        hi: "क्या किसी सप्लीमेंट से पहले सीरम फेरिटिन या आयरन प्रोफाइल टेस्ट कराना ठीक रहेगा?"
      },
      {
        en: "What balanced nutritional habits would best support healthy red blood cell production?",
        hi: "स्वस्थ रक्त कोशिकाओं के निर्माण में मदद के लिए किन संतुलित आहार आदतों पर ध्यान देना चाहिए?"
      }
    ]
  },
  {
    id: 'sample-infection',
    is_sample: true,
    sample_label: {
      en: "Synthetic Fictional Sample Report (Leukocyte Elevation Pattern)",
      hi: "काल्पनिक प्रदर्शन रिपोर्ट (श्वेत रक्त कोशिका वृद्धि पैटर्न)"
    },
    title: {
      en: "Ramesh Kumar — Acute Medical Workup",
      hi: "रमेश कुमार — तीव्र चिकित्सीय जांच"
    },
    subtitle: {
      en: "Fictional Patient: 34M • Lab: City Metro Lab • Synthetic Demo Panel",
      hi: "काल्पनिक मरीज: 34 पुरुष • लैब: सिटी मेट्रो लैब • सिंथेटिक डेमो रिपोर्ट"
    },
    tag: {
      en: "Elevated WBC (16,400) + High Neutrophils",
      hi: "बढ़ी हुई WBC (16,400) + न्यूट्रोफिलिया"
    },
    severity: "warning",
    summary: {
      en: "Elevated total white blood cell count (16,400/cumm) with an increased proportion of neutrophils (82%). Hemoglobin and platelets remain normal.",
      hi: "श्वेत रक्त कोशिकाओं की संख्या (16,400/cumm) और न्यूट्रोफिल्स (82%) बढ़े हुए हैं। हीमोग्लोबिन और प्लेटलेट्स सामान्य हैं।"
    },
    summary_counts: {
      total_parameters: 5,
      within_range_count: 2,
      low_count: 1,
      high_count: 2,
      needs_verification_count: 0
    },
    parameters: [
      {
        name: "Total Leucocyte Count (WBC)",
        name_hi: "कुल श्वेत रक्त कोशिकाएं (WBC)",
        value: "16400",
        unit: "/cumm",
        range: "4000 - 11000",
        range_min: 4000,
        range_max: 11000,
        status: "High",
        explanation: {
          en: "White blood cells defend against infections. Value is elevated above the 11,000 reference ceiling.",
          hi: "सफेद रक्त कोशिकाएं शरीर की प्रतिरक्षा प्रणाली हैं। यह 11,000 की सामान्य सीमा से अधिक है।"
        },
        evidence_trace: {
          source_text: "Total Leucocyte Count (WBC)  16,400  /cumm  4,000 - 11,000",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "16400 > 11000 (Upper Limit)",
          rule_reason: "Value 16400 is above the reference upper limit of 11000.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Neutrophils Percentage",
        name_hi: "न्यूट्रोफिल्स प्रतिशत",
        value: "82",
        unit: "%",
        range: "40 - 75",
        range_min: 40,
        range_max: 75,
        status: "High",
        explanation: {
          en: "Frontline bacterial defense cells. Elevated proportion reflects an active immune response.",
          hi: "संक्रमण से लड़ने वाली प्राथमिक कोशिकाएं। 82% मान 75% की ऊपरी सीमा से अधिक है।"
        },
        evidence_trace: {
          source_text: "Neutrophils %  82  %  40 - 75",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "82 > 75 (Upper Limit)",
          rule_reason: "Value 82 is above the reference upper limit of 75.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Lymphocytes Percentage",
        name_hi: "लिम्फोसाइट्स प्रतिशत",
        value: "12",
        unit: "%",
        range: "20 - 45",
        range_min: 20,
        range_max: 45,
        status: "Low",
        explanation: {
          en: "Relative percentage appears lower because neutrophils represent an increased fraction of total cells.",
          hi: "न्यूट्रोफिल्स का अनुपात बढ़ने से लिम्फोसाइट्स का तुलनात्मक प्रतिशत कम (12%) दिखाई दे रहा है।"
        },
        evidence_trace: {
          source_text: "Lymphocytes %  12  %  20 - 45",
          ocr_confidence: 0.98,
          coordinates: null,
          comparison_math: "12 < 20 (Lower Limit)",
          rule_reason: "Value 12 is below the reference lower limit of 20.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Hemoglobin (Hb)",
        name_hi: "हीमोग्लोबिन (Hb)",
        value: "14.6",
        unit: "g/dL",
        range: "13.0 - 17.0",
        range_min: 13.0,
        range_max: 17.0,
        status: "Within Range",
        explanation: {
          en: "Hemoglobin is safely in the healthy reference range.",
          hi: "हीमोग्लोबिन बिल्कुल सामान्य और स्वस्थ सीमा में है।"
        },
        evidence_trace: {
          source_text: "Hemoglobin (Hb)  14.6  g/dL  13.0 - 17.0",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "13.0 <= 14.6 <= 17.0 (Within Range)",
          rule_reason: "Value 14.6 is within reference boundaries.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Platelet Count",
        name_hi: "प्लेटलेट्स संख्या",
        value: "320000",
        unit: "/µL",
        range: "150000 - 450000",
        range_min: 150000,
        range_max: 450000,
        status: "Within Range",
        explanation: {
          en: "Platelets are well-preserved, indicating normal clotting potential.",
          hi: "प्लेटलेट्स सुरक्षित एवं सामान्य सीमा में हैं।"
        },
        evidence_trace: {
          source_text: "Platelet Count  320,000  /uL  150,000 - 450,000",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "150000 <= 320000 <= 450000 (Within Range)",
          rule_reason: "Value 320000 is within reference boundaries.",
          needs_verification: false,
          unit_validated: true
        }
      }
    ],
    patterns: [
      {
        title: {
          en: "Observation: Elevated Leukocytes / Neutrophil Mobilization",
          hi: "अवलोकन: श्वेत रक्त कोशिकाओं एवं न्यूट्रोफिल्स में वृद्धि"
        },
        observation: {
          en: "Total white blood cells (16,400) and neutrophils (82%) are elevated above standard laboratory thresholds.",
          hi: "श्वेत रक्त कोशिकाएं (16,400) और न्यूट्रोफिल्स (82%) दोनों सामान्य संदर्भ सीमा से ऊपर हैं।"
        },
        supporting_evidence: [
          { name: "Total Leucocyte Count (WBC)", value: "16400", unit: "/cumm", status: "High" },
          { name: "Neutrophils Percentage", value: "82", unit: "%", status: "High" }
        ],
        clinical_context: {
          en: "Elevated leukocytes and neutrophils reflect an active immune response commonly seen during acute bacterial exposure, localized inflammation, or physiological stress.",
          hi: "यह शरीर में सक्रिय प्रतिरक्षा प्रतिक्रिया या किसी संक्रमण के खिलाफ रक्षात्मक तैयारी को दर्शाता है।"
        },
        uncertainty_and_limitations: {
          en: "A complete blood count alone cannot localize an infection or determine its exact clinical cause. Physical examination and clinical assessment are necessary.",
          hi: "यह टेस्ट अकेले किसी संक्रमण के स्रोत की पहचान नहीं कर सकता। चिकित्सक द्वारा शारीरिक जांच आवश्यक है।"
        },
        suggested_questions: [
          {
            en: "What clinical symptoms (such as fever, cough, or localized pain) best explain this immune response?",
            hi: "किन शारीरिक लक्षणों (जैसे बुखार या खांसी) के संदर्भ में इन आंकड़ों को देखा जाना चाहिए?"
          },
          {
            en: "Would an inflammatory marker test (such as CRP or ESR) be helpful to track the recovery timeline?",
            hi: "क्या स्वास्थ्य की निगरानी के लिए CRP या ESR टेस्ट कराना उपयोगी रहेगा?"
          }
        ]
      }
    ],
    questions: [
      {
        en: "What clinical factors or symptoms best explain this elevated white blood cell count?",
        hi: "किन संभावित कारणों या लक्षणों से यह बढ़ा हुआ WBC संबंधित हो सकता है?"
      },
      {
        en: "Would an inflammatory marker test like CRP or ESR be helpful to monitor this?",
        hi: "क्या स्वास्थ्य की निगरानी के लिए CRP या ESR टेस्ट कराना फायदेमंद रहेगा?"
      },
      {
        en: "What specific warning signs would necessitate an immediate clinical follow-up visit?",
        hi: "किन लक्षणों के दिखने पर तुरंत डॉक्टर को दोबारा दिखाना चाहिए?"
      }
    ]
  },
  {
    id: 'sample-normal',
    is_sample: true,
    sample_label: {
      en: "Synthetic Fictional Sample Report (Balanced Normal Baseline)",
      hi: "काल्पनिक प्रदर्शन रिपोर्ट (संतुलित सामान्य आधारभूत रिपोर्ट)"
    },
    title: {
      en: "Anita Sharma — Routine Annual Health Check",
      hi: "अनीता शर्मा — वार्षिक नियमित स्वास्थ्य जांच"
    },
    subtitle: {
      en: "Fictional Patient: 29F • Lab: Apex Health • Synthetic Demo Panel",
      hi: "काल्पनिक मरीज: 29 महिला • लैब: एपेक्स हेल्थ • सिंथेटिक डेमो रिपोर्ट"
    },
    tag: {
      en: "All Parameters in Range",
      hi: "सभी पैरामीटर सामान्य"
    },
    severity: "normal",
    summary: {
      en: "All evaluated red cell, white cell, and platelet parameters sit comfortably within standard laboratory reference ranges.",
      hi: "सभी लाल रक्त कोशिकाएं, श्वेत रक्त कोशिकाएं और प्लेटलेट्स सामान्य संदर्भ सीमा में हैं।"
    },
    summary_counts: {
      total_parameters: 4,
      within_range_count: 4,
      low_count: 0,
      high_count: 0,
      needs_verification_count: 0
    },
    parameters: [
      {
        name: "Hemoglobin (Hb)",
        name_hi: "हीमोग्लोबिन (Hb)",
        value: "13.4",
        unit: "g/dL",
        range: "12.0 - 15.5",
        range_min: 12.0,
        range_max: 15.5,
        status: "Within Range",
        explanation: {
          en: "Oxygen-carrying capacity is robust and completely within healthy range.",
          hi: "ऑक्सीजन ले जाने की क्षमता पूरी तरह सामान्य और संतुलित (13.4 g/dL) है।"
        },
        evidence_trace: {
          source_text: "Hemoglobin (Hb)  13.4  g/dL  12.0 - 15.5",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "12.0 <= 13.4 <= 15.5 (Within Range)",
          rule_reason: "Value 13.4 is within reference boundaries.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Total Leucocyte Count (WBC)",
        name_hi: "श्वेत रक्त कोशिकाएं (WBC)",
        value: "7200",
        unit: "/cumm",
        range: "4000 - 11000",
        range_min: 4000,
        range_max: 11000,
        status: "Within Range",
        explanation: {
          en: "Healthy baseline immune cell count with no indications of acute elevation.",
          hi: "श्वेत रक्त कोशिकाएं सामान्य और संतुलित सीमा में हैं।"
        },
        evidence_trace: {
          source_text: "Total Leucocyte Count (WBC)  7,200  /cumm  4,000 - 11,000",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "4000 <= 7200 <= 11000 (Within Range)",
          rule_reason: "Value 7200 is within normal reference bounds.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "MCV",
        name_hi: "कोशिका आकार (MCV)",
        value: "88.5",
        unit: "fL",
        range: "80.0 - 96.0",
        range_min: 80.0,
        range_max: 96.0,
        status: "Within Range",
        explanation: {
          en: "Red blood cell dimensions are standard and healthy.",
          hi: "लाल रक्त कोशिकाओं का आकार बिल्कुल सामान्य है।"
        },
        evidence_trace: {
          source_text: "MCV  88.5  fL  80.0 - 96.0",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "80.0 <= 88.5 <= 96.0 (Within Range)",
          rule_reason: "Value 88.5 is within reference boundaries.",
          needs_verification: false,
          unit_validated: true
        }
      },
      {
        name: "Platelet Count",
        name_hi: "प्लेटलेट्स संख्या",
        value: "280000",
        unit: "/µL",
        range: "150000 - 450000",
        range_min: 150000,
        range_max: 450000,
        status: "Within Range",
        explanation: {
          en: "Clotting factors and cell counts are robust and normal.",
          hi: "रक्त का थक्का जमाने की क्षमता पूरी तरह मजबूत और सामान्य है।"
        },
        evidence_trace: {
          source_text: "Platelet Count  280,000  /uL  150,000 - 450,000",
          ocr_confidence: 0.99,
          coordinates: null,
          comparison_math: "150000 <= 280000 <= 450000 (Within Range)",
          rule_reason: "Value 280000 is within normal reference bounds.",
          needs_verification: false,
          unit_validated: true
        }
      }
    ],
    patterns: [
      {
        title: {
          en: "Observation: Core CBC Lineages Within Reference Intervals",
          hi: "अवलोकन: सभी प्रमुख सीबीसी पैरामीटर सामान्य सीमा में"
        },
        observation: {
          en: "Evaluated red cell, white cell, and platelet parameters fall within their respective laboratory reference intervals.",
          hi: "लाल कोशिकाओं, सफेद कोशिकाओं और प्लेटलेट्स के सभी मापदंड सुरक्षित सीमा में हैं।"
        },
        supporting_evidence: [
          { name: "Hemoglobin (Hb)", value: "13.4", unit: "g/dL", status: "Within Range" },
          { name: "Total Leucocyte Count (WBC)", value: "7200", unit: "/cumm", status: "Within Range" },
          { name: "Platelet Count", value: "280000", unit: "/µL", status: "Within Range" }
        ],
        clinical_context: {
          en: "Oxygen carriage, immune surveillance, and platelet counts align with standard healthy baseline values.",
          hi: "ऑक्सीजन संचरण, रोग प्रतिरोध और रक्त थक्का जमने के सभी बायोमार्कर संतुलित हैं।"
        },
        uncertainty_and_limitations: {
          en: "Normal laboratory values do not rule out all medical conditions. Clinical symptoms and lifestyle health remain primary.",
          hi: "सामान्य लैब रिपोर्ट सभी स्वास्थ्य समस्याओं को खारिज नहीं करती। व्यक्तिगत शारीरिक स्थिति हमेशा महत्वपूर्ण है।"
        },
        suggested_questions: [
          {
            en: "Given these balanced counts, what preventive screening timeline do you suggest for routine wellness?",
            hi: "इन सामान्य परिणामों को देखते हुए आप कितने अंतराल पर नियमित जांच कराने की सलाह देते हैं?"
          }
        ]
      }
    ],
    questions: [
      {
        en: "Given these normal counts, how often do you suggest repeating routine preventive blood work?",
        hi: "इन सामान्य परिणामों को देखते हुए आप कितने अंतराल पर नियमित ब्लड टेस्ट की सलाह देते हैं?"
      },
      {
        en: "Are there any specific lifestyle or nutritional habits that will help keep these markers optimal?",
        hi: "इन स्वस्थ स्तरों को बनाए रखने के लिए किन दैनिक आदतों या आहार पर ध्यान देना चाहिए?"
      }
    ]
  }
];
