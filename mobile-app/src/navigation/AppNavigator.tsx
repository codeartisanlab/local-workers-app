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
import { WorkerOnboardingScreen } from "../screens/WorkerOnboardingScreen";
import { WorkerProfileScreen } from "../screens/WorkerProfileScreen";
import { WorkerServicesScreen } from "../screens/WorkerServicesScreen";
import { WorkerVerificationScreen } from "../screens/WorkerVerificationScreen";
import { WorkerJobDetailScreen } from "../screens/WorkerJobDetailScreen";
import { WorkerChatsScreen } from "../screens/WorkerChatsScreen";
import { ServiceOption, Worker } from "../types";

export type CustomerStackParamList = {
  Home: undefined;
  Workers: { service: ServiceOption };
  Booking: { worker: Worker; service: ServiceOption; bookingId?: number };
  BookingSlots: { worker: Worker; service: ServiceOption };
  BookingChat: { bookingId: number; workerName: string };
  CustomerProfile: undefined;
  OrderHistory: undefined;
  BookingTracking: undefined;
};

export type WorkerStackParamList = {
  WorkerDashboard: undefined;
  WorkerOnboarding: undefined;
  WorkerProfile: undefined;
  WorkerServices: undefined;
  WorkerVerification: undefined;
  WorkerJobDetail: { notificationId: number };
  WorkerChats: undefined;
  BookingChat: { bookingId: number; workerName: string };
};

export type RootStackParamList = CustomerStackParamList & WorkerStackParamList & { Login: undefined };

const Stack = createNativeStackNavigator<RootStackParamList>();

const headerOptions = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: "#f4f1ea" },
  headerTitleStyle: { color: "#231f1c", fontWeight: "700" as const },
};

function CustomerNavigator() {
  return (
    <>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ ...headerOptions, title: "Services" }}
      />
      <Stack.Screen name="Workers" component={WorkersScreen} options={{ ...headerOptions, title: "Available Workers" }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ ...headerOptions, title: "Worker Details" }} />
      <Stack.Screen name="BookingSlots" component={BookingSlotsScreen} options={{ ...headerOptions, title: "Book Service" }} />
      <Stack.Screen name="BookingChat" component={BookingChatScreen} options={{ ...headerOptions, title: "Booking Chat" }} />
      <Stack.Screen name="CustomerProfile" component={CustomerProfileScreen} options={{ ...headerOptions, title: "My Profile" }} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ ...headerOptions, title: "Order History" }} />
      <Stack.Screen name="BookingTracking" component={BookingTrackingScreen} options={{ ...headerOptions, title: "Track Booking" }} />
    </>
  );
}

function WorkerNavigator({ isNewUser }: { isNewUser: boolean }) {
  return (
    <>
      <Stack.Screen
        name={isNewUser ? "WorkerOnboarding" : "WorkerDashboard"}
        component={isNewUser ? WorkerOnboardingScreen : WorkerDashboardScreen}
        options={{ ...headerOptions, title: isNewUser ? "Get Started" : "My Jobs", headerShown: !isNewUser }}
      />
      {isNewUser && (
        <Stack.Screen
          name="WorkerDashboard"
          component={WorkerDashboardScreen}
          options={{ ...headerOptions, title: "My Jobs", headerShown: false }}
        />
      )}
      {!isNewUser && (
        <Stack.Screen
          name="WorkerOnboarding"
          component={WorkerOnboardingScreen}
          options={{ ...headerOptions, title: "Get Started" }}
        />
      )}
      <Stack.Screen name="WorkerProfile" component={WorkerProfileScreen} options={{ ...headerOptions, title: "My Profile", headerShown: false }} />
      <Stack.Screen name="WorkerServices" component={WorkerServicesScreen} options={{ ...headerOptions, title: "My Services" }} />
      <Stack.Screen name="WorkerVerification" component={WorkerVerificationScreen} options={{ ...headerOptions, title: "ID Verification" }} />
      <Stack.Screen name="WorkerJobDetail" component={WorkerJobDetailScreen} options={{ ...headerOptions, title: "Job Details" }} />
      <Stack.Screen name="WorkerChats" component={WorkerChatsScreen} options={{ ...headerOptions, title: "Chats", headerShown: false }} />
      <Stack.Screen name="BookingChat" component={BookingChatScreen} options={{ ...headerOptions, title: "Chat" }} />
    </>
  );
}

export function AppNavigator() {
  const { user, isNewUser } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user.role === "worker" ? (
        WorkerNavigator({ isNewUser })
      ) : (
        CustomerNavigator()
      )}
    </Stack.Navigator>
  );
}
