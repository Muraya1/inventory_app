import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, HelperText, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminInventoryStackParamList } from '../navigation/types';
import { useInventory } from '../hooks/useInventory';

type AddEditInventoryRouteProp = RouteProp<AdminInventoryStackParamList, 'AddEditInventory'>;
type AddEditInventoryNavigationProp = NativeStackNavigationProp<AdminInventoryStackParamList, 'AddEditInventory'>;

interface AddEditInventoryScreenProps {
  route: AddEditInventoryRouteProp;
  navigation: AddEditInventoryNavigationProp;
}

const AddEditInventoryScreen = ({ route, navigation }: AddEditInventoryScreenProps) => {
  const { item } = route?.params ?? {};
  const isEditMode = !!item;
  const { createItem, updateItem } = useInventory();

  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [stockLevel, setStockLevel] = useState(String(item?.stockLevel ?? ''));
  const [unit, setUnit] = useState(item?.unit ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string; stockLevel?: string; unit?: string }>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const validateForm = () => {
    const newErrors: { name?: string; description?: string; stockLevel?: string; unit?: string } = {};

    if (!name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!stockLevel?.trim()) {
      newErrors.stockLevel = 'Stock level is required';
    } else if (isNaN(Number(stockLevel)) || Number(stockLevel) < 0) {
      newErrors.stockLevel = 'Stock level must be a positive number';
    }

    if (!unit?.trim()) {
      newErrors.unit = 'Unit is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        stockLevel: Number(stockLevel),
        unit: unit.trim(),
      };

      if (isEditMode) {
        await updateItem(item?.id ?? '', data);
        showSnackbar('Item updated successfully');
      } else {
        await createItem(data);
        showSnackbar('Item created successfully');
      }

      // Navigate back after a short delay
      setTimeout(() => {
        navigation?.goBack?.();
      }, 500);
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <TextInput
              label="Name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors?.name) {
                  setErrors(prev => ({ ...prev, name: undefined }));
                }
              }}
              mode="outlined"
              style={styles.input}
              error={!!errors?.name}
              disabled={isLoading}
            />
            {errors?.name && <HelperText type="error" visible>{errors.name}</HelperText>}

            <TextInput
              label="Description"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors?.description) {
                  setErrors(prev => ({ ...prev, description: undefined }));
                }
              }}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              error={!!errors?.description}
              disabled={isLoading}
            />
            {errors?.description && <HelperText type="error" visible>{errors.description}</HelperText>}

            <TextInput
              label="Stock Level"
              value={stockLevel}
              onChangeText={(text) => {
                setStockLevel(text);
                if (errors?.stockLevel) {
                  setErrors(prev => ({ ...prev, stockLevel: undefined }));
                }
              }}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              error={!!errors?.stockLevel}
              disabled={isLoading}
            />
            {errors?.stockLevel && <HelperText type="error" visible>{errors.stockLevel}</HelperText>}

            <TextInput
              label="Unit (e.g., pieces, kg, liters)"
              value={unit}
              onChangeText={(text) => {
                setUnit(text);
                if (errors?.unit) {
                  setErrors(prev => ({ ...prev, unit: undefined }));
                }
              }}
              mode="outlined"
              style={styles.input}
              error={!!errors?.unit}
              disabled={isLoading}
            />
            {errors?.unit && <HelperText type="error" visible>{errors.unit}</HelperText>}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation?.goBack?.()}
                disabled={isLoading}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading}
                style={styles.saveButton}
              >
                {isEditMode ? 'Update' : 'Create'}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 24,
  },
  input: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

export default AddEditInventoryScreen;