import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { CustomerStackParamList } from "../navigation/CustomerNavigator";
import { submitReview } from "../services/api";

type Props = NativeStackScreenProps<CustomerStackParamList, "ReviewBooking">;

const REVIEW_TAGS = ["Punctual", "Professional", "Skilled", "Friendly", "Clean"];

export function ReviewBookingScreen({ route, navigation }: Props) {
  const { bookingId, workerName } = route.params;
  const { accessToken } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit() {
    if (!accessToken) {
      Alert.alert("Session expired");
      return;
    }
    setSubmitting(true);
    try {
      await submitReview(accessToken, bookingId, rating, comment, wouldRecommend, selectedTags);
      Alert.alert("Review submitted", "Thank you for your feedback!", [
        { text: "OK", onPress: () => navigation.navigate("CustomerHome") },
      ]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard>
          <Text style={styles.title}>How was {workerName}?</Text>
          <Text style={styles.subtitle}>Your feedback helps others find great workers.</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)}>
                <Text style={[styles.star, star <= rating && styles.starFilled]}>{star <= rating ? "★" : "☆"}</Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsRow}>
            {REVIEW_TAGS.map((tag) => (
              <Pressable
                key={tag}
                style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipSelected]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>{tag}</Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Your Comments</Text>
          <TextInput
            style={styles.commentInput}
            multiline
            numberOfLines={4}
            placeholder="Share your experience…"
            placeholderTextColor="#a89888"
            value={comment}
            onChangeText={setComment}
          />
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Would you recommend?</Text>
          <View style={styles.recommendRow}>
            <Pressable
              style={[styles.recommendBtn, wouldRecommend && styles.recommendBtnActive]}
              onPress={() => setWouldRecommend(true)}
            >
              <Text style={[styles.recommendText, wouldRecommend && styles.recommendTextActive]}>👍 Yes</Text>
            </Pressable>
            <Pressable
              style={[styles.recommendBtn, !wouldRecommend && styles.recommendBtnActiveNo]}
              onPress={() => setWouldRecommend(false)}
            >
              <Text style={[styles.recommendText, !wouldRecommend && styles.recommendTextActive]}>👎 No</Text>
            </Pressable>
          </View>
        </SectionCard>

        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>{submitting ? "Submitting…" : "Submit Review"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  title: { color: "#231f1c", fontSize: 22, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: "#75685e", fontSize: 14, marginBottom: 14 },
  starsRow: { flexDirection: "row", gap: 8 },
  star: { fontSize: 36, color: "#d9cfc2" },
  starFilled: { color: "#ca6b2c" },
  sectionTitle: { color: "#231f1c", fontSize: 16, fontWeight: "700", marginBottom: 12 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f7f1e7",
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  tagChipSelected: { backgroundColor: "#2f6c62", borderColor: "#2f6c62" },
  tagText: { color: "#4e433a", fontWeight: "600" },
  tagTextSelected: { color: "#fffdf8" },
  commentInput: {
    backgroundColor: "#f7f1e7",
    borderWidth: 1,
    borderColor: "#eadfce",
    borderRadius: 12,
    padding: 14,
    color: "#231f1c",
    textAlignVertical: "top",
    minHeight: 100,
  },
  recommendRow: { flexDirection: "row", gap: 12 },
  recommendBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eadfce",
    backgroundColor: "#f7f1e7",
    alignItems: "center",
  },
  recommendBtnActive: { backgroundColor: "#2f6c62", borderColor: "#2f6c62" },
  recommendBtnActiveNo: { backgroundColor: "#b24a3a", borderColor: "#b24a3a" },
  recommendText: { color: "#4e433a", fontWeight: "700", fontSize: 16 },
  recommendTextActive: { color: "#fffdf8" },
  submitButton: {
    backgroundColor: "#ca6b2c",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#fffdf8", fontSize: 17, fontWeight: "800" },
});
