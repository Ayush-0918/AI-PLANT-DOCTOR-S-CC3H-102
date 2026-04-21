export const APP_LANGUAGES = [
  {
    name: "English",
    label: "English",
    subtitle: "Talk to AI in English",
    speechCode: "en-IN",
    preview:
      "Namaste Kishan. I am your Plant Doctor assistant. I will guide you in English.",
  },
  {
    name: "हिंदी",
    label: "हिंदी",
    subtitle: "अपनी भाषा में खेती सलाह",
    speechCode: "hi-IN",
    preview:
      "नमस्ते किसान जी। मैं आपका प्लांट डॉक्टर सहायक हूँ। मैं आपसे हिंदी में बात करूँगा।",
  },
  {
    name: "भोजपुरी",
    label: "भोजपुरी",
    subtitle: "खेती के बात अब भोजपुरी में",
    speechCode: "hi-IN",
    preview:
      "प्रणाम किसान जी। हम राउर प्लांट डॉक्टर सहायक बानी। अब हम भोजपुरी में बात करब।",
  },
  {
    name: "ਪੰਜਾਬੀ",
    label: "ਪੰਜਾਬੀ",
    subtitle: "ਤੁਹਾਡੀ ਫਸਲ ਦੀ ਗੱਲ ਪੰਜਾਬੀ ਵਿੱਚ",
    speechCode: "pa-IN",
    preview:
      "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ। ਮੈਂ ਤੁਹਾਡਾ ਪਲਾਂਟ ਡਾਕਟਰ ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਪੰਜਾਬੀ ਵਿੱਚ ਗੱਲ ਕਰਾਂਗਾ।",
  },
  {
    name: "मैथिली",
    label: "मैथिली",
    subtitle: "खेतीक सहयोग मैथिली में",
    speechCode: "hi-IN",
    preview:
      "प्रणाम किसान जी। हम अहाँक प्लांट डॉक्टर सहायक छी। हम मैथिली मे मार्गदर्शन करब।",
  },
  {
    name: "मराठी",
    label: "मराठी",
    subtitle: "शेती सल्ला मराठीत",
    speechCode: "mr-IN",
    preview:
      "नमस्कार शेतकरी मित्रा. मी तुमचा प्लांट डॉक्टर सहाय्यक आहे. मी मराठीत मदत करीन.",
  },
  {
    name: "ગુજરાતી",
    label: "ગુજરાતી",
    subtitle: "ખેતી માર્ગદર્શન ગુજરાતી માં",
    speechCode: "gu-IN",
    preview:
      "નમસ્તે ખેડૂતભાઈ. હું તમારો પ્લાન્ટ ડૉક્ટર સહાયક છું. હવે હું ગુજરાતી માં વાત કરીશ.",
  },
  {
    name: "తెలుగు",
    label: "తెలుగు",
    subtitle: "వ్యవసాయ సలహా తెలుగులో",
    speechCode: "te-IN",
    preview:
      "నమస్కారం రైతు గారు. నేను మీ ప్లాంట్ డాక్టర్ సహాయకుడిని. నేను తెలుగులో మాట్లాడుతాను.",
  },
] as const;

export type SupportedLanguage = (typeof APP_LANGUAGES)[number]["name"];

export function getLanguageMeta(language: string) {
  return (
    APP_LANGUAGES.find((entry) => entry.name === language) ?? APP_LANGUAGES[0]
  );
}

export function getSpeechLangCode(language: string) {
  return getLanguageMeta(language).speechCode;
}
