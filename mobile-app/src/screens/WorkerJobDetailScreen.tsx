import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { WorkerStackParamList } from "../navigation/AppNavigator";
import { acceptJob, rejectJob } from "../services/api";
import { BookingJob } from "../types";

type Props = NativeStackScreenProps<WorkerStackParamList, "WorkerJobDetail">;

function formatCountdown(expiresAt: string): string {
  const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WorkerJobDetailScreen({ route, navigation }: Props) {
  const { notificationId } = route.params;
  const { accessToken } = useAuth();
  const [job, setJob] = useState<BookingJob | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const { fetchWorkerJobs } = require("../services/api");
    if (!accessToken) return;
    fetchWorkerJobs(accessToken).then((jobs: BookingJob[]) => {
      const found = jobs.find((j) => j.id === notificationId);
      if (found) setJob(found);
    });
  }, [accessToken, notificationId]);

  async function handleAccept() {
    if (!accessToken || !job) return;
    setAccepting(true);
    try {
      await acceptJob(accessToken, notificationId);
      setJob({ ...job, status: "accepted" });
      Alert.alert("Accepted!", "You have accepted this job.", [
        { text: "Open Chat", onPress: () => navigation.navigate("BookingChat", { bookingId: job.bookingId, workerName: job.customerName }) },
        { text: "OK" },
      ]);
    } catch (error) {
      Alert.alert("Failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setAccepting(false);
    }
  }

  async function handleReject() {
    if (!accessToken || !job) return;
    setRejecting(true);
    try {
      await rejectJob(accessToken, notificationId);
      setJob({ ...job, status: "rejected" });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setRejecting(false);
    }
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.loading}>Loading job details…</Text>
      </SafeAreaView>
    );
  }

  const badgeColor = {
    pending: "#f0e2d2",
    accepted: "#d9efe3",
    rejected: "#f6d6d4",
    missed: "#e7e2da",
  }[job.status];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>{job.serviceName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.statusText}>{job.status}</Text>
          </View>
        </View>

        {job.status === "pending" && job.expiresAt && (
          <SectionCard>
            <Text style={styles.countdownLabel}>Time to respond</Text>
            <Text style={styles.countdown}>{formatCountdown(job.expiresAt)}</Text>
          </SectionCard>
        )}

        <SectionCard>
          <Text style={styles.detailLabel}>Customer</Text>
          <Text style={styles.detailValue}>{job.customerName}</Text>

          <Text style={styles.detailLabel}>Location</Text>
          <Text style={styles.detailValue}>{job.location}</Text>

          <Text style={styles.detailLabel}>Scheduled Time</Text>
          <Text style={styles.detailValue}>{job.time}</Text>

          <Text style={styles.detailLabel}>Distance</Text>
          <Text style={styles.detailValue}>{job.distance}</Text>
        </SectionCard>

        {job.status === "pending" && (
          <View style={styles.actions}>
            <PrimaryButton
              title={accepting ? "Accepting…" : "Accept Job"}
              onPress={handleAccept}
              loading={accepting}
            />
            <Pressable
              style={[styles.rejectButton, rejecting && styles.disabledButton]}
              onPress={handleReject}
              disabled={rejecting}
            >
              <Text style={styles.rejectText}>{rejecting ? "Rejecting…" : "Decline Job"}</Text>
            </Pressable>
          </View>
        )}

        {job.status === "accepted" && (
          <PrimaryButton
            title="Open Customer Chat"
            onPress={() =>
              navigation.navigate("BookingChat", {
                bookingId: job.bookingId,
                workerName: job.customerName,
              })
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  loading: { margin: 40, textAlign: "center", color: "#75685e" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heading: { color: "#231f1c", fontSize: 24, fontWeight: "800", flex: 1, marginRight: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statusText: { color: "#4e433a", fontWeight: "700", textTransform: "capitalize" },
  countdownLabel: { color: "#7d6f63", fontSize: 13, marginBottom: 4 },
  countdown: { color: "#ca6b2c", fontWeight: "800", fontSize: 28 },
  detailLabel: { fontSize: 12, fontWeight: "700", color: "#7d6f63", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 12, marginBottom: 2 },
  detailValue: { fontSize: 15, color: "#231f1c" },
  actions: { gap: 10 },
  rejectButton: {
    paddingVertical: 14, borderRadius: 18, alignItems: "center",
    backgroundColor: "#f7f1e7", borderWidth: 1, borderColor: "#eadfce",
  },
  disabledButton: { opacity: 0.55 },
  rejectText: { color: "#7b3f32", fontWeight: "700", fontSize: 15 },
});
