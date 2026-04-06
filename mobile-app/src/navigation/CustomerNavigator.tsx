/**
 * CustomerNavigator
 *
 * Self-contained navigator for customers. Only customer-relevant screens
 * are registered here, keeping the bundle and route namespace clean and
 * separate from the worker app.
 */

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { BookingChatScreen } from "../screens/BookingChatScreen";
import { BookingScreen } from "../screens/BookingScreen";
import { BookingSlotsScreen } from "../screens/BookingSlotsScreen";
import { BookingSummaryScreen } from "../screens/BookingSummaryScreen";
import { BookingTrackingScreen } from "../screens/BookingTrackingScreen";
import { CustomerGuideScreen } from "../screens/CustomerGuideScreen";
import { CustomerProfileScreen } from "../screens/CustomerProfileScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ManageAddressesScreen } from "../screens/ManageAddressesScreen";
import { OrderHistoryScreen } from "../screens/OrderHistoryScreen";
import { PaymentScreen } from "../screens/PaymentScreen";
import { PaymentSuccessScreen } from "../screens/PaymentSuccessScreen";
import { ReviewBookingScreen } from "../screens/ReviewBookingScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { ServiceCategoryScreen } from "../screens/ServiceCategoryScreen";
import { ServiceDetailScreen } from "../screens/ServiceDetailScreen";
import { WorkersScreen } from "../screens/WorkersScreen";
import {
  CustomerAddress,
  ServiceCategory,
  ServiceOption,
  ServicePackage,
  ServiceWithPackages,
  Worker,
  WorkerSlot,
} from "../types";

export type CustomerStackParamList = {
  CustomerHome: undefined;
  Search: undefined;
  ServiceCategory: { category: ServiceCategory };
  ServiceDetail: { service: ServiceWithPackages };
  Workers: { service: ServiceOption };
  Booking: { worker: Worker; service: ServiceOption; bookingId?: number };
  BookingSlots: { worker: Worker; service: ServiceOption };
  BookingSummary: {
    worker: Worker;
    service: ServiceOption;
    selectedPackage?: ServicePackage;
    address?: CustomerAddress;
    slot?: WorkerSlot;
    date?: string;
  };
  BookingChat: { bookingId: number; workerName: string };
  BookingTracking: undefined;
  Payment: { bookingId: number; amount: number };
  PaymentSuccess: { bookingId: number };
  ReviewBooking: { bookingId: number; workerName: string };
  CustomerProfile: undefined;
  OrderHistory: undefined;
  ManageAddresses: undefined;
  CustomerGuide: undefined;
};

const Stack = createNativeStackNavigator<CustomerStackParamList>();

const HEADER_OPTS = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: "#f4f1ea" },
  headerTitleStyle: { color: "#231f1c", fontWeight: "700" as const },
};

export function CustomerNavigator() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      {/* Hub */}
      <Stack.Screen name="CustomerHome" component={HomeScreen} options={{ title: "Services" }} />

      {/* Discovery */}
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} />
      <Stack.Screen name="ServiceCategory" component={ServiceCategoryScreen} options={{ title: "Category" }} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: "Service Details" }} />

      {/* Worker selection & booking */}
      <Stack.Screen name="Workers" component={WorkersScreen} options={{ title: "Available Workers" }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: "Worker Details" }} />
      <Stack.Screen name="BookingSlots" component={BookingSlotsScreen} options={{ title: "Choose a Slot" }} />
      <Stack.Screen name="BookingSummary" component={BookingSummaryScreen} options={{ title: "Booking Summary" }} />

      {/* Post-booking */}
      <Stack.Screen name="BookingChat" component={BookingChatScreen} options={{ title: "Chat" }} />
      <Stack.Screen name="BookingTracking" component={BookingTrackingScreen} options={{ title: "Track Booking" }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: "Payment" }} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReviewBooking" component={ReviewBookingScreen} options={{ title: "Leave a Review" }} />

      {/* Account */}
      <Stack.Screen name="CustomerProfile" component={CustomerProfileScreen} options={{ title: "My Profile" }} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: "Order History" }} />
      <Stack.Screen name="ManageAddresses" component={ManageAddressesScreen} options={{ title: "My Addresses" }} />
      <Stack.Screen name="CustomerGuide" component={CustomerGuideScreen} options={{ title: "How to Use" }} />
    </Stack.Navigator>
  );
}
