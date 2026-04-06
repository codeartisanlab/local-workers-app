import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import { createPaymentOrder, verifyPayment } from "../services/api";
import { PaymentMethod } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Payment">;

const METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: "upi", label: "UPI", icon: "📱" },
  { key: "card", label: "Card", icon: "💳" },
  { key: "wallet", label: "Wallet", icon: "👜" },
  { key: "cash", label: "Cash", icon: "💵" },
];

export function PaymentScreen({ route, navigation }: Props) {
  const { bookingId, amount } = route.params;
  const { accessToken } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("upi");
  const [processing, setProcessing] = useState(false);

  async function handlePay() {
    if (!accessToken) {
      Alert.alert("Session expired");
      return;
    }
    setProcessing(true);
    try {
      const order = await createPaymentOrder(accessToken, bookingId, selectedMethod);
      // In production, open Razorpay SDK here with order.order_id & order.key
      // For now, proceed with mock verification
      await verifyPayment(accessToken, bookingId, `pay_mock_${Date.now()}`, order.order_id, selectedMethod);
      navigation.replace("PaymentSuccess", { bookingId });
    } catch (error) {
      Alert.alert("Payment failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amount}>₹{amount}</Text>
          <Text style={styles.bookingId}>Booking #{bookingId}</Text>
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          {METHODS.map((m) => (
            <Pressable
              key={m.key}
              style={[styles.methodCard, selectedMethod === m.key && styles.methodCardSelected]}
              onPress={() => setSelectedMethod(m.key)}
            >
              <Text style={styles.methodIcon}>{m.icon}</Text>
              <Text style={styles.methodLabel}>{m.label}</Text>
              {selectedMethod === m.key && (
                <View style={styles.check}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </SectionCard>

        <Pressable
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fffdf8" />
          ) : (
            <Text style={styles.payButtonText}>Pay ₹{amount} →</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  amountLabel: { color: "#75685e", fontSize: 14, marginBottom: 4 },
  amount: { color: "#231f1c", fontSize: 36, fontWeight: "800" },
  bookingId: { color: "#a89888", fontSize: 13, marginTop: 4 },
  sectionTitle: { color: "#231f1c", fontSize: 17, fontWeight: "800", marginBottom: 12 },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eadfce",
    backgroundColor: "#f7f1e7",
    marginBottom: 10,
  },
  methodCardSelected: { borderColor: "#2f6c62", backgroundColor: "#e8f4f0" },
  methodIcon: { fontSize: 24 },
  methodLabel: { flex: 1, color: "#231f1c", fontSize: 16, fontWeight: "600" },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2f6c62",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: "#fffdf8", fontSize: 14, fontWeight: "800" },
  payButton: {
    backgroundColor: "#ca6b2c",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
  },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { color: "#fffdf8", fontSize: 18, fontWeight: "800" },
});
