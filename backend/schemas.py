from pydantic import BaseModel, EmailStr, Field, validator, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    roles: List[str] = []
    created_at: str


class UserUpdateRequest(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None


class UserRoleAssignRequest(BaseModel):
    role_name: str = Field(..., pattern="^(super_admin|admin|manager|user)$")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ProductBase(BaseModel):
    name: str
    description: str
    price: float = Field(..., gt=0)
    category: str
    stock: int = Field(..., ge=0)
    image_url: str

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    created_at: str

class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    limit: int

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = Field(default=1, gt=0)

class CartItemUpdate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    name: str
    price: float
    image_url: str
    stock: int
    created_at: str
    updated_at: str

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total: float

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    price: float

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    shipping_address: str

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: float
    name: str
    image_url: str

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    shipping_address: str
    created_at: str
    items: Optional[List[OrderItemResponse]] = None


# ==================== BOT SCHEMAS ====================

class BotBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=10, max_length=1000)
    category: str
    system_prompt: str = Field(..., min_length=10)
    ai_model: str = Field(default="gpt-4.1-mini")
    output_mode: str = Field(default="text", pattern="^(text|image|audio|video)$")
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=500, ge=50, le=4000)
    price: float = Field(default=0.0, ge=0)
    is_public: bool = Field(default=False)
    avatar_url: Optional[str] = None
    welcome_message: Optional[str] = None
    fallback_response: Optional[str] = "I'm not sure how to respond to that."

class BotCreate(BotBase):
    configuration: Optional[dict] = None

class BotUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=10, max_length=1000)
    category: Optional[str] = None
    system_prompt: Optional[str] = Field(None, min_length=10)
    ai_model: Optional[str] = None
    output_mode: Optional[str] = Field(None, pattern="^(text|image|audio|video)$")
    temperature: Optional[float] = Field(None, ge=0, le=2)
    max_tokens: Optional[int] = Field(None, ge=50, le=4000)
    price: Optional[float] = Field(None, ge=0)
    is_public: Optional[bool] = None
    avatar_url: Optional[str] = None
    welcome_message: Optional[str] = None
    fallback_response: Optional[str] = None
    configuration: Optional[dict] = None

class BotResponse(BotBase):
    id: int
    creator_id: int
    total_conversations: int = 0
    average_rating: float = 0.0
    total_reviews: int = 0
    created_at: str
    updated_at: str
    configuration: Optional[dict] = None

class BotListResponse(BaseModel):
    bots: List[BotResponse]
    total: int
    page: int
    limit: int

class BotChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1)

class BotChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[int] = None

class BotChatResponse(BaseModel):
    response: str
    conversation_id: int
    tokens_used: Optional[int] = None

class BotConversationResponse(BaseModel):
    id: int
    bot_id: int
    user_id: int
    bot_name: Optional[str] = None
    bot_avatar_url: Optional[str] = None
    created_at: str
    updated_at: str

class BotMessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    tokens_used: Optional[int] = None
    created_at: str

class BotPurchaseRequest(BaseModel):
    bot_id: int

class BotPurchaseResponse(BaseModel):
    id: int
    bot_id: int
    buyer_id: int
    amount: float
    created_at: str
    bot_name: Optional[str] = None
    bot_description: Optional[str] = None

class BotReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)

class BotReviewResponse(BaseModel):
    id: int
    bot_id: int
    user_id: int
    rating: int
    comment: Optional[str] = None
    full_name: Optional[str] = None
    created_at: str
    updated_at: str

class BotAnalyticsResponse(BaseModel):
    bot_id: int
    total_conversations: int
    total_messages: int
    average_rating: float
    total_reviews: int
    total_revenue: float
    recent_conversations: List[BotConversationResponse]


class BotMediaGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)


class BotMediaGenerateResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    output_type: str
    model_used: str
    media_url: Optional[str] = None
    media_base64: Optional[str] = None
    mime_type: Optional[str] = None
    text: Optional[str] = None


class SupportMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


class SupportConversationStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|closed)$")
