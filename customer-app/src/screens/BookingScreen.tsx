import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SectionCard } from "../components/SectionCard";
import { RootStackParamList } from "../navigation/AppNavigator";
import { fetchWorkerDetails } from "../services/api";
import { WorkerDetails } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Booking">;

function ChatIcon() {
  return (
    <View style={iconStyles.chatWrap}>
      <View style={iconStyles.chatBubble}>
        <View style={iconStyles.chatDotsRow}>
          <View style={iconStyles.chatDot} />
          <View style={iconStyles.chatDot} />
          <View style={iconStyles.chatDot} />
        </View>
      </View>
      <View style={iconStyles.chatTail} />
    </View>
  );
}

function CalendarIcon() {
  return (
    <View style={iconStyles.calendarWrap}>
      <View style={iconStyles.calendarRingRow}>
        <View style={iconStyles.calendarRing} />
        <View style={iconStyles.calendarRing} />
      </View>
      <View style={iconStyles.calendarBody}>
        <View style={iconStyles.calendarLine} />
        <View style={iconStyles.calendarLineShort} />
      </View>
    </View>
  );
}

export function BookingScreen({ navigation, route }: Props) {
  const { worker, service, bookingId } = route.params;
  const [workerDetails, setWorkerDetails] = useState<WorkerDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"portfolio" | "reviews">("portfolio");

  useEffect(() => {
    let isMounted = true;

    fetchWorkerDetails(worker.id)
      .then((details) => {
        if (isMounted) {
          setWorkerDetails(details);
        }
      })
      .finally(() => {
        if (isMounted) {
          setDetailsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [worker.id]);

  const resolvedWorker = workerDetails ?? worker;
  const canChat = useMemo(() => Boolean(bookingId), [bookingId]);
  const ratingValue = workerDetails?.averageRating ?? worker.rating;

  function handleOpenChat() {
    if (!bookingId) {
      Alert.alert("Booking required", "Book this worker first, then chat will be available here.");
      return;
    }

    navigation.navigate("BookingChat", {
      bookingId,
      workerName: resolvedWorker.name,
    });
  }

  function handleOpenBookingSlots() {
    navigation.navigate("BookingSlots", { worker, service });
  }

  return (
    <SafeAreaView style={styles.safeArea} testID="booking-screen">
      <ScrollView contentContainerStyle={styles.container}>
        <SectionCard>
          <View style={styles.heroHeader}>
            <Image
              source={{ uri: worker.photoUrl ?? `https://i.pravatar.cc/300?img=${(worker.id % 60) + 1}` }}
              style={styles.workerPhoto}
            />
            <View style={styles.heroCopy}>
              <Text style={styles.workerName} testID="booking-worker-name">
                {resolvedWorker.name}
              </Text>
              <Text style={styles.workerMeta}>{resolvedWorker.skills.join(" • ")}</Text>
            </View>
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.iconAction, !canChat && styles.iconActionDisabled]}
                onPress={handleOpenChat}
                disabled={!canChat}
                testID="detail-chat-button"
              >
                <ChatIcon />
              </Pressable>
              <Pressable
                style={[styles.iconAction, styles.bookingAction]}
                onPress={handleOpenBookingSlots}
                testID="detail-book-button"
              >
                <CalendarIcon />
              </Pressable>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaBadge}>{service.name}</Text>
            <Text style={styles.metaBadge}>Rating {ratingValue}</Text>
            <Text style={styles.metaBadge}>{worker.distance}</Text>
            <Text style={styles.metaBadge}>{resolvedWorker.verificationStatus}</Text>
          </View>
        </SectionCard>

        {detailsLoading ? (
          <ActivityIndicator size="large" color="#ca6b2c" style={styles.loader} />
        ) : (
          <SectionCard>
            <Text style={styles.sectionTitle}>Worker Details</Text>
            <View style={styles.tabRow}>
              <Pressable
                style={[
                  styles.tabButton,
                  activeTab === "portfolio" ? styles.activeTabButton : styles.inactiveTabButton,
                ]}
                onPress={() => setActiveTab("portfolio")}
              >
                <Text
                  style={[styles.tabText, activeTab === "portfolio" ? styles.activeTabText : styles.inactiveTabText]}
                >
                  Portfolio
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.tabButton,
                  activeTab === "reviews" ? styles.activeTabButton : styles.inactiveTabButton,
                ]}
                onPress={() => setActiveTab("reviews")}
              >
                <Text
                  style={[styles.tabText, activeTab === "reviews" ? styles.activeTabText : styles.inactiveTabText]}
                >
                  Reviews
                </Text>
              </Pressable>
            </View>

            {activeTab === "portfolio" ? (
              workerDetails?.portfolioImages.length ? (
                <View style={styles.portfolioGrid}>
                  {workerDetails.portfolioImages.map((image) => (
                    <View key={image.id} style={styles.portfolioCard}>
                      <Image source={{ uri: image.imageUrl }} style={styles.portfolioImage} resizeMode="cover" />
                      <Text style={styles.portfolioCaption}>{image.caption}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No portfolio images yet.</Text>
              )
            ) : workerDetails?.reviews.length ? (
              workerDetails.reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <Text style={styles.reviewHeader}>
                    {review.customerName} • {review.rating.toFixed(1)}
                  </Text>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No reviews yet.</Text>
            )}
          </SectionCard>
        )}
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
    paddingBottom: 40,
  },
  heroHeader: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  workerPhoto: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#eadfce",
  },
  heroCopy: {
    flex: 1,
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
    marginBottom: 0,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  iconAction: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#fff4ea",
    borderWidth: 1,
    borderColor: "#eadfce",
    alignItems: "center",
    justifyContent: "center",
  },
  bookingAction: {
    backgroundColor: "#ca6b2c",
    borderColor: "#ca6b2c",
  },
  iconActionDisabled: {
    opacity: 0.45,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  metaBadge: {
    color: "#6f5039",
    backgroundColor: "#f0e2d2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: "hidden",
    textTransform: "capitalize",
  },
  loader: {
    marginVertical: 12,
  },
  sectionTitle: {
    color: "#231f1c",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#2f6c62",
  },
  inactiveTabButton: {
    backgroundColor: "#f7f1e7",
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  tabText: {
    fontWeight: "700",
  },
  activeTabText: {
    color: "#fffdf8",
  },
  inactiveTabText: {
    color: "#4e433a",
  },
  portfolioGrid: {
    gap: 12,
  },
  portfolioCard: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#f7f1e7",
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  portfolioImage: {
    width: "100%",
    height: 180,
  },
  portfolioCaption: {
    color: "#4e433a",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontWeight: "600",
  },
  reviewCard: {
    borderRadius: 16,
    backgroundColor: "#f7f1e7",
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  reviewHeader: {
    color: "#231f1c",
    fontWeight: "700",
    marginBottom: 6,
  },
  reviewComment: {
    color: "#75685e",
    lineHeight: 20,
  },
  emptyText: {
    color: "#75685e",
    lineHeight: 20,
  },
});

const iconStyles = StyleSheet.create({
  chatWrap: {
    width: 24,
    alignItems: "center",
  },
  chatBubble: {
    width: 22,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#2f6c62",
    alignItems: "center",
    justifyContent: "center",
  },
  chatDotsRow: {
    flexDirection: "row",
    gap: 2,
  },
  chatDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#2f6c62",
  },
  chatTail: {
    marginTop: -2,
    marginLeft: -10,
    width: 8,
    height: 8,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#2f6c62",
    transform: [{ rotate: "-35deg" }],
  },
  calendarWrap: {
    width: 22,
    alignItems: "center",
  },
  calendarRingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 16,
    marginBottom: -2,
    zIndex: 1,
  },
  calendarRing: {
    width: 4,
    height: 6,
    borderRadius: 2,
    backgroundColor: "#fffdf8",
  },
  calendarBody: {
    width: 22,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#fffdf8",
    paddingTop: 4,
    alignItems: "center",
  },
  calendarLine: {
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#fffdf8",
    marginBottom: 3,
  },
  calendarLineShort: {
    width: 7,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#fffdf8",
  },
});
