import json
import logging
import os
import random
import re
import string
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, File, Query, UploadFile
from pydantic import BaseModel, Field

from app.api.deps import enforce_rate_limit
from app.core.database import get_database
from app.core.errors import ValidationError
from app.models.schemas import (
    ProductListResponse,
    SubscriptionCheckoutRequest,
    SubscriptionCheckoutResponse,
    SubscriptionPlanPublic,
    SubscriptionStatusResponse,
)

logger = logging.getLogger(__name__)

try:
    import razorpay
except ImportError:  # pragma: no cover - optional dependency
    razorpay = None

RAZORPAY_KEY = os.getenv("RAZORPAY_KEY")
RAZORPAY_SECRET = os.getenv("RAZORPAY_SECRET")
STRIPE_SECRET = os.getenv("STRIPE_SECRET", "")
UPI_MERCHANT_ID = os.getenv("UPI_MERCHANT_ID", "plantdoctors@upi")

if razorpay and RAZORPAY_KEY and RAZORPAY_SECRET:
    try:
        razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY, RAZORPAY_SECRET))
    except Exception as exc:  # pragma: no cover - provider init can fail by env
        logger.warning("Razorpay init failed: %s", exc)
        razorpay_client = None
else:
    razorpay_client = None
    if not razorpay:
        logger.warning("razorpay library not installed. Payment features will be disabled.")

router = APIRouter(prefix="/store", tags=["Store"], dependencies=[Depends(enforce_rate_limit)])

PROJECT_ROOT = Path(__file__).resolve().parents[4]
PRODUCTS_JSON_PATH = PROJECT_ROOT / "backend" / "data" / "products.json"
UPLOADS_DIR = PROJECT_ROOT / "static" / "uploads"

SUBSCRIPTION_PLANS: List[Dict[str, Any]] = [
    {
        "code": "basic",
        "name": "Basic",
        "price_inr": 0,
        "interval": "month",
        "is_popular": False,
        "features": [
            "Community access",
            "Basic scan results",
            "Standard crop tips",
        ],
    },
    {
        "code": "premium",
        "name": "Premium",
        "price_inr": 299,
        "interval": "month",
        "is_popular": True,
        "features": [
            "Priority expert support",
            "Premium PDF reports",
            "Market + weather intelligence alerts",
            "Revenue optimization insights",
        ],
    },
    {
        "code": "pro",
        "name": "Pro",
        "price_inr": 999,
        "interval": "month",
        "is_popular": False,
        "features": [
            "Multi-field business dashboard",
            "Advanced analytics & forecasts",
            "Dedicated agronomy support window",
            "Bulk advisory exports",
        ],
    },
]


def generate_order_id(prefix: str = "KBZ") -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{suffix}"


def _safe_price_to_paise(price_text: str) -> int:
    normalized = re.sub(r"[^\d.]", "", str(price_text or ""))
    if not normalized:
        raise ValidationError("product_price must contain numeric value.")
    try:
        return int(float(normalized) * 100)
    except (TypeError, ValueError) as exc:
        raise ValidationError("product_price format is invalid.") from exc


def _load_products_fallback() -> List[Dict[str, Any]]:
    if not PRODUCTS_JSON_PATH.exists():
        return []
    try:
        payload = json.loads(PRODUCTS_JSON_PATH.read_text(encoding="utf-8"))
    except Exception as exc:
        logger.error("Failed to read products fallback JSON: %s", exc)
        return []

    if isinstance(payload, dict):
        products = payload.get("products", [])
        return products if isinstance(products, list) else []
    if isinstance(payload, list):
        return payload
    return []


def _save_products_fallback(products: List[Dict[str, Any]]) -> None:
    PRODUCTS_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {"products": products}
    PRODUCTS_JSON_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def _matches_product_filters(product: Dict[str, Any], category: Optional[str], search: Optional[str]) -> bool:
    if category and category != "All":
        if str(product.get("category", "")).lower() != category.lower():
            return False
    if search:
        query_parts = [p.lower() for p in search.split() if len(p) > 2]
        if not query_parts:
            query_parts = [search.lower()]
            
        title = str(product.get("title", "")).lower()
        description = str(product.get("description", "")).lower()
        
        match_found = False
        for part in query_parts:
            if part in title or part in description:
                match_found = True
                break
        if not match_found:
            return False
    return True


def _find_plan(plan_code: str) -> Dict[str, Any]:
    for plan in SUBSCRIPTION_PLANS:
        if plan["code"] == plan_code:
            return plan
    raise ValidationError("Invalid subscription plan code.")


class PlaceOrderRequest(BaseModel):
    product_id: str = Field(..., min_length=2, max_length=80, description="Product identifier")
    product_title: str = Field(..., min_length=2, max_length=120)
    product_price: str = Field(..., min_length=1, max_length=40)
    category: str = Field(..., min_length=2, max_length=60)
    buyer_name: str = Field(..., min_length=2, max_length=80)
    buyer_phone: str = Field(..., min_length=10, max_length=15)
    buyer_email: Optional[str] = Field(default=None, max_length=120)
    buyer_address: Optional[str] = Field(default=None, max_length=200)
    quantity: int = Field(default=1, ge=1, le=100)
    order_type: Literal["buy", "rent"] = Field(default="buy")
    rental_days: Optional[int] = Field(default=None, ge=1, le=365)


class ProductCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=120)
    description: str = Field(default="", max_length=500)
    category: str = Field(..., min_length=2, max_length=60)
    price: str = Field(..., min_length=1, max_length=40)
    seller: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    rating: float = Field(default=5.0, ge=0, le=5)
    reviews: int = Field(default=0, ge=0)
    sellerBadge: str = Field(default="New Seller", max_length=40)
    image: str = Field(default="", max_length=2000)


class OrderResponse(BaseModel):
    success: bool
    order_id: str
    message: str
    whatsapp_url: str
    razorpay_order_id: Optional[str] = None
    razorpay_key: Optional[str] = None


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    original_name = file.filename or "upload.jpg"
    safe_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", original_name)
    filename = f"{int(datetime.now(timezone.utc).timestamp())}_{safe_name}"
    file_path = UPLOADS_DIR / filename

    content = await file.read()
    if not content:
        raise ValidationError("Uploaded file is empty.")
    file_path.write_bytes(content)

    return {"success": True, "url": f"/static/uploads/{filename}"}


@router.post("/products")
async def create_product(req: ProductCreateRequest):
    db = get_database()
    product_dict = req.model_dump()
    product_dict["id"] = f"user_{generate_order_id()}"
    product_dict["created_at"] = datetime.now(timezone.utc).isoformat()

    if db is not None:
        try:
            await db["products"].insert_one(product_dict)
            return {"success": True, "message": "Product listed successfully"}
        except Exception as exc:
            logger.error("Error saving product to DB: %s", exc)

    products = _load_products_fallback()
    products.insert(0, product_dict)
    try:
        _save_products_fallback(products)
    except Exception as exc:
        logger.error("Failed to append to fallback JSON: %s", exc)
        return {"success": False, "error": str(exc)}
    return {"success": True, "message": "Product listed (JSON fallback)"}


@router.get("/products", response_model=ProductListResponse)
async def get_products(
    category: Optional[str] = Query(default=None, description="Filter by category"),
    search: Optional[str] = Query(default=None, description="Search query"),
):
    db = get_database()
    products: List[Dict[str, Any]] = []

    if db is not None:
        query: Dict[str, Any] = {}
        if category and category != "All":
            query["category"] = {"$regex": f"^{category}$", "$options": "i"}
        if search:
            query_parts = [p for p in search.split() if len(p) > 2]
            if not query_parts:
                query_parts = [search]
            
            or_conditions = []
            for part in query_parts:
                or_conditions.append({"title": {"$regex": part, "$options": "i"}})
                or_conditions.append({"description": {"$regex": part, "$options": "i"}})
            
            query["$or"] = or_conditions
        try:
            docs = await db["products"].find(query).to_list(length=100)
            for doc in docs:
                doc_id = str(doc.pop("_id", ""))
                doc["id"] = doc.get("id") or doc_id
                products.append(doc)
        except Exception as exc:
            logger.error("Error fetching products from DB: %s", exc)

    fallback_products = _load_products_fallback()
    filtered_fallback = [item for item in fallback_products if _matches_product_filters(item, category, search)]
    if products:
        existing_ids = {str(item.get("id", "")) for item in products}
        for item in filtered_fallback:
            if str(item.get("id", "")) not in existing_ids:
                products.append(item)
    else:
        products = filtered_fallback

    return ProductListResponse(success=True, products=products, total=len(products))


@router.post("/orders", response_model=OrderResponse)
async def place_order(req: PlaceOrderRequest):
    db = get_database()
    order_id = generate_order_id()

    if req.order_type == "rent" and not req.rental_days:
        raise ValidationError("rental_days is required for rent orders.")

    amount_paise = _safe_price_to_paise(req.product_price)
    razorpay_order_id: Optional[str] = None
    if razorpay_client:
        try:
            rzp_order = razorpay_client.order.create(
                {
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": order_id,
                    "payment_capture": 1,
                }
            )
            razorpay_order_id = rzp_order.get("id")
        except Exception as exc:
            logger.error("Razorpay Order Error: %s", exc)

    order_doc = {
        "order_id": order_id,
        "product_id": req.product_id,
        "product_title": req.product_title,
        "product_price": req.product_price,
        "category": req.category,
        "buyer_name": req.buyer_name,
        "buyer_phone": req.buyer_phone,
        "buyer_email": req.buyer_email,
        "buyer_address": req.buyer_address,
        "quantity": req.quantity,
        "order_type": req.order_type,
        "rental_days": req.rental_days,
        "status": "confirmed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if db is not None:
        try:
            await db["orders"].insert_one(order_doc)
            logger.info("Order saved: %s for %s", order_id, req.buyer_name)
        except Exception as exc:
            logger.error("Failed to save order %s: %s", order_id, exc)

    action = f"renting for {req.rental_days or 1} day(s)" if req.order_type == "rent" else f"buying (Qty: {req.quantity})"
    wa_text = (
        "Order Confirmed\n"
        f"Order ID: {order_id}\n"
        f"Product: {req.product_title}\n"
        f"Price: {req.product_price}\n"
        f"Action: {action}\n"
        f"Buyer: {req.buyer_name} ({req.buyer_phone})"
    )
    wa_encoded = wa_text.replace(" ", "%20").replace("\n", "%0A")
    whatsapp_url = f"https://wa.me/919876543210?text={wa_encoded}"

    return OrderResponse(
        success=True,
        order_id=order_id,
        message=f"Order {order_id} placed successfully.",
        whatsapp_url=whatsapp_url,
        razorpay_order_id=razorpay_order_id,
        razorpay_key=RAZORPAY_KEY,
    )


@router.get("/subscription/plans")
async def get_subscription_plans() -> Dict[str, Any]:
    plans = [SubscriptionPlanPublic(**plan).model_dump() for plan in SUBSCRIPTION_PLANS]
    return {"success": True, "plans": plans}


@router.post("/subscription/checkout", response_model=SubscriptionCheckoutResponse)
async def create_subscription_checkout(req: SubscriptionCheckoutRequest) -> SubscriptionCheckoutResponse:
    plan = _find_plan(req.plan_code)
    order_id = generate_order_id(prefix="SUB")
    amount_paise = int(plan["price_inr"]) * 100

    payment_url: Optional[str] = None
    metadata: Dict[str, Any] = {"plan_code": req.plan_code, "user_id": req.user_id}

    if req.payment_provider == "razorpay":
        if razorpay_client and amount_paise > 0:
            try:
                order = razorpay_client.order.create(
                    {
                        "amount": amount_paise,
                        "currency": "INR",
                        "receipt": order_id,
                        "payment_capture": 1,
                        "notes": metadata,
                    }
                )
                metadata["razorpay_order_id"] = order.get("id")
                payment_url = req.success_url
            except Exception as exc:
                logger.error("Razorpay subscription checkout failed: %s", exc)
                metadata["fallback_reason"] = "razorpay_unavailable"
        else:
            metadata["fallback_reason"] = "razorpay_not_configured"

    elif req.payment_provider == "stripe":
        if STRIPE_SECRET:
            metadata["stripe_mode"] = "configured"
            payment_url = req.success_url
        else:
            metadata["fallback_reason"] = "stripe_not_configured"

    else:  # UPI default
        if amount_paise > 0:
            payment_url = (
                f"upi://pay?pa={UPI_MERCHANT_ID}"
                f"&pn=Plant%20Doctors"
                f"&am={plan['price_inr']}"
                f"&cu=INR&tn={order_id}"
            )
        else:
            payment_url = req.success_url

    db = get_database()
    if db is not None:
        checkout_doc = {
            "order_id": order_id,
            "user_id": req.user_id,
            "plan_code": req.plan_code,
            "payment_provider": req.payment_provider,
            "amount_paise": amount_paise,
            "status": "created" if amount_paise > 0 else "active",
            "metadata": metadata,
            "created_at": datetime.now(timezone.utc),
        }
        try:
            await db["subscription_checkouts"].insert_one(checkout_doc)
            if amount_paise == 0:
                await db["subscriptions"].update_one(
                    {"user_id": req.user_id},
                    {
                        "$set": {
                            "user_id": req.user_id,
                            "plan_code": req.plan_code,
                            "plan_name": plan["name"],
                            "status": "active",
                            "renewal_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                            "updated_at": datetime.now(timezone.utc),
                        }
                    },
                    upsert=True,
                )
        except Exception as exc:
            logger.error("Subscription checkout persistence failed: %s", exc)

    return SubscriptionCheckoutResponse(
        success=True,
        provider=req.payment_provider,
        order_id=order_id,
        amount_paise=amount_paise,
        currency="INR",
        payment_url=payment_url,
        metadata=metadata,
    )


@router.get("/subscription/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(user_id: str = Query(..., min_length=2, max_length=80)) -> SubscriptionStatusResponse:
    db = get_database()
    if db is None:
        return SubscriptionStatusResponse(
            success=True,
            user_id=user_id,
            plan_code="basic",
            plan_name="Basic",
            status="trial",
        )

    subscription = await db["subscriptions"].find_one({"user_id": user_id}, {"_id": 0})
    if not subscription:
        return SubscriptionStatusResponse(
            success=True,
            user_id=user_id,
            plan_code="basic",
            plan_name="Basic",
            status="trial",
        )

    return SubscriptionStatusResponse(
        success=True,
        user_id=user_id,
        plan_code=str(subscription.get("plan_code", "basic")),
        plan_name=str(subscription.get("plan_name", "Basic")),
        status=str(subscription.get("status", "inactive")),
        renewal_date=subscription.get("renewal_date"),
        expires_at=subscription.get("expires_at"),
    )
