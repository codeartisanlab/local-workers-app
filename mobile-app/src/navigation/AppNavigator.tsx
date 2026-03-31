import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../context/AuthContext";
import { BookingChatScreen } from "../screens/BookingChatScreen";
import { BookingSlotsScreen } from "../screens/BookingSlotsScreen";
import { BookingTrackingScreen } from "../screens/BookingTrackingScreen";
import { BookingScreen } from "../screens/BookingScreen";
import { CustomerProfileScreen } from "../screens/CustomerProfileScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { OrderHistoryScreen } from "../screens/OrderHistoryScreen";
import { WorkersScreen } from "../screens/WorkersScreen";
import { WorkerDashboardScreen } from "../screens/WorkerDashboardScreen";
import { ServiceOption, Worker } from "../types";

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
        </>
      )}
    </Stack.Navigator>
  );
}
