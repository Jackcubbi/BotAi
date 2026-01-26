from fastapi import APIRouter, HTTPException, status, Depends
from schemas import UserRegister, UserLogin, TokenResponse, UserResponse, UserUpdateRequest
from models import UserModel
from middleware.auth import create_access_token, get_current_user_id

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    existing_user = UserModel.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    user_id = UserModel.create(
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name
    )

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

    user = UserModel.get_by_id(user_id)
    access_token = create_access_token(user_id)

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(**user)
    )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = UserModel.get_by_email(credentials.email)

    if not user or not UserModel.verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(user["id"])
    user_response = UserModel.get_by_id(user["id"])

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(**user_response)
    )

@router.get("/profile/{user_id}", response_model=UserResponse)
async def get_profile(user_id: int, current_user_id: int = Depends(get_current_user_id)):
    if current_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this profile"
        )

    user = UserModel.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse(**user)

@router.get("/check-email")
async def check_email(email: str):
    user = UserModel.get_by_email(email)
    return {"exists": user is not None}


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    payload: UserUpdateRequest,
    current_user_id: int = Depends(get_current_user_id)
):
    user = UserModel.get_by_id(current_user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    email = payload.email
    full_name = payload.full_name

    if email and email != user.get("email"):
        existing_with_email = UserModel.get_by_email(email)
        if existing_with_email and existing_with_email.get("id") != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    if email == user.get("email"):
        email = None
    if full_name == user.get("full_name"):
        full_name = None

    if email is None and full_name is None:
        return UserResponse(**user)

    success = UserModel.update(current_user_id, full_name=full_name, email=email)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )

    updated_user = UserModel.get_by_id(current_user_id)
    return UserResponse(**updated_user)
