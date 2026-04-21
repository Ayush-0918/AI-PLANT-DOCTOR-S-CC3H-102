'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  PhoneCall,
  Mail,
  X,
  Languages,
  Leaf,
  MapPin,
  Mic,
  Sprout,
  Stars,
  Tractor,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AppLogo from '@/components/AppLogo';
import { useLanguage } from '@/context/LanguageContext';
import { useFarmerProfile } from '@/context/FarmerProfileContext';
import { APP_LANGUAGES, getLanguageMeta, getSpeechLangCode } from '@/lib/languages';

/* ── Per-language onboarding copy ──────────────────────────── */
const OB: Record<string, {
  slide1Title: string; slide1Desc: string;
  slide2Title: string; slide2Desc: string;
  slide3Title: string; slide3Desc: string;
  farmerTitle: string; farmerSub: string;
  nameLabel: string; villageLabel: string; stateLabel: string; farmSizeLabel: string;
  ft1: string; ft2: string; ft3: string;
  saveContinue: string;
  cropTitle: string; cropSub: string; selected: string; continueBtn: string;
  voiceTitle: string; voiceSub: string; voicePreviewLabel: string; hearPreview: string;
  voiceToggleLabel: string; voiceToggleSub: string;
  locationTitle: string; locationDesc: string; allowBtn: string; locating: string; skipBtn: string;
  finishTitle: string; finishSub: string; langLabel: string; farmerLabel: string; locationLabel: string;
  getStarted: string; accept: string; terms: string; privacy: string;
}> = {
  default: {
    slide1Title: 'Instant Disease Detection', slide1Desc: 'Camera kholo, leaf scan karo, aur turant disease, severity, dosage aur care steps pao.',
    slide2Title: 'Supportive Farming Community', slide2Desc: 'Local farmers ki community se poochho, solutions dekho aur real field examples samjho.',
    slide3Title: 'Great Product Deals', slide3Desc: 'Medicine, machines aur expert help ko ek hi polished workflow me access karo.',
    farmerTitle: 'Farmer Basics', farmerSub: 'Help us personalize your advice.',
    nameLabel: 'Your Name', villageLabel: 'Village', stateLabel: 'State', farmSizeLabel: 'Farm Size',
    ft1: 'I grow crops in fields', ft2: 'I grow crops in my home garden', ft3: 'I grow crops in pots',
    saveContinue: 'Save & Continue',
    cropTitle: 'Select plants', cropSub: 'Choose all the crops you grow.', selected: 'selected', continueBtn: 'Continue',
    voiceTitle: 'Voice assistant', voiceSub: 'Enable hands-free interaction.',
    voicePreviewLabel: 'Voice Preview', hearPreview: 'Hear preview',
    voiceToggleLabel: 'Enable voice commands', voiceToggleSub: 'Talk to the app directly from home.',
    locationTitle: 'Better predictions', locationDesc: 'Share your location to get accurate weather, disease risk, and spraying condition updates for your exact area.',
    allowBtn: 'Allow access', locating: 'Locating...', skipBtn: 'Skip for now',
    finishTitle: 'Ready to grow!', finishSub: 'Your personalized AI setup is complete.',
    langLabel: 'Language', farmerLabel: 'Farmer', locationLabel: 'Location', getStarted: 'Get Started',
    accept: 'Accept', terms: 'terms of use', privacy: 'privacy policy',
  },
  'हिंदी': {
    slide1Title: 'तुरंत रोग पहचान', slide1Desc: 'कैमरा खोलो, पत्ती स्कैन करो, और तुरंत बीमारी, गंभीरता, खुराक और देखभाल के तरीके पाओ।',
    slide2Title: 'किसान समुदाय', slide2Desc: 'स्थानीय किसानों से पूछो, उपाय देखो और असली खेत के उदाहरण समझो।',
    slide3Title: 'बेहतरीन उत्पाद', slide3Desc: 'दवाई, मशीनें और विशेषज्ञ मदद — सब एक जगह पाओ।',
    farmerTitle: 'किसान की जानकारी', farmerSub: 'हम आपकी सलाह को निजी बनाने में मदद करेंगे।',
    nameLabel: 'आपका नाम', villageLabel: 'गाँव', stateLabel: 'राज्य', farmSizeLabel: 'खेत का आकार',
    ft1: 'मैं खेत में फसल उगाता हूँ', ft2: 'मैं घर के बगीचे में उगाता हूँ', ft3: 'मैं गमलों में उगाता हूँ',
    saveContinue: 'सेव करें और जारी रखें',
    cropTitle: 'पौधे चुनें', cropSub: 'वो सभी फसलें चुनें जो आप उगाते हैं।', selected: 'चुनी गई', continueBtn: 'जारी रखें',
    voiceTitle: 'आवाज़ सहायक', voiceSub: 'हिंदी में हैंड्स-फ्री उपयोग करें।',
    voicePreviewLabel: 'आवाज़ झलक', hearPreview: 'सुनें',
    voiceToggleLabel: 'आवाज़ कमांड चालू करें', voiceToggleSub: 'घर से सीधे ऐप से बात करें।',
    locationTitle: 'बेहतर अनुमान', locationDesc: 'सटीक मौसम, रोग जोखिम और स्प्रे जानकारी के लिए अपनी लोकेशन दें।',
    allowBtn: 'अनुमति दें', locating: 'ढूंढ रहे हैं...', skipBtn: 'अभी नहीं',
    finishTitle: 'तैयार हैं!', finishSub: 'आपका AI सेटअप पूरा हो गया।',
    langLabel: 'भाषा', farmerLabel: 'किसान', locationLabel: 'लोकेशन', getStarted: 'शुरू करें',
    accept: 'स्वीकार करें', terms: 'उपयोग की शर्तें', privacy: 'गोपनीयता नीति',
  },
  'ਪੰਜਾਬੀ': {
    slide1Title: 'ਤੁਰੰਤ ਰੋਗ ਪਹਿਚਾਣ', slide1Desc: 'ਕੈਮਰਾ ਖੋਲੋ, ਪੱਤਾ ਸਕੈਨ ਕਰੋ, ਅਤੇ ਤੁਰੰਤ ਬਿਮਾਰੀ, ਖੁਰਾਕ ਅਤੇ ਦੇਖਭਾਲ ਦੇ ਤਰੀਕੇ ਪਾਓ।',
    slide2Title: 'ਕਿਸਾਨ ਭਾਈਚਾਰਾ', slide2Desc: 'ਸਥਾਨਕ ਕਿਸਾਨਾਂ ਤੋਂ ਪੁੱਛੋ, ਹੱਲ ਦੇਖੋ ਅਤੇ ਅਸਲ ਖੇਤ ਉਦਾਹਰਣ ਸਮਝੋ।',
    slide3Title: 'ਵਧੀਆ ਉਤਪਾਦ', slide3Desc: 'ਦਵਾਈ, ਮਸ਼ੀਨਾਂ ਅਤੇ ਮਾਹਰ ਮਦਦ — ਸਭ ਇੱਕ ਥਾਂ ਪਾਓ।',
    farmerTitle: 'ਕਿਸਾਨ ਜਾਣਕਾਰੀ', farmerSub: 'ਅਸੀਂ ਤੁਹਾਡੀ ਸਲਾਹ ਨੂੰ ਨਿੱਜੀ ਬਣਾਵਾਂਗੇ।',
    nameLabel: 'ਤੁਹਾਡਾ ਨਾਮ', villageLabel: 'ਪਿੰਡ', stateLabel: 'ਸੂਬਾ', farmSizeLabel: 'ਜ਼ਮੀਨ ਦਾ ਆਕਾਰ',
    ft1: 'ਮੈਂ ਖੇਤ ਵਿੱਚ ਫ਼ਸਲ ਉਗਾਉਂਦਾ ਹਾਂ', ft2: 'ਮੈਂ ਘਰ ਦੇ ਬਗੀਚੇ ਵਿੱਚ ਉਗਾਉਂਦਾ ਹਾਂ', ft3: 'ਮੈਂ ਗਮਲਿਆਂ ਵਿੱਚ ਉਗਾਉਂਦਾ ਹਾਂ',
    saveContinue: 'ਸੇਵ ਕਰੋ ਅਤੇ ਜਾਰੀ ਰੱਖੋ',
    cropTitle: 'ਪੌਦੇ ਚੁਣੋ', cropSub: 'ਉਹ ਸਾਰੀਆਂ ਫ਼ਸਲਾਂ ਚੁਣੋ ਜੋ ਤੁਸੀਂ ਉਗਾਉਂਦੇ ਹੋ।', selected: 'ਚੁਣੇ ਗਏ', continueBtn: 'ਜਾਰੀ ਰੱਖੋ',
    voiceTitle: 'ਆਵਾਜ਼ ਸਹਾਇਕ', voiceSub: 'ਪੰਜਾਬੀ ਵਿੱਚ ਹੈਂਡਸ-ਫ੍ਰੀ ਵਰਤੋਂ ਕਰੋ।',
    voicePreviewLabel: 'ਆਵਾਜ਼ ਝਲਕ', hearPreview: 'ਸੁਣੋ',
    voiceToggleLabel: 'ਆਵਾਜ਼ ਕਮਾਂਡ ਚਾਲੂ ਕਰੋ', voiceToggleSub: 'ਘਰ ਤੋਂ ਸਿੱਧੇ ਐਪ ਨਾਲ ਗੱਲ ਕਰੋ।',
    locationTitle: 'ਬਿਹਤਰ ਅਨੁਮਾਨ', locationDesc: 'ਸਹੀ ਮੌਸਮ, ਰੋਗ ਜੋਖਮ ਅਤੇ ਸਪ੍ਰੇ ਜਾਣਕਾਰੀ ਲਈ ਆਪਣੀ ਲੋਕੇਸ਼ਨ ਦਿਓ।',
    allowBtn: 'ਇਜਾਜ਼ਤ ਦਿਓ', locating: 'ਲੱਭ ਰਹੇ ਹਾਂ...', skipBtn: 'ਹੁਣ ਨਹੀਂ',
    finishTitle: 'ਤਿਆਰ ਹੋ!', finishSub: 'ਤੁਹਾਡਾ AI ਸੈੱਟਅੱਪ ਪੂਰਾ ਹੋ ਗਿਆ।',
    langLabel: 'ਭਾਸ਼ਾ', farmerLabel: 'ਕਿਸਾਨ', locationLabel: 'ਟਿਕਾਣਾ', getStarted: 'ਸ਼ੁਰੂ ਕਰੋ',
    accept: 'ਸਵੀਕਾਰ ਕਰੋ', terms: 'ਵਰਤੋਂ ਦੀਆਂ ਸ਼ਰਤਾਂ', privacy: 'ਗੋਪਨੀਯਤਾ ਨੀਤੀ',
  },
  'मराठी': {
    slide1Title: 'त्वरित रोग ओळख', slide1Desc: 'कॅमेरा उघडा, पान स्कॅन करा, आणि त्वरित रोग, तीव्रता, मात्रा आणि काळजी पाऊले मिळवा।',
    slide2Title: 'शेतकरी समुदाय', slide2Desc: 'स्थानिक शेतकऱ्यांना विचारा, उपाय पाहा आणि वास्तविक शेत उदाहरणे समजा।',
    slide3Title: 'उत्तम उत्पादने', slide3Desc: 'औषध, यंत्रे आणि तज्ञ मदत — सर्व एका ठिकाणी मिळवा।',
    farmerTitle: 'शेतकरी माहिती', farmerSub: 'आम्ही तुमचा सल्ला वैयक्तिक करण्यास मदत करू।',
    nameLabel: 'तुमचे नाव', villageLabel: 'गाव', stateLabel: 'राज्य', farmSizeLabel: 'शेताचा आकार',
    ft1: 'मी शेतात पिके घेतो', ft2: 'मी घरच्या बागेत घेतो', ft3: 'मी कुंडीत घेतो',
    saveContinue: 'जतन करा आणि सुरू ठेवा',
    cropTitle: 'पिके निवडा', cropSub: 'तुम्ही घेत असलेली सर्व पिके निवडा।', selected: 'निवडले', continueBtn: 'सुरू ठेवा',
    voiceTitle: 'आवाज सहाय्यक', voiceSub: 'मराठीत हँड्स-फ्री वापरा.',
    voicePreviewLabel: 'आवाज झलक', hearPreview: 'ऐका',
    voiceToggleLabel: 'आवाज कमांड चालू करा', voiceToggleSub: 'घरून थेट ॲपशी बोला.',
    locationTitle: 'चांगले अंदाज', locationDesc: 'अचूक हवामान, रोग धोका आणि फवारणी माहितीसाठी तुमचे स्थान सामायिक करा.',
    allowBtn: 'परवानगी द्या', locating: 'शोधत आहे...', skipBtn: 'आत्ता नाही',
    finishTitle: 'तयार आहात!', finishSub: 'तुमचे AI सेटअप पूर्ण झाले.',
    langLabel: 'भाषा', farmerLabel: 'शेतकरी', locationLabel: 'स्थान', getStarted: 'सुरू करा',
    accept: 'स्वीकारा', terms: 'वापराच्या अटी', privacy: 'गोपनीयता धोरण',
  },
  'ગુજરાતી': {
    slide1Title: 'તાત્કાલિક રોગ ઓળખ', slide1Desc: 'કૅમેરો ખોલો, પાન સ્કૅન કરો, અને તાત્કાલિક રોગ, ગંભીરતા, માત્રા અને સંભાળ પગલાં મેળવો।',
    slide2Title: 'ખેડૂત સમુદાય', slide2Desc: 'સ્થાનિક ખેડૂતોને પૂછો, ઉકેલ જુઓ અને વાસ્તવિક ખેત ઉદાહરણ સમજો।',
    slide3Title: 'ઉત્તમ ઉત્પાદનો', slide3Desc: 'દવા, મશીન અને નિષ્ણાત મદદ — બધું એક જ જગ્યાએ.',
    farmerTitle: 'ખેડૂત માહિતી', farmerSub: 'અમે તમારી સલાહ વ્યક્તિગત બનાવીશું.',
    nameLabel: 'તમારું નામ', villageLabel: 'ગામ', stateLabel: 'રાજ્ય', farmSizeLabel: 'ખેતની સાઇઝ',
    ft1: 'હું ખેતરમાં પાક ઉગાડું છું', ft2: 'હું ઘરના બગીચામાં ઉગાડું છું', ft3: 'હું ગમલામાં ઉગાડું છું',
    saveContinue: 'સેવ કરો અને ચાલુ રાખો',
    cropTitle: 'છોડ પસંદ કરો', cropSub: 'તમે ઉગાડો છો તે બધા પાક પસંદ કરો.', selected: 'પસંદ', continueBtn: 'ચાલુ રાખો',
    voiceTitle: 'અવાજ સહાયક', voiceSub: 'ગુજરાતીમાં હૅન્ડ્સ-ફ્રી ઉપયોગ.',
    voicePreviewLabel: 'અવાજ ઝલક', hearPreview: 'સાંભળો',
    voiceToggleLabel: 'અવાજ આદેશ ચાલુ કરો', voiceToggleSub: 'ઘરેથી સીધા ઍપ સાથે વાત કરો.',
    locationTitle: 'વધુ સારા અંદાજ', locationDesc: 'ચોક્કસ હવામાન, રોગ જોખમ માટે સ્થાન શૅર કરો.',
    allowBtn: 'પ્રવેશ આપો', locating: 'શોધી રહ્યા છીએ...', skipBtn: 'અત્યારે નહીં',
    finishTitle: 'તૈયાર!', finishSub: 'AI સેટઅપ પૂર્ણ.',
    langLabel: 'ભાષા', farmerLabel: 'ખેડૂત', locationLabel: 'સ્થાન', getStarted: 'શરૂ કરો',
    accept: 'સ્વીકાર કરો', terms: 'ઉપયોગ શરતો', privacy: 'ગોપનીયતા નીતિ',
  },
  'తెలుగు': {
    slide1Title: 'తక్షణ రోగ గుర్తింపు', slide1Desc: 'కెమెరా తెరవండి, ఆకు స్కాన్ చేయండి, తక్షణ రోగం, తీవ్రత, మోతాదు మరియు సంరక్షణ దశలు పొందండి.',
    slide2Title: 'రైతు సమాజం', slide2Desc: 'స్థానిక రైతులను అడగండి, పరిష్కారాలు చూడండి మరియు అసలు పొల ఉదాహరణలు అర్థం చేసుకోండి.',
    slide3Title: 'అద్భుతమైన ఉత్పత్తులు', slide3Desc: 'మందులు, యంత్రాలు మరియు నిపుణుల సహాయం — అన్నీ ఒక చోటే.',
    farmerTitle: 'రైతు వివరాలు', farmerSub: 'మీ సలహాను వ్యక్తిగతీకరించడానికి సహాయం చేయండి.',
    nameLabel: 'మీ పేరు', villageLabel: 'గ్రామం', stateLabel: 'రాష్ట్రం', farmSizeLabel: 'పొల పరిమాణం',
    ft1: 'నేను పొలంలో పంటలు పండిస్తాను', ft2: 'నేను ఇంటి తోటలో పండిస్తాను', ft3: 'నేను కుండీలో పండిస్తాను',
    saveContinue: 'సేవ్ చేసి కొనసాగించు',
    cropTitle: 'మొక్కలు ఎంచుకోండి', cropSub: 'మీరు పండించే పంటలన్నీ ఎంచుకోండి.', selected: 'ఎంపిక', continueBtn: 'కొనసాగించు',
    voiceTitle: 'వాయిస్ సహాయకుడు', voiceSub: 'తెలుగులో హ్యాండ్స్-ఫ్రీ వాడకం.',
    voicePreviewLabel: 'వాయిస్ ప్రివ్యూ', hearPreview: 'వినండి',
    voiceToggleLabel: 'వాయిస్ కమాండ్ ప్రారంభించు', voiceToggleSub: 'ఇంటి నుండి నేరుగా యాప్ తో మాట్లాడండి.',
    locationTitle: 'మెరుగైన అంచనాలు', locationDesc: 'ఖచ్చితమైన వాతావరణం, రోగ ప్రమాదం కోసం స్థానం పంచుకోండి.',
    allowBtn: 'అనుమతి ఇవ్వండి', locating: 'వెతుకుతున్నాం...', skipBtn: 'ఇప్పుడు వద్దు',
    finishTitle: 'సిద్ధంగా ఉన్నారు!', finishSub: 'AI సెటప్ పూర్తయింది.',
    langLabel: 'భాష', farmerLabel: 'రైతు', locationLabel: 'స్థానం', getStarted: 'ప్రారంభించు',
    accept: 'అంగీకరించు', terms: 'వినియోగ నిబంధనలు', privacy: 'గోపనీయతా విధానం',
  },
  'भोजपुरी': {
    slide1Title: 'तुरंत रोग पहचान', slide1Desc: 'कैमरा खोलीं, पत्ती स्कैन करीं, आउर तुरंत बीमारी, खुराक आउर देखभाल के तरीका पाईं।',
    slide2Title: 'किसान समुदाय', slide2Desc: 'स्थानीय किसानन से पूछीं, उपाय देखीं आउर असल खेत के उदाहरण समझीं।',
    slide3Title: 'बढ़िया उत्पाद', slide3Desc: 'दवाई, मशीन आउर बिशेसज्ञ मदद — सब एक जगह पाईं।',
    farmerTitle: 'किसान के जानकारी', farmerSub: 'हम रउरा सलाह के निजी बनाएब।',
    nameLabel: 'रउरा नाम', villageLabel: 'गाँव', stateLabel: 'राज्य', farmSizeLabel: 'खेत के आकार',
    ft1: 'हम खेत में फसल उगाइला', ft2: 'हम घर के बगीचे में उगाइला', ft3: 'हम गमले में उगाइला',
    saveContinue: 'सेव करीं आउर जारी रखीं',
    cropTitle: 'पौधा चुनीं', cropSub: 'उ सब फसल चुनीं जवन रउरा उगाइला।', selected: 'चुनल', continueBtn: 'जारी रखीं',
    voiceTitle: 'आवाज सहायक', voiceSub: 'भोजपुरी में बिना हाथ के उपयोग करीं।',
    voicePreviewLabel: 'आवाज झलक', hearPreview: 'सुनीं',
    voiceToggleLabel: 'आवाज कमांड चालू करीं', voiceToggleSub: 'घर से सीधे ऐप से बात करीं।',
    locationTitle: 'बेहतर अनुमान', locationDesc: 'सटीक मौसम, रोग खतरा खातिर रउरा लोकेशन दीं।',
    allowBtn: 'इजाजत दीं', locating: 'खोजत बाटीं...', skipBtn: 'अभी नाहीं',
    finishTitle: 'तैयार बाड़ीं!', finishSub: 'रउरा AI सेटअप पूरा हो गइल।',
    langLabel: 'भाषा', farmerLabel: 'किसान', locationLabel: 'लोकेशन', getStarted: 'शुरू करीं',
    accept: 'स्वीकार करीं', terms: 'उपयोग शर्त', privacy: 'गोपनीयता नीति',
  },
  'मैथिली': {
    slide1Title: 'तुरंत रोग पहचान', slide1Desc: 'कैमरा खोलीं, पत्ती स्कैन करीं, आउर तुरंत बीमारी, खुराक आउर देखभालक तरीका पाबीं।',
    slide2Title: 'किसान समुदाय', slide2Desc: 'स्थानीय किसान सँ पूछीं, उपाय देखीं आउर असल खेतक उदाहरण बुझीं।',
    slide3Title: 'बढ़िया उत्पाद', slide3Desc: 'दवाई, मशीन आउर विशेषज्ञ मदद — सब एक जगह।',
    farmerTitle: 'किसानक जानकारी', farmerSub: 'हम अपनेक सलाह निजी बनायब।',
    nameLabel: 'अपनेक नाम', villageLabel: 'गाम', stateLabel: 'राज्य', farmSizeLabel: 'खेतक आकार',
    ft1: 'हम खेतमे फसल उगाबैत छी', ft2: 'हम घरक बगैचामे उगाबैत छी', ft3: 'हम गमलामे उगाबैत छी',
    saveContinue: 'सेव करीं आउर जारी राखीं',
    cropTitle: 'पौधा चुनीं', cropSub: 'जे सब फसल उगाबैत छी से सब चुनीं।', selected: 'चुनल', continueBtn: 'जारी राखीं',
    voiceTitle: 'आवाज सहायक', voiceSub: 'मैथिलीमे हैंड्स-फ्री उपयोग।',
    voicePreviewLabel: 'आवाज झलक', hearPreview: 'सुनीं',
    voiceToggleLabel: 'आवाज कमांड चालू करीं', voiceToggleSub: 'घरसँ सीधे ऐपसँ बात करीं।',
    locationTitle: 'बेहतर अनुमान', locationDesc: 'सटीक मौसम, रोग खतराक लेल लोकेशन दीं।',
    allowBtn: 'अनुमति दीं', locating: 'खोजैत छी...', skipBtn: 'अखन नहिं',
    finishTitle: 'तैयार छी!', finishSub: 'AI सेटअप पूरा भेल।',
    langLabel: 'भाषा', farmerLabel: 'किसान', locationLabel: 'लोकेशन', getStarted: 'शुरू करीं',
    accept: 'स्वीकार करीं', terms: 'उपयोग शर्त', privacy: 'गोपनीयता नीति',
  },
};

function getOB(language: string) {
  return OB[language] ?? OB['default'];
}

/* ── Flow: splash → language → intro → farmer → crops → voice → location → finish ── */
const stepOrder = ['splash', 'language', 'intro', 'farmer', 'crops', 'voice', 'location', 'finish'] as const;
type OnboardingStep = (typeof stepOrder)[number];

export default function OnboardingFlow() {
  const { language, setLanguage } = useLanguage();
  const { profile, completeOnboarding, updateProfile } = useFarmerProfile();
  const [step, setStep] = useState<OnboardingStep>('splash');
  const [progress, setProgress] = useState(8);
  const [introIndex, setIntroIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [isSpeakingPreview, setIsSpeakingPreview] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Derive localized strings based on currently selected language
  const S = useMemo(() => getOB(language), [language]);

  // Dynamic intro slides based on S
  const introSlides = useMemo(() => [
    { title: S.slide1Title, description: S.slide1Desc, icon: Leaf, accent: '#34D399' },
    { title: S.slide2Title, description: S.slide2Desc, icon: Sprout, accent: '#60A5FA' },
    { title: S.slide3Title, description: S.slide3Desc, icon: Tractor, accent: '#FBBF24' },
  ], [S]);

  // Farmer types localized
  const farmerTypes = useMemo(() => [S.ft1, S.ft2, S.ft3], [S]);

  const cropOptions = [
    'Wheat', 'Rice', 'Tomato', 'Potato', 'Cotton', 'Sugarcane',
    'Mustard', 'Maize', 'Brinjal', 'Onion', 'Chilli', 'Banana',
    'Soybean', 'Groundnut', 'Gram', 'Jowar',
  ];

  const [draft, setDraft] = useState({
    name: profile.name,
    village: profile.village,
    state: profile.state,
    farmerType: profile.farmerType,
    farmSize: profile.farmSize,
    crops: profile.crops,
    voiceEnabled: profile.voiceEnabled,
    locationAllowed: profile.locationAllowed,
    latitude: profile.latitude,
    longitude: profile.longitude,
  });

  useEffect(() => {
    if (step !== 'splash') return undefined;

    const tick = window.setInterval(() => {
      setProgress((current) => (current >= 96 ? current : current + 11));
    }, 180);

    const timer = window.setTimeout(() => {
      setStep('language');
      setProgress(100);
    }, 1900);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(timer);
    };
  }, [step]);

  useEffect(() => {
    updateProfile({
      name: draft.name,
      village: draft.village,
      state: draft.state,
      farmerType: draft.farmerType,
      farmSize: draft.farmSize,
      crops: draft.crops,
      voiceEnabled: draft.voiceEnabled,
      locationAllowed: draft.locationAllowed,
      latitude: draft.latitude,
      longitude: draft.longitude,
    });
  }, [draft, updateProfile]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentSlide = introSlides[introIndex];
  const currentLanguage = useMemo(() => getLanguageMeta(language), [language]);

  const nextStep = () => {
    const currentIndex = stepOrder.indexOf(step);
    const next = stepOrder[currentIndex + 1];
    if (next) setStep(next);
  };

  const previousStep = () => {
    if (navigator.vibrate) navigator.vibrate(10);
    const currentIndex = stepOrder.indexOf(step);
    const prev = stepOrder[currentIndex - 1];
    if (prev === 'intro') {
      setIntroIndex(introSlides.length - 1);
      setStep('intro');
    } else if (prev) {
      setStep(prev);
    }
  };

  const previousIntro = () => {
    setIntroIndex((current) => (current === 0 ? introSlides.length - 1 : current - 1));
  };

  const nextIntro = () => {
    if (introIndex === introSlides.length - 1) {
      setStep('farmer');
      return;
    }
    setIntroIndex((current) => current + 1);
  };

  const toggleCrop = (crop: string) => {
    setDraft((current) => {
      const exists = current.crops.includes(crop);
      const nextCrops = exists
        ? current.crops.filter((entry) => entry !== crop)
        : [...current.crops, crop];
      return { ...current, crops: nextCrops };
    });
  };

  const speakPreview = () => {
    if (!('speechSynthesis' in window)) return;
    setIsSpeakingPreview(true);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentLanguage.preview);
    utterance.lang = getSpeechLangCode(language);
    utterance.rate = 0.9; // Slightly slower for better clarity
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeakingPreview(false);
    utterance.onerror = () => setIsSpeakingPreview(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeakingPreview(false);
  };

  // Automatic speech when entering voice step
  useEffect(() => {
    if (step === 'voice') {
      const timer = setTimeout(() => {
        speakPreview();
      }, 500); // Small delay for smooth transition
      return () => {
        clearTimeout(timer);
        stopSpeaking();
      };
    }
    return undefined;
  }, [step, language]); // Re-run if language changes while on screen

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setDraft((current) => ({ ...current, locationAllowed: false }));
      nextStep();
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDraft((current) => ({
          ...current,
          locationAllowed: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setIsLocating(false);
        nextStep();
      },
      () => {
        setDraft((current) => ({
          ...current,
          locationAllowed: false,
          latitude: null,
          longitude: null,
        }));
        setIsLocating(false);
        nextStep();
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
      }
    );
  };

  const enterApp = () => {
    const finalCrops = draft.crops.length ? draft.crops : ['Wheat', 'Rice'];
    completeOnboarding({
      name: draft.name.trim() || 'Kishan Kumar',
      village: draft.village.trim() || 'Nalanda',
      state: draft.state.trim() || 'Bihar',
      farmerType: draft.farmerType,
      farmSize: draft.farmSize.trim() || '3.5 acres',
      crops: finalCrops,
      activeCrop: finalCrops[0],
      voiceEnabled: draft.voiceEnabled,
      locationAllowed: draft.locationAllowed,
      latitude: draft.latitude,
      longitude: draft.longitude,
    });
  };

  const stepIndex = stepOrder.indexOf(step);

  return (
    <div 
      className="absolute inset-0 z-[120] overflow-hidden bg-white text-slate-900"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <AnimatePresence mode="wait">
        {step === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex h-full flex-col items-center justify-center px-8 text-center bg-white"
          >
            <div className="relative z-10 flex flex-col items-center gap-6">
              <motion.div
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <AppLogo size={96} />
              </motion.div>
              <div className="space-y-1">
                <p className="text-3xl font-bold tracking-tight text-slate-900">Plant Doctor</p>
                <p className="text-slate-500">Healing your crops</p>
              </div>
              <div className="w-full max-w-[200px] mt-8">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-[#10B981]"
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step !== 'splash' && (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative flex h-full flex-col bg-white"
          >
            {/* ────── LANGUAGE ────── */}
            {step === 'language' && (
              <div className="flex h-full flex-col">
                <div className="flex flex-col items-center text-center pt-10 pb-6 px-6 shrink-0">
                  <div className="flex items-center gap-2">
                    <Leaf size={28} className="text-[#10B981]" fill="#10B981" />
                    <h1 className="text-3xl font-bold text-slate-900">Namaste!</h1>
                  </div>
                  <p className="mt-2 text-slate-600">Select your Plant Doctor language</p>
                </div>


                <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-3 hide-scrollbar">
                  {/* Add pb-32 to ensure last language is visible above sticky button */}
                  {APP_LANGUAGES.map((entry) => {
                    const active = language === entry.name;
                    return (
                      <button
                        key={entry.name}
                        onClick={() => setLanguage(entry.name)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all ${
                          active
                            ? 'border-blue-600 bg-blue-50/30'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="text-xl font-semibold text-slate-800">{entry.label}</p>
                          <p className="text-sm text-slate-500 mt-1">{entry.subtitle}</p>
                        </div>
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                            active
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 bg-transparent text-transparent'
                          }`}
                        >
                          <Check size={14} strokeWidth={3} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 bg-white shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] border-t border-slate-100 sticky bottom-0 z-20">
                  {/* Make button sticky at bottom for mobile UX */}
                  <button
                    onClick={nextStep}
                    className="w-full rounded-full bg-slate-200 px-5 py-4 text-center font-bold text-slate-500 transition-colors focus:bg-blue-600 focus:text-white active:bg-blue-700"
                    style={{ backgroundColor: language ? '#1D4ED8' : undefined, color: language ? 'white' : undefined }}
                  >
                    {S.accept}
                  </button>
                  <p className="mt-4 text-center text-xs text-slate-500 mb-2">
                    I read and accept the <a href="#" className="text-blue-600 font-medium">{S.terms}</a> and the <a href="#" className="text-blue-600 font-medium">{S.privacy}</a>.
                  </p>
                </div>
              </div>
            )}

            {/* ────── INTRO SLIDES ────── */}
            {step === 'intro' && (
              <div className="flex h-full flex-col px-6 pb-6 pt-10">
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="mb-8 p-6 bg-blue-50 rounded-[2rem] text-blue-600">
                    <currentSlide.icon size={48} strokeWidth={2} />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                    {currentSlide.title}
                  </h2>
                  <p className="mt-4 text-lg text-slate-600">
                    {currentSlide.description}
                  </p>
                </div>

                <div className="flex justify-center gap-2 mb-10">
                  {introSlides.map((slide, index) => (
                    <button
                      key={slide.title}
                      onClick={() => setIntroIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        introIndex === index ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'
                      }`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <button
                    onClick={previousIntro}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-600"
                  >
                    {S.continueBtn === 'Continue' ? 'Back' : S.continueBtn.replace('Continue', 'Back')}
                  </button>
                  <button
                    onClick={nextIntro}
                    className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white hover:bg-blue-700 active:scale-95 transition-transform"
                  >
                    {introIndex === introSlides.length - 1 ? S.saveContinue.split(' ')[0] || 'Start' : S.continueBtn}
                  </button>
                </div>
              </div>
            )}

            {/* ────── FARMER PROFILE ────── */}
            {step === 'farmer' && (
              <div className="flex h-full flex-col px-6 pb-6 pt-6">
                <StepHeader onBack={previousStep} onHelp={() => setShowHelp(true)} />
                <div className="mb-4 shrink-0">
                  <h2 className="text-3xl font-bold text-slate-900">{S.farmerTitle}</h2>
                  <p className="mt-2 text-slate-600">{S.farmerSub}</p>
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{S.nameLabel}</label>
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft((c) => ({ ...c, name: e.target.value }))}
                      placeholder="e.g. Kishan Kumar"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{S.villageLabel}</label>
                      <input
                        value={draft.village}
                        onChange={(e) => setDraft((c) => ({ ...c, village: e.target.value }))}
                        placeholder="Nalanda"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{S.stateLabel}</label>
                      <input
                        value={draft.state}
                        onChange={(e) => setDraft((c) => ({ ...c, state: e.target.value }))}
                        placeholder="Bihar"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{S.farmSizeLabel}</label>
                    <input
                      value={draft.farmSize}
                      onChange={(e) => setDraft((c) => ({ ...c, farmSize: e.target.value }))}
                      placeholder="3.5 acres"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 space-y-2.5">
                    {farmerTypes.map((entry) => {
                      const active = draft.farmerType === entry;
                      return (
                        <button
                          key={entry}
                          onClick={() => setDraft((c) => ({ ...c, farmerType: entry }))}
                          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-colors ${
                            active ? 'border-blue-600 bg-blue-50/50 text-blue-900' : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <span className="font-semibold">{entry}</span>
                          <div className={`h-5 w-5 rounded-full border-2 ${active ? 'border-[6px] border-blue-600 bg-white' : 'border-slate-300'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="shrink-0 pt-4 bg-white">
                  <button
                    onClick={nextStep}
                    className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white hover:bg-blue-700 active:scale-95 transition-transform"
                  >
                    {S.saveContinue}
                  </button>
                </div>
              </div>
            )}

            {/* ────── CROP SELECTION ────── */}
            {step === 'crops' && (
              <div className="flex h-full flex-col px-6 pb-6 pt-6">
                <StepHeader onBack={previousStep} onHelp={() => setShowHelp(true)} />
                <div className="mb-4 flex flex-col shrink-0">
                  <h2 className="text-3xl font-bold text-slate-900">{S.cropTitle}</h2>
                  <p className="mt-2 text-slate-600">{S.cropSub}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-semibold text-blue-600">{draft.crops.length} {S.selected}</p>
                    <button
                      onClick={() => {
                        if (draft.crops.length === cropOptions.length) {
                          setDraft(c => ({ ...c, crops: [] }));
                        } else {
                          setDraft(c => ({ ...c, crops: [...cropOptions] }));
                        }
                      }}
                      className="text-xs font-bold px-3 py-1.5 rounded-full border transition-colors"
                      style={{
                        borderColor: draft.crops.length === cropOptions.length ? '#ef4444' : '#2563eb',
                        color: draft.crops.length === cropOptions.length ? '#ef4444' : '#2563eb',
                        background: draft.crops.length === cropOptions.length ? 'rgba(239,68,68,0.06)' : 'rgba(37,99,235,0.06)',
                      }}
                    >
                      {draft.crops.length === cropOptions.length ? '✕ Clear All' : '✓ Select All'}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar pb-2 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    {cropOptions.map((crop) => {
                      const active = draft.crops.includes(crop);
                      return (
                        <button
                          key={crop}
                          onClick={() => toggleCrop(crop)}
                          className={`flex items-center gap-3 rounded-2xl border p-4 transition-all text-left ${
                            active ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-white ${active ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                            {active && <Check size={14} strokeWidth={3} />}
                          </div>
                          <span className={`font-semibold ${active ? 'text-blue-900' : 'text-slate-700'}`}>{crop}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="shrink-0 pt-4 bg-white">
                  <button
                    onClick={nextStep}
                    disabled={!draft.crops.length}
                    className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white shadow-md shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 active:scale-95 transition-transform"
                  >
                    {S.continueBtn}
                  </button>
                </div>
              </div>
            )}

            {/* ────── VOICE ASSISTANT ────── */}
            {step === 'voice' && (
              <div className="flex h-full flex-col px-6 pb-6 pt-6">
                <StepHeader onBack={previousStep} onHelp={() => setShowHelp(true)} />
                <div className="mb-4 shrink-0">
                  <h2 className="text-3xl font-bold text-slate-900">{S.voiceTitle}</h2>
                  <p className="mt-2 text-slate-600">{S.voiceSub}</p>
                </div>

                <div className="flex flex-col flex-1 items-center justify-center space-y-8">
                  <div className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
                      <Mic size={32} />
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">{S.voicePreviewLabel}</p>
                    <p className="text-lg font-bold text-slate-800">&ldquo;{currentLanguage.preview}&rdquo;</p>
                    
                    <button
                      onClick={isSpeakingPreview ? stopSpeaking : speakPreview}
                      className={`mt-6 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-bold shadow-sm transition-all active:scale-95 ${
                        isSpeakingPreview 
                          ? 'border-red-200 bg-red-50 text-red-600' 
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {isSpeakingPreview ? (
                        <>
                          <div className="flex gap-0.5 items-center mr-1">
                            <span className="w-1 h-3 bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-4 bg-red-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-3 bg-red-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          Stop
                        </>
                      ) : (
                        <>
                          <Volume2 size={18} />
                          {S.hearPreview}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="shrink-0 pt-4 space-y-3 bg-white">
                  <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition-colors cursor-pointer hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-900">{S.voiceToggleLabel}</p>
                      <p className="text-sm text-slate-500 mt-1">{S.voiceToggleSub}</p>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={draft.voiceEnabled} onChange={() => setDraft(c => ({...c, voiceEnabled: !c.voiceEnabled}))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                  </label>
                  <button
                    onClick={nextStep}
                    className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white hover:bg-blue-700 active:scale-95 transition-transform"
                  >
                    {S.continueBtn}
                  </button>
                </div>
              </div>
            )}

            {/* ────── LOCATION ────── */}
            {step === 'location' && (
              <div className="flex h-full flex-col px-6 pb-6 pt-6 text-center">
                <StepHeader onBack={previousStep} onHelp={() => setShowHelp(true)} />
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <MapPin size={40} />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">{S.locationTitle}</h2>
                  <p className="mt-4 text-slate-600 mx-4">{S.locationDesc}</p>
                </div>

                <div className="grid gap-3 shrink-0">
                  <button
                    onClick={requestLocation}
                    disabled={isLocating}
                    className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white shadow-md shadow-blue-600/20 disabled:opacity-60 hover:bg-blue-700 active:scale-95 transition-transform"
                  >
                    {isLocating ? S.locating : S.allowBtn}
                  </button>
                  <button
                    onClick={nextStep}
                    className="w-full rounded-2xl border border-slate-200 px-5 py-4 font-bold text-slate-500 hover:bg-slate-50"
                  >
                    {S.skipBtn}
                  </button>
                </div>
              </div>
            )}

            {/* ────── FINISH ────── */}
            {step === 'finish' && (
              <div className="flex h-full flex-col px-6 pb-6 pt-6">
                <StepHeader onBack={previousStep} onHelp={() => setShowHelp(true)} />
                <div className="flex-1 flex flex-col items-center justify-center">
                  <AppLogo size={80} className="mb-6" />
                  <h2 className="text-3xl font-bold text-slate-900 text-center">{S.finishTitle}</h2>
                  <p className="mt-2 text-slate-500 text-center">{S.finishSub}</p>

                  <div className="w-full mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-4">
                    <SummaryRow label={S.langLabel} value={currentLanguage.label} />
                    <SummaryRow label={S.farmerLabel} value={`${draft.name || 'Kishan'} (${draft.farmerType})`} />
                    <SummaryRow label={S.locationLabel} value={`${draft.village || 'City'}, ${draft.state || 'State'}`} />
                    <div className="flex wrap gap-2 pt-2 border-t border-slate-200">
                      {draft.crops.map(c => (
                        <span key={c} className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md">{c}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-6">
                  <button
                    onClick={enterApp}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#10B981] px-5 py-4 font-bold text-white shadow-md shadow-[#10B981]/20 hover:bg-emerald-600 active:scale-95 transition-transform"
                  >
                    {S.getStarted} <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────── HELP MODAL ────── */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="relative w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl"
            >
              <div className="absolute right-4 top-4">
                <button
                  onClick={() => setShowHelp(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <HelpCircle size={28} />
              </div>

              <h3 className="text-2xl font-bold text-slate-900">Need Help?</h3>
              <p className="mt-2 text-sm text-slate-600 font-medium">
                If you are facing any problem with the app, onboarding, or the market, please reach out to us directly. We are here to help you 24/7.
              </p>

              <div className="mt-8 space-y-3">
                <a
                  href="tel:8228858145"
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-600 hover:bg-blue-50/50"
                  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <PhoneCall size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Call Us</p>
                    <p className="font-bold text-slate-800">8228858145</p>
                  </div>
                </a>

                <a
                  href="mailto:ayushpandey10851@gmail.com"
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-600 hover:bg-blue-50/50"
                  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Us</p>
                    <p className="truncate font-bold text-slate-800 text-sm">ayushpandey10851@gmail.com</p>
                  </div>
                </a>
              </div>
              
              <button
                onClick={() => setShowHelp(false)}
                className="mt-6 w-full rounded-2xl bg-blue-600 py-3.5 font-bold text-white shadow-md shadow-blue-600/20 active:scale-95 transition-transform"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepHeader({ onBack, onHelp }: { onBack: () => void, onHelp: () => void }) {
  return (
    <div className="flex items-center justify-between shrink-0 mb-6 w-full">
      <button 
        onClick={onBack} 
        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm active:scale-95 transition-transform"
      >
        <ChevronLeft size={22} />
      </button>
      <button 
        onClick={onHelp} 
        className="flex h-10 px-4 items-center gap-1.5 rounded-full border border-slate-200 bg-white text-slate-600 font-bold text-sm shadow-sm active:scale-95 transition-transform hover:bg-slate-50"
      >
         <HelpCircle size={16} />
         Help
      </button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="text-right text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}
