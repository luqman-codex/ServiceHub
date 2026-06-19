// src/navigation/RootNavigator.tsx (05 §6.3)
// Decides Auth stack vs App tabs based on AuthContext.token. While the saved token is
// being read from SecureStore on cold start, show a centered loading spinner.
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';

export function RootNavigator() {
  const { token, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    // While we read the saved token from SecureStore on cold start.
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return token ? <AppTabs /> : <AuthStack />;
}
