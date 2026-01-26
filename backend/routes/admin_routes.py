from fastapi import APIRouter, HTTPException, status, Depends
from schemas import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse, UserUpdateRequest, UserRoleAssignRequest
from models import ProductModel, UserModel, RoleModel, AuditLogModel
from middleware.auth import require_permission
from typing import Optional

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Admin check dependency
async def get_admin_user(current_user_id: int = Depends(require_permission("admin.access"))) -> int:
    """Verify user is an admin"""
    return current_user_id


def _log_admin_action(admin_user_id: int, action: str, resource_type: str, resource_id: Optional[int] = None, details: Optional[dict] = None) -> None:
    AuditLogModel.create(
        actor_user_id=admin_user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
    )

# Product Management
@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    admin_user_id: int = Depends(require_permission("products.manage"))
):
    """Create a new product (Admin only)"""
    try:
        product_id = ProductModel.create(
            name=product_data.name,
            description=product_data.description,
            price=product_data.price,
            category=product_data.category,
            stock=product_data.stock,
            image_url=product_data.image_url
        )

        _log_admin_action(
            admin_user_id,
            action="product.create",
            resource_type="product",
            resource_id=product_id,
            details={"name": product_data.name, "category": product_data.category},
        )

        product = ProductModel.get_by_id(product_id)
        return ProductResponse(**product)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create product: {str(e)}"
        )

@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    admin_user_id: int = Depends(require_permission("products.manage"))
):
    """Update an existing product (Admin only)"""
    existing_product = ProductModel.get_by_id(product_id)
    if not existing_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    try:
        success = ProductModel.update(
            product_id=product_id,
            name=product_data.name,
            description=product_data.description,
            price=product_data.price,
            category=product_data.category,
            stock=product_data.stock,
            image_url=product_data.image_url
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update product"
            )

        product = ProductModel.get_by_id(product_id)
        _log_admin_action(
            admin_user_id,
            action="product.update",
            resource_type="product",
            resource_id=product_id,
            details={"name": product_data.name, "category": product_data.category},
        )
        return ProductResponse(**product)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update product: {str(e)}"
        )

@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    admin_user_id: int = Depends(require_permission("products.manage"))
):
    """Delete a product (Admin only)"""
    existing_product = ProductModel.get_by_id(product_id)
    if not existing_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    try:
        success = ProductModel.delete(product_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete product"
            )

        _log_admin_action(
            admin_user_id,
            action="product.delete",
            resource_type="product",
            resource_id=product_id,
            details={"name": existing_product.get("name")},
        )

        return {"message": "Product deleted successfully", "product_id": product_id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete product: {str(e)}"
        )

@router.get("/products", response_model=ProductListResponse)
async def get_all_products_admin(
    page: int = 1,
    limit: int = 50,
    category: Optional[str] = None,
    admin_user_id: int = Depends(require_permission("products.manage"))
):
    """Get all products with admin view (Admin only)"""
    offset = (page - 1) * limit
    products = ProductModel.get_all(limit=limit, offset=offset, category=category)
    total = ProductModel.count(category=category)

    return ProductListResponse(
        products=[ProductResponse(**p) for p in products],
        total=total,
        page=page,
        limit=limit
    )

@router.get("/stats")
async def get_admin_stats(admin_user_id: int = Depends(require_permission("analytics.read"))):
    """Get admin dashboard statistics"""
    from models import OrderModel, BotModel

    return {
        "total_products": ProductModel.count(),
        "total_orders": OrderModel.count_all(),
        "low_stock_products": ProductModel.get_low_stock(threshold=10),
        "total_users": UserModel.count(),
        "total_bots": BotModel.count(),
        "public_bots": BotModel.count(is_public=True)
    }


@router.get("/audit-logs")
async def get_audit_logs(
    page: int = 1,
    limit: int = 100,
    actor_user_id: Optional[int] = None,
    action: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    admin_user_id: int = Depends(require_permission("system.manage"))
):
    safe_limit = max(1, min(limit, 500))
    safe_page = max(1, page)
    result = AuditLogModel.list_paginated(
        page=safe_page,
        limit=safe_limit,
        actor_user_id=actor_user_id,
        action=action,
        from_date=from_date,
        to_date=to_date,
    )
    return result

# User Management
@router.get("/users")
async def get_all_users(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    admin_user_id: int = Depends(require_permission("users.read"))
):
    """Get all users with pagination (Admin only)"""
    offset = (page - 1) * limit
    users = UserModel.get_all(limit=limit, offset=offset, search=search)

    # Add statistics for each user
    users_with_stats = []
    for user in users:
        stats = UserModel.get_user_stats(user['id'])
        roles = RoleModel.get_user_roles(user['id'])
        users_with_stats.append({**user, **stats, "roles": roles})

    total = UserModel.count()

    return {
        "users": users_with_stats,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/users/{user_id}")
async def get_user_details(
    user_id: int,
    admin_user_id: int = Depends(require_permission("users.read"))
):
    """Get detailed user information (Admin only)"""
    from models import BotModel

    user = UserModel.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    stats = UserModel.get_user_stats(user_id)

    # Get user's bots
    bots = BotModel.get_all(creator_id=user_id, limit=100, offset=0)

    return {
        **user,
        **stats,
        "roles": RoleModel.get_user_roles(user_id),
        "bots": bots
    }


@router.get("/roles")
async def get_roles(
    admin_user_id: int = Depends(require_permission("users.roles.manage"))
):
    return {
        "roles": RoleModel.get_roles()
    }

@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    admin_user_id: int = Depends(require_permission("users.update"))
):
    """Update user information (Admin only)"""
    user = UserModel.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    email = payload.email
    full_name = payload.full_name

    if email and email != user.get("email"):
        existing_with_email = UserModel.get_by_email(email)
        if existing_with_email and existing_with_email.get("id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    if email == user.get("email"):
        email = None
    if full_name == user.get("full_name"):
        full_name = None

    if email is None and full_name is None:
        return user

    success = UserModel.update(user_id, full_name=full_name, email=email)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )

    updated_user = UserModel.get_by_id(user_id)
    return {
        **updated_user,
        "roles": RoleModel.get_user_roles(user_id)
    }


@router.put("/users/{user_id}/role")
async def assign_user_role(
    user_id: int,
    payload: UserRoleAssignRequest,
    admin_user_id: int = Depends(require_permission("users.roles.manage"))
):
    user = UserModel.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user_id == admin_user_id and payload.role_name != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot downgrade your own role"
        )

    actor_roles = set(RoleModel.get_user_roles(admin_user_id))
    is_admin_actor = "admin" in actor_roles or "super_admin" in actor_roles
    if payload.role_name != "user" and not is_admin_actor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can assign non-customer roles"
        )

    success = RoleModel.set_single_role(user_id, payload.role_name)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )

    _log_admin_action(
        admin_user_id,
        action="user.role.assign",
        resource_type="user",
        resource_id=user_id,
        details={"role_name": payload.role_name},
    )

    updated_user = UserModel.get_by_id(user_id)
    return {
        **updated_user,
        "roles": RoleModel.get_user_roles(user_id)
    }

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin_user_id: int = Depends(require_permission("users.delete"))
):
    """Delete a user (Admin only)"""
    if user_id == admin_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    user = UserModel.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    success = UserModel.delete(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )

    _log_admin_action(
        admin_user_id,
        action="user.delete",
        resource_type="user",
        resource_id=user_id,
        details={"email": user.get("email")},
    )

    return {"message": "User deleted successfully", "user_id": user_id}


# Bot Management Endpoints
@router.get("/bots")
async def get_all_bots(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    category: Optional[str] = None,
    is_public: Optional[bool] = None,
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Get all bots with pagination and filters (Admin only)"""
    from models import BotModel

    offset = (page - 1) * limit

    # Get bots with filters
    bots = BotModel.get_all(
        limit=limit,
        offset=offset,
        search=search,
        category=category,
        is_public=is_public
    )

    # Enrich bots with creator information
    enriched_bots = []
    for bot in bots:
        creator = UserModel.get_by_id(bot.get('creator_id'))
        bot_data = dict(bot)
        bot_data['creator_name'] = creator.get('full_name') if creator else None
        bot_data['creator_email'] = creator.get('email') if creator else None
        enriched_bots.append(bot_data)

    # Get total count
    total = BotModel.count(category=category, is_public=is_public, search=search)

    return {
        "success": True,
        "data": {
            "bots": enriched_bots,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
    }


@router.get("/bots/{bot_id}")
async def get_admin_bot_details(
    bot_id: int,
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Get detailed bot information (Admin only)"""
    from models import BotModel

    bot = BotModel.get_by_id(bot_id)
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot not found"
        )

    # Get creator info
    creator = UserModel.get_by_id(bot.get('creator_id'))

    # Get bot stats
    stats = BotModel.get_bot_stats(bot_id)

    bot_data = dict(bot)
    bot_data['creator_name'] = creator.get('full_name') if creator else None
    bot_data['creator_email'] = creator.get('email') if creator else None
    bot_data['stats'] = stats

    return {"success": True, "data": bot_data}


@router.put("/bots/{bot_id}")
async def update_admin_bot(
    bot_id: int,
    bot_data: dict,
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Update any bot (Admin override)"""
    from models import BotModel

    bot = BotModel.get_by_id(bot_id)
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot not found"
        )

    # Update bot
    success = BotModel.update(bot_id, **bot_data)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update bot"
        )

    _log_admin_action(
        admin_user_id,
        action="bot.update",
        resource_type="bot",
        resource_id=bot_id,
        details={"fields": list(bot_data.keys())},
    )

    updated_bot = BotModel.get_by_id(bot_id)
    return {"success": True, "data": updated_bot}


@router.delete("/bots/{bot_id}")
async def delete_admin_bot(
    bot_id: int,
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Delete any bot (Admin only)"""
    from models import BotModel

    bot = BotModel.get_by_id(bot_id)
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot not found"
        )

    success = BotModel.delete(bot_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete bot"
        )

    _log_admin_action(
        admin_user_id,
        action="bot.delete",
        resource_type="bot",
        resource_id=bot_id,
        details={"name": bot.get("name")},
    )

    return {"success": True, "data": {"message": "Bot deleted successfully"}}


@router.put("/bots/{bot_id}/publish")
async def toggle_admin_bot_publish(
    bot_id: int,
    data: dict,
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Toggle bot public/private status (Admin only)"""
    from models import BotModel

    bot = BotModel.get_by_id(bot_id)
    if not bot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bot not found"
        )

    is_public = data.get('is_public', False)
    success = BotModel.update(bot_id, is_public=is_public)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update bot status"
        )

    _log_admin_action(
        admin_user_id,
        action="bot.publish.toggle",
        resource_type="bot",
        resource_id=bot_id,
        details={"is_public": bool(is_public)},
    )

    updated_bot = BotModel.get_by_id(bot_id)
    return {"success": True, "data": updated_bot}


# ==================== CATEGORY MANAGEMENT ====================

@router.get("/categories")
async def get_all_categories(
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Get all bot categories with subcategories (Admin only)"""
    from models import BotCategoryModel

    categories = BotCategoryModel.get_with_subcategories()

    return {
        "success": True,
        "data": {
            "categories": categories,
            "total": len(categories)
        }
    }


@router.get("/categories/{category_id}")
async def get_category_details(
    category_id: int,
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Get detailed category information with subcategories (Admin only)"""
    from models import BotCategoryModel

    categories = BotCategoryModel.get_with_subcategories(category_id)
    if not categories:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    return {"success": True, "data": categories[0]}


@router.post("/categories")
async def create_category(
    category_data: dict,
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Create a new bot category (Admin only)"""
    from models import BotCategoryModel

    name = category_data.get("name")
    description = category_data.get("description")
    icon = category_data.get("icon")

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category name is required"
        )

    category_id = BotCategoryModel.create(name, description, icon)
    if not category_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category with this name already exists"
        )

    category = BotCategoryModel.get_by_id(category_id)
    return {"success": True, "data": category}


@router.put("/categories/{category_id}")
async def update_category(
    category_id: int,
    category_data: dict,
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Update a category (Admin only)"""
    from models import BotCategoryModel

    category = BotCategoryModel.get_by_id(category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    name = category_data.get("name")
    description = category_data.get("description")
    icon = category_data.get("icon")

    success = BotCategoryModel.update(category_id, name, description, icon)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Failed to update category (name may already exist)"
        )

    updated_category = BotCategoryModel.get_by_id(category_id)
    return {"success": True, "data": updated_category}


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Delete a category (Admin only)"""
    from models import BotCategoryModel

    category = BotCategoryModel.get_by_id(category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    result = BotCategoryModel.delete(category_id)
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to delete category")
        )

    _log_admin_action(
        admin_user_id,
        action="category.delete",
        resource_type="category",
        resource_id=category_id,
        details={"name": category.get("name")},
    )

    return {"success": True, "message": "Category deleted successfully"}


# ==================== SUBCATEGORY MANAGEMENT ====================

@router.get("/subcategories")
async def get_all_subcategories(
    category_id: Optional[int] = None,
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Get all subcategories, optionally filtered by category (Admin only)"""
    from models import BotSubcategoryModel

    subcategories = BotSubcategoryModel.get_all(category_id)

    return {
        "success": True,
        "data": {
            "subcategories": subcategories,
            "total": len(subcategories)
        }
    }


@router.get("/subcategories/{subcategory_id}")
async def get_subcategory_details(
    subcategory_id: int,
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Get detailed subcategory information (Admin only)"""
    from models import BotSubcategoryModel

    subcategory = BotSubcategoryModel.get_by_id(subcategory_id)
    if not subcategory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subcategory not found"
        )

    return {"success": True, "data": subcategory}


@router.post("/subcategories")
async def create_subcategory(
    subcategory_data: dict,
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Create a new subcategory (Admin only)"""
    from models import BotSubcategoryModel

    category_id = subcategory_data.get("category_id")
    name = subcategory_data.get("name")
    description = subcategory_data.get("description")

    if not category_id or not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category ID and name are required"
        )

    subcategory_id = BotSubcategoryModel.create(category_id, name, description)
    if not subcategory_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subcategory with this name already exists in this category"
        )

    subcategory = BotSubcategoryModel.get_by_id(subcategory_id)
    return {"success": True, "data": subcategory}


@router.put("/subcategories/{subcategory_id}")
async def update_subcategory(
    subcategory_id: int,
    subcategory_data: dict,
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Update a subcategory (Admin only)"""
    from models import BotSubcategoryModel

    subcategory = BotSubcategoryModel.get_by_id(subcategory_id)
    if not subcategory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subcategory not found"
        )

    name = subcategory_data.get("name")
    description = subcategory_data.get("description")
    category_id = subcategory_data.get("category_id")

    success = BotSubcategoryModel.update(subcategory_id, name, description, category_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Failed to update subcategory (name may already exist in category)"
        )

    updated_subcategory = BotSubcategoryModel.get_by_id(subcategory_id)
    return {"success": True, "data": updated_subcategory}


@router.delete("/subcategories/{subcategory_id}")
async def delete_subcategory(
    subcategory_id: int,
    admin_user_id: int = Depends(require_permission("bots.manage"))
):
    """Delete a subcategory (Admin only)"""
    from models import BotSubcategoryModel

    subcategory = BotSubcategoryModel.get_by_id(subcategory_id)
    if not subcategory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subcategory not found"
        )

    success = BotSubcategoryModel.delete(subcategory_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete subcategory"
        )

    _log_admin_action(
        admin_user_id,
        action="subcategory.delete",
        resource_type="subcategory",
        resource_id=subcategory_id,
        details={"name": subcategory.get("name")},
    )

    return {"success": True, "message": "Subcategory deleted successfully"}
