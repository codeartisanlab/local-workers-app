import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { WorkerTabBar } from "../components/WorkerTabBar";
import { useAuth } from "../context/AuthContext";
import { WorkerStackParamList } from "../navigation/WorkerNavigator";
import { fetchWorkerEarnings } from "../services/api";
import { WorkerEarning } from "../types";

type Props = NativeStackScreenProps<WorkerStackParamList, "WorkerEarnings">;

export function WorkerEarningsScreen({}: Props) {
  const { accessToken } = useAuth();
  const [earnings, setEarnings] = useState<WorkerEarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetchWorkerEarnings(accessToken)
      .then(setEarnings)
      .finally(() => setLoading(false));
  }, [accessToken]);

  const totalGross = earnings.reduce((s, e) => s + parseFloat(e.gross_amount), 0);
  const totalNet = earnings.reduce((s, e) => s + parseFloat(e.net_amount), 0);
  const pendingCount = earnings.filter((e) => e.payout_status === "pending").length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={earnings}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>₹{totalGross.toFixed(0)}</Text>
                <Text style={styles.summaryLabel}>Total Earned</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>₹{totalNet.toFixed(0)}</Text>
                <Text style={styles.summaryLabel}>Net Payout</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, pendingCount > 0 && styles.pendingValue]}>{pendingCount}</Text>
                <Text style={styles.summaryLabel}>Pending</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Transaction History</Text>
          </>
        }
        renderItem={({ item }) => (
          <SectionCard>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.bookingId}>Booking #{item.booking}</Text>
                <Text style={styles.meta}>Gross: ₹{item.gross_amount}</Text>
                <Text style={styles.meta}>Commission: {item.platform_commission_percent}%</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.netAmount}>₹{item.net_amount}</Text>
                <View style={[styles.badge, item.payout_status === "paid" ? styles.badgePaid : styles.badgePending]}>
                  <Text style={styles.badgeText}>{item.payout_status}</Text>
                </View>
              </View>
            </View>
          </SectionCard>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#6ecfc2" style={styles.loader} />
          ) : (
            <Text style={styles.empty}>No earnings yet.</Text>
          )
        }
      />
      <WorkerTabBar activeTab="earnings" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1a2e2a" },
  content: { padding: 20, paddingBottom: 120 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#1e3830",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2f6c62",
    alignItems: "center",
  },
  summaryValue: { color: "#fffdf8", fontSize: 22, fontWeight: "800" },
  pendingValue: { color: "#6ecfc2" },
  summaryLabel: { color: "#9ebfbb", fontSize: 12, marginTop: 2 },
  sectionTitle: { color: "#fffdf8", fontSize: 18, fontWeight: "800", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  info: { flex: 1 },
  bookingId: { color: "#231f1c", fontWeight: "700", marginBottom: 4 },
  meta: { color: "#75685e", fontSize: 13 },
  right: { alignItems: "flex-end", gap: 6 },
  netAmount: { color: "#231f1c", fontSize: 20, fontWeight: "800" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgePaid: { backgroundColor: "#d9efe3" },
  badgePending: { backgroundColor: "#f0e2d2" },
  badgeText: { color: "#4e433a", fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  sep: { height: 10 },
  loader: { marginTop: 40 },
  empty: { textAlign: "center", color: "#9ebfbb", marginTop: 40 },
});
