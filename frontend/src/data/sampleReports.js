export const SAMPLE_REPORTS = [
  {
    id: 'sample-kanav-typhoid',
    title: {
      en: "Kanav Mathur (Typhoid & Thrombocytopenia Panel)",
      hi: "कणव माथुर (टाइफाइड एवं प्लेटलेट्स रिपोर्ट)"
    },
    subtitle: {
      en: "Patient: Kanav Mathur, 18M • Lab: Shiv X-Ray & Lab, Degana (Nagaur, Raj.) • Date: 15-03-2025",
      hi: "मरीज़: कणव माथुर, 18 पुरुष • लैब: शिव एक्स-रे एण्ड लैब, डेगाना (नागौर, राज.) • दिनांक: 15-03-2025"
    },
    tag: {
      en: "Typhoid + Low Platelets (103)",
      hi: "टाइफाइड + कम प्लेटलेट्स (103)"
    },
    severity: "warning",
    summary: {
      en: "Positive Typhoid serology with mild thrombocytopenia (Platelets 103,000) and elevated Granulocytes (75.5%). Normal hemoglobin (14.0 g/dL).",
      hi: "टाइफाइड पॉजिटिव होने के साथ प्लेटलेट्स में गिरावट (103,000) और ग्रैनुलोसाइट्स (75.5%) में बढ़ोतरी। हीमोग्लोबिन 14.0 बिल्कुल सामान्य है।"
    },
    parameters: [
      {
        name: "Typhoid IgG IgM Serology",
        name_hi: "टाइफाइड एंटीबॉडी (IgG/IgM)",
        value: "POSITIVE",
        unit: "Card Test",
        range: "Negative",
        range_min: null,
        range_max: null,
        status: "High",
        explanation: {
          en: "Serological test indicates antibodies reactive to Salmonella Typhi, the bacteria causing enteric/typhoid fever.",
          hi: "यह टेस्ट साल्मोनेला टाइफी बैक्टीरिया के खिलाफ एंटीबॉडी दर्शाता है, जो टाइफाइड बुखार का कारण बनता है।"
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
          en: "Platelets help blood clot. Your count is 103,000 (mildly below the 150,000 lab threshold). In typhoid infection, platelets commonly drop temporarily due to bacterial endotoxins and immune clearance.",
          hi: "प्लेटलेट्स रक्त का थक्का जमाने में मदद करते हैं। आपका मान 103 है जो सामान्य सीमा (150-450) से थोड़ा कम है। टाइफाइड संक्रमण में यह अक्सर अस्थायी रूप से गिर जाता है।"
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
          en: "Granulocytes (mostly neutrophils) are frontline immune cells dispatched to fight bacterial infection. Slightly elevated above normal 70% threshold.",
          hi: "ग्रैनुलोसाइट्स बैक्टीरिया से लड़ने वाले मुख्य श्वेत रक्त कोशिकाएं हैं। यह 75.5% है जो सामान्य सीमा 70% से थोड़ा अधिक है, जो संक्रमण से मुकाबला दर्शाता है।"
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
          en: "Relative proportion of monocytes, eosinophils, and basophils is slightly lower because granulocytes occupy a larger share.",
          hi: "ग्रैनुलोसाइट्स का अनुपात बढ़ने से मिड कोशिकाओं का प्रतिशत थोड़ा कम (2.8%) दिखाई दे रहा है।"
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
        status: "Normal",
        explanation: {
          en: "Oxygen-carrying capacity is robust and completely within healthy range. No signs of anemia.",
          hi: "शरीर में ऑक्सीजन ले जाने की क्षमता पूरी तरह से सामान्य और स्वस्थ (14.0 g/dL) है। खून की कोई कमी नहीं है।"
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
        status: "Normal",
        explanation: {
          en: "Overall white blood cell count remains comfortably inside normal limits.",
          hi: "कुल सफेद रक्त कोशिकाएं सामान्य सीमा के बीच में हैं।"
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
        status: "Normal",
        explanation: {
          en: "Red blood cell production is healthy and consistent.",
          hi: "लाल रक्त कोशिकाओं का उत्पादन सामान्य और स्थिर है।"
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
        status: "Normal",
        explanation: {
          en: "Red blood cell volume is standard and healthy.",
          hi: "लाल रक्त कोशिकाओं का आकार सामान्य है।"
        }
      },
      {
        name: "Plateletcrit (PCT)",
        name_hi: "प्लेटलेटक्रिट (PCT)",
        value: "0.101",
        unit: "%",
        range: "0.108 - 0.282",
        range_min: 0.108,
        range_max: 0.282,
        status: "Low",
        explanation: {
          en: "The volume percentage occupied by platelets in blood is slightly lower, mirroring the mild platelet drop.",
          hi: "रक्त में प्लेटलेट्स द्वारा घेरा गया कुल आयतन थोड़ा कम है, जो प्लेटलेट्स 103 के अनुरूप है।"
        }
      },
      {
        name: "Malaria by Card",
        name_hi: "मलेरिया कार्ड टेस्ट",
        value: "NEGATIVE",
        unit: "Card Test",
        range: "Negative",
        range_min: null,
        range_max: null,
        status: "Normal",
        explanation: {
          en: "No malaria parasites detected. Fevers are not attributed to plasmodium species.",
          hi: "मलेरिया की जांच नकारात्मक (नेगेटिव) है, यानी मलेरिया का कोई लक्षण नहीं है।"
        }
      }
    ],
    patterns: [
      {
        title: {
          en: "Secondary Thrombocytopenia from Enteric (Typhoid) Fever",
          hi: "टाइफाइड संक्रमण से संबंधित प्लेटलेट में गिरावट"
        },
        description: {
          en: "A positive Typhoid test accompanied by Platelets at 103,000/µL and elevated Granulocytes (75.5%) is a classic clinical presentation of enteric fever. Bacterial endotoxins frequently induce transient platelet pooling and mild suppression, which typically reverses upon completing doctor-prescribed antibiotics.",
          hi: "टाइफाइड पॉजिटिव के साथ प्लेटलेट्स 103 और ग्रैनुलोसाइट्स 75.5% का होना टाइफाइड बुखार की पहचान है। डॉक्टर द्वारा दिए गए एंटीबायोटिक उपचार के बाद प्लेटलेट्स सामान्यतः पुनः बढ़ जाते हैं।"
        }
      },
      {
        title: {
          en: "Preserved Erythroid Lineage & Oxygen Delivery",
          hi: "सामान्य हीमोग्लोबिन एवं लाल रक्त कोशिकाएं"
        },
        description: {
          en: "Hemoglobin (14.0 g/dL), RBC (4.61), and cellular indices (MCV 88.0, MCH 30.4) are completely undisturbed, confirming no hemolytic destruction or anemia.",
          hi: "हीमोग्लोबिन (14.0) और लाल रक्त कोशिकाएं पूरी तरह सुरक्षित और स्वस्थ हैं, खून की कोई कमी नहीं है।"
        }
      }
    ],
    questions: [
      {
        en: "Given the positive Typhoid test and platelet count of 103, what specific antibiotic course do you recommend?",
        hi: "टाइफाइड पॉजिटिव और 103 प्लेटलेट्स को देखते हुए कौन सा एंटीबायोटिक कोर्स सबसे उपयुक्त है?"
      },
      {
        en: "Should we recheck my platelet count in 48 to 72 hours to ensure it is stabilizing?",
        hi: "क्या 48 से 72 घंटे बाद दोबारा प्लेटलेट्स टेस्ट कराना चाहिए ताकि यह सुनिश्चित हो सके कि वे बढ़ रहे हैं?"
      },
      {
        en: "What hydration and nutrition guidelines (such as ORS or light soft diet) should I follow during recovery?",
        hi: "ठीक होने के दौरान खान-पान और पानी/ओआरएस के सेवन को लेकर क्या सावधानियां रखनी चाहिए?"
      },
      {
        en: "What warning signs (e.g. persistent vomiting, severe abdominal pain, bleeding) require immediate hospital care?",
        hi: "किन गंभीर लक्षणों (जैसे पेट में तेज दर्द, उल्टी या रक्तस्राव) के दिखने पर तुरंत अस्पताल जाना चाहिए?"
      }
    ]
  },
  {
    id: 'sample-anemia',
    title: {
      en: "Sunita's Mother (Suspected Anemia Profile)",
      hi: "सुनीता की माताजी (एनीमिया जांच रिपोर्ट)"
    },
    subtitle: {
      en: "Patient: Shanti Devi, 58F • Lab: Pali Diagnostics • Test: CBC",
      hi: "मरीज़: शांति देवी, 58 महिला • लैब: पाली डायग्नोस्टिक्स • टेस्ट: सीबीसी"
    },
    tag: {
      en: "Mild Microcytic Pattern",
      hi: "माइक्रोसाइटिक पैटर्न"
    },
    severity: "warning",
    summary: {
      en: "Low hemoglobin accompanied by reduced red blood cell size (MCV) and cell hemoglobin (MCH). Frequently seen with iron deficiency.",
      hi: "हीमोग्लोबिन कम होने के साथ-साथ लाल रक्त कोशिकाओं का आकार (MCV) और हीमोग्लोबिन घनत्व (MCH) भी कम पाया गया है। यह अक्सर आयरन की कमी में देखा जाता है।"
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
          en: "Hemoglobin is the iron-rich protein that carries oxygen from your lungs to the rest of your body. Lower levels mean less oxygen reaches tissues, which can cause fatigue or weakness.",
          hi: "हीमोग्लोबिन वह प्रोटीन है जो फेफड़ों से शरीर के सभी अंगों तक ऑक्सीजन पहुंचाता है। इसका स्तर कम होने पर थकान या कमजोरी महसूस हो सकती है।"
        }
      },
      {
        name: "RBC Count",
        name_hi: "लाल रक्त कोशिकाएं (RBC)",
        value: "3.8",
        unit: "mil/µL",
        range: "4.0 - 5.2",
        range_min: 4.0,
        range_max: 5.2,
        status: "Low",
        explanation: {
          en: "Red Blood Cells are the cells carrying hemoglobin. A slightly reduced count aligns with the low hemoglobin finding.",
          hi: "आरबीसी वे कोशिकाएं हैं जिनमें हीमोग्लोबिन होता है। इसकी संख्या कम होना कम हीमोग्लोबिन से मेल खाता है।"
        }
      },
      {
        name: "MCV (Mean Corpuscular Volume)",
        name_hi: "एमसीवी (कोशिका का आकार)",
        value: "74.2",
        unit: "fL",
        range: "80.0 - 96.0",
        range_min: 80.0,
        range_max: 96.0,
        status: "Low",
        explanation: {
          en: "MCV measures the physical volume or size of each red blood cell. A low number indicates cells are smaller than typical ('microcytic').",
          hi: "एमसीवी लाल रक्त कोशिकाओं के औसत आकार को मापता है। यह कम होने का मतलब है कि कोशिकाएं सामान्य से छोटी हैं।"
        }
      },
      {
        name: "MCH (Mean Corpuscular Hemoglobin)",
        name_hi: "एमसीएच (प्रति कोशिका हीमोग्लोबिन)",
        value: "23.8",
        unit: "pg",
        range: "27.0 - 33.0",
        range_min: 27.0,
        range_max: 33.0,
        status: "Low",
        explanation: {
          en: "MCH measures how much hemoglobin is inside each single cell. Low MCH means cells carry less pigment and oxygen ('hypochromic').",
          hi: "एमसीएच बताता है कि प्रत्येक कोशिका के अंदर कितना हीमोग्लोबिन है। कम होने पर कोशिकाएं हल्की दिखती हैं।"
        }
      },
      {
        name: "Total Leucocyte Count (WBC)",
        name_hi: "श्वेत रक्त कोशिकाएं (WBC)",
        value: "6,800",
        unit: "/cumm",
        range: "4,000 - 11,000",
        range_min: 4000,
        range_max: 11000,
        status: "Normal",
        explanation: {
          en: "White blood cells defend your body against germs and infections. This value sits right in the healthy middle range.",
          hi: "सफेद रक्त कोशिकाएं शरीर को संक्रमण से बचाती हैं। यह मान बिल्कुल सामान्य और स्वस्थ सीमा में है।"
        }
      },
      {
        name: "Platelet Count",
        name_hi: "प्लेटलेट्स संख्या",
        value: "245,000",
        unit: "/µL",
        range: "150,000 - 450,000",
        range_min: 150000,
        range_max: 450000,
        status: "Normal",
        explanation: {
          en: "Platelets help stop bleeding by forming clots when there is a wound or injury. Your count is safely normal.",
          hi: "प्लेटलेट्स खून का थक्का जमाने और बहने से रोकने में मदद करते हैं। आपकी संख्या पूरी तरह सामान्य है।"
        }
      }
    ],
    patterns: [
      {
        title: {
          en: "Microcytic Hypochromic Pattern Connected",
          hi: "माइक्रोसाइटिक हाइपोक्रोमिक पैटर्न की पहचान"
        },
        description: {
          en: "Low Hemoglobin (10.2) is directly matched with reduced cell size (MCV 74.2) and reduced cellular color (MCH 23.8). Clinically, this cluster often correlates with nutritional iron depletion or chronic blood loss, though definitive confirmation requires a serum ferritin test.",
          hi: "कम हीमोग्लोबिन (10.2), छोटी कोशिकाओं (MCV 74.2) और कम रंग (MCH 23.8) का एक साथ होना आमतौर पर आयरन की कमी की ओर इशारा करता है। डॉक्टर सीरम फेरिटिन टेस्ट से इसकी पुष्टि कर सकते हैं।"
        }
      },
      {
        title: {
          en: "Normal Immune and Clotting Defenses",
          hi: "सामान्य रोग-प्रतिरोधक और थक्का बनाने की क्षमता"
        },
        description: {
          en: "WBC (6,800) and Platelets (245,000) remain completely undisturbed within reference boundaries, showing no signs of acute infection or bleeding disorder.",
          hi: "WBC और प्लेटलेट्स दोनों सुरक्षित सीमा में हैं, जिससे किसी अचानक संक्रमण या रक्तस्राव की समस्या का संकेत नहीं मिलता।"
        }
      }
    ],
    questions: [
      {
        en: "Could my mother's low hemoglobin and small red cell size (MCV) be caused by iron deficiency?",
        hi: "क्या मेरी माताजी का कम हीमोग्लोबिन और छोटा एमसीवी आयरन की कमी के कारण हो सकता है?"
      },
      {
        en: "Do you recommend a serum ferritin or iron profile test before deciding on supplements?",
        hi: "क्या किसी सप्लीमेंट से पहले सीरम फेरिटिन या आयरन प्रोफाइल टेस्ट कराना ठीक रहेगा?"
      },
      {
        en: "Are there any dietary changes or iron-rich foods that would help support her recovery?",
        hi: "क्या खान-पान में कोई ऐसा बदलाव है जो उनकी सेहत में सुधार के लिए मददगार हो सकता है?"
      }
    ]
  },
  {
    id: 'sample-infection',
    title: {
      en: "Acute Infection / Inflammation Response",
      hi: "तीव्र संक्रमण / सूजन प्रतिक्रिया रिपोर्ट"
    },
    subtitle: {
      en: "Patient: Ramesh Kumar, 34M • Lab: City Metro Lab • Test: CBC",
      hi: "मरीज़: रमेश कुमार, 34 पुरुष • लैब: सिटी मेट्रो लैब • टेस्ट: सीबीसी"
    },
    tag: {
      en: "Elevated WBC & Neutrophilia",
      hi: "बढ़ी हुई WBC एवं न्यूट्रोफिलिया"
    },
    severity: "warning",
    summary: {
      en: "Markedly elevated total white blood cells driven by high neutrophils, which commonly indicates the immune system fighting an active bacterial illness.",
      hi: "सफेद रक्त कोशिकाओं और न्यूट्रोफिल्स की बढ़ी हुई संख्या दर्शाती है कि शरीर की रोग प्रतिरोधक प्रणाली किसी सक्रिय बैक्टीरिया या संक्रमण से लड़ रही है।"
    },
    parameters: [
      {
        name: "Total Leucocyte Count (WBC)",
        name_hi: "कुल श्वेत रक्त कोशिकाएं (WBC)",
        value: "16,400",
        unit: "/cumm",
        range: "4,000 - 11,000",
        range_min: 4000,
        range_max: 11000,
        status: "High",
        explanation: {
          en: "White blood cells act as your immune system's frontline defenders. High counts indicate your body has ramped up defenses against an irritant, infection, or stress.",
          hi: "सफेद रक्त कोशिकाएं शरीर के सुरक्षा गार्ड हैं। यह संख्या अधिक होने का मतलब है कि शरीर किसी संक्रमण या सूजन से लड़ रहा है।"
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
          en: "Neutrophils are the first-response white blood cells dispatched specifically to destroy bacterial invaders.",
          hi: "न्यूट्रोफिल्स पहली प्रतिक्रिया देने वाली कोशिकाएं हैं जो विशेष रूप से बैक्टीरिया को नष्ट करने के लिए निकलती हैं।"
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
          en: "Relative percentage is lower because neutrophils make up an overwhelming proportion of the total count.",
          hi: "न्यूट्रोफिल्स की भारी बढ़ोतरी के कारण लिम्फोसाइट्स का तुलनात्मक प्रतिशत कम दिखता है।"
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
        status: "Normal",
        explanation: {
          en: "Hemoglobin is safely in the healthy range, showing oxygen-carrying ability is not impacted.",
          hi: "हीमोग्लोबिन बिल्कुल स्वस्थ सीमा में है, यानी ऑक्सीजन संचरण सही है।"
        }
      },
      {
        name: "Platelet Count",
        name_hi: "प्लेटलेट्स संख्या",
        value: "320,000",
        unit: "/µL",
        range: "150,000 - 450,000",
        range_min: 150000,
        range_max: 450000,
        status: "Normal",
        explanation: {
          en: "Platelets are well-preserved, indicating normal blood clotting capabilities.",
          hi: "प्लेटलेट्स का स्तर बहुत अच्छा और सामान्य है।"
        }
      }
    ],
    patterns: [
      {
        title: {
          en: "Active Bacterial or Inflammatory Cascade",
          hi: "सक्रिय बैक्टीरिया या सूजन संबंधी प्रक्रिया"
        },
        description: {
          en: "Elevated WBC (16,400) together with high Neutrophils (82%) is a recognized hallmark of an active immune battle against localized or systemic bacterial infection.",
          hi: "WBC (16,400) और न्यूट्रोफिल्स (82%) का बढ़ना इस बात का स्पष्ट संकेत है कि शरीर बैक्टीरिया जनित संक्रमण से मुकाबला कर रहा है।"
        }
      }
    ],
    questions: [
      {
        en: "Does this high white blood cell count indicate a bacterial infection that requires antibiotics?",
        hi: "क्या यह बढ़ा हुआ WBC किसी ऐसे बैक्टीरिया संक्रमण का संकेत है जिसके लिए एंटीबायोटिक की आवश्यकता है?"
      },
      {
        en: "Would an inflammatory marker test like CRP or ESR be helpful to monitor recovery?",
        hi: "क्या स्वास्थ्य की निगरानी के लिए CRP या ESR टेस्ट कराना फायदेमंद रहेगा?"
      },
      {
        en: "What symptoms (such as fever or cough) should prompt an immediate follow-up visit?",
        hi: "किन लक्षणों (जैसे तेज़ बुखार या खांसी) के दिखने पर तुरंत डॉक्टर को दोबारा दिखाना चाहिए?"
      }
    ]
  },
  {
    id: 'sample-normal',
    title: {
      en: "Balanced Routine Health Checkup",
      hi: "संतुलित सामान्य स्वास्थ्य जांच रिपोर्ट"
    },
    subtitle: {
      en: "Patient: Anita Sharma, 29F • Lab: Apex Health • Test: Routine Annual CBC",
      hi: "मरीज़: अनीता शर्मा, 29 महिला • लैब: एपेक्स हेल्थ • टेस्ट: वार्षिक नियमित सीबीसी"
    },
    tag: {
      en: "All Parameters in Range",
      hi: "सभी पैरामीटर सामान्य"
    },
    severity: "normal",
    summary: {
      en: "All red cell, white cell, and platelet counts sit comfortably within standard laboratory reference ranges.",
      hi: "लाल रक्त कोशिकाएं, श्वेत रक्त कोशिकाएं और प्लेटलेट्स सभी सामान्य स्वस्थ सीमा में हैं।"
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
        status: "Normal",
        explanation: {
          en: "Optimal oxygen-carrying capacity. Perfectly balanced.",
          hi: "ऑक्सीजन ले जाने की आदर्श क्षमता। पूर्णतः संतुलित।"
        }
      },
      {
        name: "Total Leucocyte Count (WBC)",
        name_hi: "श्वेत रक्त कोशिकाएं (WBC)",
        value: "7,200",
        unit: "/cumm",
        range: "4,000 - 11,000",
        range_min: 4000,
        range_max: 11000,
        status: "Normal",
        explanation: {
          en: "Healthy immune surveillance with no signs of distress or suppression.",
          hi: "स्वस्थ रोग प्रतिरोधक तंत्र। किसी संक्रमण का कोई संकेत नहीं।"
        }
      },
      {
        name: "MCV",
        name_hi: "एमसीवी (कोशिका आकार)",
        value: "88.5",
        unit: "fL",
        range: "80.0 - 96.0",
        range_min: 80.0,
        range_max: 96.0,
        status: "Normal",
        explanation: {
          en: "Red blood cell dimensions are standard and healthy.",
          hi: "लाल रक्त कोशिकाओं का आकार बिल्कुल सामान्य है।"
        }
      },
      {
        name: "Platelet Count",
        name_hi: "प्लेटलेट्स संख्या",
        value: "280,000",
        unit: "/µL",
        range: "150,000 - 450,000",
        range_min: 150000,
        range_max: 450000,
        status: "Normal",
        explanation: {
          en: "Clotting factors and cell counts are robust.",
          hi: "रक्त का थक्का जमाने की क्षमता पूरी तरह मजबूत और सामान्य है।"
        }
      }
    ],
    patterns: [
      {
        title: {
          en: "Homogeneous Normal Complete Blood Profile",
          hi: "संतुलित एवं सामान्य रक्त प्रोफ़ाइल"
        },
        description: {
          en: "No cross-parameter abnormalities detected across erythroid, myeloid, or thrombocytic lineages.",
          hi: "लाल कोशिकाओं, सफेद कोशिकाओं या प्लेटलेट्स में किसी प्रकार की असामान्यता नहीं पाई गई है।"
        }
      }
    ],
    questions: [
      {
        en: "Given these normal counts, how often do you suggest repeating routine preventive blood work?",
        hi: "इन सामान्य परिणामों को देखते हुए, आप कितने अंतराल पर दोबारा नियमित ब्लड टेस्ट कराने की सलाह देते हैं?"
      },
      {
        en: "Are there any specific lifestyle or nutritional habits that will help keep these markers optimal?",
        hi: "इन स्वस्थ स्तरों को बनाए रखने के लिए किन दैनिक आदतों या आहार पर ध्यान देना चाहिए?"
      }
    ]
  }
];
