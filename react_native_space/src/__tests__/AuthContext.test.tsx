import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';

const TestComponent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  return <Text>{isLoading ? 'Loading' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</Text>;
};

describe('AuthContext', () => {
  it('should provide authentication state', async () => {
    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText(/Not Authenticated|Authenticated/)).toBeTruthy();
    });
  });
});