import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, ScrollView, StyleSheet, Text, Pressable, View } from "react-native";

import { FloatingTabBar } from "../components/FloatingTabBar";
import { LocationBar } from "../components/LocationBar";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useCustomerBookings } from "../context/CustomerBookingContext";
import { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "CustomerProfile">;

function ArrowIcon() {
  return (
    <View style={iconStyles.arrowWrap}>
      <View style={iconStyles.arrowShaft} />
      <View style={iconStyles.arrowHead} />
    </View>
  );
}

function LogoutIcon() {
  return (
    <View style={iconStyles.logoutWrap}>
      <View style={iconStyles.logoutRing} />
      <View style={iconStyles.logoutStem} />
    </View>
  );
}

export function CustomerProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { currentBooking, orderHistory } = useCustomerBookings();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <LocationBar />
        <SectionCard>
          <View style={styles.topRow}>
            <Text style={styles.title}>Profile</Text>
            <Pressable style={styles.iconButton} onPress={logout}>
              <LogoutIcon />
            </Pressable>
          </View>
          <Text style={styles.meta}>Phone: {user?.phone}</Text>
          <Text style={styles.meta}>Orders placed: {orderHistory.length}</Text>
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Booking</Text>
            <Pressable style={styles.iconButton} onPress={() => navigation.navigate("BookingTracking")}>
              <ArrowIcon />
            </Pressable>
          </View>
          {currentBooking ? (
            <>
              <Text style={styles.bookingTitle}>{currentBooking.serviceName}</Text>
              <Text style={styles.meta}>{currentBooking.workerName}</Text>
              <Text style={styles.meta}>{currentBooking.scheduledLabel}</Text>
              <Text style={styles.status}>{currentBooking.statusLabel}</Text>
            </>
          ) : (
            <Text style={styles.emptyText}>No active booking right now.</Text>
          )}
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Addresses</Text>
            <Pressable style={styles.iconButton} onPress={() => navigation.navigate("ManageAddresses")}>
              <ArrowIcon />
            </Pressable>
          </View>
          <Text style={styles.meta}>Manage saved addresses for quick booking.</Text>
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order History</Text>
            <Pressable style={styles.iconButton} onPress={() => navigation.navigate("OrderHistory")}>
              <ArrowIcon />
            </Pressable>
          </View>
          <Text style={styles.meta}>See all placed, active, and completed bookings.</Text>
        </SectionCard>
      </ScrollView>
      <FloatingTabBar activeTab="profile" />
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
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#231f1c",
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    color: "#75685e",
    marginBottom: 4,
    lineHeight: 20,
  },
  bookingTitle: {
    color: "#231f1c",
    fontWeight: "700",
    fontSize: 17,
    marginBottom: 6,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f7f1e7",
    borderWidth: 1,
    borderColor: "#eadfce",
    alignItems: "center",
    justifyContent: "center",
  },
  status: {
    marginTop: 8,
    color: "#8c4d24",
    fontWeight: "700",
  },
  emptyText: {
    color: "#75685e",
  },
});

const iconStyles = StyleSheet.create({
  arrowWrap: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowShaft: {
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#4e433a",
  },
  arrowHead: {
    position: "absolute",
    right: 1,
    width: 7,
    height: 7,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "#4e433a",
    transform: [{ rotate: "45deg" }],
  },
  logoutWrap: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#4e433a",
  },
  logoutStem: {
    position: "absolute",
    top: 0,
    width: 2,
    height: 8,
    borderRadius: 1,
    backgroundColor: "#4e433a",
  },
});
