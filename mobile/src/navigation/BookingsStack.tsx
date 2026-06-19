// src/navigation/BookingsStack.tsx (05 §6.1)
// Native stack for the Bookings tab: BookingHistory (tab root) → BookingDetail.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BookingsStackParamList } from './types';
import { BookingHistoryScreen } from '../screens/bookings/BookingHistoryScreen';
import { BookingDetailScreen } from '../screens/bookings/BookingDetailScreen';

const Stack = createNativeStackNavigator<BookingsStackParamList>();

export function BookingsStack() {
  return (
    <Stack.Navigator initialRouteName="BookingHistory">
      <Stack.Screen
        name="BookingHistory"
        component={BookingHistoryScreen}
        options={{ title: 'My bookings' }}
      />
      <Stack.Screen
        name="BookingDetail"
        component={BookingDetailScreen}
        options={{ title: 'Booking' }}
      />
    </Stack.Navigator>
  );
}
