import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import InventoryListScreen from '../screens/InventoryListScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import AdminPendingOrdersScreen from '../screens/AdminPendingOrdersScreen';
import { AdminInventoryStack } from './AdminInventoryStack';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#757575',
      }}
    >
      <Tab.Screen
        name="Inventory"
        component={InventoryListScreen}
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{
          title: 'My Orders',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-text" color={color} size={size} />
          ),
        }}
      />
      {isAdmin && (
        <>
          <Tab.Screen
            name="AdminPending"
            component={AdminPendingOrdersScreen}
            options={{
              title: 'Pending Orders',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="clock-alert" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="AdminInventory"
            component={AdminInventoryStack}
            options={{
              title: 'Manage Inventory',
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="cog" color={color} size={size} />
              ),
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
};