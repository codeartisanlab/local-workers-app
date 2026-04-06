import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert } from "react-native";
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";

import { FloatingTabBar } from "../components/FloatingTabBar";
import { LocationBar } from "../components/LocationBar";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useCustomerBookings } from "../context/CustomerBookingContext";
import { CustomerStackParamList } from "../navigation/CustomerNavigator";
import { cancelBooking } from "../services/api";

type Props = NativeStackScreenProps<CustomerStackParamList, "BookingTracking">;

function ChatGlyph() {
  return (
    <View style={iconStyles.chatWrap}>
      <View style={iconStyles.chatBubble} />
      <View style={iconStyles.chatTail} />
    </View>
  );
}

export function BookingTrackingScreen({ navigation }: Props) {
  const { currentBooking } = useCustomerBookings();
  const { accessToken } = useAuth();

  async function handleCancel() {
    if (!currentBooking || !accessToken) return;
    Alert.alert("Cancel Booking", "Are you sure you want to cancel?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          await cancelBooking(accessToken, currentBooking.id, "Customer cancelled");
          Alert.alert("Cancelled", "Your booking has been cancelled.");
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <LocationBar />
        <SectionCard>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Track Order</Text>
            {currentBooking ? (
              <Pressable
                style={styles.iconButton}
                onPress={() =>
                  navigation.navigate("BookingChat", {
                    bookingId: currentBooking.id,
                    workerName: currentBooking.workerName,
                  })
                }
              >
                <ChatGlyph />
              </Pressable>
            ) : null}
          </View>
          {currentBooking ? (
            <>
              <Text style={styles.service}>{currentBooking.serviceName}</Text>
              <Text style={styles.meta}>Worker: {currentBooking.workerName}</Text>
              <Text style={styles.meta}>Location: {currentBooking.location}</Text>
              <Text style={styles.meta}>Scheduled: {currentBooking.scheduledLabel}</Text>
              <Text style={styles.meta}>
                Last update: {new Date(currentBooking.lastUpdatedAt).toLocaleString()}
              </Text>
            </>
          ) : (
            <Text style={styles.meta}>No active booking to track.</Text>
          )}
        </SectionCard>

        {currentBooking ? (
          <SectionCard>
            <Text style={styles.sectionTitle}>Progress</Text>
            {currentBooking.steps.map((step, index) => (
              <View key={`${step.label}-${index}`} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepDot,
                    step.status === "done"
                      ? styles.doneDot
                      : step.status === "current"
                        ? styles.currentDot
                        : styles.upcomingDot,
                  ]}
                />
                <View style={styles.stepCopy}>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                  <Text style={styles.stepMeta}>
                    {step.status === "done"
                      ? "Completed"
                      : step.status === "current"
                        ? "Happening now"
                        : "Coming up next"}
                  </Text>
                </View>
              </View>
            ))}
          </SectionCard>
        ) : null}

        {currentBooking && currentBooking.status === "completed" && (
          <Pressable
            style={styles.reviewButton}
            onPress={() =>
              navigation.navigate("ReviewBooking", {
                bookingId: currentBooking.id,
                workerName: currentBooking.workerName,
              })
            }
          >
            <Text style={styles.reviewButtonText}>⭐ Leave a Review</Text>
          </Pressable>
        )}

        {currentBooking && (currentBooking.status === "searching" || currentBooking.status === "assigned") && (
          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </Pressable>
        )}
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    color: "#231f1c",
    fontSize: 24,
    fontWeight: "800",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2f6c62",
    alignItems: "center",
    justifyContent: "center",
  },
  service: {
    color: "#231f1c",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#231f1c",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  meta: {
    color: "#75685e",
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    alignItems: "flex-start",
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
  },
  doneDot: {
    backgroundColor: "#2f6c62",
  },
  currentDot: {
    backgroundColor: "#ca6b2c",
  },
  upcomingDot: {
    backgroundColor: "#d9cfc2",
  },
  stepCopy: {
    flex: 1,
  },
  stepLabel: {
    color: "#231f1c",
    fontWeight: "700",
    marginBottom: 2,
  },
  stepMeta: {
    color: "#75685e",
  },
  reviewButton: {
    backgroundColor: "#2f6c62",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  reviewButtonText: {
    color: "#fffdf8",
    fontSize: 16,
    fontWeight: "800",
  },
  cancelButton: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#b24a3a",
  },
  cancelButtonText: {
    color: "#b24a3a",
    fontSize: 15,
    fontWeight: "700",
  },
});

const iconStyles = StyleSheet.create({
  chatWrap: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  chatBubble: {
    width: 14,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#fffdf8",
  },
  chatTail: {
    position: "absolute",
    left: 1,
    bottom: 0,
    width: 6,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#fffdf8",
    transform: [{ rotate: "-35deg" }],
  },
});
