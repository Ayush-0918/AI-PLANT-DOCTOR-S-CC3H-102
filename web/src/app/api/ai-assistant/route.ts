import { NextRequest, NextResponse } from 'next/server';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT: Record<string, string> = {
  English: `You are an expert AI agricultural assistant called "Plant Doctor AI" for Indian farmers. 
Answer questions about: crop diseases, fertilizers, pesticides, weather impact on crops, market prices, farming techniques, and irrigation.
Keep answers SHORT (2-4 sentences max), practical, and specific to Indian agriculture.
If asked to navigate/open a page like "open scan" or "open shop", respond with: NAVIGATE:/scanner or NAVIGATE:/marketplace or NAVIGATE:/community etc.
Always be helpful, warm, and farmer-friendly.`,

  'हिंदी': `आप "Plant Doctor AI" नाम के भारतीय किसानों के लिए एक विशेषज्ञ AI कृषि सहायक हैं।
फसल रोग, खाद, कीटनाशक, मौसम प्रभाव, मंडी भाव, खेती तकनीक और सिंचाई के बारे में सवालों का जवाब दें।
जवाब छोटे (2-4 वाक्य), व्यावहारिक और भारतीय खेती के लिए उपयुक्त रखें।
अगर कोई "स्कैन खोलो" या "दुकान खोलो" जैसा कहे तो जवाब दें: NAVIGATE:/scanner या NAVIGATE:/marketplace
हमेशा मददगार और किसान-मित्रवत रहें। हिंदी में जवाब दें।`,

  'भोजपुरी': `रउआ "Plant Doctor AI" नाम के भारतीय किसान लोगन के खातिर एक विशेषज्ञ AI कृषि सहायक बानीं।
फसल रोग, खाद, कीड़ा मार दवा, मौसम, मंडी भाव, खेती तरीका के बारे में जवाब दीं।
जवाब छोट (2-4 वाक्य) आउर व्यावहारिक रखीं।
अगर "स्कैन खोलीं" या "बाजार खोलीं" कहे तो: NAVIGATE:/scanner या NAVIGATE:/marketplace बोलीं।
हमेशा मददगार रहीं। भोजपुरी में जवाब दीं।`,

  'ਪੰਜਾਬੀ': `ਤੁਸੀਂ "Plant Doctor AI" ਨਾਮ ਦੇ ਭਾਰਤੀ ਕਿਸਾਨਾਂ ਲਈ ਇੱਕ ਮਾਹਰ AI ਖੇਤੀ ਸਹਾਇਕ ਹੋ।
ਫ਼ਸਲ ਰੋਗ, ਖਾਦ, ਕੀਟਨਾਸ਼ਕ, ਮੌਸਮ, ਮੰਡੀ ਭਾਅ ਅਤੇ ਖੇਤੀ ਤਕਨੀਕਾਂ ਬਾਰੇ ਜਵਾਬ ਦਿਓ।
ਜਵਾਬ ਛੋਟੇ (2-4 ਵਾਕ) ਅਤੇ ਵਿਹਾਰਕ ਰੱਖੋ।
ਜੇ "ਸਕੈਨ ਖੋਲੋ" ਕਹੇ ਤਾਂ: NAVIGATE:/scanner ਕਹੋ।
ਹਮੇਸ਼ਾ ਮਦਦਗਾਰ ਰਹੋ। ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ।`,
};

const NAV_FALLBACK: Record<string, Record<string, string>> = {
  English: { scan: '/scanner', scanner: '/scanner', shop: '/marketplace', market: '/marketplace', community: '/community', profile: '/profile', home: '/dashboard', soil: '/soil' },
  'हिंदी': { स्कैन: '/scanner', दुकान: '/marketplace', बाज़ार: '/marketplace', समुदाय: '/community', घर: '/dashboard', मिट्टी: '/soil' },
  'भोजपुरी': { स्कैन: '/scanner', बाजार: '/marketplace', घर: '/dashboard' },
  'ਪੰਜਾਬੀ': { ਸਕੈਨ: '/scanner', ਦੁਕਾਨ: '/marketplace', ਘਰ: '/dashboard' },
};

function checkNavIntent(text: string, lang: string): string | null {
  const lower = text.toLowerCase();
  const navMap = { ...NAV_FALLBACK['English'], ...(NAV_FALLBACK[lang] || {}) };
  for (const [key, route] of Object.entries(navMap)) {
    if (lower.includes(key.toLowerCase())) return route;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { query, language } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json({ error: 'GEMINI_KEY_MISSING' }, { status: 503 });
    }

    // Quick nav intent check before hitting Gemini
    const navRoute = checkNavIntent(query, language);

    const systemPrompt = SYSTEM_PROMPT[language] || SYSTEM_PROMPT['English'];

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nFarmer says: "${query}"` }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 200,
        topP: 0.8,
      },
    };

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini error:', err);
      return NextResponse.json({ error: 'GEMINI_API_ERROR', detail: err }, { status: 500 });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Check if Gemini itself returned a nav intent
    const navMatch = text.match(/NAVIGATE:(\/\w+)/);
    if (navMatch) {
      return NextResponse.json({ navigate: navMatch[1], text: '' });
    }
    if (navRoute) {
      return NextResponse.json({ navigate: navRoute, text: '' });
    }

    return NextResponse.json({ text: text.trim() });
  } catch (err) {
    console.error('AI assistant error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
