import { useState, useEffect } from 'react';
import apiService from '../services/api';
import { InventoryItem } from '../models/types';

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getInventory();
      setItems(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const createItem = async (data: { name: string; description: string; stockLevel: number; unit: string }) => {
    try {
      const newItem = await apiService.createInventoryItem(data);
      setItems(prev => [newItem, ...(prev ?? [])]);
      return newItem;
    } catch (err) {
      throw err;
    }
  };

  const updateItem = async (id: string, data: { name?: string; description?: string; stockLevel?: number; unit?: string }) => {
    try {
      const updatedItem = await apiService.updateInventoryItem(id, data);
      setItems(prev => (prev ?? []).map(item => item?.id === id ? updatedItem : item));
      return updatedItem;
    } catch (err) {
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await apiService.deleteInventoryItem(id);
      setItems(prev => (prev ?? []).filter(item => item?.id !== id));
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return {
    items,
    isLoading,
    error,
    fetchInventory,
    createItem,
    updateItem,
    deleteItem,
  };
};