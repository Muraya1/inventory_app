import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Snackbar, HelperText, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { UserRole } from '../models/types';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; confirmPassword?: string }>({});

  const validateForm = () => {
    const newErrors: { username?: string; password?: string; confirmPassword?: string } = {};
    
    if (!username?.trim()) {
      newErrors.username = 'Username is required';
    } else if ((username?.length ?? 0) < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!password?.trim()) {
      newErrors.password = 'Password is required';
    } else if ((password?.length ?? 0) < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword?.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await register(username, password, role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text variant="displaySmall" style={styles.title}>📦 Inventory App</Text>
            <Text variant="titleMedium" style={styles.subtitle}>Create your account</Text>

            <TextInput
              label="Username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errors?.username) {
                  setErrors(prev => ({ ...prev, username: undefined }));
                }
              }}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              error={!!errors?.username}
              disabled={isLoading}
            />
            {errors?.username && <HelperText type="error" visible>{errors.username}</HelperText>}

            <TextInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors?.password) {
                  setErrors(prev => ({ ...prev, password: undefined }));
                }
              }}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
              error={!!errors?.password}
              disabled={isLoading}
            />
            {errors?.password && <HelperText type="error" visible>{errors.password}</HelperText>}

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors?.confirmPassword) {
                  setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              right={<TextInput.Icon icon={showConfirmPassword ? "eye-off" : "eye"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
              error={!!errors?.confirmPassword}
              disabled={isLoading}
            />
            {errors?.confirmPassword && <HelperText type="error" visible>{errors.confirmPassword}</HelperText>}

            <View style={styles.roleContainer}>
              <Text variant="titleSmall" style={styles.roleLabel}>Select Role:</Text>
              <SegmentedButtons
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                buttons={[
                  { value: 'user', label: 'User' },
                  { value: 'admin', label: 'Admin' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              Register
            </Button>

            <Button
              mode="text"
              onPress={() => navigation?.goBack?.()}
              disabled={isLoading}
              style={styles.linkButton}
            >
              Already have an account? Sign In
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => setError(null),
        }}
      >
        {error ?? ''}
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
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    marginBottom: 8,
  },
  roleContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  roleLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  segmentedButtons: {
    marginTop: 8,
  },
  button: {
    marginTop: 16,
    paddingVertical: 4,
  },
  linkButton: {
    marginTop: 8,
  },
});

export default RegisterScreen;