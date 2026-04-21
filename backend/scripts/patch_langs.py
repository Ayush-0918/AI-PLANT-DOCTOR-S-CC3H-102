import re
import os

fp = "/Users/aayu/Plant Doctors/web/src/context/LanguageContext.tsx"
with open(fp, "r", encoding="utf-8") as f:
    content = f.read()

translations = {
    "English": {
        "scanner_pipeline_scan": "Scan",
        "scanner_pipeline_diagnose": "Diagnose",
        "scanner_pipeline_prevent": "Prevent",
        "scanner_pipeline_dosage": "Dosage",
        "scanner_pipeline_precaution": "Precaution",
        "scanner_app_title": "Plant Scanner",
        "scanner_analyzing_leaf": "Analyzing Leaf",
        "scanner_checking_pathogens": "Checking against 38,000+ pathogens",
        "scanner_step_0": "Extracting visual features",
        "scanner_step_1": "Pattern matching diseases",
        "scanner_step_2": "Geo-locating outbreak data",
        "scanner_ai_processing": "AI Processing",
        "scanner_high_severity": "High Severity",
        "scanner_medium_severity": "Medium Severity",
        "scanner_early_detection": "Early Detection",
        "scanner_match": "Match",
        "scanner_based_on_visual": "Based on visual symptoms & local outbreak data",
        "scanner_ai_action": "AI Action",
        "scanner_human_review": "Human Review Recommended",
        "scanner_spray_decision": "Spray decision lene se pehle expert se confirm karein.",
        "scanner_treatment_plan": "Treatment Plan",
        "scanner_btn_talk": "Talk to Agronomist Now",
        "scanner_btn_compute": "Compute Exact Dosage",
        "scanner_btn_shop": "Shop Products",
        "scanner_btn_new": "New Scan",
        "scanner_live_badge": "Live",
        "scanner_center_leaf": "Center the affected leaf",
        "scanner_camera_unavailable": "Camera Unavailable",
        "scanner_try_again": "Try Again",
        "scanner_upload_gallery": "Or upload from gallery · Supports JPG, PNG, HEIC"
    },
    "हिंदी": {
        "scanner_pipeline_scan": "स्कैन",
        "scanner_pipeline_diagnose": "निदान",
        "scanner_pipeline_prevent": "बचाव",
        "scanner_pipeline_dosage": "मात्रा",
        "scanner_pipeline_precaution": "सावधानी",
        "scanner_app_title": "पौधा स्कैनर",
        "scanner_analyzing_leaf": "पत्ती की जाँच हो रही है",
        "scanner_checking_pathogens": "38,000+ बीमारियों का मिलान",
        "scanner_step_0": "दिखने वाले लक्षण निकाले जा रहे हैं",
        "scanner_step_1": "बीमारी का पैटर्न मिला रहे हैं",
        "scanner_step_2": "आसपास के इलाकों का डेटा चेक कर रहे हैं",
        "scanner_ai_processing": "AI प्रोसेसिंग",
        "scanner_high_severity": "गंभीर स्थिति",
        "scanner_medium_severity": "मध्यम स्थिति",
        "scanner_early_detection": "शुरुआती पहचान",
        "scanner_match": "मिलान",
        "scanner_based_on_visual": "लक्षणों और आस-पास की बीमारियों के आधार पर",
        "scanner_ai_action": "AI की सलाह",
        "scanner_human_review": "विशेषज्ञ की सलाह",
        "scanner_spray_decision": "स्प्रे का निर्णय लेने से पहले विशेषज्ञ से बात करें।",
        "scanner_treatment_plan": "उपचार योजना",
        "scanner_btn_talk": "अभी कृषि विशेषज्ञ से बात करें",
        "scanner_btn_compute": "दवा की सही मात्रा जानें",
        "scanner_btn_shop": "दवाइयां खरीदें",
        "scanner_btn_new": "नया स्कैन करें",
        "scanner_live_badge": "लाइव",
        "scanner_center_leaf": "बीमार पत्ती को बीच में रखें",
        "scanner_camera_unavailable": "कैमरा उपलब्ध नहीं है",
        "scanner_try_again": "फिर से कोशिश करें",
        "scanner_upload_gallery": "या गैलरी से फोटो अपलोड करें"
    },
    "ਪੰਜਾਬੀ": {
        "scanner_pipeline_scan": "ਸਕੈਨ",
        "scanner_pipeline_diagnose": "ਜਾਂਚ",
        "scanner_pipeline_prevent": "ਬਚਾਅ",
        "scanner_pipeline_dosage": "ਖੁਰਾਕ",
        "scanner_pipeline_precaution": "ਸਾਵਧਾਨੀ",
        "scanner_app_title": "ਪੌਦਾ ਸਕੈਨਰ",
        "scanner_analyzing_leaf": "ਪੱਤੇ ਦੀ ਜਾਂਚ ਹੋ ਰਹੀ ਹੈ",
        "scanner_checking_pathogens": "38,000+ ਬਿਮਾਰੀਆਂ ਨਾਲ ਮੇਲਾਣ",
        "scanner_step_0": "ਲੱਛਣਾਂ ਦੀ ਪਛਾਣ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ",
        "scanner_step_1": "ਬਿਮਾਰੀ ਦਾ ਪੈਟਰਨ ਮਿਲਾ ਰਹੇ ਹਾਂ",
        "scanner_step_2": "ਆਸ-ਪਾਸ ਦੇ ਇਲਾਕਿਆਂ ਦਾ ਡੇਟਾ ਚੈੱਕ ਕਰ ਰਹੇ ਹਾਂ",
        "scanner_ai_processing": "AI ਪ੍ਰੋਸੈਸਿੰਗ",
        "scanner_high_severity": "ਗੰਭੀਰ ਸਥਿਤੀ",
        "scanner_medium_severity": "ਔਸਤ ਸਥਿਤੀ",
        "scanner_early_detection": "ਸ਼ੁਰੂਆਤੀ ਪਛਾਣ",
        "scanner_match": "ਮੇਲਾਣ",
        "scanner_based_on_visual": "ਲੱਛਣਾਂ ਅਤੇ ਆਲੇ-ਦੁਆਲੇ ਦੀਆਂ ਬਿਮਾਰੀਆਂ ਦੇ ਅਧਾਰ ਤੇ",
        "scanner_ai_action": "AI ਦੀ ਸਲਾਹ",
        "scanner_human_review": "ਮਾਹਰ ਦੀ ਸਲਾਹ",
        "scanner_spray_decision": "ਸਪ੍ਰੇ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਮਾਹਰ ਨਾਲ ਗੱਲ ਕਰੋ।",
        "scanner_treatment_plan": "ਇਲਾਜ ਯੋਜਨਾ",
        "scanner_btn_talk": "ਹੁਣ ਖੇਤੀਬਾੜੀ ਮਾਹਰ ਨਾਲ ਗੱਲ ਕਰੋ",
        "scanner_btn_compute": "ਦਵਾਈ ਦੀ ਸਹੀ ਮਾਤਰਾ ਜਾਣੋ",
        "scanner_btn_shop": "ਦਵਾਈਆਂ ਖਰੀਦੋ",
        "scanner_btn_new": "ਨਵਾਂ ਸਕੈਨ ਕਰੋ",
        "scanner_live_badge": "ਲਾਈਵ",
        "scanner_center_leaf": "ਬਿਮਾਰ ਪੱਤੇ ਨੂੰ ਵਿਚਕਾਰ ਰੱਖੋ",
        "scanner_camera_unavailable": "ਕੈਮਰਾ ਉਪਲਬਧ ਨਹੀਂ ਹੈ",
        "scanner_try_again": "ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ",
        "scanner_upload_gallery": "ਜਾਂ ਗੈਲਰੀ ਤੋਂ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ"
    }
}

dict_header = "const dictionary: Record<string, Record<string, string>> = {"
if dict_header not in content:
    print("Cannot find dictionary")
    exit(1)

parts = content.split("const dictionary: Record<string, Record<string, string>> = {")
before = parts[0]
after_dict_start = parts[1]
end_of_dict_index = after_dict_start.find("};\n")

dict_body = after_dict_start[:end_of_dict_index]
after_dict = after_dict_start[end_of_dict_index:]

out_parts = []
langs = dict_body.split("\n  },")
for lang_block in langs:
    if not lang_block.strip(): continue
    lines = lang_block.split("\n")
    lang_name_line = lines[1].strip() if not lines[0].strip() else lines[0].strip()
    
    if lang_name_line.startswith("'"):
        lang_name = lang_name_line.split("'")[1]
    else:
        lang_name = lang_name_line.split(":")[0].strip()
    
    inject_dict = translations.get(lang_name, translations["English"])
    inject_str = ""
    for k, v in inject_dict.items():
        v = v.replace("'", "\\'")
        inject_str += f"    '{k}': '{v}',\n"
    
    lang_block += ",\n" + inject_str.rstrip(",\n")
    out_parts.append(lang_block)

new_dict_body = "\n  },".join(out_parts)
new_content = before + dict_header + new_dict_body + after_dict

with open(fp, "w", encoding="utf-8") as f:
    f.write(new_content)
print("Language files updated.")
