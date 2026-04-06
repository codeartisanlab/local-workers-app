import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../context/AuthContext";
import { BookingChatScreen } from "../screens/BookingChatScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { WorkerDashboardScreen } from "../screens/WorkerDashboardScreen";

export type RootStackParamList = {
  Login: undefined;
  WorkerDashboard: undefined;
  BookingChat: { bookingId: number; workerName: string };
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
          <Stack.Screen name="WorkerDashboard" component={WorkerDashboardScreen} options={{ title: "My Jobs" }} />
          <Stack.Screen name="BookingChat" component={BookingChatScreen} options={{ title: "Customer Chat" }} />
        </>
      )}
    </Stack.Navigator>
  );
}
