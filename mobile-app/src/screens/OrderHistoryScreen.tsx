import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { FloatingTabBar } from "../components/FloatingTabBar";
import { LocationBar } from "../components/LocationBar";
import { SectionCard } from "../components/SectionCard";
import { useCustomerBookings } from "../context/CustomerBookingContext";
import { CustomerStackParamList } from "../navigation/CustomerNavigator";

type Props = NativeStackScreenProps<CustomerStackParamList, "OrderHistory">;

export function OrderHistoryScreen({}: Props) {
  const { orderHistory } = useCustomerBookings();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <LocationBar />
        <SectionCard>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.count}>{orderHistory.length} bookings</Text>
        </SectionCard>

        {orderHistory.map((booking) => (
          <SectionCard key={booking.id}>
            <View style={styles.bookingHeader}>
              <Text style={styles.bookingTitle}>{booking.serviceName}</Text>
              <Text style={styles.status}>{booking.statusLabel}</Text>
            </View>
            <Text style={styles.meta}>{booking.workerName}</Text>
            <Text style={styles.meta}>{booking.location}</Text>
            <Text style={styles.meta}>{booking.scheduledLabel}</Text>
          </SectionCard>
        ))}
      </ScrollView>
      <FloatingTabBar activeTab="orders" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f1ea",
  },
  container: {
    padding: 20,
    gap: 16,
    paddingBottom: 120,
  },
  title: {
    color: "#231f1c",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  count: {
    color: "#75685e",
  },
  bookingTitle: {
    color: "#231f1c",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  meta: {
    color: "#75685e",
    marginBottom: 4,
  },
  status: {
    color: "#8c4d24",
    fontWeight: "700",
    textTransform: "capitalize",
  },
});
