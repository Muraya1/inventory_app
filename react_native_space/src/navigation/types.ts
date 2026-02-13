import { NavigatorScreenParams } from '@react-navigation/native';
import { InventoryItem } from '../models/types';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Inventory: undefined;
  MyOrders: undefined;
  AdminPending: undefined;
  AdminInventory: undefined;
};

export type AdminInventoryStackParamList = {
  AdminInventoryList: undefined;
  AddEditInventory: { item?: InventoryItem };
};