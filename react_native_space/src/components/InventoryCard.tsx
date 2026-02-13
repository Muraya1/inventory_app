import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, IconButton } from 'react-native-paper';
import { InventoryItem } from '../models/types';

interface InventoryCardProps {
  item: InventoryItem;
  onOrder?: (item: InventoryItem) => void;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  showAdminActions?: boolean;
}

export const InventoryCard = ({ item, onOrder, onEdit, onDelete, showAdminActions }: InventoryCardProps) => {
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>{item?.name ?? 'Unknown Item'}</Text>
          {showAdminActions && (
            <View style={styles.adminActions}>
              <IconButton icon="pencil" size={20} onPress={() => onEdit?.(item)} />
              <IconButton icon="delete" size={20} iconColor="#d32f2f" onPress={() => onDelete?.(item)} />
            </View>
          )}
        </View>
        <Text variant="bodyMedium" style={styles.description}>{item?.description ?? ''}</Text>
        <View style={styles.stockContainer}>
          <Text variant="bodyLarge" style={styles.stockLabel}>Stock Level:</Text>
          <Text 
            variant="bodyLarge" 
            style={[
              styles.stockValue,
              (item?.stockLevel ?? 0) > 10 ? styles.stockHigh : (item?.stockLevel ?? 0) > 0 ? styles.stockMedium : styles.stockLow
            ]}
          >
            {item?.stockLevel ?? 0} {item?.unit ?? ''}
          </Text>
        </View>
      </Card.Content>
      {onOrder && (
        <Card.Actions>
          <Button 
            mode="contained" 
            onPress={() => onOrder(item)} 
            disabled={(item?.stockLevel ?? 0) <= 0}
            icon="cart-plus"
          >
            Add to Cart
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  adminActions: {
    flexDirection: 'row',
  },
  description: {
    color: '#666',
    marginBottom: 12,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLabel: {
    fontWeight: '600',
    marginRight: 8,
  },
  stockValue: {
    fontWeight: 'bold',
  },
  stockHigh: {
    color: '#4caf50',
  },
  stockMedium: {
    color: '#ff9800',
  },
  stockLow: {
    color: '#d32f2f',
  },
});