import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, FAB, Button, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminInventoryStackParamList } from '../navigation/types';
import { useInventory } from '../hooks/useInventory';
import { InventoryCard } from '../components/InventoryCard';
import { Loader } from '../components/Loader';
import { InventoryItem } from '../models/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type AdminInventoryNavigationProp = NativeStackNavigationProp<AdminInventoryStackParamList, 'AdminInventoryList'>;

const AdminInventoryManagementScreen = () => {
  const navigation = useNavigation<AdminInventoryNavigationProp>();
  const { items, isLoading, error, fetchInventory, deleteItem } = useInventory();
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

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

  const handleEdit = (item: InventoryItem) => {
    navigation?.navigate?.('AddEditInventory', { item });
  };

  const handleDelete = (item: InventoryItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item?.name ?? 'this item'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(item?.id ?? '');
              showSnackbar('Item deleted successfully');
            } catch (err) {
              showSnackbar(err instanceof Error ? err.message : 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const handleAddNew = () => {
    navigation?.navigate?.('AddEditInventory', {});
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

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
            <Text variant="titleMedium" style={styles.emptyText}>No inventory items</Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>Tap the + button to add your first item</Text>
          </View>
        ) : (
          <FlatList
            data={items ?? []}
            keyExtractor={(item) => item?.id ?? ''}
            renderItem={({ item }) => (
              <InventoryCard
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showAdminActions
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleAddNew}
        />
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});

export default AdminInventoryManagementScreen;