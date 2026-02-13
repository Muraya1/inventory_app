import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView } from 'react-native';
import { Text, FAB, Portal, Snackbar, Button, Dialog, TextInput, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useInventory } from '../hooks/useInventory';
import { useCart } from '../hooks/useCart';
import { useOrders } from '../hooks/useOrders';
import { InventoryCard } from '../components/InventoryCard';
import { Loader } from '../components/Loader';
import { InventoryItem, CartItem } from '../models/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const InventoryListScreen = () => {
  const { items, isLoading, error, fetchInventory } = useInventory();
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart, getTotalItems } = useCart();
  const { createOrder } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [cartVisible, setCartVisible] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchInventory();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  };

  const handleAddToCart = (item: InventoryItem) => {
    addToCart(item, 1);
    showSnackbar(`${item?.name ?? 'Item'} added to cart`);
  };

  const handlePlaceOrder = async () => {
    if ((cart ?? []).length === 0) {
      showSnackbar('Cart is empty');
      return;
    }

    setIsOrdering(true);
    try {
      const orderItems = (cart ?? []).map(cartItem => ({
        inventoryItemId: cartItem?.inventoryItem?.id ?? '',
        quantity: cartItem?.quantity ?? 0,
      }));

      await createOrder({ items: orderItems });
      clearCart();
      setCartVisible(false);
      showSnackbar('Order placed successfully!');
      fetchInventory(); // Refresh inventory
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setIsOrdering(false);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const renderCartItem = (item: CartItem) => (
    <View key={item?.inventoryItem?.id} style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text variant="titleSmall">{item?.inventoryItem?.name ?? 'Unknown'}</Text>
        <Text variant="bodySmall" style={styles.cartItemUnit}>
          Available: {item?.inventoryItem?.stockLevel ?? 0} {item?.inventoryItem?.unit ?? ''}
        </Text>
      </View>
      <View style={styles.cartItemActions}>
        <IconButton
          icon="minus"
          size={20}
          onPress={() => updateQuantity(item?.inventoryItem?.id ?? '', (item?.quantity ?? 0) - 1)}
        />
        <TextInput
          value={String(item?.quantity ?? 0)}
          onChangeText={(text) => {
            const num = parseInt(text) || 0;
            updateQuantity(item?.inventoryItem?.id ?? '', num);
          }}
          keyboardType="numeric"
          style={styles.quantityInput}
        />
        <IconButton
          icon="plus"
          size={20}
          onPress={() => updateQuantity(item?.inventoryItem?.id ?? '', (item?.quantity ?? 0) + 1)}
        />
        <IconButton
          icon="delete"
          size={20}
          iconColor="#d32f2f"
          onPress={() => removeFromCart(item?.inventoryItem?.id ?? '')}
        />
      </View>
    </View>
  );

  if (isLoading && (items ?? []).length === 0) {
    return <Loader message="Loading inventory..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="outlined" onPress={fetchInventory}>Retry</Button>
          </View>
        )}

        {(items ?? []).length === 0 && !isLoading && !error ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant-closed" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyText}>No inventory items available</Text>
          </View>
        ) : (
          <FlatList
            data={items ?? []}
            keyExtractor={(item) => item?.id ?? ''}
            renderItem={({ item }) => (
              <InventoryCard
                item={item}
                onOrder={handleAddToCart}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}

        {getTotalItems() > 0 && (
          <FAB
            icon="cart"
            label={`Cart (${getTotalItems()})`}
            style={styles.fab}
            onPress={() => setCartVisible(true)}
          />
        )}
      </View>

      <Portal>
        <Dialog visible={cartVisible} onDismiss={() => setCartVisible(false)} style={styles.dialog}>
          <Dialog.Title>Shopping Cart</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={styles.cartContent}>
              {(cart ?? []).map(renderCartItem)}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setCartVisible(false)} disabled={isOrdering}>Cancel</Button>
            <Button 
              mode="contained" 
              onPress={handlePlaceOrder} 
              loading={isOrdering}
              disabled={isOrdering || (cart ?? []).length === 0}
            >
              Place Order
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dialog: {
    maxHeight: '80%',
  },
  cartContent: {
    paddingHorizontal: 24,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemUnit: {
    color: '#666',
    marginTop: 4,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityInput: {
    width: 50,
    height: 40,
    textAlign: 'center',
    marginHorizontal: 4,
  },
});

export default InventoryListScreen;