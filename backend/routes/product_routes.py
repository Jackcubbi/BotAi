from fastapi import APIRouter, HTTPException, status, Depends, Query
from schemas import ProductResponse, ProductListResponse, CartItemAdd, CartItemUpdate, CartResponse, CartItemResponse
from models import ProductModel, CartModel
from middleware.auth import get_current_user_id
from typing import Optional

router = APIRouter(prefix="/api", tags=["products"])

@router.get("/products", response_model=ProductListResponse)
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None
):
    offset = (page - 1) * limit
    products = ProductModel.get_all(limit=limit, offset=offset, category=category)
    total = ProductModel.count(category=category)

    return ProductListResponse(
        products=[ProductResponse(**p) for p in products],
        total=total,
        page=page,
        limit=limit
    )

@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int):
    product = ProductModel.get_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return ProductResponse(**product)

@router.get("/cart", response_model=CartResponse)
async def get_cart(current_user_id: int = Depends(get_current_user_id)):
    cart_items = CartModel.get_cart(current_user_id)
    total = sum(item["price"] * item["quantity"] for item in cart_items)

    return CartResponse(
        items=[CartItemResponse(**item) for item in cart_items],
        total=total
    )

@router.post("/cart/add", status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    item: CartItemAdd,
    current_user_id: int = Depends(get_current_user_id)
):
    product = ProductModel.get_by_id(item.product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    if product["stock"] < item.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock"
        )

    success = CartModel.add_item(current_user_id, item.product_id, item.quantity)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add item to cart"
        )

    return {"message": "Item added to cart"}

@router.put("/cart/update")
async def update_cart_item(
    item: CartItemUpdate,
    current_user_id: int = Depends(get_current_user_id)
):
    product = ProductModel.get_by_id(item.product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    if product["stock"] < item.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock"
        )

    success = CartModel.update_quantity(current_user_id, item.product_id, item.quantity)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    return {"message": "Cart updated"}

@router.delete("/cart/remove/{product_id}")
async def remove_from_cart(
    product_id: int,
    current_user_id: int = Depends(get_current_user_id)
):
    success = CartModel.remove_item(current_user_id, product_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    return {"message": "Item removed from cart"}

@router.delete("/cart/clear")
async def clear_cart(current_user_id: int = Depends(get_current_user_id)):
    CartModel.clear_cart(current_user_id)
    return {"message": "Cart cleared"}
