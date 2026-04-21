/**
 * Disease mapping and treatment database
 * Maps PlantVillage disease class IDs to:
 * - Human-readable disease names
 * - Treatment protocols (medicine, dosage, instructions)
 * - Multi-language labels
 */

// 38 PlantVillage crop disease classes
export const PLANTVILLAGE_CLASSES: { [key: string]: number } = {
  'Apple___Apple_scab': 0,
  'Apple___Black_rot': 1,
  'Apple___Cedar_apple_rust': 2,
  'Apple___healthy': 3,
  'Blueberry___healthy': 4,
  'Cherry_(including_sour)___Powdery_mildew': 5,
  'Cherry_(including_sour)___healthy': 6,
  'Corn_(maize)___Cercospora_leaf_spot': 7,
  'Corn_(maize)___Common_rust': 8,
  'Corn_(maize)___healthy': 9,
  'Corn_(maize)___Northern_Leaf_Blight': 10,
  'Grape___Black_rot': 11,
  'Grape___Esca_(Black_Measles)': 12,
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': 13,
  'Grape___healthy': 14,
  'Orange___Haunglongbing_(Citrus_greening)': 15,
  'Peach___Bacterial_spot': 16,
  'Peach___healthy': 17,
  'Pepper,_bell___Bacterial_spot': 18,
  'Pepper,_bell___healthy': 19,
  'Potato___Early_blight': 20,
  'Potato___healthy': 21,
  'Potato___Late_blight': 22,
  'Raspberry___healthy': 23,
  'Soybean___healthy': 24,
  'Squash___Powdery_mildew': 25,
  'Strawberry___healthy': 26,
  'Strawberry___Leaf_scorch': 27,
  'Tomato___Bacterial_spot': 28,
  'Tomato___Early_blight': 29,
  'Tomato___healthy': 30,
  'Tomato___Late_blight': 31,
  'Tomato___Leaf_Mold': 32,
  'Tomato___Septoria_leaf_spot': 33,
  'Tomato___Spider_mites': 34,
  'Tomato___Target_Spot': 35,
  'Tomato___Tomato_mosaic_virus': 36,
  'Tomato___Yellow_Leaf_Curl_Virus': 37,
};

// Treatment protocols for each disease
export const PLANT_TREATMENTS: {
  [key: string]: {
    medicine: string;
    dosage: string;
    instructions: string;
    pesticide?: string;
  };
} = {
  'Apple___Apple_scab': {
    medicine: 'Mancozeb / Captan',
    dosage: '2g per Liter water',
    instructions:
      'Spray every 10-14 days from bud break to harvest. Remove infected leaves. Prune for air circulation.',
  },
  'Apple___Black_rot': {
    medicine: 'Benomyl / Triadimefon',
    dosage: '1.5g per Liter water',
    instructions:
      'Spray 2-3 times at 2-week intervals. Remove cankers. Practice crop rotation.',
  },
  'Apple___Cedar_apple_rust': {
    medicine: 'Myclobutanil / Triflumizole',
    dosage: '1g per Liter water',
    instructions:
      'Apply fungicide at petal fall and repeat every 10-14 days. Remove alternate host plants.',
  },
  'Cherry_(including_sour)___Powdery_mildew': {
    medicine: 'Sulfur / Potassium bicarbonate',
    dosage: '2-3g per Liter water',
    instructions:
      'Spray weekly from budbreak to harvest. Improve air circulation. Avoid overhead irrigation.',
  },
  'Corn_(maize)___Cercospora_leaf_spot': {
    medicine: 'Pyraclostrobin / Azoxystrobin',
    dosage: '1.2ml per Liter water',
    instructions:
      'Apply when disease appears. Repeat every 14 days. Rotate with non-susceptible crops.',
  },
  'Corn_(maize)___Common_rust': {
    medicine: 'Mancozeb',
    dosage: '2.5g per Liter water',
    instructions:
      'Spray when rust appears. Plant resistant varieties. Remove infected leaves.',
  },
  'Corn_(maize)___Northern_Leaf_Blight': {
    medicine: 'Propiconazole / Tebuconazole',
    dosage: '1ml per Liter water',
    instructions:
      'Apply at first sign. Repeat every 14 days. Use disease-resistant hybrids.',
  },
  'Grape___Black_rot': {
    medicine: 'Mancozeb / Sulfur',
    dosage: '2.5g per Liter water',
    instructions:
      'Spray at bud break, 3x per season. Remove infected fruit. Prune for air circulation.',
  },
  'Grape___Esca_(Black_Measles)': {
    medicine: 'Copper sulfate / Sodium hypochlorite',
    dosage: '2g per Liter water',
    instructions:
      'Difficult to treat. Remove infected vines. Sterilize pruning tools. Apply wound dressing to cuts.',
  },
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {
    medicine: 'Mancozeb / Chlorothalonil',
    dosage: '2.5g per Liter water',
    instructions:
      'Spray weekly during growing season. Improve drainage. Remove infected leaves.',
  },
  'Orange___Haunglongbing_(Citrus_greening)': {
    medicine: 'No effective cure. Prevention: Imidacloprid',
    dosage: '2.5ml per Liter water',
    instructions:
      'Control Asian citrus psyllid vector. Remove infected trees. Plant disease-free nursery stock.',
  },
  'Peach___Bacterial_spot': {
    medicine: 'Copper fungicide / Streptomycin',
    dosage: '2g copper per Liter water',
    instructions:
      'Spray at bud break and post-harvest. Prune infected branches. Use resistant varieties.',
  },
  'Pepper,_bell___Bacterial_spot': {
    medicine: 'Copper hydroxide / Bacillus subtilis',
    dosage: '2-3g per Liter water',
    instructions:
      'Apply preventively. Space plants for air circulation. Avoid overhead irrigation. Remove infected plants.',
  },
  'Potato___Early_blight': {
    medicine: 'Mancozeb / Chlorothalonil',
    dosage: '2-2.5g per Liter water',
    instructions:
      'Start spraying when disease appears. Repeat every 7-10 days. Remove lower infected leaves.',
  },
  'Potato___Late_blight': {
    medicine: 'Metalaxyl-M / Mancozeb',
    dosage: '2g per Liter water',
    instructions:
      'Critical disease! Spray immediately when symptoms appear. Repeat every 7 days. Destroy infected plants.',
  },
  'Strawberry___Leaf_scorch': {
    medicine: 'Copper fungicide / Sulfur',
    dosage: '2g per Liter water',
    instructions:
      'Remove infected leaves and plants. Apply fungicide. Improve air circulation. Rotate beds.',
  },
  'Tomato___Bacterial_spot': {
    medicine: 'Copper hydroxide / Bacillus subtilis',
    dosage: '2-3g per Liter water',
    instructions:
      'Spray preventively and when symptoms appear. Space plants. Remove infected fruit and leaves. Use resistant varieties.',
  },
  'Tomato___Early_blight': {
    medicine: 'Mancozeb / Chlorothalonil',
    dosage: '2-2.5g per Liter water',
    instructions:
      'Remove infected leaves. Spray when disease appears. Repeat every 7-10 days. Mulch to prevent soil splash.',
  },
  'Tomato___Late_blight': {
    medicine: 'Metalaxyl-M / Mancozeb',
    dosage: '2g per Liter water',
    instructions:
      'CRITICAL! Spray immediately when spotted. Repeat every 7 days. Remove infected plants. Destroy plant debris.',
  },
  'Tomato___Leaf_Mold': {
    medicine: 'Sulfur / Potassium bicarbonate',
    dosage: '2-3g per Liter water',
    instructions:
      'Improve air circulation. Remove infected leaves. Spray weekly. Reduce humidity. Use resistant varieties.',
  },
  'Tomato___Septoria_leaf_spot': {
    medicine: 'Mancozeb / Chlorothalonil',
    dosage: '2-2.5g per Liter water',
    instructions:
      'Remove infected leaves. Spray when disease appears. Repeat every 7-10 days. Sterilize pruning tools.',
  },
  'Tomato___Spider_mites': {
    medicine: 'Sulfur / Neem Oil',
    dosage: '2-3g per Liter (Sulfur), 3% (Neem)',
    instructions:
      'Spray undersides of leaves. Repeat every 5-7 days. Increase humidity. Remove heavily infested leaves.',
  },
  'Tomato___Target_Spot': {
    medicine: 'Mancozeb / Chlorothalonil',
    dosage: '2.5g per Liter water',
    instructions:
      'Remove infected leaves. Spray when disease appears. Repeat every 10 days. Improve air circulation.',
  },
  'Tomato___Tomato_mosaic_virus': {
    medicine: 'No cure. Prevention: Control aphids with Imidacloprid',
    dosage: '2.5ml per Liter water',
    instructions:
      'Rogue infected plants immediately. Disinfect tools with bleach (1:10). Plant virus-resistant varieties. Control aphid vectors.',
  },
  'Tomato___Yellow_Leaf_Curl_Virus': {
    medicine: 'No cure. Prevention: Insecticidal soap / Spinosad',
    dosage: '2-3g per Liter (soap), 1ml per Liter (Spinosad)',
    instructions:
      'Remove infected plants immediately. Control whitefly vectors with insecticide. Plant resistant varieties.',
  },
};

// Multi-language disease labels (for future internationalization)
export const DISEASE_LABELS_I18N: {
  [key: string]: { [language: string]: string };
} = {
  'Apple___Apple_scab': {
    en: 'Apple Scab',
    hi: 'सेब का दाद',
  },
  'Tomato___Early_blight': {
    en: 'Tomato Early Blight',
    hi: 'टमाटर का प्रारंभिक अंगमारी',
  },
  'Potato___Late_blight': {
    en: 'Potato Late Blight',
    hi: 'आलू का देर से आने वाली अंगमारी',
  },
  // Add more languages as needed
};
