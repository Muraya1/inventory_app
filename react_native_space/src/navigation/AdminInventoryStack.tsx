import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminInventoryStackParamList } from './types';
import AdminInventoryManagementScreen from '../screens/AdminInventoryManagementScreen';
import AddEditInventoryScreen from '../screens/AddEditInventoryScreen';

const Stack = createNativeStackNavigator<AdminInventoryStackParamList>();

export const AdminInventoryStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="AdminInventoryList" 
        component={AdminInventoryManagementScreen}
        options={{ title: 'Manage Inventory' }}
      />
      <Stack.Screen 
        name="AddEditInventory" 
        component={AddEditInventoryScreen}
        options={({ route }) => ({
          title: route?.params?.item ? 'Edit Item' : 'Add Item',
        })}
      />
    </Stack.Navigator>
  );
};