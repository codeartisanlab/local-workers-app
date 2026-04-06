import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { WorkerStackParamList } from "../navigation/WorkerNavigator";

type Props = NativeStackScreenProps<WorkerStackParamList, "WorkerOnboarding">;

const STEPS = ["Basic Info", "Skills", "Documents", "Complete"];

const SKILLS = ["Cleaning", "Plumbing", "Electrical", "Carpentry", "Painting", "Pest Control"];

export function WorkerOnboardingScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      Alert.alert("Setup Complete", "Your profile is ready for review.", [
        { text: "Go to Dashboard", onPress: () => navigation.navigate("WorkerDashboard") },
      ]);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Progress */}
        <View style={styles.progressRow}>
          {STEPS.map((label, i) => (
            <View key={label} style={styles.progressStep}>
              <View style={[styles.dot, i <= step ? styles.dotActive : styles.dotInactive]}>
                <Text style={[styles.dotText, i <= step && styles.dotTextActive]}>{i + 1}</Text>
              </View>
              <Text style={[styles.progressLabel, i === step && styles.progressLabelActive]} numberOfLines={1}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.stepCounter}>Step {step + 1} of {STEPS.length}</Text>

        {step === 0 && (
          <SectionCard>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <Text style={styles.desc}>Fill in your name, photo, and bio to attract customers. This step connects to your profile settings.</Text>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>📝 Profile form (name, photo, bio)</Text>
            </View>
          </SectionCard>
        )}

        {step === 1 && (
          <SectionCard>
            <Text style={styles.sectionTitle}>Select Your Skills</Text>
            <Text style={styles.desc}>Choose the services you can provide.</Text>
            <View style={styles.skillsGrid}>
              {SKILLS.map((skill) => (
                <Pressable
                  key={skill}
                  style={[styles.skillChip, selectedSkills.includes(skill) && styles.skillChipSelected]}
                  onPress={() => toggleSkill(skill)}
                >
                  <Text style={[styles.skillText, selectedSkills.includes(skill) && styles.skillTextSelected]}>
                    {skill}
                  </Text>
                </Pressable>
              ))}
            </View>
          </SectionCard>
        )}

        {step === 2 && (
          <SectionCard>
            <Text style={styles.sectionTitle}>Upload Documents</Text>
            <Text style={styles.desc}>Upload your Aadhaar card or government ID for verification. Max 5MB, JPG/PNG/PDF.</Text>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>📄 Aadhaar / ID upload</Text>
            </View>
          </SectionCard>
        )}

        {step === 3 && (
          <SectionCard>
            <View style={styles.completeWrap}>
              <Text style={styles.completeIcon}>🎉</Text>
              <Text style={styles.completeTitle}>You're all set!</Text>
              <Text style={styles.desc}>Your profile is under review. You'll be able to accept jobs once approved by our team (usually within 24h).</Text>
            </View>
          </SectionCard>
        )}

        <View style={styles.navRow}>
          {step > 0 && (
            <Pressable style={styles.backButton} onPress={() => setStep((s) => s - 1)}>
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>
          )}
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>{step === STEPS.length - 1 ? "Complete Setup" : "Next →"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  progressStep: { alignItems: "center", flex: 1 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dotActive: { backgroundColor: "#ca6b2c" },
  dotInactive: { backgroundColor: "#eadfce" },
  dotText: { color: "#a89888", fontWeight: "700" },
  dotTextActive: { color: "#fffdf8" },
  progressLabel: { color: "#a89888", fontSize: 10, textAlign: "center" },
  progressLabelActive: { color: "#ca6b2c", fontWeight: "700" },
  stepCounter: { color: "#75685e", fontSize: 14 },
  sectionTitle: { color: "#231f1c", fontSize: 20, fontWeight: "800", marginBottom: 8 },
  desc: { color: "#75685e", lineHeight: 20 },
  placeholder: {
    marginTop: 16,
    backgroundColor: "#f0e2d2",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  placeholderText: { color: "#6f5039", fontWeight: "600" },
  skillsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  skillChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f7f1e7",
    borderWidth: 1,
    borderColor: "#eadfce",
  },
  skillChipSelected: { backgroundColor: "#2f6c62", borderColor: "#2f6c62" },
  skillText: { color: "#4e433a", fontWeight: "600" },
  skillTextSelected: { color: "#fffdf8" },
  completeWrap: { alignItems: "center" },
  completeIcon: { fontSize: 60, marginBottom: 12 },
  completeTitle: { color: "#231f1c", fontSize: 24, fontWeight: "800", marginBottom: 8 },
  navRow: { flexDirection: "row", gap: 12 },
  backButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    backgroundColor: "#f7f1e7",
    borderWidth: 1,
    borderColor: "#eadfce",
    alignItems: "center",
  },
  backButtonText: { color: "#4e433a", fontWeight: "700", fontSize: 16 },
  nextButton: {
    flex: 2,
    borderRadius: 16,
    paddingVertical: 16,
    backgroundColor: "#ca6b2c",
    alignItems: "center",
  },
  nextButtonText: { color: "#fffdf8", fontWeight: "800", fontSize: 16 },
});
