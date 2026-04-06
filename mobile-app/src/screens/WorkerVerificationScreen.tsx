import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, ScrollView, SafeAreaView, StyleSheet, Text, View, Pressable } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { WorkerStackParamList } from "../navigation/AppNavigator";
import { uploadVerification } from "../services/api";

type Props = NativeStackScreenProps<WorkerStackParamList, "WorkerVerification">;

export function WorkerVerificationScreen({ navigation }: Props) {
  const { accessToken, user } = useAuth();
  const [aadhaarSelected, setAadhaarSelected] = useState(false);
  const [selfieSelected, setSelfieSelected] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit() {
    if (!aadhaarSelected && !selfieSelected) {
      Alert.alert("Nothing selected", "Please select at least one document to upload.");
      return;
    }
    if (!accessToken) return;
    setUploading(true);
    try {
      const mockAadhaar = aadhaarSelected
        ? { uri: "mock://aadhaar.jpg", name: "aadhaar.jpg", type: "image/jpeg" }
        : undefined;
      const mockSelfie = selfieSelected
        ? { uri: "mock://selfie.jpg", name: "selfie.jpg", type: "image/jpeg" }
        : undefined;
      await uploadVerification(accessToken, { aadhaar: mockAadhaar, selfie: mockSelfie });
      Alert.alert("Submitted", "Your documents have been submitted for review.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Upload failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>ID Verification</Text>
          <Text style={styles.subheading}>
            Verify your identity to start receiving bookings. Upload a government-issued ID and a selfie.
          </Text>
        </View>

        <SectionCard>
          <Text style={styles.sectionTitle}>ID Document</Text>
          <Text style={styles.sectionDesc}>
            Upload a clear photo of your Aadhaar card, driving licence, or other government-issued ID.
            Accepted formats: JPG, PNG, PDF (max 5 MB).
          </Text>
          <Pressable
            style={[styles.uploadArea, aadhaarSelected && styles.uploadAreaSelected]}
            onPress={() => setAadhaarSelected((v) => !v)}
          >
            {aadhaarSelected ? (
              <Text style={styles.uploadSelectedText}>✓ ID Document Selected (mock)</Text>
            ) : (
              <>
                <View style={styles.uploadIcon}>
                  <View style={styles.uploadIconLine} />
                  <View style={styles.uploadIconArrow} />
                </View>
                <Text style={styles.uploadText}>Tap to select ID document</Text>
                <Text style={styles.uploadHint}>JPG, PNG or PDF · Max 5 MB</Text>
              </>
            )}
          </Pressable>
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Selfie</Text>
          <Text style={styles.sectionDesc}>
            Take a live selfie so we can match it with your ID. Make sure your face is clearly visible.
            Accepted formats: JPG, PNG (max 5 MB).
          </Text>
          <Pressable
            style={[styles.uploadArea, selfieSelected && styles.uploadAreaSelected]}
            onPress={() => setSelfieSelected((v) => !v)}
          >
            {selfieSelected ? (
              <Text style={styles.uploadSelectedText}>✓ Selfie Selected (mock)</Text>
            ) : (
              <>
                <View style={styles.cameraIcon}>
                  <View style={styles.cameraBody}>
                    <View style={styles.cameraLens} />
                  </View>
                </View>
                <Text style={styles.uploadText}>Tap to take a selfie</Text>
                <Text style={styles.uploadHint}>JPG or PNG · Max 5 MB</Text>
              </>
            )}
          </Pressable>
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Verification Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.pendingDot]} />
            <Text style={styles.statusText}>Once submitted, your documents will be reviewed within 24 hours.</Text>
          </View>
          <View style={styles.statusStep}>
            <Text style={styles.statusStepLabel}>🟡 Pending</Text>
            <Text style={styles.statusStepDesc}>Your documents are under review</Text>
          </View>
          <View style={styles.statusStep}>
            <Text style={styles.statusStepLabel}>✅ Approved</Text>
            <Text style={styles.statusStepDesc}>You're verified and can receive bookings</Text>
          </View>
          <View style={styles.statusStep}>
            <Text style={styles.statusStepLabel}>🔴 Rejected</Text>
            <Text style={styles.statusStepDesc}>Verification failed — re-upload below</Text>
          </View>
        </SectionCard>

        <PrimaryButton
          title={uploading ? "Uploading…" : "Submit for Verification"}
          onPress={handleSubmit}
          loading={uploading}
          disabled={!aadhaarSelected && !selfieSelected}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  header: { gap: 8 },
  heading: { color: "#231f1c", fontSize: 28, fontWeight: "800" },
  subheading: { color: "#75685e", lineHeight: 22 },
  sectionTitle: { color: "#231f1c", fontSize: 17, fontWeight: "800", marginBottom: 8 },
  sectionDesc: { color: "#75685e", fontSize: 13, lineHeight: 20, marginBottom: 12 },
  uploadArea: {
    borderWidth: 2, borderColor: "#dfd3c1", borderStyle: "dashed",
    borderRadius: 16, paddingVertical: 28, alignItems: "center", gap: 8,
    backgroundColor: "#faf7f2",
  },
  uploadAreaSelected: { borderColor: "#2f6c62", backgroundColor: "#eef7f4" },
  uploadSelectedText: { color: "#2f6c62", fontWeight: "700", fontSize: 15 },
  uploadIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  uploadIconLine: {
    position: "absolute", width: 2, height: 20, borderRadius: 1, backgroundColor: "#b0a89e",
  },
  uploadIconArrow: {
    position: "absolute", bottom: 4, width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 10,
    borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#b0a89e",
  },
  uploadText: { color: "#4e433a", fontWeight: "700" },
  uploadHint: { color: "#7d6f63", fontSize: 12 },
  cameraIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  cameraBody: {
    width: 30, height: 22, borderWidth: 2, borderColor: "#b0a89e", borderRadius: 5,
    alignItems: "center", justifyContent: "center",
  },
  cameraLens: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#b0a89e" },
  statusRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  pendingDot: { backgroundColor: "#ca6b2c" },
  statusText: { color: "#75685e", flex: 1, lineHeight: 20, fontSize: 13 },
  statusStep: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#f0e8da" },
  statusStepLabel: { fontWeight: "700", color: "#231f1c", marginBottom: 2 },
  statusStepDesc: { color: "#75685e", fontSize: 13 },
});
