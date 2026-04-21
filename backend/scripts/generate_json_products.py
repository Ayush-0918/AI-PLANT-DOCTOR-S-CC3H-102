import json
import random
import os

IMG_MAP = {
    "Medicines": "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?q=80&w=400",
    "Seeds": "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=400",
    "Machines": "https://images.unsplash.com/photo-1594489428504-5c0c480a15fd?q=80&w=400",
    "Rental": "https://images.unsplash.com/photo-1517404212739-650058e578f2?q=80&w=400",
}

medicines = [
    ("Nano Urea (Liquid)", "High-efficiency nitrogen delivery."), ("DAP (Di-Ammonium Phosphate)", "Essential for root development."),
    ("Coromandel Gromor", "Popular NPK complex for balanced growth."), ("Glyphosate (Roundup)", "Broad-spectrum weed control."),
    ("Imidacloprid", "Controls sucking pests (aphids, thrips)."), ("Chlorpyrifos", "Soil-borne pest control."),
    ("Carbendazim", "Systemic control of fungal diseases."), ("Mancozeb", "Protective contact fungicide."),
    ("Trichoderma Viride", "Bio-fungicide, Eco-friendly soil pathogen control."), ("Beauveria Bassiana", "Bio-pesticide, Natural control for whiteflies/borers."),
    ("Neem Oil / Azadirachtin", "Bio-pesticide, Organic pest repellent."), ("Zinc Sulfate", "Prevents leaf yellowing and stunting."),
    ("Boron (Solubor)", "Essential for flowering and fruit set."), ("Seaweed Extract", "Biostimulant, Boosts stress tolerance and yield."),
    ("Humic Acid", "Soil Conditioner, Improves nutrient uptake."), ("Gibberellic Acid", "Growth Regulator, Increases fruit size and stem length."),
    ("Atrazine", "Herbicide, Used primarily for maize and sugarcane."), ("Pendimethalin", "Pre-emergence weed control."),
    ("Bifenthrin", "Controls termites and bollworms."), ("Potassium Nitrate", "Water-soluble K for fruiting stage.")
]

seeds = [
    ("Pusa Basmati 1121", "Famous long-grain aromatic rice."), ("HD 2967 (Wheat)", "High-yield, disease-resistant variety."),
    ("BT Cotton (Shriram)", "Pest-resistant hybrid cotton."), ("Hybrid Maize (Pioneer)", "For high grain and fodder yield."),
    ("Co 0238 (Sugarcane)", "The 'miracle' high-sugar variety."), ("Pusa Mustard 25", "High oil content and early maturing."),
    ("Shriram 2372 (Tomato)", "Heat-tolerant, high-market-value hybrid."), ("JS 335 (Soybean)", "Widely adapted for central India."),
    ("Hybrid Chilli (Sitara)", "Disease-resistant, high-pungency types."), ("Kufri Jyoti (Potato)", "Standard reliable variety for various climates."),
    ("N-53 (Onion)", "Popular for Kharif (monsoon) season."), ("Hybrid Sunflower (KBSH)", "Drought-tolerant oilseed."),
    ("Pusa 372 (Chickpea)", "Standard pulse for winter cropping."), ("Hybrid Bajra (Pusa 701)", "Dual-purpose (grain and fodder)."),
    ("SML 668 (Moong Dal)", "Short-duration pulse for summer."), ("Marigold (Pusa Narangi)", "High demand for religious/festive use."),
    ("Hybrid Watermelon", "Sweet, transport-friendly fruits."), ("Golden Acre (Cabbage)", "Compact and fast-growing."),
    ("Bio-fortified Cauliflower", "Varieties enriched with Beta-carotene."), ("Hybrid Papaya", "High yield and viral resistance.")
]

rental = [
    ("Tractor (Daily Hire)", "Most common rental for plowing/hauling."), ("Combine Harvester", "Essential for harvesting wheat/paddy."),
    ("Drone Spraying Service", "Rapidly growing for pesticide application."), ("Laser Land Leveler", "High-cost item usually rented per acre."),
    ("JCB / Backhoe Loader", "Used for farm leveling and pond digging."), ("Happy Seeder", "Rented for managing stubble in North India."),
    ("Thresher", "Seasonal rental for post-harvest processing."), ("Baler", "Increasingly rented to prevent crop residue burning."),
    ("Power Tiller", "Rented by small-scale farmers for garden work."), ("Water Pump (Diesel/Electric)", "For temporary irrigation needs."),
    ("Mulching Machine", "Rented for specialized vegetable farming."), ("Seed Drill", "Rented during sowing windows."),
    ("Reaper", "Alternative to manual labor for grain harvesting."), ("Rotavator", "Often rented as a tractor attachment."),
    ("Trolley / Trailer", "For transporting produce to Mandis (markets)."), ("Post Hole Digger", "Rented for fencing large farms."),
    ("Cold Storage Space", "Rental for perishable crops like potatoes."), ("Precision Soil Sensors", "High-tech rental for soil mapping."),
    ("Sugarcane Loader", "Rented for loading cane onto trucks.")
]

machines = [
    ("4WD Tractor (John Deere)", "The backbone of the farm."), ("Rotavator", "For seedbed preparation and soil tilling."),
    ("Combine Harvester", "Multi-crop harvesting (Rice, Wheat, Corn)."), ("Agri-Drone", "For precision spraying and crop monitoring."),
    ("Laser Land Leveler", "Ensures water efficiency by leveling fields."), ("Power Tiller", "Ideal for small farms and hilly terrain."),
    ("Zero Till Drill", "Allows sowing without prior tilling."), ("Pneumatic Planter", "Precision seed placement for uniform growth."),
    ("Multi-crop Thresher", "Separates grains from stalks efficiently."), ("Boom Sprayer", "Tractor-mounted for large-scale chemical application."),
    ("Rice Transplanter", "Mechanized paddy planting."), ("Baler", "Compresses straw/hay into manageable blocks."),
    ("Sugarcane Harvester", "Specialized for large-scale sugar estates."), ("Chaff Cutter", "Essential for livestock fodder preparation."),
    ("Potato Planter & Digger", "Specialized root crop machinery."), ("Cultivator", "Secondary tillage and weed management."),
    ("Disc Harrow", "Breaks up heavy clods and crop residue."), ("Brush Cutter", "Clears weeds and small bushes."),
    ("Solar Water Pump", "Sustainable irrigation solution."), ("Reaper Binder", "Cuts and binds crops like wheat automatically.")
]

def map_products(data, category, seller):
    res = []
    for (title, desc) in data:
        p = {
            "id": f"fallback_{category.lower()}_{len(res)}",
            "title": title,
            "description": desc,
            "category": category,
            "rating": round(random.uniform(4.0, 4.9), 1),
            "reviews": random.randint(10, 500),
            "seller": seller,
            "sellerBadge": "Verified" if random.choice([True, False]) else "Top Rated",
            "image": IMG_MAP[category],
            "stock": random.randint(2, 500) if category != "Rental" else 1
        }
        
        if category == "Medicines": p["price"] = f"₹{random.randint(200, 1500)}"
        if category == "Seeds": p["price"] = f"₹{random.randint(500, 3000)}"
        if category == "Machines": p["price"] = f"₹{random.randint(50000, 800000)}"
        if category == "Rental": p["price"] = f"₹{random.randint(500, 3000)}/hr"

        res.append(p)
    return res

all_p = sum([
    map_products(medicines, "Medicines", "AgriBharat Depot"),
    map_products(seeds, "Seeds", "National Seeds Corp"),
    map_products(machines, "Machines", "Kisan Machineries"),
    map_products(rental, "Rental", "AgriRentals Direct")
], [])

os.makedirs("data", exist_ok=True)
with open("data/products.json", "w") as f:
    json.dump({"products": all_p}, f, indent=2)

print(f"Generated data/products.json with {len(all_p)} products.")
