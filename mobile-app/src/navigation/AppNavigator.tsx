import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../context/AuthContext";
import { BookingChatScreen } from "../screens/BookingChatScreen";
import { BookingSlotsScreen } from "../screens/BookingSlotsScreen";
import { BookingTrackingScreen } from "../screens/BookingTrackingScreen";
import { BookingScreen } from "../screens/BookingScreen";
import { BookingSummaryScreen } from "../screens/BookingSummaryScreen";
import { CustomerProfileScreen } from "../screens/CustomerProfileScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { ManageAddressesScreen } from "../screens/ManageAddressesScreen";
import { OrderHistoryScreen } from "../screens/OrderHistoryScreen";
import { PaymentScreen } from "../screens/PaymentScreen";
import { PaymentSuccessScreen } from "../screens/PaymentSuccessScreen";
import { ReviewBookingScreen } from "../screens/ReviewBookingScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { ServiceCategoryScreen } from "../screens/ServiceCategoryScreen";
import { ServiceDetailScreen } from "../screens/ServiceDetailScreen";
import { WorkerDashboardScreen } from "../screens/WorkerDashboardScreen";
import { WorkerEarningsScreen } from "../screens/WorkerEarningsScreen";
import { WorkerOnboardingScreen } from "../screens/WorkerOnboardingScreen";
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

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Workers: { service: ServiceOption };
  Booking: { worker: Worker; service: ServiceOption; bookingId?: number };
  BookingSlots: { worker: Worker; service: ServiceOption };
  BookingChat: { bookingId: number; workerName: string };
  CustomerProfile: undefined;
  OrderHistory: undefined;
  BookingTracking: undefined;
  WorkerDashboard: undefined;
  // Phase 1
  ServiceCategory: { category: ServiceCategory };
  ServiceDetail: { service: ServiceWithPackages };
  // Phase 2
  BookingSummary: {
    worker: Worker;
    service: ServiceOption;
    selectedPackage?: ServicePackage;
    address?: CustomerAddress;
    slot?: WorkerSlot;
    date?: string;
  };
  ManageAddresses: undefined;
  // Phase 3
  Payment: { bookingId: number; amount: number };
  PaymentSuccess: { bookingId: number };
  // Phase 5
  ReviewBooking: { bookingId: number; workerName: string };
  // Phase 6
  Search: undefined;
  // Phase 3 earnings
  WorkerEarnings: undefined;
  // Phase 7
  WorkerOnboarding: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: "#f4f1ea",
        },
        headerTitleStyle: {
          color: "#231f1c",
          fontWeight: "700",
        },
      }}
    >
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: user.role === "worker" ? "Nearby Jobs" : "Services",
            }}
          />
          <Stack.Screen name="Workers" component={WorkersScreen} options={{ title: "Available Workers" }} />
          <Stack.Screen name="Booking" component={BookingScreen} options={{ title: "Worker Details" }} />
          <Stack.Screen name="BookingSlots" component={BookingSlotsScreen} options={{ title: "Book Service" }} />
          <Stack.Screen name="BookingChat" component={BookingChatScreen} options={{ title: "Booking Chat" }} />
          <Stack.Screen name="CustomerProfile" component={CustomerProfileScreen} options={{ title: "My Profile" }} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: "Order History" }} />
          <Stack.Screen name="BookingTracking" component={BookingTrackingScreen} options={{ title: "Track Booking" }} />
          <Stack.Screen
            name="WorkerDashboard"
            component={WorkerDashboardScreen}
            options={{ title: "Worker Dashboard" }}
          />
          {/* Phase 1 – Service Catalog */}
          <Stack.Screen name="ServiceCategory" component={ServiceCategoryScreen} options={{ title: "Category" }} />
          <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: "Service Details" }} />
          {/* Phase 2 – Booking Flow */}
          <Stack.Screen name="BookingSummary" component={BookingSummaryScreen} options={{ title: "Booking Summary" }} />
          <Stack.Screen name="ManageAddresses" component={ManageAddressesScreen} options={{ title: "My Addresses" }} />
          {/* Phase 3 – Payments */}
          <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: "Payment" }} />
          <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ headerShown: false }} />
          {/* Phase 5 – Reviews */}
          <Stack.Screen name="ReviewBooking" component={ReviewBookingScreen} options={{ title: "Leave a Review" }} />
          {/* Phase 6 – Search */}
          <Stack.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} />
          {/* Phase 3 – Worker Earnings */}
          <Stack.Screen name="WorkerEarnings" component={WorkerEarningsScreen} options={{ title: "My Earnings" }} />
          {/* Phase 7 – Worker Onboarding */}
          <Stack.Screen name="WorkerOnboarding" component={WorkerOnboardingScreen} options={{ title: "Setup Profile" }} />
        </>
      )}
    </Stack.Navigator>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: "#f4f1ea",
        },
        headerTitleStyle: {
          color: "#231f1c",
          fontWeight: "700",
        },
      }}
    >
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: user.role === "worker" ? "Nearby Jobs" : "Services",
            }}
          />
          <Stack.Screen name="Workers" component={WorkersScreen} options={{ title: "Available Workers" }} />
          <Stack.Screen name="Booking" component={BookingScreen} options={{ title: "Worker Details" }} />
          <Stack.Screen name="BookingSlots" component={BookingSlotsScreen} options={{ title: "Book Service" }} />
          <Stack.Screen name="BookingChat" component={BookingChatScreen} options={{ title: "Booking Chat" }} />
          <Stack.Screen name="CustomerProfile" component={CustomerProfileScreen} options={{ title: "My Profile" }} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: "Order History" }} />
          <Stack.Screen name="BookingTracking" component={BookingTrackingScreen} options={{ title: "Track Booking" }} />
          <Stack.Screen
            name="WorkerDashboard"
            component={WorkerDashboardScreen}
            options={{ title: "Worker Dashboard" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
