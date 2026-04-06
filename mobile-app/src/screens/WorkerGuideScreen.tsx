import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { WorkerTabBar } from "../components/WorkerTabBar";
import { WorkerStackParamList } from "../navigation/WorkerNavigator";

type Props = NativeStackScreenProps<WorkerStackParamList, "WorkerGuide">;

type Step = {
  number: number;
  icon: string;
  title: string;
  details: string[];
  tip?: string;
};

const STEPS: Step[] = [
  {
    number: 1,
    icon: "📱",
    title: "Sign Up / Log In",
    details: [
      "Open the app and enter your 10-digit mobile number.",
      "Select "Worker" as your role on the login screen.",
      "Tap "Send OTP" and enter the 6-digit code you receive.",
      "Tap "Continue" — your worker account and profile are created automatically.",
    ],
    tip: "Your phone number is your permanent account ID. No password required.",
  },
  {
    number: 2,
    icon: "🛠️",
    title: "Complete Your Profile",
    details: [
      "You are guided through a 4-step onboarding wizard on first login.",
      "Step 1 – Basic Info: your display name, photo, and a short bio.",
      "Step 2 – Skills: select the services you can provide (Cleaning, Plumbing, Electrical …).",
      "Step 3 – Documents: upload your Aadhaar card or government ID (JPG/PNG/PDF, max 5 MB).",
      "Step 4 – Complete: review a summary and submit your profile for admin approval.",
    ],
    tip: "Your profile is visible to customers only after admin approval (usually within 24 h).",
  },
  {
    number: 3,
    icon: "✅",
    title: "Get Verified",
    details: [
      "Our team reviews your submitted ID and profile details.",
      "Once approved, you receive a Verified badge on your profile.",
      "Rejected submissions receive feedback so you can re-upload.",
      "Only Approved workers appear in customer search results and receive job notifications.",
    ],
    tip: "Keep your documents clear and legible to speed up verification.",
  },
  {
    number: 4,
    icon: "🔔",
    title: "Receive & Accept Jobs",
    details: [
      "When a customer books a service near you, you get a push notification.",
      "Open the Dashboard (📋 tab) to see all incoming job requests.",
      "Each card shows the service name, customer location, distance, and scheduled time.",
      "Tap "Accept" to take the job, or "Decline" to pass.",
      "Accepting locks the booking — other workers are automatically notified it is taken.",
    ],
    tip: "Keep "Online" toggled ON so you receive notifications. Toggle it OFF when you need a break.",
  },
  {
    number: 5,
    icon: "🗺️",
    title: "Complete the Job",
    details: [
      "Navigate to the customer's address shown in the booking details.",
      "Use the in-app chat to communicate with the customer before or during the job.",
      "Perform the service and collect payment if the method is Cash.",
      "The booking is marked "Completed" either automatically or by the customer after the job.",
    ],
    tip: "Good communication and punctuality lead to better reviews and more bookings.",
  },
  {
    number: 6,
    icon: "💰",
    title: "Track Your Earnings",
    details: [
      "Open the Earnings tab (💰) from the bottom bar.",
      "See your total gross earnings, net payout (after 15 % platform commission), and pending payouts.",
      "Each transaction shows the booking it relates to.",
      "Payouts are processed weekly to your registered bank account.",
    ],
    tip: "Add your bank account details in Settings to enable direct payouts.",
  },
  {
    number: 7,
    icon: "💬",
    title: "Chat with Customers",
    details: [
      "Tap the Chat icon on any accepted job card in the Dashboard.",
      "Messages are only visible to you and the customer for that booking.",
      "Use chat to confirm arrival time, ask about access instructions, or send updates.",
    ],
  },
  {
    number: 8,
    icon: "⭐",
    title: "Build Your Reputation",
    details: [
      "After job completion, customers can rate you (1–5 stars) and leave a review.",
      "Your average rating is displayed on your public profile.",
      "Consistently high ratings lead to higher placement in search results.",
      "Your profile shows: completed jobs, verified status, and years on platform.",
    ],
    tip: "Respond to negative reviews professionally — it builds customer trust.",
  },
  {
    number: 9,
    icon: "🔧",
    title: "Manage Availability",
    details: [
      "Set your weekly availability from the Profile / Settings section.",
      "Block specific dates or times when you are unavailable.",
      "Customers can only book slots within your set availability.",
    ],
    tip: "Keeping your availability up-to-date prevents double bookings.",
  },
];

export function WorkerGuideScreen({}: Props) {
  const [expanded, setExpanded] = useState<number | null>(1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard>
          <Text style={styles.heroIcon}>📖</Text>
          <Text style={styles.heroTitle}>Worker Guide</Text>
          <Text style={styles.heroSubtitle}>
            Everything you need to start earning as a service professional — step by step.
          </Text>
        </SectionCard>

        {STEPS.map((step) => {
          const isOpen = expanded === step.number;
          return (
            <Pressable key={step.number} onPress={() => setExpanded(isOpen ? null : step.number)}>
              <SectionCard>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepBadge, isOpen && styles.stepBadgeActive]}>
                    <Text style={[styles.stepBadgeText, isOpen && styles.stepBadgeTextActive]}>
                      {step.number}
                    </Text>
                  </View>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                  <Text style={[styles.stepTitle, isOpen && styles.stepTitleActive]} numberOfLines={1}>
                    {step.title}
                  </Text>
                  <Text style={styles.chevron}>{isOpen ? "▲" : "▼"}</Text>
                </View>

                {isOpen && (
                  <View style={styles.stepBody}>
                    {step.details.map((d, i) => (
                      <View key={i} style={styles.detailRow}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.detailText}>{d}</Text>
                      </View>
                    ))}
                    {step.tip && (
                      <View style={styles.tipBox}>
                        <Text style={styles.tipText}>💡  {step.tip}</Text>
                      </View>
                    )}
                  </View>
                )}
              </SectionCard>
            </Pressable>
          );
        })}

        <View style={styles.faqCard}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          {[
            ["How do I reset my phone number?", "Contact support via the Help section. Account transfers must be verified manually."],
            ["When do I get paid?", "Payouts are processed every Monday for all completed bookings from the previous week."],
            ["What is the platform commission?", "We deduct 15% from each booking's price. Your net earning is shown on every transaction."],
            ["What if a customer cancels?", "You receive a partial payment if the cancellation happens after you've accepted the job."],
            ["How do I report a customer?", "Use the "Raise a Dispute" option on the booking detail screen."],
          ].map(([q, a], i) => (
            <View key={i} style={styles.faqItem}>
              <Text style={styles.faqQ}>Q: {q}</Text>
              <Text style={styles.faqA}>{a}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <WorkerTabBar activeTab="guide" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1a2e2a" },
  content: { padding: 20, gap: 12, paddingBottom: 120 },
  heroIcon: { fontSize: 48, textAlign: "center", marginBottom: 8 },
  heroTitle: { color: "#fffdf8", fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  heroSubtitle: { color: "#9ebfbb", lineHeight: 21, textAlign: "center" },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(47,108,98,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeActive: { backgroundColor: "#2f6c62" },
  stepBadgeText: { color: "#9ebfbb", fontSize: 13, fontWeight: "800" },
  stepBadgeTextActive: { color: "#fffdf8" },
  stepIcon: { fontSize: 22 },
  stepTitle: { flex: 1, color: "#fffdf8", fontSize: 15, fontWeight: "700" },
  stepTitleActive: { color: "#6ecfc2" },
  chevron: { color: "#6b8e88", fontSize: 12 },
  stepBody: { marginTop: 14, gap: 8 },
  detailRow: { flexDirection: "row", gap: 8 },
  bullet: { color: "#2f6c62", fontSize: 16, lineHeight: 22 },
  detailText: { flex: 1, color: "#c2d8d4", lineHeight: 22 },
  tipBox: {
    backgroundColor: "rgba(47,108,98,0.2)",
    borderLeftWidth: 3,
    borderLeftColor: "#2f6c62",
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  tipText: { color: "#9ebfbb", fontSize: 13, lineHeight: 19 },
  faqCard: {
    backgroundColor: "#1e3830",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2f6c62",
    padding: 18,
    gap: 14,
    marginTop: 4,
  },
  faqTitle: { color: "#fffdf8", fontSize: 17, fontWeight: "800" },
  faqItem: { gap: 4 },
  faqQ: { color: "#6ecfc2", fontWeight: "700", fontSize: 14 },
  faqA: { color: "#9ebfbb", fontSize: 13, lineHeight: 20 },
});
