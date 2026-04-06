/**
 * WorkerNavigator
 *
 * Self-contained navigator for workers. Only worker-relevant screens are
 * registered here, keeping the bundle and route namespace completely
 * separate from the customer app.
 */

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { BookingChatScreen } from "../screens/BookingChatScreen";
import { WorkerDashboardScreen } from "../screens/WorkerDashboardScreen";
import { WorkerEarningsScreen } from "../screens/WorkerEarningsScreen";
import { WorkerGuideScreen } from "../screens/WorkerGuideScreen";
import { WorkerOnboardingScreen } from "../screens/WorkerOnboardingScreen";

export type WorkerStackParamList = {
  WorkerDashboard: undefined;
  WorkerChat: { bookingId: number; workerName: string };
  WorkerEarnings: undefined;
  WorkerOnboarding: undefined;
  WorkerGuide: undefined;
};

const Stack = createNativeStackNavigator<WorkerStackParamList>();

const HEADER_OPTS = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: "#2a4a44" },
  headerTitleStyle: { color: "#fffdf8", fontWeight: "700" as const },
  headerTintColor: "#fffdf8",
};

export function WorkerNavigator() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      {/* Hub — first screen shown on login */}
      <Stack.Screen name="WorkerDashboard" component={WorkerDashboardScreen} options={{ title: "My Jobs" }} />

      {/* Job communication */}
      <Stack.Screen name="WorkerChat" component={BookingChatScreen} options={{ title: "Chat" }} />

      {/* Account & finance */}
      <Stack.Screen name="WorkerEarnings" component={WorkerEarningsScreen} options={{ title: "Earnings" }} />
      <Stack.Screen name="WorkerOnboarding" component={WorkerOnboardingScreen} options={{ title: "Setup Profile" }} />

      {/* Help */}
      <Stack.Screen name="WorkerGuide" component={WorkerGuideScreen} options={{ title: "How to Use" }} />
    </Stack.Navigator>
  );
}
