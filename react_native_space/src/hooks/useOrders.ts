import { useState, useEffect } from 'react';
import apiService from '../services/api';
import { Order, PendingOrder, CreateOrderRequest } from '../models/types';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getMyOrders();
      setOrders(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const createOrder = async (data: CreateOrderRequest) => {
    try {
      const newOrder = await apiService.createOrder(data);
      setOrders(prev => [newOrder, ...(prev ?? [])]);
      return newOrder;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  return {
    orders,
    isLoading,
    error,
    fetchMyOrders,
    createOrder,
  };
};

export const usePendingOrders = () => {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getPendingOrders();
      setOrders(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pending orders');
    } finally {
      setIsLoading(false);
    }
  };

  const approveOrder = async (id: string) => {
    try {
      await apiService.approveOrder(id);
      setOrders(prev => (prev ?? []).filter(order => order?.id !== id));
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  return {
    orders,
    isLoading,
    error,
    fetchPendingOrders,
    approveOrder,
  };
};