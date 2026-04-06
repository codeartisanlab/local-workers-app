import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { WorkerTabBar } from "../components/WorkerTabBar";
import { useAuth } from "../context/AuthContext";
import { WorkerStackParamList } from "../navigation/WorkerNavigator";
import { acceptJob, fetchWorkerJobs, rejectJob } from "../services/api";
import { BookingJob } from "../types";

type Props = NativeStackScreenProps<WorkerStackParamList, "WorkerDashboard">;

export function WorkerDashboardScreen({ navigation }: Props) {
  const { accessToken } = useAuth();
  const [jobs, setJobs] = useState<BookingJob[]>([]);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    fetchWorkerJobs(accessToken).then(setJobs);
  }, [accessToken]);

  async function handleAccept(notificationId: number) {
    if (!accessToken) {
      Alert.alert("Session expired", "Please log in again.");
      return;
    }

    try {
      await acceptJob(accessToken, notificationId);
      setJobs((current) =>
        current.map((job) => {
          if (job.id === notificationId) {
            return { ...job, status: "accepted" };
          }
          if (job.status === "pending") {
            return { ...job, status: "missed" };
          }
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

  return (
    <SafeAreaView style={styles.safeArea} testID="worker-dashboard-screen">
      <FlatList
        contentContainerStyle={styles.content}
        data={jobs}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerTitles}>
                <Text style={styles.heading} testID="worker-dashboard-heading">
                  Incoming jobs and active work
                </Text>
                <Text style={styles.subheading}>Accept jobs quickly or clear ones you cannot take.</Text>
              </View>
              <Pressable style={styles.earningsBtn} onPress={() => navigation.navigate("WorkerEarnings")}>
                <Text style={styles.earningsBtnText}>💰</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.onlineToggle, isOnline ? styles.onlineToggleOn : styles.onlineToggleOff]}
              onPress={() => setIsOnline((v) => !v)}
            >
              <Text style={styles.onlineToggleText}>{isOnline ? "🟢 Online" : "🔴 Offline"}</Text>
              <Text style={styles.onlineToggleSub}>{isOnline ? "Accepting jobs" : "Not accepting jobs"}</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => (
          <SectionCard>
            <Text style={styles.serviceName} testID={`job-service-name-${index}`}>
              {item.serviceName}
            </Text>
            <Text style={styles.meta}>{item.customerName}</Text>
            <Text style={styles.meta}>{item.location}</Text>
            <Text style={styles.meta}>{item.time}</Text>
            <Text style={styles.meta}>Distance {item.distance}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, badgeStyles[item.status]]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAccept(item.id)}
                disabled={item.status !== "pending"}
                testID={`accept-job-button-${index}`}
              >
                <Text style={styles.actionText}>Accept</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(item.id)}
                disabled={item.status !== "pending"}
                testID={`reject-job-button-${index}`}
              >
                <Text style={styles.rejectText}>Reject</Text>
              </Pressable>
            </View>
            {item.status === "accepted" ? (
              <Pressable
                style={styles.chatButton}
                onPress={() =>
                  navigation.navigate("WorkerChat", {
                    bookingId: item.bookingId,
                    workerName: item.customerName,
                  })
                }
              >
                <Text style={styles.chatButtonText}>Open Customer Chat</Text>
              </Pressable>
            ) : null}
            <Text style={styles.meta} testID={`job-status-${index}`}>
              Current status: {item.status}
            </Text>
          </SectionCard>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <WorkerTabBar activeTab="dashboard" />
    </SafeAreaView>
  );
}

const badgeStyles = StyleSheet.create({
  pending: {
    backgroundColor: "#f0e2d2",
  },
  accepted: {
    backgroundColor: "#d9efe3",
  },
  rejected: {
    backgroundColor: "#f6d6d4",
  },
  missed: {
    backgroundColor: "#e7e2da",
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1a2e2a",
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 22,
    gap: 14,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerTitles: {
    flex: 1,
  },
  earningsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(47,108,98,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  earningsBtnText: { fontSize: 20 },
  onlineToggle: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  onlineToggleOn: { backgroundColor: "rgba(47,108,98,0.35)" },
  onlineToggleOff: { backgroundColor: "rgba(180,60,40,0.25)" },
  onlineToggleText: { color: "#fffdf8", fontWeight: "800", fontSize: 16 },
  onlineToggleSub: { color: "#9ebfbb", fontSize: 13 },
  heading: {
    color: "#fffdf8",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    marginBottom: 8,
  },
  subheading: {
    color: "#9ebfbb",
    lineHeight: 22,
  },
  serviceName: {
    color: "#231f1c",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },
  meta: {
    color: "#75685e",
    marginBottom: 4,
  },
  statusRow: {
    marginTop: 12,
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusText: {
    color: "#4e433a",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#2f6c62",
  },
  rejectButton: {
    backgroundColor: "#f7f1e7",
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  actionText: {
    color: "#fffdf8",
    fontWeight: "700",
  },
  rejectText: {
    color: "#7b3f32",
    fontWeight: "700",
  },
  separator: {
    height: 14,
  },
  chatButton: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#ca6b2c",
  },
  chatButtonText: {
    color: "#fffdf8",
    fontWeight: "700",
  },
});
