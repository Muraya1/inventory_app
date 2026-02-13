import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, List } from 'react-native-paper';
import { Order, PendingOrder } from '../models/types';
import { StatusBadge } from './StatusBadge';

interface OrderCardProps {
  order: Order | PendingOrder;
  onApprove?: (orderId: string) => void;
  showUsername?: boolean;
  showApproveButton?: boolean;
}

export const OrderCard = ({ order, onApprove, showUsername, showApproveButton }: OrderCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date?.toLocaleDateString?.('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) ?? dateStr;
    } catch {
      return dateStr;
    }
  };

  const pendingOrder = order as PendingOrder;

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="titleMedium" style={styles.orderId}>Order #{order?.id?.slice?.(0, 8) ?? 'Unknown'}</Text>
            {showUsername && pendingOrder?.username && (
              <Text variant="bodySmall" style={styles.username}>User: {pendingOrder.username}</Text>
            )}
          </View>
          <StatusBadge status={order?.status ?? 'pending'} />
        </View>
        <Text variant="bodySmall" style={styles.date}>{formatDate(order?.createdAt ?? '')}</Text>
        
        <List.Accordion
          title={`${(order?.items ?? []).length} item(s)`}
          expanded={expanded}
          onPress={() => setExpanded(!expanded)}
          style={styles.accordion}
        >
          {(order?.items ?? []).map((item, index) => (
            <View key={item?.id ?? index} style={styles.orderItem}>
              <Text variant="bodyMedium" style={styles.itemName}>{item?.itemName ?? 'Unknown Item'}</Text>
              <Text variant="bodyMedium" style={styles.itemQuantity}>Qty: {item?.quantity ?? 0}</Text>
            </View>
          ))}
        </List.Accordion>
      </Card.Content>
      {showApproveButton && order?.status === 'pending' && (
        <Card.Actions>
          <Button 
            mode="contained" 
            onPress={() => onApprove?.(order?.id ?? '')} 
            icon="check-circle"
            buttonColor="#4caf50"
          >
            Approve Order
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
  headerLeft: {
    flex: 1,
  },
  orderId: {
    fontWeight: 'bold',
  },
  username: {
    color: '#666',
    marginTop: 4,
  },
  date: {
    color: '#999',
    marginBottom: 12,
  },
  accordion: {
    backgroundColor: '#f5f5f5',
    marginTop: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemName: {
    flex: 1,
  },
  itemQuantity: {
    fontWeight: '600',
  },
});