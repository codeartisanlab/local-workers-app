import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "PaymentSuccess">;

export function PaymentSuccessScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>✅</Text>
        </View>
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>Your booking #{bookingId} has been placed successfully. A professional will be with you shortly.</Text>
        <Text style={styles.bookingId}>Booking ID: #{bookingId}</Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.buttonText}>Go to Home</Text>
        </Pressable>
        <Pressable style={styles.trackButton} onPress={() => navigation.navigate("BookingTracking")}>
          <Text style={styles.trackButtonText}>Track Booking →</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  iconWrap: { marginBottom: 24 },
  icon: { fontSize: 72 },
  title: { color: "#231f1c", fontSize: 30, fontWeight: "800", marginBottom: 12, textAlign: "center" },
  subtitle: { color: "#75685e", fontSize: 15, lineHeight: 22, textAlign: "center", marginBottom: 20 },
  bookingId: {
    color: "#6f5039",
    backgroundColor: "#f0e2d2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    fontSize: 14,
    fontWeight: "700",
    overflow: "hidden",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#ca6b2c",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  buttonText: { color: "#fffdf8", fontSize: 17, fontWeight: "800" },
  trackButton: { padding: 12 },
  trackButtonText: { color: "#2f6c62", fontSize: 15, fontWeight: "700" },
});
