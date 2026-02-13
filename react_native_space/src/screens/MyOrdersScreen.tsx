import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Button, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useOrders } from '../hooks/useOrders';
import { OrderCard } from '../components/OrderCard';
import { Loader } from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Order } from '../models/types';

type FilterType = 'all' | 'pending' | 'approved';

const MyOrdersScreen = () => {
  const { orders, isLoading, error, fetchMyOrders } = useOrders();
  const { logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useFocusEffect(
    React.useCallback(() => {
      fetchMyOrders();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyOrders();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const getFilteredOrders = () => {
    if (filter === 'all') return orders ?? [];
    return (orders ?? []).filter(order => order?.status === filter);
  };

  const filteredOrders = getFilteredOrders();

  if (isLoading && (orders ?? []).length === 0) {
    return <Loader message="Loading your orders..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <SegmentedButtons
            value={filter}
            onValueChange={(value) => setFilter(value as FilterType)}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
            ]}
            style={styles.segmentedButtons}
          />
          <Button
            mode="outlined"
            onPress={handleLogout}
            icon="logout"
            style={styles.logoutButton}
          >
            Logout
          </Button>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="outlined" onPress={fetchMyOrders}>Retry</Button>
          </View>
        )}

        {filteredOrders.length === 0 && !isLoading && !error ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-off" size={64} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyText}>
              {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {filter === 'all' ? 'Start by adding items to your cart from the Inventory tab' : ''}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item?.id ?? ''}
            renderItem={({ item }) => <OrderCard order={item} />}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </View>
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
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  logoutButton: {
    marginTop: 8,
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
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#bbb',
    textAlign: 'center',
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
});

export default MyOrdersScreen;