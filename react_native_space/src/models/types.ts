// TypeScript interfaces matching backend API responses exactly

export type UserRole = 'user' | 'admin';
export type OrderStatus = 'pending' | 'approved';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  stockLevel: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryRequest {
  name: string;
  description: string;
  stockLevel: number;
  unit: string;
}

export interface UpdateInventoryRequest {
  name?: string;
  description?: string;
  stockLevel?: number;
  unit?: string;
}

export interface OrderItemDto {
  inventoryItemId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  items: OrderItemDto[];
}

export interface OrderItem {
  id: string;
  inventoryItemId: string;
  itemName: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PendingOrder extends Order {
  username: string;
}

export interface CartItem {
  inventoryItem: InventoryItem;
  quantity: number;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}