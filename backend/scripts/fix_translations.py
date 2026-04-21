import csv

csv_path = 'data/generated/treatment_knowledge.csv'

hindi_dict = {
    "low": "कम", "medium": "मध्यम", "high": "उच्च", "critical": "गंभीर",
    "vegetative stage": "वनस्पति अवस्था", "nursery or early transplant stage": "नर्सरी अवस्था", 
    "flowering or fruiting stage": "फूलने या फलने की अवस्था", "current crop stage": "वर्तमान फसल अवस्था",
    "Apple": "सेब", "Blueberry": "ब्लूबेरी", "Cherry": "चेरी", "Corn": "मक्का", "Grape": "अंगूर", 
    "Orange": "संतरा", "Peach": "आड़ू", "Pepper": "शिमला मिर्च", "Potato": "आलू", "Raspberry": "रसभरी", 
    "Soybean": "सोयाबीन", "Squash": "कद्दू", "Strawberry": "स्ट्रॉबेरी", "Tomato": "टमाटर",
    "Continue scouting, remove dead leaves, and keep field airflow open.": "निगरानी जारी रखें, सूखी पत्तियाँ हटाएँ और खेत में हवा का बहाव बनाए रखें।",
    "Remove infected leaves, improve spacing, and avoid field work in wet conditions.": "संक्रमित पत्तियों को हटाएँ, पौधों के बीच दूरी बढ़ाएँ और गीली मिट्टी में काम न करें।",
    "Destroy heavily infected foliage and avoid moving tools between wet plots.": "खराब हो चुकी पत्तियों को नष्ट करें और गीले खेतों के बीच औजार न ले जाएं।",
    "Scout border rows, remove weak foliage, and keep field hygiene strong.": "किनारे की पंक्तियों की निगरानी करें, कमजोर पत्तियों को हटाएँ और खेत की सफाई रखें।",
    "Remove infected plants, sanitize tools, and control vector pressure quickly.": "बीमार पौधों को हटा दें, औजारों को साफ करें और कीटों पर जल्दी नियंत्रण पाएं।",
    "Remove infected lower leaves and improve sunlight penetration in canopy.": "संक्रमित निचली पत्तियों को हटा दें और पौधों के बीच धूप पहुंचने दें।",
    "Cut off diseased wood/leaves and avoid overhead watering in late evening.": "बीमार लकड़ी/पत्तियों को काट दें और देर शाम ऊपर से पानी न दें।",
    "Protective foliar fungicide": "सुरक्षात्मक कवकनाशी (Fungicide)", "Curative systemic fungicide": "प्रणालीगत कवकनाशी (Systemic Fungicide)", 
    "Aggressive systemic + protectant mix": "पावरफुल कवकनाशी मिक्स", "Emergency copper-based or bio-fungicide": "इमरजेंसी कॉपर-बेस्ड दवा", 
    "Preventive scouting + balanced nutrition": "रोकथाम और संतुलित पोषण", "Contact bactericide/copper spray": "कॉपर स्प्रे (Bactericide)", 
    "Systemic antibiotic or aggressive copper spray": "एंटीबायोटिक या कॉपर स्प्रे", "Broad-spectrum insecticide": "कीटनाशक (Insecticide)", 
    "Systemic miticide": "माइटिसाइड (Miticide)", "No chemical treatment required": "किसी रसायन की आवश्यकता नहीं"
}

punjabi_dict = {
    "low": "ਘੱਟ", "medium": "ਦਰਮਿਆਨਾ", "high": "ਉੱਚ", "critical": "ਗੰਭੀਰ",
    "vegetative stage": "ਵਿਕਾਸ ਅਵਸਥਾ", "nursery or early transplant stage": "ਨਰਸਰੀ ਅਵਸਥਾ", 
    "flowering or fruiting stage": "ਫੁੱਲ ਜਾਂ ਫਲ ਆਉਣ ਦੀ ਅਵਸਥਾ", "current crop stage": "ਮੌਜੂਦਾ ਫਸਲ ਅਵਸਥਾ",
    "Apple": "ਸੇਬ", "Blueberry": "ਬਲੂਬੇਰੀ", "Cherry": "ਚੈਰੀ", "Corn": "ਮੱਕੀ", "Grape": "ਅੰਗੂਰ", 
    "Orange": "ਸੰਤਰਾ", "Peach": "ਆੜੂ", "Pepper": "ਸ਼ਿਮਲਾ ਮਿਰਚ", "Potato": "ਆਲੂ", "Raspberry": "ਰਸਭਰੀ", 
    "Soybean": "ਸੋਇਆਬੀਨ", "Squash": "ਕੱਦੂ", "Strawberry": "ਸਟ੍ਰਾਬੇਰੀ", "Tomato": "ਟਮਾਟਰ",
    "Continue scouting, remove dead leaves, and keep field airflow open.": "ਨਿਗਰਾਨੀ ਜਾਰੀ ਰੱਖੋ, ਸੁੱਕੇ ਪੱਤੇ ਹਟਾਓ ਅਤੇ ਖੇਤ ਵਿੱਚ ਹਵਾ ਦਾ ਵਹਾਅ ਬਣਾਈ ਰੱਖੋ।",
    "Remove infected leaves, improve spacing, and avoid field work in wet conditions.": "ਬਿਮਾਰ ਪੱਤਿਆਂ ਨੂੰ ਹਟਾਓ, ਪੌਦਿਆਂ ਵਿਚਕਾਰ ਦੂਰੀ ਬਣਾਈ ਰੱਖੋ ਅਤੇ ਗਿੱਲੇ ਖੇਤ ਵਿੱਚ ਕੰਮ ਨਾ ਕਰੋ।",
    "Destroy heavily infected foliage and avoid moving tools between wet plots.": "ਬਹੁਤ ਜ਼ਿਆਦਾ ਬਿਮਾਰ ਪੱਤਿਆਂ ਨੂੰ ਨਸ਼ਟ ਕਰੋ ਅਤੇ ਗਿੱਲੇ ਖੇਤਾਂ ਵਿੱਚ ਸੰਦ ਨਾ ਲਿਜਾਓ।",
    "Scout border rows, remove weak foliage, and keep field hygiene strong.": "ਕਿਨਾਰੇ ਦੀਆਂ ਲਾਈਨਾਂ ਦੀ ਨਿਗਰਾਨੀ ਕਰੋ, ਕਮਜ਼ੋਰ ਪੱਤਿਆਂ ਨੂੰ ਹਟਾਓ ਅਤੇ ਖੇਤ ਨੂੰ ਸਾਫ਼ ਰੱਖੋ।",
    "Remove infected plants, sanitize tools, and control vector pressure quickly.": "ਬਿਮਾਰ ਪੌਦਿਆਂ ਨੂੰ ਹਟਾਓ, ਸੰਦਾਂ ਨੂੰ ਸਾਫ਼ ਕਰੋ ਅਤੇ ਕੀੜਿਆਂ 'ਤੇ ਜਲਦੀ ਕਾਬੂ ਪਾਓ।",
    "Remove infected lower leaves and improve sunlight penetration in canopy.": "ਬਿਮਾਰ ਹੇਠਲੇ ਪੱਤਿਆਂ ਨੂੰ ਹਟਾਓ ਅਤੇ ਪੌਦਿਆਂ ਵਿਚਕਾਰ ਧੁੱਪ ਪਹੁੰਚਣ ਦਿਓ।",
    "Cut off diseased wood/leaves and avoid overhead watering in late evening.": "ਬਿਮਾਰ ਲੱਕੜ/ਪੱਤਿਆਂ ਨੂੰ ਕੱਟੋ ਅਤੇ ਦੇਰ ਸ਼ਾਮ ਉੱਪਰੋਂ ਪਾਣੀ ਨਾ ਦਿਓ।",
    "Protective foliar fungicide": "ਸੁਰੱਖਿਆ ਵਾਲੀ ਉੱਲੀਮਾਰ (Fungicide)", "Curative systemic fungicide": "ਸਿਸਟੈਮਿਕ ਉੱਲੀਮਾਰ", 
    "Aggressive systemic + protectant mix": "ਸ਼ਕਤੀਸ਼ਾਲੀ ਉੱਲੀਮਾਰ ਮਿਕਸ", "Emergency copper-based or bio-fungicide": "ਕਾਪਰ-ਅਧਾਰਤ ਦਵਾਈ", 
    "Preventive scouting + balanced nutrition": "ਰੋਕਥਾਮ ਅਤੇ ਸੰਤੁਲਿਤ ਪੋਸ਼ਣ", "Contact bactericide/copper spray": "ਕਾਪਰ ਸਪਰੇਅ", 
    "Systemic antibiotic or aggressive copper spray": "ਐਂਟੀਬਾਇਓਟਿਕ ਜਾਂ ਕਾਪਰ ਸਪਰੇਅ", "Broad-spectrum insecticide": "ਕੀਟਨਾਸ਼ਕ (Insecticide)", 
    "Systemic miticide": "ਮਾਈਟੀਸਾਈਡ (Miticide)", "No chemical treatment required": "ਕਿਸੇ ਰਸਾਇਣ ਦੀ ਲੋੜ ਨਹੀਂ"
}

def translate_str(text, tr_dict):
    for k, v in tr_dict.items():
        text = text.replace(k, v)
    return text

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    fieldnames = reader.fieldnames

for row in rows:
    row['summary_hi'] = translate_str(row['summary_hi'], hindi_dict)
    row['summary_pa'] = translate_str(row['summary_pa'], punjabi_dict)

with open(csv_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print('Translated!')
