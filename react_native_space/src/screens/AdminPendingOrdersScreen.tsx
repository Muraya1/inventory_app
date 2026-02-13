import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Button, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { usePendingOrders } from '../hooks/useOrders';
import { OrderCard } from '../components/OrderCard';
import { Loader } from '../components/Loader';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AdminPendingOrdersScreen = () => {
  const { orders, isLoading, error, fetchPendingOrders, approveOrder } = usePendingOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      fetchPendingOrders();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingOrders();
    setRefreshing(false);
  };

  const handleApprove = async (orderId: string) => {
    try {
      await approveOrder(orderId);
      showSnackbar('Order approved successfully!');
      // Refresh list
      await fetchPendingOrders();
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Failed to approve order');
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  if (isLoading && (orders ?? []).length === 0) {
    return <Loader message="Loading pending orders..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="outlined" onPress={fetchPendingOrders}>Retry</Button>
          </View>
        )}

        {(orders ?? []).length === 0 && !isLoading && !error ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="check-circle" size={64} color="#4caf50" />
            <Text variant="titleMedium" style={styles.emptyText}>No pending orders</Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>All orders have been processed</Text>
          </View>
        ) : (
          <FlatList
            data={orders ?? []}
            keyExtractor={(item) => item?.id ?? ''}
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                onApprove={handleApprove}
                showUsername
                showApproveButton
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </View>

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

export default AdminPendingOrdersScreen;