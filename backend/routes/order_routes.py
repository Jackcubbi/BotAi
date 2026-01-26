from fastapi import APIRouter, HTTPException, status, Depends
from schemas import OrderCreate, OrderResponse
from models import OrderModel, CartModel, ProductModel
from middleware.auth import get_current_user_id
from typing import List

router = APIRouter(prefix="/api", tags=["orders"])

@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user_id: int = Depends(get_current_user_id)
):
    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item"
        )

    total_amount = 0
    for item in order_data.items:
        product = ProductModel.get_by_id(item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found"
            )

        if product["stock"] < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product {product['name']}"
            )

        total_amount += item.price * item.quantity

    order_id = OrderModel.create(
        user_id=current_user_id,
        total_amount=total_amount,
        shipping_address=order_data.shipping_address,
        items=[item.dict() for item in order_data.items]
    )

    if not order_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create order"
        )

    CartModel.clear_cart(current_user_id)

    order = OrderModel.get_by_id(order_id, current_user_id)
    return OrderResponse(**order)

@router.get("/orders", response_model=List[OrderResponse])
async def get_orders(current_user_id: int = Depends(get_current_user_id)):
    orders = OrderModel.get_by_user(current_user_id)
    return [OrderResponse(**order) for order in orders]

@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user_id: int = Depends(get_current_user_id)
):
    order = OrderModel.get_by_id(order_id, current_user_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    return OrderResponse(**order)
