// src/navigation/types.ts (05 §6.2)
// Typed param lists give useNavigation<NativeStackNavigationProp<...>>() and
// useRoute<RouteProp<...>>() full type safety on params.

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type ServicesStackParamList = {
  ServiceList: undefined;
  ServiceDetail: { serviceId: number };
  CreateBooking: { serviceId: number };
};

export type BookingsStackParamList = {
  BookingHistory: undefined;
  BookingDetail: { bookingId: number };
};

export type ProfileStackParamList = {
  Profile: undefined;
};

export type AppTabsParamList = {
  Services: undefined;
  Bookings: undefined;
  Profile: undefined;
};
