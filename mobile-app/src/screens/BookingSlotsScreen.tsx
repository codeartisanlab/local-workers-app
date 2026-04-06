import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useCustomerBookings } from "../context/CustomerBookingContext";
import { CustomerStackParamList } from "../navigation/CustomerNavigator";
import { createBooking } from "../services/api";

type Props = NativeStackScreenProps<CustomerStackParamList, "BookingSlots">;

function getAvailableSlots(workerId: number) {
  const slotMap: Record<number, string[]> = {
    2: ["Today, 4:00 PM", "Today, 6:30 PM", "Tomorrow, 9:00 AM", "Tomorrow, 1:30 PM"],
    3: ["Today, 5:15 PM", "Tomorrow, 10:30 AM", "Tomorrow, 3:00 PM"],
    4: ["Tomorrow, 8:00 AM", "Tomorrow, 11:00 AM", "Tomorrow, 5:00 PM"],
  };

  return slotMap[workerId] ?? ["Tomorrow, 10:00 AM", "Tomorrow, 2:00 PM"];
}

function convertTo24Hour(timeLabel: string) {
  const [time, period] = timeLabel.split(" ");
  const [rawHour, minute] = time.split(":");
  let hour = Number(rawHour);

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }
  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function toBookingIso(slot: string) {
  if (slot.startsWith("Today")) {
    return `2026-03-29T${convertTo24Hour(slot.replace("Today, ", ""))}:00Z`;
  }

  return `2026-03-30T${convertTo24Hour(slot.replace("Tomorrow, ", ""))}:00Z`;
}

export function BookingSlotsScreen({ navigation, route }: Props) {
  const { worker, service } = route.params;
  const { accessToken } = useAuth();
  const { createCustomerBooking } = useCustomerBookings();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [location, setLocation] = useState("221B Baker Street");
  const [loading, setLoading] = useState(false);
  const availableSlots = useMemo(() => getAvailableSlots(worker.id), [worker.id]);
  const customerLatitude = 12.9716;
  const customerLongitude = 77.5946;

  async function handleBooking() {
    if (!accessToken) {
      Alert.alert("Session expired", "Please log in again.");
      return;
    }
    if (!selectedSlot) {
      Alert.alert("Select a slot", "Choose one available slot for this worker.");
      return;
    }

    try {
      setLoading(true);
      const response = await createBooking(
        accessToken,
        service.id,
        location,
        toBookingIso(selectedSlot),
        customerLatitude,
        customerLongitude,
      );
      createCustomerBooking({
        id: response.id,
        workerId: worker.id,
        workerName: worker.name,
        serviceName: service.name,
        location,
        scheduledLabel: selectedSlot,
      });
      Alert.alert("Booking confirmed", "Your request is submitted and the worker detail page now unlocks chat.");
      navigation.replace("Booking", { worker, service, bookingId: response.id });
    } catch (error) {
      Alert.alert("Booking failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <SectionCard>
          <Text style={styles.workerName}>{worker.name}</Text>
          <Text style={styles.workerMeta}>{service.name}</Text>
          <Text style={styles.workerMeta}>Choose from this worker's next available slots.</Text>
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Available Slots</Text>
          <View style={styles.slotGrid}>
            {availableSlots.map((slot) => {
              const active = slot === selectedSlot;
              return (
                <Pressable
                  key={slot}
                  style={[styles.slotCard, active ? styles.activeSlotCard : styles.inactiveSlotCard]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[styles.slotText, active ? styles.activeSlotText : styles.inactiveSlotText]}>
                    {slot}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            style={styles.input}
            testID="booking-location-input"
          />
          <Text style={styles.helperText}>
            Selected slot: {selectedSlot ?? "Pick a slot above to continue"}
          </Text>
          <PrimaryButton
            title="Confirm Booking"
            onPress={handleBooking}
            loading={loading}
            disabled={!selectedSlot}
            testID="confirm-booking-button"
          />
        </SectionCard>
      </ScrollView>
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
    paddingBottom: 32,
  },
  workerName: {
    color: "#231f1c",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  workerMeta: {
    color: "#75685e",
    fontSize: 15,
    marginBottom: 4,
  },
  sectionTitle: {
    color: "#231f1c",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  slotGrid: {
    gap: 10,
  },
  slotCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  activeSlotCard: {
    backgroundColor: "#2f6c62",
  },
  inactiveSlotCard: {
    backgroundColor: "#f7f1e7",
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  slotText: {
    textAlign: "center",
    fontWeight: "700",
  },
  activeSlotText: {
    color: "#fffdf8",
  },
  inactiveSlotText: {
    color: "#4e433a",
  },
  input: {
    backgroundColor: "#f7f1e7",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eadfce",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#231f1c",
    marginBottom: 12,
  },
  helperText: {
    color: "#75685e",
    marginBottom: 14,
    lineHeight: 20,
  },
});
