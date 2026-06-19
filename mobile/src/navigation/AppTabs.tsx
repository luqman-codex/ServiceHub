// src/navigation/AppTabs.tsx (05 §6.1)
// Bottom tab navigator for the authenticated CUSTOMER app. Each tab hosts its own
// native stack so drill-downs (e.g. ServiceDetail) push within the tab while the
// tab bar stays visible (05 §6, "Why a stack inside each tab?").
//
// Tab icons are simple emoji glyphs rendered in <Text> to avoid an extra icon
// dependency; the tab bar itself hides each stack's own header to prevent a double header.
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from './types';
import { ServicesStack } from './ServicesStack';
import { BookingsStack } from './BookingsStack';
import { ProfileStack } from './ProfileStack';

const Tab = createBottomTabNavigator<AppTabsParamList>();

function tabIcon(glyph: string) {
  return ({ color, size }: { color: string; size: number }) => (
    <Text style={{ fontSize: size, color }}>{glyph}</Text>
  );
}

export function AppTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Services"
      screenOptions={{
        headerShown: false, // each inner stack renders its own header
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Tab.Screen
        name="Services"
        component={ServicesStack}
        options={{ tabBarLabel: 'Services', tabBarIcon: tabIcon('🧰') }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsStack}
        options={{ tabBarLabel: 'Bookings', tabBarIcon: tabIcon('📅') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile', tabBarIcon: tabIcon('👤') }}
      />
    </Tab.Navigator>
  );
}
