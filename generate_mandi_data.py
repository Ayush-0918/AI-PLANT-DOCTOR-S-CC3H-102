import pandas as pd  # type: ignore[import]
import numpy as np  # type: ignore[import]
from datetime import datetime, timedelta
import matplotlib.pyplot as plt  # type: ignore[import]

# Configuration
num_rows = 50000
states = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Maharashtra', 'Rajasthan']
districts = {
    'Punjab': ['Ludhiana', 'Amritsar', 'Patiala'], 
    'Haryana': ['Karnal', 'Ambala'], 
    'Uttar Pradesh': ['Lucknow', 'Bareilly'],
    'Maharashtra': ['Pune', 'Nashik'],
    'Rajasthan': ['Jaipur', 'Kota']
}
commodities = ['Wheat', 'Rice', 'Potato', 'Tomato', 'Onion']

data = []
start_date = datetime(2023, 6, 6)

print("🏭 Generating 50,000 rows of 'Billion-Dollar' Mandi Intelligence...")

for i in range(num_rows):
    state = np.random.choice(states)
    dist = np.random.choice(districts.get(state, ['Other']))
    comm = np.random.choice(commodities)
    
    # 1. Base Prices
    base_price = 2000 if comm == 'Wheat' else 3500 if comm == 'Rice' else 1200 if comm == 'Potato' else 1500 if comm == 'Onion' else 800
    
    # Generate Date
    date_val = start_date + timedelta(days=np.random.randint(0, 1000))
    month = date_val.month
    
    # 2. Seasonal Variation (Sine wave approximation)
    season_multiplier = 1.0 + (0.3 * np.sin((month - 1) * (np.pi / 6))) # Fluctuate by +/- 30% based on month
    
    # 3. Weather Impact
    temperature = np.random.normal(loc=28, scale=5) if month in [4,5,6,7,8] else np.random.normal(loc=18, scale=6)
    rainfall = np.random.exponential(scale=20) if month in [7,8,9] else np.random.exponential(scale=5)
    
    weather_multiplier = 1.0
    if rainfall > 50:
        weather_multiplier += 0.15 # Heavy rain damages crops, prices go up
    if temperature > 38:
        weather_multiplier += 0.10 # Heatwave scarcity

    # 4. Final Modal Price Simulation
    real_fluctuation = np.random.randint(-150, 150)
    modal = max(500, int(base_price * season_multiplier * weather_multiplier) + real_fluctuation)
    
    # 5. AI Prediction (Adding futuristic realism)
    ai_predicted = modal + np.random.randint(-50, 50)
    ai_confidence = round(np.random.uniform(85.5, 99.2), 1)

    data.append({
        'STATE': state,
        'District Name': dist,
        'Market Name': f"{dist} Global Mandi",
        'Commodity': comm,
        'Variety': 'Premium',
        'Grade': 'A-Grade',
        'Temperature_C': round(temperature, 1),
        'Rainfall_mm': round(rainfall, 1),
        'Min_Price': modal - 150,
        'Max_Price': modal + 120,
        'Modal_Price': modal,
        'AI_Predicted_Price': ai_predicted,
        'AI_Confidence_%': ai_confidence,
        'Price Date': date_val.strftime('%Y-%m-%d')
    })

df = pd.DataFrame(data)
df.to_csv('Agriculture_price_dataset.csv', index=False)
print("✅ Done! 'Agriculture_price_dataset.csv' with AI Predictions & Weather Impact is ready.")

# 6. Graph Add Kar (Super Win)
print("📉 Generating Predictive Trend Graph...")
df['Price Date'] = pd.to_datetime(df['Price Date'])
sample_df = df[(df['Commodity'] == 'Wheat') & (df['District Name'] == 'Ludhiana')].sort_values('Price Date')

if not sample_df.empty:
    # Resample by month for cleaner graph
    monthly_trend = sample_df.set_index('Price Date').resample('M')[['Modal_Price', 'AI_Predicted_Price']].mean()

    plt.figure(figsize=(12, 6))
    plt.plot(monthly_trend.index, monthly_trend['Modal_Price'], label='Actual Mandi Price', color='#2E8B57', linewidth=2, marker='o')
    plt.plot(monthly_trend.index, monthly_trend['AI_Predicted_Price'], label='AI Predicted Price', color='#FF4500', linestyle='--', linewidth=2)
    
    plt.title('Wheat Price Trends in Ludhiana Mandi (2023-2026)\nPowered by Synthetic + Realistic Agricultural Intelligence Dataset (50,000+ entries)', fontsize=14, fontweight='bold', pad=20)
    plt.xlabel('Date', fontsize=12)
    plt.ylabel('Price (₹ / Quintal)', fontsize=12)
    plt.legend(fontsize=12)
    plt.grid(True, linestyle=':', alpha=0.7)
    
    # Save the graph
    plt.tight_layout()
    plt.savefig('ai_price_trends.png', dpi=300)
    print("🎯 Super Win! Graph saved as 'ai_price_trends.png'. Open it to see the magic!")
else:
    print("⚠️ Not enough data points to generate graph for Ludhiana Wheat.")
