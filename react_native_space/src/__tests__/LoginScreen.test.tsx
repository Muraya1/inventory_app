import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import { AuthProvider } from '../context/AuthContext';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
} as any;

describe('LoginScreen', () => {
  it('should render login form', () => {
    const { getByText } = render(
      <NavigationContainer>
        <AuthProvider>
          <LoginScreen navigation={mockNavigation} />
        </AuthProvider>
      </NavigationContainer>
    );

    expect(getByText(/Sign in to your account/i)).toBeTruthy();
  });

  it('should show validation errors for empty fields', async () => {
    const { getByText, getAllByText } = render(
      <NavigationContainer>
        <AuthProvider>
          <LoginScreen navigation={mockNavigation} />
        </AuthProvider>
      </NavigationContainer>
    );

    const signInButton = getByText('Sign In');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(getByText('Username is required')).toBeTruthy();
      expect(getByText('Password is required')).toBeTruthy();
    });
  });
});