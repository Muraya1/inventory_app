import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, LoginRequest, RegisterRequest, InventoryItem, CreateInventoryRequest, UpdateInventoryRequest, Order, CreateOrderRequest, PendingOrder } from '../models/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://8b1d5e33c.na105.preview.abacusai.app/';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (token && config?.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error reading token from storage:', error);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error?.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          await AsyncStorage.multiRemove(['authToken', 'user']);
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (error?.response?.data) {
      const data = error.response.data as any;
      return new Error(data?.message ?? 'An error occurred');
    } else if (error?.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error(error?.message ?? 'An unexpected error occurred');
    }
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/api/auth/register', data);
    return response?.data ?? { token: '', user: { id: '', username: '', role: 'user' } };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/api/auth/login', data);
    return response?.data ?? { token: '', user: { id: '', username: '', role: 'user' } };
  }

  // Inventory endpoints
  async getInventory(): Promise<InventoryItem[]> {
    const response = await this.api.get<InventoryItem[]>('/api/inventory');
    return response?.data ?? [];
  }

  async createInventoryItem(data: CreateInventoryRequest): Promise<InventoryItem> {
    const response = await this.api.post<InventoryItem>('/api/inventory', data);
    return response?.data ?? { id: '', name: '', description: '', stockLevel: 0, unit: '', createdAt: '', updatedAt: '' };
  }

  async updateInventoryItem(id: string, data: UpdateInventoryRequest): Promise<InventoryItem> {
    const response = await this.api.put<InventoryItem>(`/api/inventory/${id}`, data);
    return response?.data ?? { id: '', name: '', description: '', stockLevel: 0, unit: '', createdAt: '', updatedAt: '' };
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await this.api.delete(`/api/inventory/${id}`);
  }

  // Order endpoints
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await this.api.post<Order>('/api/orders', data);
    return response?.data ?? { id: '', userId: '', status: 'pending', items: [], createdAt: '', updatedAt: '' };
  }

  async getMyOrders(): Promise<Order[]> {
    const response = await this.api.get<Order[]>('/api/orders/my-orders');
    return response?.data ?? [];
  }

  async getPendingOrders(): Promise<PendingOrder[]> {
    const response = await this.api.get<PendingOrder[]>('/api/orders/pending');
    return response?.data ?? [];
  }

  async approveOrder(id: string): Promise<Order> {
    const response = await this.api.put<Order>(`/api/orders/${id}/approve`);
    return response?.data ?? { id: '', userId: '', status: 'approved', items: [], createdAt: '', updatedAt: '' };
  }
}

export default new ApiService();