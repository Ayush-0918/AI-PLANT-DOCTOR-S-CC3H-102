from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class UserPublic(BaseModel):
    user_id: str
    name: str
    phone_number: str
    role: str = "farmer"
    language: str = "hi"
    location: Optional[str] = None
    soil_type: Optional[str] = None


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    phone_number: str = Field(min_length=10, max_length=20)
    password: str = Field(min_length=8, max_length=120)
    language: str = Field(default="hi", min_length=2, max_length=20)
    location: Optional[str] = Field(default=None, max_length=120)


class LoginRequest(BaseModel):
    phone_number: str = Field(min_length=10, max_length=20)
    password: str = Field(min_length=8, max_length=120)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    user: UserPublic


class ExpertCallRequest(BaseModel):
    phone_number: str = Field(min_length=10, max_length=20)
    reason: str = Field(default="manual_request", max_length=120)
    prediction_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ExpertCallResponse(BaseModel):
    success: bool
    call_id: Optional[str] = None
    status: str
    attempts: int
    message: str


class ScanResponse(BaseModel):
    success: bool
    prediction_id: Optional[str] = None
    diagnosis: Dict[str, Any]
    escalation_required: bool
    escalation_reason: Optional[str] = None
    confidence_threshold: float
    context: Optional[Dict[str, Any]] = None
    weather: Optional[Dict[str, Any]] = None
    disease_risk: Optional[Dict[str, Any]] = None
    knowledge: Optional[Dict[str, Any]] = None
    recommendation: Dict[str, Any]
    observability: Dict[str, Any]


class PredictionFeedbackRequest(BaseModel):
    prediction_id: str
    verdict: str = Field(description="correct | incorrect | unsure")
    rating: int = Field(ge=1, le=5)
    notes: Optional[str] = Field(default=None, max_length=500)


class PredictionFeedbackResponse(BaseModel):
    success: bool
    feedback_id: str
    prediction_id: str


class DosageRequest(BaseModel):
    crop: str = Field(min_length=2, max_length=80)
    area_acres: float = Field(gt=0, le=10000)
    disease: Optional[str] = Field(default=None, max_length=120)
    language: Optional[str] = Field(default="English", max_length=40)


class DosageResponse(BaseModel):
    dosage_exact: Dict[str, str]
    instructions: str
    ai_analysis: Dict[str, Any]
    warnings: str


class ScanReportRequest(BaseModel):
    language: str = Field(default="English", min_length=2, max_length=40)
    farmer_name: str = Field(default="Farmer", max_length=80)
    location: str = Field(default="", max_length=120)
    crop: str = Field(default="Unknown", max_length=80)
    diagnosis_name: str = Field(min_length=2, max_length=160)
    confidence: float = Field(ge=0, le=100)
    recommendation: str = Field(default="", max_length=1000)
    stage: str = Field(default="vegetative", max_length=40)
    severity: str = Field(default="medium", max_length=40)
    weather_risk: str = Field(default="medium", max_length=40)
    treatment: Dict[str, Any] = Field(default_factory=dict)


class ScanReportResponse(BaseModel):
    success: bool
    report_url: str
    file_name: str


class GrowthCareResponse(BaseModel):
    success: bool
    crop: str
    stage: str
    weather_risk: str
    recommendations: List[Dict[str, Any]]


class SoilFertilizerItem(BaseModel):
    nutrient: str
    product_name: str
    dosage_kg_per_acre: float = 0.0
    dosage_for_farm_kg: float = 0.0
    estimated_cost_inr: float = 0.0
    estimated_cost_label: str = ""
    application_method: str = ""
    advisory: str = ""


class SoilReportResponse(BaseModel):
    success: bool
    soil_type: str = ""
    confidence_pct: Optional[float] = None
    analysis_method: str = ""
    source_model: str = ""
    crop_focus: str = ""
    area_acres: float = 1.0
    overall_advice: str = ""
    nitrogen_advice: str
    potassium_advice: str = ""
    phosphorus_advice: str = ""
    estimated_cost: str = ""
    estimated_cost_value_inr: float = 0.0
    estimated_cost_per_acre: str = ""
    recommended_fertilizers: List[SoilFertilizerItem] = Field(default_factory=list)
    raw_text: str = ""


class UserHistoryResponse(BaseModel):
    user: UserPublic
    scans: List[Dict[str, Any]]
    calls: List[Dict[str, Any]]
    feedback: List[Dict[str, Any]]


class PreferencesUpdate(BaseModel):
    language: Optional[str] = Field(default=None, min_length=2, max_length=40)
    location: Optional[str] = Field(default=None, max_length=120)
    soil_type: Optional[str] = Field(default=None, max_length=80)


class ProductPublic(BaseModel):
    id: str = Field(default="")
    title: str
    description: str = Field(default="")
    price: str
    rating: float = Field(default=0.0)
    reviews: int = Field(default=0)
    seller: str = Field(default="Verified Seller")
    sellerBadge: str = Field(default="")
    category: str
    image: str = Field(default="")
    stock: int = Field(default=0)

    class Config:
        populate_by_name = True


class ProductListResponse(BaseModel):
    success: bool
    products: List[ProductPublic]
    total: int


class SubscriptionPlanPublic(BaseModel):
    code: str
    name: str
    price_inr: int = Field(ge=0)
    interval: str = Field(default="month", min_length=3, max_length=20)
    features: List[str] = Field(default_factory=list)
    is_popular: bool = False


class SubscriptionCheckoutRequest(BaseModel):
    user_id: str = Field(min_length=2, max_length=80)
    plan_code: str = Field(min_length=2, max_length=20)
    payment_provider: Literal["upi", "stripe", "razorpay"] = "upi"
    success_url: Optional[str] = Field(default=None, max_length=500)
    cancel_url: Optional[str] = Field(default=None, max_length=500)


class SubscriptionCheckoutResponse(BaseModel):
    success: bool
    provider: str
    order_id: str
    amount_paise: int = Field(ge=0)
    currency: str = "INR"
    payment_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SubscriptionStatusResponse(BaseModel):
    success: bool
    user_id: str
    plan_code: str
    plan_name: str
    status: str
    renewal_date: Optional[str] = None
    expires_at: Optional[str] = None
