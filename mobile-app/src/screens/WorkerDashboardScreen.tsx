import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Switch, Text, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { WorkerFloatingTabBar } from "../components/WorkerFloatingTabBar";
import { useAuth } from "../context/AuthContext";
import { WorkerStackParamList } from "../navigation/AppNavigator";
import { acceptJob, fetchWorkerJobs, fetchWorkerMe, rejectJob, updateWorkerProfile } from "../services/api";
import { BookingJob } from "../types";

type Props = NativeStackScreenProps<WorkerStackParamList, "WorkerDashboard">;
type JobTab = "new" | "active" | "history";

function formatCountdown(expiresAt: string): string {
  const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WorkerDashboardScreen({ navigation }: Props) {
  const { accessToken } = useAuth();
  const [jobs, setJobs] = useState<BookingJob[]>([]);
  const [activeTab, setActiveTab] = useState<JobTab>("new");
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    fetchWorkerMe(accessToken).then((profile) => setIsAvailable(profile.isAvailable));
  }, [accessToken]);

  function loadJobs() {
    if (!accessToken) return;
    fetchWorkerJobs(accessToken).then((data) => {
      setJobs(data);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadJobs();
    pollingRef.current = setInterval(loadJobs, 15000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [accessToken]);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleToggleAvailability(value: boolean) {
    if (!accessToken) return;
    setIsAvailable(value);
    try {
      await updateWorkerProfile(accessToken, { is_available: value });
    } catch {
      setIsAvailable(!value);
    }
  }

  async function handleAccept(notificationId: number) {
    if (!accessToken) {
      Alert.alert("Session expired", "Please log in again.");
      return;
    }
    try {
      await acceptJob(accessToken, notificationId);
      setJobs((current) =>
        current.map((job) => {
          if (job.id === notificationId) return { ...job, status: "accepted" };
          if (job.status === "pending") return { ...job, status: "missed" };
          return job;
        }),
      );
    } catch (error) {
      Alert.alert("Accept failed", error instanceof Error ? error.message : "Try again.");
    }
  }

  async function handleReject(notificationId: number) {
    if (!accessToken) {
      Alert.alert("Session expired", "Please log in again.");
      return;
    }
    try {
      await rejectJob(accessToken, notificationId);
      setJobs((current) =>
        current.map((job) => (job.id === notificationId ? { ...job, status: "rejected" } : job)),
      );
    } catch (error) {
      Alert.alert("Reject failed", error instanceof Error ? error.message : "Try again.");
    }
  }

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "new") return job.status === "pending";
    if (activeTab === "active") return job.status === "accepted";
    return job.status === "rejected" || job.status === "missed";
  });

  return (
    <SafeAreaView style={styles.safeArea} testID="worker-dashboard-screen">
      <FlatList
        contentContainerStyle={styles.content}
        data={filteredJobs}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.heading} testID="worker-dashboard-heading">
                My Jobs
              </Text>
              <View style={styles.availabilityRow}>
                <View style={[styles.statusDot, isAvailable ? styles.onlineDot : styles.offlineDot]} />
                <Text style={[styles.availabilityLabel, isAvailable ? styles.onlineText : styles.offlineText]}>
                  {isAvailable ? "Online" : "Offline"}
                </Text>
                <Switch
                  value={isAvailable}
                  onValueChange={handleToggleAvailability}
                  trackColor={{ false: "#d9cfc5", true: "#2f6c62" }}
                  thumbColor="#fffdf8"
                  testID="availability-toggle"
                />
              </View>
            </View>
            <View style={styles.tabs}>
              {(["new", "active", "history"] as JobTab[]).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab === "new" ? "New" : tab === "active" ? "Active" : "History"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <SectionCard>
            <Pressable onPress={() => navigation.navigate("WorkerJobDetail", { notificationId: item.id })}>
              <Text style={styles.serviceName} testID={`job-service-name-${index}`}>
                {item.serviceName}
              </Text>
              <Text style={styles.meta}>{item.customerName}</Text>
              <Text style={styles.meta}>{item.location}</Text>
              <Text style={styles.meta}>{item.time}</Text>
              <Text style={styles.meta}>Distance {item.distance}</Text>
            </Pressable>
            {item.status === "pending" && item.expiresAt && (
              <Text style={styles.countdown}>Expires in {formatCountdown(item.expiresAt)}</Text>
            )}
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, badgeStyles[item.status]]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            {item.status === "pending" && (
              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => handleAccept(item.id)}
                  testID={`accept-job-button-${index}`}
                >
                  <Text style={styles.actionText}>Accept</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(item.id)}
                  testID={`reject-job-button-${index}`}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </Pressable>
              </View>
            )}
            {item.status === "accepted" && (
              <Pressable
                style={styles.chatButton}
                onPress={() =>
                  navigation.navigate("BookingChat", {
                    bookingId: item.bookingId,
                    workerName: item.customerName,
                  })
                }
              >
                <Text style={styles.chatButtonText}>Open Customer Chat</Text>
              </Pressable>
            )}
            <Text style={styles.meta} testID={`job-status-${index}`}>
              Current status: {item.status}
            </Text>
          </SectionCard>
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {activeTab === "new"
                  ? isAvailable
                    ? "No new jobs right now. Stay online to receive bookings."
                    : "You are offline. Toggle availability to receive bookings."
                  : activeTab === "active"
                    ? "No active jobs."
                    : "No job history yet."}
              </Text>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <WorkerFloatingTabBar activeTab="jobs" />
    </SafeAreaView>
  );
}

const badgeStyles = StyleSheet.create({
  pending: { backgroundColor: "#f0e2d2" },
  accepted: { backgroundColor: "#d9efe3" },
  rejected: { backgroundColor: "#f6d6d4" },
  missed: { backgroundColor: "#e7e2da" },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  content: { padding: 20, paddingBottom: 120 },
  header: { marginBottom: 16 },
  heading: { color: "#231f1c", fontSize: 30, lineHeight: 36, fontWeight: "800", marginBottom: 12 },
  availabilityRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  onlineDot: { backgroundColor: "#2f6c62" },
  offlineDot: { backgroundColor: "#b0a89e" },
  availabilityLabel: { fontSize: 15, fontWeight: "700", flex: 1 },
  onlineText: { color: "#2f6c62" },
  offlineText: { color: "#7d6f63" },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 20 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 999,
    backgroundColor: "#f7f1e7", borderWidth: 1, borderColor: "#eadfce", alignItems: "center",
  },
  tabActive: { backgroundColor: "#2f6c62", borderColor: "#2f6c62" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#4e433a" },
  tabTextActive: { color: "#fffdf8" },
  serviceName: { color: "#231f1c", fontSize: 20, fontWeight: "800", marginBottom: 8 },
  meta: { color: "#75685e", marginBottom: 4 },
  countdown: { color: "#ca6b2c", fontWeight: "700", fontSize: 13, marginBottom: 4 },
  statusRow: { marginTop: 12, marginBottom: 14 },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  statusText: { color: "#4e433a", fontWeight: "700", textTransform: "capitalize" },
  actions: { flexDirection: "row", gap: 10 },
  actionButton: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  acceptButton: { backgroundColor: "#2f6c62" },
  rejectButton: { backgroundColor: "#f7f1e7", borderWidth: 1, borderColor: "#eadfce" },
  actionText: { color: "#fffdf8", fontWeight: "700" },
  rejectText: { color: "#7b3f32", fontWeight: "700" },
  chatButton: { marginTop: 12, borderRadius: 16, paddingVertical: 14, alignItems: "center", backgroundColor: "#ca6b2c" },
  chatButtonText: { color: "#fffdf8", fontWeight: "700" },
  separator: { height: 14 },
  emptyState: { paddingTop: 40, alignItems: "center" },
  emptyText: { color: "#7d6f63", textAlign: "center", lineHeight: 22 },
});
