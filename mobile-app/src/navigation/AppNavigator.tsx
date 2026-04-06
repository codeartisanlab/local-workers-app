/**
 * AppNavigator
 *
 * Top-level router. After the shared Login screen the user is directed to
 * either the fully self-contained CustomerNavigator or WorkerNavigator
 * depending on the role they chose at sign-in.
 *
 *   ┌─ Unauthenticated ──────────────────┐
 *   │  Login                              │
 *   └─────────────────────────────────────┘
 *          │ role = "customer"    │ role = "worker"
 *          ▼                      ▼
 *   CustomerNavigator       WorkerNavigator
 *   (all customer screens)  (all worker screens)
 */

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { CustomerNavigator } from "./CustomerNavigator";
import { WorkerNavigator } from "./WorkerNavigator";

// Re-export CustomerStackParamList as RootStackParamList so existing screens
// that still import from AppNavigator continue to compile.
export type { CustomerStackParamList as RootStackParamList } from "./CustomerNavigator";

type RootParamList = {
  Login: undefined;
  CustomerApp: undefined;
  WorkerApp: undefined;
};

const Root = createNativeStackNavigator<RootParamList>();

const HEADER_OPTS = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: "#f4f1ea" as const },
  headerTitleStyle: { color: "#231f1c" as const, fontWeight: "700" as const },
};

export function AppNavigator() {
  const { user } = useAuth();

  return (
    <Root.Navigator screenOptions={HEADER_OPTS}>
      {!user ? (
        <Root.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : user.role === "worker" ? (
        <Root.Screen name="WorkerApp" component={WorkerNavigator} options={{ headerShown: false }} />
      ) : (
        <Root.Screen name="CustomerApp" component={CustomerNavigator} options={{ headerShown: false }} />
      )}
    </Root.Navigator>
  );
}
