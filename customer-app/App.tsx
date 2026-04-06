import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "./src/context/AuthContext";
import { CustomerBookingProvider } from "./src/context/CustomerBookingContext";
import { LocationProvider } from "./src/context/LocationContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#f4f1ea",
    card: "#fffdf8",
    text: "#231f1c",
    border: "#e3dacb",
    primary: "#ca6b2c",
  },
};

export default function App() {
  return (
    <AuthProvider>
      <CustomerBookingProvider>
        <LocationProvider>
          <NavigationContainer theme={theme}>
            <StatusBar style="dark" />
            <AppNavigator />
          </NavigationContainer>
        </LocationProvider>
      </CustomerBookingProvider>
    </AuthProvider>
  );
}
