/**
 * Crop Guide Component
 * Comprehensive crop recommendations, seasonal planning, and market insights
 */

'use client';

import { useState } from 'react';
import { Zap, Droplets, Sun, Wind, AlertCircle, type LucideIcon } from 'lucide-react';

interface CropInfo {
  name: string;
  season: string;
  daysToMaturity: number;
  waterNeeds: string;
  soilType: string;
  idealTemp: { min: number; max: number };
  spacing: string;
  yield: string;
  pests: string[];
  diseases: string[];
  marketDemand: 'High' | 'Medium' | 'Low';
  price: number; // INR per kg
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const CROPS_DATABASE: { [key: string]: CropInfo } = {
  Tomato: {
    name: 'Tomato',
    season: 'Kharif & Rabi',
    daysToMaturity: 60,
    waterNeeds: 'Moderate (500-600mm)',
    soilType: 'Well-drained loam',
    idealTemp: { min: 20, max: 30 },
    spacing: '45cm x 60cm',
    yield: '25-30 tons/hectare',
    pests: ['Fruit borer', 'Aphids', 'Whitefly'],
    diseases: ['Early blight', 'Late blight', 'Fusarium wilt'],
    marketDemand: 'High',
    price: 25,
    difficulty: 'Medium',
  },
  Potato: {
    name: 'Potato',
    season: 'Rabi',
    daysToMaturity: 90,
    waterNeeds: 'Moderate (500mm)',
    soilType: 'Well-drained loam, light soil',
    idealTemp: { min: 15, max: 25 },
    spacing: '20cm x 60cm',
    yield: '20-25 tons/hectare',
    pests: ['Colorado beetle', 'Aphids'],
    diseases: ['Late blight', 'Early blight', 'Scab'],
    marketDemand: 'High',
    price: 20,
    difficulty: 'Easy',
  },
  Onion: {
    name: 'Onion',
    season: 'Kharif & Rabi',
    daysToMaturity: 120,
    waterNeeds: 'Moderate (400-500mm)',
    soilType: 'Well-drained loam',
    idealTemp: { min: 10, max: 25 },
    spacing: '15cm x 30cm',
    yield: '20-25 tons/hectare',
    pests: ['Thrips', 'Pink root rot'],
    diseases: ['Purple blotch', 'Fusarium basal rot'],
    marketDemand: 'High',
    price: 30,
    difficulty: 'Medium',
  },
  Pepper: {
    name: 'Bell Pepper',
    season: 'Kharif & Rabi',
    daysToMaturity: 150,
    waterNeeds: 'High (750-900mm)',
    soilType: 'Well-drained loam',
    idealTemp: { min: 21, max: 29 },
    spacing: '45cm x 60cm',
    yield: '20-25 tons/hectare',
    pests: ['Fruit borer', 'Spider mites'],
    diseases: ['Anthracnose', 'Bacterial spot'],
    marketDemand: 'High',
    price: 40,
    difficulty: 'Hard',
  },
  Wheat: {
    name: 'Wheat',
    season: 'Rabi',
    daysToMaturity: 120,
    waterNeeds: 'Low (400-500mm)',
    soilType: 'Well-drained loam, clay loam',
    idealTemp: { min: 12, max: 28 },
    spacing: '20cm rows',
    yield: '4-5 tons/hectare',
    pests: ['Armyworm', 'Termites'],
    diseases: ['Rust', 'Loose smut'],
    marketDemand: 'High',
    price: 22,
    difficulty: 'Easy',
  },
  Rice: {
    name: 'Rice',
    season: 'Kharif',
    daysToMaturity: 120,
    waterNeeds: 'High (1000-1500mm)',
    soilType: 'Clayey, alluvial',
    idealTemp: { min: 20, max: 32 },
    spacing: '20cm x 15cm',
    yield: '5-6 tons/hectare',
    pests: ['Brown plant hopper', 'Stem borer'],
    diseases: ['Blast', 'Brown leaf spot'],
    marketDemand: 'High',
    price: 28,
    difficulty: 'Medium',
  },
  Maize: {
    name: 'Maize',
    season: 'Kharif & Rabi',
    daysToMaturity: 100,
    waterNeeds: 'Moderate (500-750mm)',
    soilType: 'Well-drained loam',
    idealTemp: { min: 20, max: 30 },
    spacing: '60cm x 25cm',
    yield: '8-10 tons/hectare',
    pests: ['Fall armyworm', 'Corn borer'],
    diseases: ['Turcicum leaf blight', 'Anthracnose'],
    marketDemand: 'High',
    price: 18,
    difficulty: 'Easy',
  },
  Chickpea: {
    name: 'Chickpea',
    season: 'Rabi',
    daysToMaturity: 100,
    waterNeeds: 'Low (400mm)',
    soilType: 'Well-drained loam',
    idealTemp: { min: 15, max: 25 },
    spacing: '30cm x 10cm',
    yield: '2-2.5 tons/hectare',
    pests: ['Pod borer', 'Gram caterpillar'],
    diseases: ['Ascochyta blight', 'Wilt'],
    marketDemand: 'High',
    price: 60,
    difficulty: 'Easy',
  },
  Cotton: {
    name: 'Cotton',
    season: 'Kharif',
    daysToMaturity: 180,
    waterNeeds: 'High (600-1000mm)',
    soilType: 'Well-drained loam, black soil',
    idealTemp: { min: 21, max: 30 },
    spacing: '90cm x 45cm',
    yield: '15-20 quintals/hectare',
    pests: ['Bollworm', 'Whitefly'],
    diseases: ['Wilt', 'Leaf curl virus'],
    marketDemand: 'High',
    price: 500, // per quintal
    difficulty: 'Hard',
  },
};

const SEASONAL_CROPS: Record<string, string[]> = {
  Kharif: ['Rice', 'Maize', 'Cotton', 'Tomato'],
  Rabi: ['Wheat', 'Potato', 'Chickpea', 'Onion'],
  'Summer/Zaid': ['Watermelon', 'Muskmelon', 'Vegetables'],
};

export function CropGuide() {
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato');
  const [selectedSeason, setSelectedSeason] = useState<string>('Kharif');
  const crop = CROPS_DATABASE[selectedCrop];

  return (
    <div className="space-y-6">
      {/* Season Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🌾 Crop Selection</h2>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Season</label>
          <div className="flex gap-3">
            {Object.keys(SEASONAL_CROPS).map((season) => (
              <button
                key={season}
                onClick={() => setSelectedSeason(season)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedSeason === season
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {season}
              </button>
            ))}
          </div>
        </div>

        {/* Seasonal Crops */}
        <div className="mb-6">
          <p className="text-sm text-gray-700 mb-3">
            <strong>Crops suitable for {selectedSeason}:</strong>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SEASONAL_CROPS[selectedSeason]?.map((cropName: string) => (
              <button
                key={cropName}
                onClick={() => setSelectedCrop(cropName)}
                className={`p-3 rounded-lg transition font-semibold ${
                  selectedCrop === cropName
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cropName}
              </button>
            ))}
          </div>
        </div>

        {/* All Available Crops */}
        <details className="bg-gray-50 p-4 rounded-lg">
          <summary className="font-semibold text-gray-700 cursor-pointer">
            All Available Crops ({Object.keys(CROPS_DATABASE).length})
          </summary>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {Object.keys(CROPS_DATABASE).map((cropName) => (
              <button
                key={cropName}
                onClick={() => setSelectedCrop(cropName)}
                className={`p-2 rounded text-sm transition ${
                  selectedCrop === cropName
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-green-300'
                }`}
              >
                {cropName}
              </button>
            ))}
          </div>
        </details>
      </div>

      {/* Crop Details */}
      {crop && (
        <>
          {/* Header Card */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg shadow p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-3xl font-bold">{crop.name}</h2>
                <p className="text-green-100 mt-1">Season: {crop.season}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">₹{crop.price}/kg</div>
                <div className="text-green-100">Market Price</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/20 rounded p-3">
                <p className="text-green-100 text-sm">Days to Maturity</p>
                <p className="text-2xl font-bold">{crop.daysToMaturity}</p>
              </div>
              <div className="bg-white/20 rounded p-3">
                <p className="text-green-100 text-sm">Difficulty</p>
                <p className="text-2xl font-bold">{crop.difficulty}</p>
              </div>
              <div className="bg-white/20 rounded p-3">
                <p className="text-green-100 text-sm">Market Demand</p>
                <p className="text-2xl font-bold">{crop.marketDemand}</p>
              </div>
            </div>
          </div>

          {/* Growing Requirements */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🌱 Growing Requirements</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RequirementCard
                icon={Sun}
                label="Temperature"
                value={`${crop.idealTemp.min}°C - ${crop.idealTemp.max}°C`}
              />
              <RequirementCard
                icon={Droplets}
                label="Water Needs"
                value={crop.waterNeeds}
              />
              <RequirementCard
                icon={Wind}
                label="Soil Type"
                value={crop.soilType}
              />
              <RequirementCard
                icon={Zap}
                label="Spacing"
                value={crop.spacing}
              />
            </div>

            <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="font-semibold text-blue-900 mb-2">📊 Expected Yield</p>
              <p className="text-blue-800">{crop.yield}</p>
            </div>
          </div>

          {/* Pest & Disease Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pests */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🐛</span> Common Pests
              </h3>
              <div className="space-y-3">
                {crop.pests.map((pest, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-orange-50 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <span className="text-gray-800">{pest}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                <strong>Control:</strong> Use organic pesticides, neem oil, or integrated pest management.
              </div>
            </div>

            {/* Diseases */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🦠</span> Common Diseases
              </h3>
              <div className="space-y-3">
                {crop.diseases.map((disease, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-gray-800">{disease}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                <strong>Prevention:</strong> Use disease-resistant varieties, crop rotation, and fungicides.
              </div>
            </div>
          </div>

          {/* Profitability Analysis */}
          <ProfitabilityAnalysis crop={crop} />

          {/* Farming Calendar */}
          <FarmingCalendar crop={crop} />

          {/* Tips & Best Practices */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">💡 Expert Tips</h3>

            <div className="space-y-3">
              <TipCard>
                Prepare soil 2-3 weeks before planting with organic compost.
              </TipCard>
              <TipCard>
                Use certified seeds from authorized dealers to avoid diseases.
              </TipCard>
              <TipCard>
                Monitor weather forecasts and plan irrigation accordingly.
              </TipCard>
              <TipCard>
                Practice crop rotation to prevent soil-borne diseases.
              </TipCard>
              <TipCard>
                Use drip irrigation for 20-30% water savings and better yield.
              </TipCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RequirementCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-green-600" />
        <p className="font-semibold text-gray-800">{label}</p>
      </div>
      <p className="text-gray-700">{value}</p>
    </div>
  );
}

function ProfitabilityAnalysis({ crop }: { crop: CropInfo }) {
  const costPerHectare = 40000; // Average cost
  const yieldValue = crop.name === 'Cotton' ? 75000 : 60000; // Rough value
  const profit = yieldValue - costPerHectare;
  const roiNum = (profit / costPerHectare) * 100;
  const roi = roiNum.toFixed(0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Profitability Analysis</h3>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Cost/Hectare</p>
          <p className="text-2xl font-bold text-blue-600">₹{costPerHectare.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Revenue/Hectare</p>
          <p className="text-2xl font-bold text-green-600">₹{yieldValue.toLocaleString()}</p>
        </div>
        <div className={`rounded-lg p-4 ${profit > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className="text-sm text-gray-600">Net Profit</p>
          <p className={`text-2xl font-bold ${profit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ₹{profit.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
        <p className="font-semibold text-gray-800 mb-2">ROI: {roi}%</p>
        <p className="text-sm text-gray-700">
          {roiNum >= 50 ? '✅ Excellent profitability' : roiNum >= 20 ? '👍 Good profitability' : '⚠️ Check market conditions'}
        </p>
      </div>
    </div>
  );
}

function FarmingCalendar({ crop }: { crop: CropInfo }) {
  const stages = [
    { month: 'Month 1', activity: 'Soil preparation & seed selection' },
    { month: 'Month 2', activity: 'Sowing & germination' },
    { month: 'Month 3', activity: 'Vegetative growth & fertilizer application' },
    { month: 'Month 4', activity: 'Flowering & pest management' },
    { month: 'Month 5', activity: 'Fruit formation & irrigation' },
    { month: 'Month 6', activity: 'Harvesting & post-harvest management' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📅 Farming Calendar</h3>

      <div className="space-y-2">
        {stages
          .slice(0, Math.ceil(crop.daysToMaturity / 30))
          .map((stage, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
              <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                {idx + 1}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{stage.month}</p>
                <p className="text-sm text-gray-600">{stage.activity}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function TipCard({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
      <span className="text-lg">💡</span>
      <p className="text-gray-800">{children}</p>
    </div>
  );
}
