from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from fastapi import Request

from middleware.auth import get_current_user, require_permission
from middleware.rate_limit import limiter
from models import SupportChatModel, AuditLogModel
from schemas import SupportMessageCreate, SupportConversationStatusUpdate

router = APIRouter(prefix="/api/support", tags=["support"])


def _log_support_admin_action(admin_user_id: int, action: str, resource_type: str, resource_id: Optional[int] = None, details: Optional[dict] = None) -> None:
    AuditLogModel.create(
        actor_user_id=admin_user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
    )


@router.get("/my-conversation")
@limiter.limit("60/minute")
async def get_my_support_conversation(
    request: Request,
    mark_read: bool = Query(False),
    current_user: dict = Depends(get_current_user)
):
    conversation = SupportChatModel.get_conversation_for_user(current_user["id"])

    if conversation and mark_read:
        SupportChatModel.mark_conversation_as_read(conversation["id"], "user")
        conversation = SupportChatModel.get_conversation_by_id(conversation["id"])

    messages = SupportChatModel.get_messages(conversation["id"]) if conversation else []

    return {
        "conversation": conversation,
        "messages": messages,
    }


@router.post("/my-conversation/messages")
@limiter.limit("60/minute")
async def send_my_support_message(
    request: Request,
    payload: SupportMessageCreate,
    current_user: dict = Depends(get_current_user)
):
    conversation = SupportChatModel.get_or_create_conversation(current_user["id"])

    message_id = SupportChatModel.add_message(
        conversation_id=conversation["id"],
        sender_id=current_user["id"],
        sender_role="user",
        message=payload.message,
    )

    if not message_id:
        raise HTTPException(status_code=500, detail="Failed to send support message")

    messages = SupportChatModel.get_messages(conversation["id"])
    updated_conversation = SupportChatModel.get_conversation_by_id(conversation["id"])

    return {
        "conversation": updated_conversation,
        "messages": messages,
    }


@router.put("/my-conversation/status")
@limiter.limit("30/minute")
async def update_my_support_conversation_status(
    request: Request,
    payload: SupportConversationStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    conversation = SupportChatModel.get_conversation_for_user(current_user["id"])
    if not conversation:
        raise HTTPException(status_code=404, detail="Support conversation not found")

    if payload.status == "closed":
        status_updated = SupportChatModel.update_status(conversation["id"], "closed")
        if not status_updated:
            raise HTTPException(status_code=500, detail="Failed to close support conversation")

        archived_conversation = SupportChatModel.archive_and_close_conversation(
            conversation_id=conversation["id"],
            closed_by=current_user["id"],
        )
        if not archived_conversation:
            raise HTTPException(status_code=500, detail="Failed to archive support conversation")

        _log_support_admin_action(
            admin_user_id,
            action="support.conversation.close_archive",
            resource_type="support_conversation",
            resource_id=conversation_id,
            details={"status": "closed"},
        )

        return {
            "message": "Support conversation archived",
            "conversation": None,
            "archived_conversation": archived_conversation,
        }

    success = SupportChatModel.update_status(conversation["id"], payload.status)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update support conversation status")

    _log_support_admin_action(
        admin_user_id,
        action="support.conversation.status_update",
        resource_type="support_conversation",
        resource_id=conversation_id,
        details={"status": payload.status},
    )

    return {
        "message": "Support conversation status updated",
        "conversation": SupportChatModel.get_conversation_by_id(conversation["id"]),
    }


@router.get("/admin/conversations")
@limiter.limit("60/minute")
async def get_admin_support_conversations(
    request: Request,
    status: Optional[str] = Query(None, pattern="^(open|closed)$"),
    search: Optional[str] = Query(None, min_length=1, max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin_user_id: int = Depends(require_permission("support.manage"))
):
    offset = (page - 1) * limit
    conversations = SupportChatModel.get_admin_conversations(status=status, limit=limit, offset=offset, search=search)

    return {
        "conversations": conversations,
        "page": page,
        "limit": limit,
    }


@router.get("/admin/conversations/{conversation_id:int}/messages")
@limiter.limit("60/minute")
async def get_admin_support_messages(
    request: Request,
    conversation_id: int,
    mark_read: bool = Query(True),
    admin_user_id: int = Depends(require_permission("support.manage"))
):
    conversation = SupportChatModel.get_conversation_by_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Support conversation not found")

    if mark_read:
        SupportChatModel.mark_conversation_as_read(conversation_id, "admin")
        conversation = SupportChatModel.get_conversation_by_id(conversation_id)

    messages = SupportChatModel.get_messages(conversation_id)
    return {
        "conversation": conversation,
        "messages": messages,
    }


@router.post("/admin/users/{user_id:int}/start-conversation")
@limiter.limit("30/minute")
async def start_admin_support_conversation(
    request: Request,
    user_id: int,
    admin_user_id: int = Depends(require_permission("support.manage"))
):
    conversation = SupportChatModel.get_or_create_conversation(user_id)
    if not conversation:
        raise HTTPException(status_code=500, detail="Failed to start support conversation")

    messages = SupportChatModel.get_messages(conversation["id"])
    return {
        "message": "Support conversation started",
        "conversation": conversation,
        "messages": messages,
    }


@router.post("/admin/conversations/{conversation_id:int}/messages")
@limiter.limit("60/minute")
async def send_admin_support_message(
    request: Request,
    conversation_id: int,
    payload: SupportMessageCreate,
    admin_user_id: int = Depends(require_permission("support.manage"))
):
    conversation = SupportChatModel.get_conversation_by_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Support conversation not found")

    message_id = SupportChatModel.add_message(
        conversation_id=conversation_id,
        sender_id=admin_user_id,
        sender_role="admin",
        message=payload.message,
    )

    if not message_id:
        raise HTTPException(status_code=500, detail="Failed to send admin reply")

    messages = SupportChatModel.get_messages(conversation_id)
    updated_conversation = SupportChatModel.get_conversation_by_id(conversation_id)

    return {
        "conversation": updated_conversation,
        "messages": messages,
    }


@router.put("/admin/conversations/{conversation_id:int}/status")
@limiter.limit("60/minute")
async def update_support_conversation_status(
    request: Request,
    conversation_id: int,
    payload: SupportConversationStatusUpdate,
    admin_user_id: int = Depends(require_permission("support.manage"))
):
    conversation = SupportChatModel.get_conversation_by_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Support conversation not found")

    if payload.status == "closed":
        status_updated = SupportChatModel.update_status(conversation_id, "closed")
        if not status_updated:
            raise HTTPException(status_code=500, detail="Failed to close support conversation")

        archived_conversation = SupportChatModel.archive_and_close_conversation(
            conversation_id=conversation_id,
            closed_by=admin_user_id,
        )
        if not archived_conversation:
            raise HTTPException(status_code=500, detail="Failed to archive support conversation")

        return {
            "message": "Support conversation archived",
            "conversation": None,
            "archived_conversation": archived_conversation,
        }

    success = SupportChatModel.update_status(conversation_id, payload.status)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update support conversation status")

    return {
        "message": "Support conversation status updated",
        "conversation": SupportChatModel.get_conversation_by_id(conversation_id),
    }


@router.post("/admin/conversations/{conversation_id:int}/archive")
@limiter.limit("30/minute")
async def archive_admin_support_conversation(
    request: Request,
    conversation_id: int,
    admin_user_id: int = Depends(require_permission("support.manage"))
):
    conversation = SupportChatModel.get_conversation_by_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Support conversation not found")

    archived_conversation = SupportChatModel.archive_and_close_conversation(
        conversation_id=conversation_id,
        closed_by=admin_user_id,
    )
    if not archived_conversation:
        raise HTTPException(status_code=500, detail="Failed to archive support conversation")

    _log_support_admin_action(
        admin_user_id,
        action="support.conversation.archive",
        resource_type="support_conversation",
        resource_id=conversation_id,
        details={"history_id": archived_conversation.get("id")},
    )

    return {
        "message": "Support conversation archived",
        "archived_conversation": archived_conversation,
    }


@router.get("/admin/history")
@limiter.limit("60/minute")
async def get_admin_support_history(
    request: Request,
    user_id: Optional[int] = Query(None, ge=1),
    search: Optional[str] = Query(None, min_length=1, max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin_user_id: int = Depends(require_permission("support.manage"))
):
    offset = (page - 1) * limit
    history = SupportChatModel.get_admin_history(user_id=user_id, search=search, limit=limit, offset=offset)
    return {
        "history": history,
        "page": page,
        "limit": limit,
    }


@router.get("/admin/history/{history_id:int}/messages")
@limiter.limit("60/minute")
async def get_admin_support_history_messages(
    request: Request,
    history_id: int,
    admin_user_id: int = Depends(require_permission("support.manage"))
):
    history = SupportChatModel.get_history_by_id(history_id)
    if not history:
        raise HTTPException(status_code=404, detail="Support history not found")

    messages = SupportChatModel.get_history_messages(history_id)
    return {
        "history": history,
        "messages": messages,
    }


@router.get("/my-history")
@limiter.limit("60/minute")
async def get_my_support_history(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    offset = (page - 1) * limit
    history = SupportChatModel.get_admin_history(
        user_id=current_user["id"],
        limit=limit,
        offset=offset,
    )
    return {
        "history": history,
        "page": page,
        "limit": limit,
    }


@router.get("/my-history/{history_id:int}/messages")
@limiter.limit("60/minute")
async def get_my_support_history_messages(
    request: Request,
    history_id: int,
    current_user: dict = Depends(get_current_user)
):
    history = SupportChatModel.get_history_by_id(history_id)
    if not history:
        raise HTTPException(status_code=404, detail="Support history not found")

    if history.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this support history")

    messages = SupportChatModel.get_history_messages(history_id)
    return {
        "history": history,
        "messages": messages,
    }


@router.post("/my-history/{history_id:int}/continue")
@limiter.limit("30/minute")
async def continue_my_support_history(
    request: Request,
    history_id: int,
    current_user: dict = Depends(get_current_user)
):
    history = SupportChatModel.get_history_by_id(history_id)
    if not history:
        raise HTTPException(status_code=404, detail="Support history not found")

    if history.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to continue this support history")

    conversation = SupportChatModel.continue_from_history(history_id, current_user["id"])
    if not conversation:
        raise HTTPException(status_code=500, detail="Failed to continue support conversation")

    _log_support_admin_action(
        admin_user_id,
        action="support.history.continue",
        resource_type="support_history",
        resource_id=history_id,
        details={"conversation_id": conversation.get("id")},
    )

    messages = SupportChatModel.get_messages(conversation["id"])
    return {
        "message": "Support conversation continued",
        "conversation": conversation,
        "messages": messages,
        "history": SupportChatModel.get_history_by_id(history_id),
    }


@router.post("/admin/history/{history_id:int}/continue")
@limiter.limit("30/minute")
async def continue_admin_support_history(
    request: Request,
    history_id: int,
    admin_user_id: int = Depends(require_permission("support.manage"))
):
    history = SupportChatModel.get_history_by_id(history_id)
    if not history:
        raise HTTPException(status_code=404, detail="Support history not found")

    conversation = SupportChatModel.continue_from_history(history_id, history.get("user_id"))
    if not conversation:
        raise HTTPException(status_code=500, detail="Failed to continue support conversation")

    messages = SupportChatModel.get_messages(conversation["id"])
    return {
        "message": "Support conversation restored",
        "conversation": conversation,
        "messages": messages,
        "history": SupportChatModel.get_history_by_id(history_id),
    }


@router.delete("/admin/conversations/{conversation_id:int}")
@limiter.limit("30/minute")
async def delete_admin_support_conversation(
    request: Request,
    conversation_id: int,
    admin_user_id: int = Depends(require_permission("support.manage"))
):
    conversation = SupportChatModel.get_conversation_by_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Support conversation not found")

    success = SupportChatModel.delete_conversation(conversation_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete support conversation")

    _log_support_admin_action(
        admin_user_id,
        action="support.conversation.delete",
        resource_type="support_conversation",
        resource_id=conversation_id,
        details={"user_id": conversation.get("user_id")},
    )

    return {"message": "Support conversation removed"}


@router.delete("/admin/history/{history_id:int}")
@limiter.limit("30/minute")
async def delete_admin_support_history(
    request: Request,
    history_id: int,
    admin_user_id: int = Depends(require_permission("support.manage"))
):
    history = SupportChatModel.get_history_by_id(history_id)
    if not history:
        raise HTTPException(status_code=404, detail="Support history not found")

    success = SupportChatModel.delete_history(history_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete support history")

    _log_support_admin_action(
        admin_user_id,
        action="support.history.delete",
        resource_type="support_history",
        resource_id=history_id,
        details={"user_id": history.get("user_id")},
    )

    return {"message": "Support history removed"}
