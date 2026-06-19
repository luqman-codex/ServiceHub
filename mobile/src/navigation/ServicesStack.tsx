// src/navigation/ServicesStack.tsx (05 §6.1)
// Native stack for the Services tab: ServiceList (tab root) → ServiceDetail → CreateBooking.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ServicesStackParamList } from './types';
import { ServiceListScreen } from '../screens/services/ServiceListScreen';
import { ServiceDetailScreen } from '../screens/services/ServiceDetailScreen';
import { CreateBookingScreen } from '../screens/bookings/CreateBookingScreen';

const Stack = createNativeStackNavigator<ServicesStackParamList>();

export function ServicesStack() {
  return (
    <Stack.Navigator initialRouteName="ServiceList">
      <Stack.Screen
        name="ServiceList"
        component={ServiceListScreen}
        options={{ title: 'Services' }}
      />
      <Stack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
        options={{ title: 'Service' }}
      />
      <Stack.Screen
        name="CreateBooking"
        component={CreateBookingScreen}
        options={{ title: 'Book service' }}
      />
    </Stack.Navigator>
  );
}
