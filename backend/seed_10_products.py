import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb://localhost:27017"

async def seed_more_products():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.plant_doctor
    
    new_products = [
        # Medicines
        {
            "title": "Nano Urea (Liquid)", 
            "description": "High-efficiency nitrogen delivery fertilizer.",
            "price": "₹240", "category": "Medicines", "rating": 4.9, "reviews": 512,
            "seller": "IFFCO Official", "sellerBadge": "Verified",
            "image": "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?q=80&w=400", "stock": 500
        },
        {
            "title": "DAP (Di-Ammonium Phosphate)", 
            "description": "Essential for root development and crop establishment.",
            "price": "₹1350", "category": "Medicines", "rating": 4.7, "reviews": 310,
            "seller": "Agro Bharat", "sellerBadge": "Top Rated",
            "image": "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?q=80&w=400", "stock": 250
        },
        {
            "title": "Glyphosate (Roundup)", 
            "description": "Broad-spectrum weed control herbicide.",
            "price": "₹850", "category": "Medicines", "rating": 4.6, "reviews": 118,
            "seller": "Bayer CropScience", "sellerBadge": "Official",
            "image": "https://images.unsplash.com/photo-1615485906371-d64e9a3b6d08?q=80&w=400", "stock": 120
        },
        
        # Machines
        {
            "title": "Agri-Drone Pro X1", 
            "description": "High-capacity drone for precision spraying and crop monitoring.",
            "price": "₹4,50,000", "category": "Machines", "rating": 4.8, "reviews": 42,
            "seller": "Garuda Aerospace", "sellerBadge": "Premium",
            "image": "https://images.unsplash.com/photo-1558504068-12c8b0dd6657?q=80&w=400", "stock": 3
        },
        {
            "title": "Rotavator (Heavy Duty)", 
            "description": "For seedbed preparation and rapid soil tilling.",
            "price": "₹1,10,000", "category": "Machines", "rating": 4.5, "reviews": 85,
            "seller": "FieldKing", "sellerBadge": "Verified",
            "image": "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=400", "stock": 10
        },
        
        # Seeds
        {
            "title": "Pusa Basmati 1121", 
            "description": "Famous long-grain aromatic rice high-yield seeds (10kg).",
            "price": "₹1200", "category": "Seeds", "rating": 4.9, "reviews": 820,
            "seller": "Pusa Genetics", "sellerBadge": "Official",
            "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=400", "stock": 1000
        },
        {
            "title": "BT Cotton (Bollgard II)", 
            "description": "Pest-resistant hybrid cotton seeds (450g packet).",
            "price": "₹800", "category": "Seeds", "rating": 4.8, "reviews": 460,
            "seller": "Shriram Seeds", "sellerBadge": "Top Rated",
            "image": "https://images.unsplash.com/photo-1506450097690-349f7ba30438?q=80&w=400", "stock": 500
        },
        {
            "title": "Hybrid Maize (Pioneer 30V92)", 
            "description": "For high grain and fodder yield.",
            "price": "₹1800", "category": "Seeds", "rating": 4.7, "reviews": 230,
            "seller": "Pioneer Seeds", "sellerBadge": "Premium",
            "image": "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?q=80&w=400", "stock": 400
        },
        
        # Rental
        {
            "title": "JCB / Backhoe Loader", 
            "description": "Used for farm leveling, trenching, and pond digging.",
            "price": "₹1200/hr", "category": "Rental", "rating": 4.6, "reviews": 315,
            "seller": "Kisan Earthmovers", "sellerBadge": "Verified",
            "image": "https://images.unsplash.com/photo-1533227268408-a774693194a8?q=80&w=400", "stock": 1
        },
        {
            "title": "Drone Spraying Service", 
            "description": "Rapid pesticide application by certified drone pilots.",
            "price": "₹600/acre", "category": "Rental", "rating": 4.9, "reviews": 612,
            "seller": "AgriFly Tech", "sellerBadge": "Top Rated",
            "image": "https://images.unsplash.com/photo-1579435649938-1ee4b150c765?q=80&w=400", "stock": 5
        }
    ]
    
    await db.products.insert_many(new_products)
    print("✅ 10 New Products Added Successfully!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_more_products())
