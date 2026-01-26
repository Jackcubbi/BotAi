import { Product } from '../contexts/CartContext';
import { apiClient } from '../lib/api';

// API Product interface matching backend schema
export interface ApiProduct {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  categoryId?: number;
  description?: string;
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fetch products from API
export async function getProductsFromApi(): Promise<ApiProduct[]> {
  try {
    const response = await apiClient.getProducts();
    if (response.success && response.data) {
      return (response.data as any).products || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching products from API:', error);
    return [];
  }
}

// Get single product from API
export async function getProductFromApi(id: number): Promise<ApiProduct | null> {
  try {
    const response = await apiClient.getProduct(id);
    if (response.success && response.data) {
      return (response.data as any).product || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching product from API:', error);
    return null;
  }
}

// Product image mapping (for products that don't have imageUrl from backend)
export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  'Pink Suit Jacket': 'https://api.builder.io/api/v1/image/assets/TEMP/27c361a92078ded646e7bb081b2459444472a25c?width=800',
  'White Hoodie': 'https://api.builder.io/api/v1/image/assets/TEMP/1ba06dbe8aa77c8ba77e5d1c1941c7f4fe4a3451?width=800',
  'Blue Cowboy Hat': 'https://api.builder.io/api/v1/image/assets/TEMP/8c3f0a48b578cffaa1354efef81dcba2bc95fb00?width=800',
  'Black Shirt': 'https://api.builder.io/api/v1/image/assets/TEMP/8b8f4b1b38ac1a960b22545fd5b66d4f8ba8cb72?width=800',
  'Denim Jacket': 'https://api.builder.io/api/v1/image/assets/TEMP/e48f3611865047e002cc033f3e0bd62fa57a517e?width=800',
  'Leather Boots': 'https://api.builder.io/api/v1/image/assets/TEMP/f4cc19f2c4bbea9f9e5447682e27188cc7151120?width=800',
  'Summer Dress': 'https://api.builder.io/api/v1/image/assets/TEMP/fad0df61ef66bac543a7b4fc7febc2d0bad5ca29?width=800',
  'Wool Coat': 'https://api.builder.io/api/v1/image/assets/TEMP/70f3a01b15a364552b6c677266c5eacdbadd60e1?width=800',
  // Fallback placeholder
  'default': '/local-assets/placeholder.svg'
};

// Get product image by name or use backend imageUrl
export function getProductImage(productName: string, backendImageUrl?: string): string {
  if (backendImageUrl) return backendImageUrl;
  return PRODUCT_IMAGE_MAP[productName] || PRODUCT_IMAGE_MAP['default'];
}

// Convert API product to Cart product format
export function convertApiProductToCartProduct(apiProduct: ApiProduct): Product {
  return {
    id: apiProduct.id.toString(),
    name: apiProduct.name,
    price: apiProduct.price,
    image: getProductImage(apiProduct.name, apiProduct.imageUrl),
    description: apiProduct.description || '',
    category: 'AI Bot', // Backend doesn't return category name yet
    sizes: ['XS', 'S', 'M', 'L', 'XL'], // Default sizes
    colors: ['Default'], // Default color
    inStock: apiProduct.stockQuantity
  };
}

