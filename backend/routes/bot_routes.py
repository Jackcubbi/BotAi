"""
Bot Routes - API endpoints for bot management and interactions
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from database import get_db
from middleware.auth import get_current_user_id, get_current_user
from middleware.rate_limit import limiter
from models import (
    BotModel, BotConversationModel, BotMessageModel,
    BotPurchaseModel, BotReviewModel, UserModel
)
from schemas import (
    BotCreate, BotUpdate, BotResponse, BotListResponse,
    BotChatRequest, BotChatResponse, BotConversationResponse,
    BotMessageResponse, BotPurchaseRequest, BotPurchaseResponse,
    BotReviewCreate, BotReviewResponse, BotAnalyticsResponse,
    BotMediaGenerateRequest, BotMediaGenerateResponse
)
from services.ai_service import get_ai_service
from fastapi import Request

router = APIRouter(prefix="/api/bots", tags=["bots"])


# ==================== BOT CRUD ====================

@router.get("/public-stats")
@limiter.limit("60/minute")
async def get_public_stats(request: Request):
    """Get public platform stats for homepage counters"""
    try:
        conn = get_db()
        cursor = conn.cursor()

        def table_exists(table_name: str) -> bool:
            cursor.execute(
                "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
                (table_name,)
            )
            return cursor.fetchone() is not None

        active_bots = 0
        total_conversations = 0
        total_creators = 0

        if table_exists("bots"):
            cursor.execute("SELECT COUNT(*) as count FROM bots WHERE is_public = 1")
            active_bots = int(cursor.fetchone()["count"] or 0)

            cursor.execute("SELECT COUNT(DISTINCT creator_id) as count FROM bots WHERE is_public = 1")
            total_creators = int(cursor.fetchone()["count"] or 0)

        if table_exists("bot_conversations"):
            cursor.execute("SELECT COUNT(*) as count FROM bot_conversations")
            total_conversations = int(cursor.fetchone()["count"] or 0)

        return {
            "active_bots": active_bots,
            "total_conversations": total_conversations,
            "total_creators": total_creators,
        }
    except Exception:
        return {
            "active_bots": 0,
            "total_conversations": 0,
            "total_creators": 0,
        }

@router.post("", response_model=BotResponse)
@limiter.limit("10/minute")
async def create_bot(
    request: Request,
    bot_data: BotCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new bot"""
    bot_id = BotModel.create(
        name=bot_data.name,
        description=bot_data.description,
        category=bot_data.category,
        creator_id=current_user["id"],
        system_prompt=bot_data.system_prompt,
        ai_model=bot_data.ai_model,
        output_mode=bot_data.output_mode,
        temperature=bot_data.temperature,
        max_tokens=bot_data.max_tokens,
        price=bot_data.price,
        is_public=bot_data.is_public,
        avatar_url=bot_data.avatar_url,
        welcome_message=bot_data.welcome_message,
        fallback_response=bot_data.fallback_response,
        configuration=bot_data.configuration
    )

    if not bot_id:
        raise HTTPException(status_code=500, detail="Failed to create bot")

    bot = BotModel.get_by_id(bot_id)
    avg_rating = BotReviewModel.get_average_rating(bot_id)

    return {**bot, "average_rating": avg_rating, "total_reviews": 0}


@router.get("", response_model=BotListResponse)
@limiter.limit("30/minute")
async def get_bots(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    is_public: Optional[bool] = None,
    creator_id: Optional[int] = None
):
    """Get list of bots with pagination"""
    offset = (page - 1) * limit

    bots = BotModel.get_all(
        limit=limit,
        offset=offset,
        category=category,
        creator_id=creator_id,
        is_public=is_public
    )

    bot_ids = [bot["id"] for bot in bots]
    rating_stats = BotReviewModel.get_rating_stats_for_bots(bot_ids)
    for bot in bots:
        stat = rating_stats.get(bot["id"], {"average_rating": 0.0, "total_reviews": 0.0})
        bot["average_rating"] = float(stat.get("average_rating", 0.0))
        bot["total_reviews"] = int(stat.get("total_reviews", 0.0))

    total = BotModel.count(category=category, is_public=is_public)

    return {
        "bots": bots,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/my-bots", response_model=BotListResponse)
@limiter.limit("30/minute")
async def get_my_bots(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get current user's created bots"""
    offset = (page - 1) * limit

    bots = BotModel.get_all(
        limit=limit,
        offset=offset,
        creator_id=current_user["id"]
    )

    bot_ids = [bot["id"] for bot in bots]
    rating_stats = BotReviewModel.get_rating_stats_for_bots(bot_ids)
    for bot in bots:
        stat = rating_stats.get(bot["id"], {"average_rating": 0.0, "total_reviews": 0.0})
        bot["average_rating"] = float(stat.get("average_rating", 0.0))
        bot["total_reviews"] = int(stat.get("total_reviews", 0.0))

    total = BotModel.count()

    return {
        "bots": bots,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/marketplace", response_model=BotListResponse)
@limiter.limit("30/minute")
async def get_marketplace_bots(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None
):
    """Get public bots available in marketplace"""
    offset = (page - 1) * limit
    try:
        bots = BotModel.get_marketplace_fast(
            limit=limit,
            offset=offset,
            category=category,
        )

        bot_ids = [bot["id"] for bot in bots]
        rating_stats = BotReviewModel.get_rating_stats_for_bots(bot_ids)
        for bot in bots:
            stat = rating_stats.get(bot["id"], {"average_rating": 0.0, "total_reviews": 0.0})
            bot["average_rating"] = float(stat.get("average_rating", 0.0))
            bot["total_reviews"] = int(stat.get("total_reviews", 0.0))

        total = BotModel.count(category=category, is_public=True)

        return {
            "bots": bots,
            "total": total,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        print(f"Marketplace endpoint error: {e}")
        return {
            "bots": [],
            "total": 0,
            "page": page,
            "limit": limit
        }


@router.get("/{bot_id:int}", response_model=BotResponse)
@limiter.limit("30/minute")
async def get_bot(request: Request, bot_id: int):
    """Get bot by ID"""
    bot = BotModel.get_by_id(bot_id)

    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    # Add ratings
    bot["average_rating"] = BotReviewModel.get_average_rating(bot_id)
    bot["total_reviews"] = len(BotReviewModel.get_by_bot(bot_id))

    return bot


@router.put("/{bot_id:int}", response_model=BotResponse)
@limiter.limit("10/minute")
async def update_bot(
    request: Request,
    bot_id: int,
    bot_data: BotUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update bot (only by creator)"""
    bot = BotModel.get_by_id(bot_id)

    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    if bot["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this bot")

    update_data = bot_data.dict(exclude_unset=True)

    success = BotModel.update_by_creator(
        bot_id=bot_id,
        creator_id=current_user["id"],
        **update_data
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to update bot")

    updated_bot = BotModel.get_by_id(bot_id)
    updated_bot["average_rating"] = BotReviewModel.get_average_rating(bot_id)
    updated_bot["total_reviews"] = len(BotReviewModel.get_by_bot(bot_id))

    return updated_bot


@router.delete("/{bot_id:int}")
@limiter.limit("10/minute")
async def delete_bot(
    request: Request,
    bot_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete bot (only by creator)"""
    bot = BotModel.get_by_id(bot_id)

    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    if bot["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this bot")

    success = BotModel.delete_by_creator(bot_id, current_user["id"])

    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete bot")

    return {"message": "Bot deleted successfully"}


# ==================== BOT CHAT ====================

@router.post("/{bot_id:int}/chat", response_model=BotChatResponse)
@limiter.limit("20/minute")
async def chat_with_bot(
    request: Request,
    bot_id: int,
    chat_request: BotChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a message to a bot and get response"""
    bot = BotModel.get_by_id(bot_id, include_secrets=True)

    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    # Check if bot is public or user is the creator
    if not bot["is_public"] and bot["creator_id"] != current_user["id"]:
        # Check if user has purchased the bot
        if not BotPurchaseModel.has_purchased(bot_id, current_user["id"]):
            raise HTTPException(status_code=403, detail="You must purchase this bot to use it")

    # Get or create conversation
    conversation_id = chat_request.conversation_id

    if not conversation_id:
        conversation_id = BotConversationModel.create(bot_id, current_user["id"])
        if not conversation_id:
            raise HTTPException(status_code=500, detail="Failed to create conversation")
    else:
        # Verify conversation belongs to user
        conversation = BotConversationModel.get_by_id(conversation_id)
        if not conversation or conversation["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Invalid conversation")

    # Save user message
    BotMessageModel.create(
        conversation_id=conversation_id,
        role="user",
        content=chat_request.message
    )

    # Get conversation history
    messages_history = BotMessageModel.get_by_conversation(conversation_id)

    # Build conversation context
    ai_service = get_ai_service()

    conversation_messages = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in messages_history
    ]

    messages = ai_service.build_conversation_context(
        system_prompt=bot["system_prompt"],
        conversation_history=conversation_messages,
        max_history=20
    )

    # Get AI response
    bot_configuration = bot.get("configuration") or {}
    ai_provider = bot_configuration.get("ai_provider", "openai")
    creator_api_key = bot_configuration.get("ai_api_key")

    response_text, tokens_used, error = ai_service.chat_completion(
        messages=messages,
        model=bot["ai_model"],
        api_provider=ai_provider,
        api_key=creator_api_key,
        temperature=bot["temperature"],
        max_tokens=bot["max_tokens"]
    )

    if error:
        # Use fallback response on error
        response_text = bot.get("fallback_response", "I'm having trouble responding right now. Please try again.")
        tokens_used = 0

    # Save bot response
    BotMessageModel.create(
        conversation_id=conversation_id,
        role="assistant",
        content=response_text,
        tokens_used=tokens_used
    )

    # Update conversation timestamp
    BotConversationModel.update_timestamp(conversation_id)

    # Increment bot usage counter
    BotModel.increment_usage(bot_id)

    return {
        "response": response_text,
        "conversation_id": conversation_id,
        "tokens_used": tokens_used
    }


@router.post("/{bot_id:int}/generate-image", response_model=BotMediaGenerateResponse)
@limiter.limit("10/minute")
async def generate_image_with_bot(
    request: Request,
    bot_id: int,
    media_request: BotMediaGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate image content with bot configuration"""
    bot = BotModel.get_by_id(bot_id, include_secrets=True)

    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    if not bot["is_public"] and bot["creator_id"] != current_user["id"]:
        if not BotPurchaseModel.has_purchased(bot_id, current_user["id"]):
            raise HTTPException(status_code=403, detail="You must purchase this bot to use it")

    ai_service = get_ai_service()
    bot_configuration = bot.get("configuration") or {}
    ai_provider = bot_configuration.get("ai_provider", "openai")
    creator_api_key = bot_configuration.get("ai_api_key")

    media_url, media_base64, mime_type, error = ai_service.generate_image(
        prompt=media_request.prompt,
        model=bot["ai_model"],
        api_provider=ai_provider,
        api_key=creator_api_key
    )

    if error:
        raise HTTPException(status_code=400, detail=error)

    return {
        "output_type": "image",
        "model_used": bot["ai_model"],
        "media_url": media_url,
        "media_base64": media_base64,
        "mime_type": mime_type
    }


@router.post("/{bot_id:int}/generate-audio", response_model=BotMediaGenerateResponse)
@limiter.limit("10/minute")
async def generate_audio_with_bot(
    request: Request,
    bot_id: int,
    media_request: BotMediaGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate audio content with bot configuration"""
    bot = BotModel.get_by_id(bot_id, include_secrets=True)

    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    if not bot["is_public"] and bot["creator_id"] != current_user["id"]:
        if not BotPurchaseModel.has_purchased(bot_id, current_user["id"]):
            raise HTTPException(status_code=403, detail="You must purchase this bot to use it")

    ai_service = get_ai_service()
    bot_configuration = bot.get("configuration") or {}
    ai_provider = bot_configuration.get("ai_provider", "openai")
    creator_api_key = bot_configuration.get("ai_api_key")

    media_base64, mime_type, error = ai_service.generate_audio(
        text=media_request.prompt,
        model=bot["ai_model"],
        api_provider=ai_provider,
        api_key=creator_api_key
    )

    if error:
        raise HTTPException(status_code=400, detail=error)

    return {
        "output_type": "audio",
        "model_used": bot["ai_model"],
        "media_base64": media_base64,
        "mime_type": mime_type
    }


@router.post("/{bot_id:int}/generate-video", response_model=BotMediaGenerateResponse)
@limiter.limit("10/minute")
async def generate_video_with_bot(
    request: Request,
    bot_id: int,
    media_request: BotMediaGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate video content with bot configuration"""
    bot = BotModel.get_by_id(bot_id, include_secrets=True)

    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    if not bot["is_public"] and bot["creator_id"] != current_user["id"]:
        if not BotPurchaseModel.has_purchased(bot_id, current_user["id"]):
            raise HTTPException(status_code=403, detail="You must purchase this bot to use it")

    ai_service = get_ai_service()
    bot_configuration = bot.get("configuration") or {}
    ai_provider = bot_configuration.get("ai_provider", "openai")
    creator_api_key = bot_configuration.get("ai_api_key")

    media_url, media_base64, mime_type, error = ai_service.generate_video(
        prompt=media_request.prompt,
        model=bot["ai_model"],
        api_provider=ai_provider,
        api_key=creator_api_key
    )

    if error:
        raise HTTPException(status_code=400, detail=error)

    return {
        "output_type": "video",
        "model_used": bot["ai_model"],
        "media_url": media_url,
        "media_base64": media_base64,
        "mime_type": mime_type
    }


@router.get("/{bot_id:int}/conversations", response_model=List[BotConversationResponse])
@limiter.limit("30/minute")
async def get_bot_conversations(
    request: Request,
    bot_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get user's conversations with a bot"""
    conversations = BotConversationModel.get_by_user(current_user["id"], bot_id)
    return conversations


@router.get("/conversations/{conversation_id}/messages", response_model=List[BotMessageResponse])
@limiter.limit("30/minute")
async def get_conversation_messages(
    request: Request,
    conversation_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get messages in a conversation"""
    conversation = BotConversationModel.get_by_id(conversation_id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    messages = BotMessageModel.get_by_conversation(conversation_id)
    return messages


# ==================== BOT MARKETPLACE ====================

@router.post("/{bot_id:int}/purchase", response_model=BotPurchaseResponse)
@limiter.limit("10/minute")
async def purchase_bot(
    request: Request,
    bot_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Purchase a bot"""
    bot = BotModel.get_by_id(bot_id)

    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    if bot["creator_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot purchase your own bot")

    if bot["price"] == 0:
        raise HTTPException(status_code=400, detail="This bot is free")

    # Check if already purchased
    if BotPurchaseModel.has_purchased(bot_id, current_user["id"]):
        raise HTTPException(status_code=400, detail="Bot already purchased")

    # Create purchase record (payment integration would go here)
    purchase_id = BotPurchaseModel.create(bot_id, current_user["id"], bot["price"])

    if not purchase_id:
        raise HTTPException(status_code=500, detail="Failed to process purchase")

    return {
        "id": purchase_id,
        "bot_id": bot_id,
        "buyer_id": current_user["id"],
        "amount": bot["price"],
        "created_at": "",
        "bot_name": bot["name"],
        "bot_description": bot["description"]
    }


@router.get("/purchases/my-purchases", response_model=List[BotPurchaseResponse])
@limiter.limit("30/minute")
async def get_my_purchases(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get user's purchased bots"""
    purchases = BotPurchaseModel.get_by_user(current_user["id"])
    return purchases


# ==================== BOT REVIEWS ====================

@router.post("/{bot_id:int}/reviews", response_model=BotReviewResponse)
@limiter.limit("5/minute")
async def create_review(
    request: Request,
    bot_id: int,
    review_data: BotReviewCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create or update a review for a bot"""
    bot = BotModel.get_by_id(bot_id)

    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    review_id = BotReviewModel.create(
        bot_id=bot_id,
        user_id=current_user["id"],
        rating=review_data.rating,
        comment=review_data.comment
    )

    if not review_id:
        raise HTTPException(status_code=500, detail="Failed to create review")

    user = UserModel.get_by_id(current_user["id"])

    return {
        "id": review_id,
        "bot_id": bot_id,
        "user_id": current_user["id"],
        "rating": review_data.rating,
        "comment": review_data.comment,
        "full_name": user.get("full_name") if user else None,
        "created_at": "",
        "updated_at": ""
    }


@router.get("/{bot_id:int}/reviews", response_model=List[BotReviewResponse])
@limiter.limit("30/minute")
async def get_reviews(request: Request, bot_id: int):
    """Get reviews for a bot"""
    reviews = BotReviewModel.get_by_bot(bot_id)
    return reviews


# ==================== BOT ANALYTICS ====================

@router.get("/{bot_id:int}/analytics", response_model=BotAnalyticsResponse)
@limiter.limit("10/minute")
async def get_bot_analytics(
    request: Request,
    bot_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get analytics for a bot (only by creator)"""
    bot = BotModel.get_by_id(bot_id)

    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")

    if bot["creator_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get recent conversations
    from database import get_db
    conn = get_db()
    cursor = conn.cursor()

    # Total messages
    cursor.execute(
        """SELECT COUNT(*) as count FROM bot_messages bm
           JOIN bot_conversations bc ON bm.conversation_id = bc.id
           WHERE bc.bot_id = ?""",
        (bot_id,)
    )
    total_messages = cursor.fetchone()["count"]

    # Total revenue
    cursor.execute(
        "SELECT SUM(amount) as total FROM bot_purchases WHERE bot_id = ?",
        (bot_id,)
    )
    result = cursor.fetchone()
    total_revenue = result["total"] if result["total"] else 0.0

    # Recent conversations
    recent_convs = BotConversationModel.get_by_user(current_user["id"], bot_id)[:10]

    return {
        "bot_id": bot_id,
        "total_conversations": bot["total_conversations"],
        "total_messages": total_messages,
        "average_rating": BotReviewModel.get_average_rating(bot_id),
        "total_reviews": len(BotReviewModel.get_by_bot(bot_id)),
        "total_revenue": total_revenue,
        "recent_conversations": recent_convs
    }
