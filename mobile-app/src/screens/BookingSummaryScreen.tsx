import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import { applyCoupon, createBooking } from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "BookingSummary">;

export function BookingSummaryScreen({ route, navigation }: Props) {
  const { worker, service, selectedPackage, slot, date } = route.params;
  const { accessToken } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const basePrice = selectedPackage?.price ?? (service as { base_price?: number }).base_price ?? 499;
  const finalPrice = Math.max(0, basePrice - discount);

  async function handleApplyCoupon() {
    if (!couponCode.trim() || !accessToken) return;
    setApplyingCoupon(true);
    try {
      const result = await applyCoupon(accessToken, couponCode, basePrice);
      setDiscount(result.discount_amount);
      setCouponApplied(true);
    } catch (error) {
      Alert.alert("Coupon Error", error instanceof Error ? error.message : "Invalid coupon.");
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function handleConfirm() {
    if (!accessToken) {
      Alert.alert("Session expired", "Please log in again.");
      return;
    }
    setConfirming(true);
    try {
      const bookingTime = date && slot
        ? `${date}T${slot.start_time}:00`
        : new Date(Date.now() + 3600000).toISOString();

      const booking = await createBooking(
        accessToken,
        service.id,
        worker.location,
        bookingTime,
        worker.latitude ?? 12.9716,
        worker.longitude ?? 77.5946,
      );
      navigation.navigate("Payment", { bookingId: booking.id, amount: finalPrice });
    } catch (error) {
      Alert.alert("Booking failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <Text style={styles.label}>Service</Text>
          <Text style={styles.value}>{service.name}</Text>
          {selectedPackage && (
            <>
              <Text style={styles.label}>Package</Text>
              <Text style={styles.value}>{selectedPackage.name}</Text>
            </>
          )}
          <Text style={styles.label}>Worker</Text>
          <Text style={styles.value}>{worker.name}</Text>
          {slot && date && (
            <>
              <Text style={styles.label}>Scheduled</Text>
              <Text style={styles.value}>{date} at {slot.start_time}</Text>
            </>
          )}
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service price</Text>
            <Text style={styles.priceValue}>₹{basePrice}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: "#2f6c62" }]}>Coupon discount</Text>
              <Text style={[styles.priceValue, { color: "#2f6c62" }]}>−₹{discount}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{finalPrice}</Text>
          </View>
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter code (e.g. FIRST50)"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
              editable={!couponApplied}
              placeholderTextColor="#a89888"
            />
            <Pressable
              style={[styles.applyBtn, couponApplied && styles.applyBtnApplied]}
              onPress={handleApplyCoupon}
              disabled={applyingCoupon || couponApplied}
            >
              <Text style={styles.applyBtnText}>{couponApplied ? "Applied ✓" : "Apply"}</Text>
            </Pressable>
          </View>
        </SectionCard>

        <PrimaryButton label={confirming ? "Confirming…" : "Confirm & Pay →"} onPress={handleConfirm} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  sectionTitle: { color: "#231f1c", fontSize: 17, fontWeight: "800", marginBottom: 12 },
  label: { color: "#a89888", fontSize: 12, marginTop: 6 },
  value: { color: "#231f1c", fontSize: 15, fontWeight: "600" },
  priceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  priceLabel: { color: "#75685e", fontSize: 14 },
  priceValue: { color: "#231f1c", fontSize: 14, fontWeight: "600" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#eadfce", paddingTop: 10, marginTop: 4 },
  totalLabel: { color: "#231f1c", fontSize: 16, fontWeight: "800" },
  totalValue: { color: "#ca6b2c", fontSize: 20, fontWeight: "800" },
  couponRow: { flexDirection: "row", gap: 10 },
  couponInput: {
    flex: 1,
    backgroundColor: "#f7f1e7",
    borderWidth: 1,
    borderColor: "#eadfce",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#231f1c",
  },
  applyBtn: {
    backgroundColor: "#2f6c62",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnApplied: { backgroundColor: "#5a9c8e" },
  applyBtnText: { color: "#fffdf8", fontWeight: "700" },
});
