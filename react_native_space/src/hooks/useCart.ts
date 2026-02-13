import { useState } from 'react';
import { CartItem, InventoryItem } from '../models/types';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: InventoryItem, quantity: number = 1) => {
    setCart(prev => {
      const existingItem = (prev ?? []).find(cartItem => cartItem?.inventoryItem?.id === item?.id);
      
      if (existingItem) {
        // Update quantity
        return (prev ?? []).map(cartItem => 
          cartItem?.inventoryItem?.id === item?.id
            ? { ...cartItem, quantity: (cartItem?.quantity ?? 0) + quantity }
            : cartItem
        );
      } else {
        // Add new item
        return [...(prev ?? []), { inventoryItem: item, quantity }];
      }
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prev => 
      (prev ?? []).map(cartItem => 
        cartItem?.inventoryItem?.id === itemId
          ? { ...cartItem, quantity }
          : cartItem
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => (prev ?? []).filter(cartItem => cartItem?.inventoryItem?.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalItems = () => {
    return (cart ?? []).reduce((sum, item) => sum + (item?.quantity ?? 0), 0);
  };

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
  };
};