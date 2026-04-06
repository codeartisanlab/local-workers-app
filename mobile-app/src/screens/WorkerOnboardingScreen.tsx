import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, ScrollView, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { WorkerStackParamList } from "../navigation/AppNavigator";
import { updateWorkerProfile } from "../services/api";

type Props = NativeStackScreenProps<WorkerStackParamList, "WorkerOnboarding">;
type Step = 0 | 1 | 2;

export function WorkerOnboardingScreen({ navigation }: Props) {
  const { accessToken } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleStep0Next() {
    if (!fullName.trim()) {
      Alert.alert("Name required", "Please enter your full name.");
      return;
    }
    if (!accessToken) return;
    setSaving(true);
    try {
      await updateWorkerProfile(accessToken, { full_name: fullName, bio });
      setStep(1);
    } catch {
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSkipToServices() {
    setStep(1);
  }

  function handleServicesNext() {
    setStep(2);
  }

  function handleFinish() {
    navigation.replace("WorkerDashboard");
  }

  const steps = ["About You", "Your Services", "Verify Identity"];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Welcome</Text>
          <Text style={styles.title}>Set up your worker profile</Text>
          <Text style={styles.subtitle}>Complete these steps to start receiving bookings.</Text>
        </View>

        <View style={styles.stepIndicator}>
          {steps.map((label, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepDot, step > i ? styles.stepDone : step === i ? styles.stepCurrent : styles.stepUpcoming]}>
                <Text style={styles.stepDotText}>{step > i ? "✓" : String(i + 1)}</Text>
              </View>
              <Text style={[styles.stepLabel, step === i && styles.stepLabelActive]}>{label}</Text>
            </View>
          ))}
        </View>

        {step === 0 && (
          <SectionCard>
            <Text style={styles.sectionTitle}>Tell us about yourself</Text>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Aarav Singh"
              style={styles.input}
            />
            <Text style={styles.label}>Bio (optional)</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Short description about yourself and your experience…"
              style={[styles.input, styles.multilineInput]}
              multiline
            />
            <PrimaryButton title={saving ? "Saving…" : "Next →"} onPress={handleStep0Next} loading={saving} />
          </SectionCard>
        )}

        {step === 1 && (
          <SectionCard>
            <Text style={styles.sectionTitle}>Choose your services</Text>
            <Text style={styles.meta}>
              Select the services you offer. You can always update these from your profile.
            </Text>
            <View style={styles.buttonGroup}>
              <PrimaryButton title="Select Services" onPress={() => navigation.navigate("WorkerServices")} />
            </View>
            <View style={styles.buttonGroup}>
              <PrimaryButton title="Continue →" onPress={handleServicesNext} />
            </View>
          </SectionCard>
        )}

        {step === 2 && (
          <SectionCard>
            <Text style={styles.sectionTitle}>Verify your identity</Text>
            <Text style={styles.meta}>
              Upload your ID document and a selfie to get verified. Verification helps customers trust you.
            </Text>
            <View style={styles.buttonGroup}>
              <PrimaryButton title="Upload Documents" onPress={() => navigation.navigate("WorkerVerification")} />
            </View>
            <View style={styles.buttonGroup}>
              <PrimaryButton title="Skip for Now & Go to Dashboard" onPress={handleFinish} />
            </View>
          </SectionCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  container: { padding: 20, gap: 20, paddingBottom: 40 },
  hero: { gap: 8 },
  eyebrow: { color: "#ca6b2c", fontSize: 13, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { fontSize: 30, fontWeight: "800", color: "#231f1c", lineHeight: 36 },
  subtitle: { color: "#75685e", lineHeight: 22 },
  stepIndicator: { flexDirection: "row", justifyContent: "space-between" },
  stepItem: { alignItems: "center", flex: 1 },
  stepDot: {
    width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  stepDone: { backgroundColor: "#2f6c62" },
  stepCurrent: { backgroundColor: "#ca6b2c" },
  stepUpcoming: { backgroundColor: "#dfd3c1" },
  stepDotText: { color: "#fffdf8", fontWeight: "700", fontSize: 13 },
  stepLabel: { fontSize: 11, color: "#7d6f63", textAlign: "center" },
  stepLabelActive: { color: "#ca6b2c", fontWeight: "700" },
  sectionTitle: { color: "#231f1c", fontSize: 17, fontWeight: "800", marginBottom: 10 },
  label: { fontSize: 13, fontWeight: "700", color: "#4e433a", marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: "#f7f1e7", borderRadius: 14, borderWidth: 1, borderColor: "#eadfce",
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#231f1c", marginBottom: 8,
  },
  multilineInput: { minHeight: 80, textAlignVertical: "top" },
  meta: { color: "#75685e", lineHeight: 20, marginBottom: 12 },
  buttonGroup: { marginTop: 10 },
});
