import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ScrollView, SafeAreaView, StyleSheet, Text, View, Pressable, Switch, TextInput, Alert, FlatList, Image } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { WorkerFloatingTabBar } from "../components/WorkerFloatingTabBar";
import { useAuth } from "../context/AuthContext";
import { WorkerStackParamList } from "../navigation/AppNavigator";
import { fetchWorkerMe, updateWorkerProfile, deletePortfolioImage } from "../services/api";
import { WorkerProfile, WorkerPortfolioImage, WorkerReview } from "../types";

type Props = NativeStackScreenProps<WorkerStackParamList, "WorkerProfile">;
type ProfileTab = "info" | "reviews" | "portfolio";

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[starStyles.star, i <= Math.round(rating) ? starStyles.filled : starStyles.empty]} />
      ))}
      <Text style={starStyles.label}>{rating.toFixed(1)}</Text>
    </View>
  );
}

export function WorkerProfileScreen({ navigation }: Props) {
  const { accessToken, logout } = useAuth();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("info");
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [workStart, setWorkStart] = useState("");
  const [workEnd, setWorkEnd] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    fetchWorkerMe(accessToken).then((p) => {
      setProfile(p);
      setFullName(p.fullName);
      setBio(p.bio);
      setLocation(p.location);
      setWorkStart(p.workStartTime ?? "");
      setWorkEnd(p.workEndTime ?? "");
    });
  }, [accessToken]);

  async function handleSaveInfo() {
    if (!accessToken) return;
    setSaving(true);
    try {
      const updated = await updateWorkerProfile(accessToken, {
        full_name: fullName,
        bio,
        location,
        work_start_time: workStart || null,
        work_end_time: workEnd || null,
      });
      setProfile(updated);
      Alert.alert("Saved", "Profile updated successfully.");
    } catch {
      Alert.alert("Error", "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePortfolioImage(imageId: number) {
    if (!accessToken) return;
    Alert.alert("Delete photo?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePortfolioImage(accessToken, imageId);
            setProfile((prev) =>
              prev
                ? { ...prev, portfolioImages: prev.portfolioImages.filter((img) => img.id !== imageId) }
                : prev,
            );
          } catch {
            Alert.alert("Error", "Failed to delete photo.");
          }
        },
      },
    ]);
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.loading}>Loading profile…</Text>
      </SafeAreaView>
    );
  }

  const verificationColors = {
    approved: "#2f6c62",
    pending: "#ca6b2c",
    rejected: "#c0392b",
  };
  const verificationLabels = {
    approved: "✓ Verified",
    pending: "⏳ Pending review",
    rejected: "✗ Verification failed",
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.heading}>My Profile</Text>
          <Pressable onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        <SectionCard>
          <Text style={styles.phone}>{profile.phone}</Text>
          <Text
            style={[styles.verificationBadge, { color: verificationColors[profile.verificationStatus] }]}
          >
            {verificationLabels[profile.verificationStatus]}
          </Text>
          <Pressable
            style={styles.verifyLink}
            onPress={() => navigation.navigate("WorkerVerification")}
          >
            <Text style={styles.verifyLinkText}>
              {profile.verificationStatus === "rejected" ? "Re-upload documents" : "Manage verification"}
            </Text>
          </Pressable>
        </SectionCard>

        <View style={styles.tabs}>
          {(["info", "reviews", "portfolio"] as ProfileTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === "info" ? "Info" : tab === "reviews" ? "Reviews" : "Portfolio"}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === "info" && (
          <SectionCard>
            <Text style={styles.sectionTitle}>Personal Info</Text>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              style={styles.input}
            />
            <Text style={styles.label}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Short description about yourself"
              style={[styles.input, styles.multilineInput]}
              multiline
            />
            <Text style={styles.label}>Location</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Your location"
              style={styles.input}
            />
            <Text style={styles.sectionTitle}>Work Hours</Text>
            <Text style={styles.hint}>Format: HH:MM:SS (e.g. 09:00:00)</Text>
            <Text style={styles.label}>Available From</Text>
            <TextInput
              value={workStart}
              onChangeText={setWorkStart}
              placeholder="09:00:00"
              style={styles.input}
            />
            <Text style={styles.label}>Available Until</Text>
            <TextInput
              value={workEnd}
              onChangeText={setWorkEnd}
              placeholder="18:00:00"
              style={styles.input}
            />
            <PrimaryButton title={saving ? "Saving…" : "Save Changes"} onPress={handleSaveInfo} loading={saving} />
            <Pressable style={styles.servicesLink} onPress={() => navigation.navigate("WorkerServices")}>
              <Text style={styles.servicesLinkText}>Edit My Services →</Text>
            </Pressable>
          </SectionCard>
        )}

        {activeTab === "reviews" && (
          <View style={styles.reviewsContainer}>
            <SectionCard>
              <Text style={styles.sectionTitle}>Rating</Text>
              <StarRating rating={profile.averageRating} />
              <Text style={styles.meta}>{profile.reviews.length} review{profile.reviews.length !== 1 ? "s" : ""}</Text>
            </SectionCard>
            {profile.reviews.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No reviews yet.</Text>
              </View>
            ) : (
              profile.reviews.map((review) => (
                <SectionCard key={review.id}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewCustomer}>{review.customerName}</Text>
                    <StarRating rating={review.rating} />
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </SectionCard>
              ))
            )}
          </View>
        )}

        {activeTab === "portfolio" && (
          <View>
            <SectionCard>
              <Text style={styles.sectionTitle}>Portfolio</Text>
              <Text style={styles.meta}>Showcase your best work.</Text>
              <Pressable
                style={styles.addPhotoBtn}
                onPress={() => navigation.navigate("WorkerVerification")}
              >
                <Text style={styles.addPhotoBtnText}>+ Add Photo via Verification Upload</Text>
              </Pressable>
            </SectionCard>
            {profile.portfolioImages.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No portfolio photos yet.</Text>
              </View>
            ) : (
              <View style={styles.portfolioGrid}>
                {profile.portfolioImages.map((img) => (
                  <View key={img.id} style={styles.portfolioItem}>
                    {img.imageUrl ? (
                      <Image source={{ uri: img.imageUrl }} style={styles.portfolioImage} />
                    ) : (
                      <View style={[styles.portfolioImage, styles.portfolioPlaceholder]} />
                    )}
                    {img.caption ? <Text style={styles.portfolioCaption}>{img.caption}</Text> : null}
                    <Pressable
                      onPress={() => handleDeletePortfolioImage(img.id)}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <WorkerFloatingTabBar activeTab="profile" />
    </SafeAreaView>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  star: { width: 12, height: 12, borderRadius: 2 },
  filled: { backgroundColor: "#ca6b2c" },
  empty: { backgroundColor: "#dfd3c1" },
  label: { color: "#4e433a", fontWeight: "700", marginLeft: 4, fontSize: 13 },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  container: { padding: 20, gap: 16, paddingBottom: 120 },
  loading: { margin: 40, textAlign: "center", color: "#75685e" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heading: { color: "#231f1c", fontSize: 28, fontWeight: "800" },
  logoutBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: "#f7f1e7", borderWidth: 1, borderColor: "#eadfce",
  },
  logoutText: { color: "#7b3f32", fontWeight: "700" },
  phone: { fontSize: 17, fontWeight: "700", color: "#231f1c", marginBottom: 6 },
  verificationBadge: { fontWeight: "700", marginBottom: 8 },
  verifyLink: { marginTop: 4 },
  verifyLinkText: { color: "#2f6c62", fontWeight: "700" },
  tabs: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 999,
    backgroundColor: "#f7f1e7", borderWidth: 1, borderColor: "#eadfce", alignItems: "center",
  },
  tabActive: { backgroundColor: "#2f6c62", borderColor: "#2f6c62" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#4e433a" },
  tabTextActive: { color: "#fffdf8" },
  sectionTitle: { color: "#231f1c", fontSize: 17, fontWeight: "800", marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "700", color: "#4e433a", marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: "#f7f1e7", borderRadius: 14, borderWidth: 1, borderColor: "#eadfce",
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#231f1c", marginBottom: 4,
  },
  multilineInput: { minHeight: 80, textAlignVertical: "top" },
  hint: { fontSize: 12, color: "#7d6f63", marginBottom: 4 },
  servicesLink: { marginTop: 14, alignItems: "center" },
  servicesLinkText: { color: "#2f6c62", fontWeight: "700" },
  meta: { color: "#75685e", marginBottom: 4 },
  reviewsContainer: { gap: 12 },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  reviewCustomer: { fontWeight: "700", color: "#231f1c", fontSize: 15 },
  reviewComment: { color: "#4e433a", lineHeight: 20 },
  emptyState: { paddingVertical: 30, alignItems: "center" },
  emptyText: { color: "#7d6f63" },
  addPhotoBtn: {
    marginTop: 10, paddingVertical: 12, borderRadius: 14,
    borderWidth: 1, borderColor: "#2f6c62", alignItems: "center",
  },
  addPhotoBtnText: { color: "#2f6c62", fontWeight: "700" },
  portfolioGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  portfolioItem: { width: "47%", position: "relative" },
  portfolioImage: { width: "100%", aspectRatio: 1, borderRadius: 12, backgroundColor: "#dfd3c1" },
  portfolioPlaceholder: { backgroundColor: "#e5dbd0" },
  portfolioCaption: { fontSize: 12, color: "#75685e", marginTop: 4 },
  deleteBtn: {
    position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },
  deleteBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
