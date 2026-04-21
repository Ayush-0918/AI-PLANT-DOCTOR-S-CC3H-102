from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.api.deps import enforce_rate_limit, get_current_user
from app.core.database import get_database
from app.models.schemas import LoginRequest, RegisterRequest, TokenResponse, UserPublic
from app.services.auth_service import authenticate_user, issue_user_token, register_user

router = APIRouter(prefix="/auth", tags=["Auth"], dependencies=[Depends(enforce_rate_limit)])


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest) -> TokenResponse:
    db = get_database()
    user = await register_user(
        db=db,
        name=request.name,
        phone_number=request.phone_number,
        password=request.password,
        language=request.language,
        location=request.location,
    )

    user_doc = {
        "user_id": user.user_id,
        "name": user.name,
        "phone_number": user.phone_number,
        "role": user.role,
        "language": user.language,
        "location": user.location,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    return issue_user_token(user_doc)


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest) -> TokenResponse:
    db = get_database()
    user_doc = await authenticate_user(
        db=db,
        phone_number=request.phone_number,
        password=request.password,
    )
    return issue_user_token(user_doc)


@router.get("/me", response_model=UserPublic)
async def me(user=Depends(get_current_user)) -> UserPublic:
    return UserPublic(
        user_id=user["user_id"],
        name=user["name"],
        phone_number=user["phone_number"],
        role=user.get("role", "farmer"),
        language=user.get("language", "hi"),
        location=user.get("location"),
        soil_type=user.get("soil_type"),
    )
