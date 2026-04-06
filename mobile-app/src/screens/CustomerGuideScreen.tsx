import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { SectionCard } from "../components/SectionCard";
import { CustomerStackParamList } from "../navigation/CustomerNavigator";

type Props = NativeStackScreenProps<CustomerStackParamList, "CustomerGuide">;

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
      "Tap "Send OTP" — you will receive a 6-digit code via SMS.",
      "Enter the code and tap "Continue" to log in.",
      "Select "Customer" as your role before logging in.",
    ],
    tip: "Your phone number is your permanent account ID — no password needed.",
  },
  {
    number: 2,
    icon: "🔍",
    title: "Find a Service",
    details: [
      "The Home screen shows popular service categories (Cleaning, Plumbing, Electrical …).",
      "Tap a category card to explore its services and pricing packages.",
      "Use the Search bar (🔍) at the top to find any service by name.",
      "Each service page shows included/excluded items and estimated duration.",
    ],
    tip: "Tap a package card to compare Basic, Standard, and Premium options.",
  },
  {
    number: 3,
    icon: "👷",
    title: "Choose a Worker",
    details: [
      "After picking a service, the app shows verified workers nearby.",
      "Workers are sorted by distance (closest first). You can filter by rating.",
      "Tap a worker card to see their full profile: rating, reviews, portfolio, and skills.",
      "Verified workers show a ✓ badge — they have passed our ID check.",
    ],
    tip: "Workers with more ⭐ ratings and completed jobs are more reliable.",
  },
  {
    number: 4,
    icon: "📅",
    title: "Book a Slot",
    details: [
      "Pick a date and time slot that works for you from the worker's availability calendar.",
      "Choose your service address — saved addresses appear automatically.",
      "Review the Booking Summary: service, package, worker, slot, and total price.",
      "Apply a promo/coupon code in the summary to get a discount.",
    ],
    tip: "Tap "Manage Addresses" in your Profile to add or change saved addresses.",
  },
  {
    number: 5,
    icon: "💳",
    title: "Pay Securely",
    details: [
      "Choose a payment method: UPI, Card, Wallet, or Cash.",
      "Confirm the payment to finalise your booking.",
      "You will see a "Booking Confirmed" screen with your Booking ID.",
    ],
    tip: "Cash payment is collected by the worker on completion.",
  },
  {
    number: 6,
    icon: "📍",
    title: "Track Your Booking",
    details: [
      "Go to "Track Booking" from your profile or the order history.",
      "Watch real-time progress steps: Accepted → On the Way → In Progress → Completed.",
      "Tap the chat bubble to message your worker at any time.",
      "You can cancel a pending or accepted booking from the tracking screen.",
    ],
    tip: "Reschedule is available from the Order History screen.",
  },
  {
    number: 7,
    icon: "⭐",
    title: "Leave a Review",
    details: [
      "After the job is marked Completed, a "Leave a Review" button appears.",
      "Rate the worker (1–5 stars) and add tags like Punctual or Professional.",
      "Write a comment and indicate if you would recommend them.",
      "Your review helps other customers make informed decisions.",
    ],
    tip: "Reviews improve the platform for everyone — please be honest!",
  },
  {
    number: 8,
    icon: "👤",
    title: "Manage Your Account",
    details: [
      "Access your Profile from the bottom tab bar (person icon).",
      "View past and active bookings in Order History.",
      "Add, edit, or remove saved addresses under "My Addresses".",
      "Tap "Logout" in Profile to sign out safely.",
    ],
  },
];

export function CustomerGuideScreen({ navigation }: Props) {
  const [expanded, setExpanded] = useState<number | null>(1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard>
          <Text style={styles.heroIcon}>📖</Text>
          <Text style={styles.heroTitle}>Customer Guide</Text>
          <Text style={styles.heroSubtitle}>
            Everything you need to book trusted home-service professionals — step by step.
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

        <Pressable style={styles.ctaButton} onPress={() => navigation.navigate("CustomerHome")}>
          <Text style={styles.ctaButtonText}>Start Booking →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f1ea" },
  content: { padding: 20, gap: 12, paddingBottom: 48 },
  heroIcon: { fontSize: 48, textAlign: "center", marginBottom: 8 },
  heroTitle: { color: "#231f1c", fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  heroSubtitle: { color: "#75685e", lineHeight: 21, textAlign: "center" },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0e2d2",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeActive: { backgroundColor: "#ca6b2c" },
  stepBadgeText: { color: "#6f5039", fontSize: 13, fontWeight: "800" },
  stepBadgeTextActive: { color: "#fffdf8" },
  stepIcon: { fontSize: 22 },
  stepTitle: { flex: 1, color: "#231f1c", fontSize: 15, fontWeight: "700" },
  stepTitleActive: { color: "#ca6b2c" },
  chevron: { color: "#a89888", fontSize: 12 },
  stepBody: { marginTop: 14, gap: 8 },
  detailRow: { flexDirection: "row", gap: 8 },
  bullet: { color: "#ca6b2c", fontSize: 16, lineHeight: 22 },
  detailText: { flex: 1, color: "#4e433a", lineHeight: 22 },
  tipBox: {
    backgroundColor: "#fdf2e8",
    borderLeftWidth: 3,
    borderLeftColor: "#ca6b2c",
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  tipText: { color: "#6f5039", fontSize: 13, lineHeight: 19 },
  ctaButton: {
    backgroundColor: "#ca6b2c",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  ctaButtonText: { color: "#fffdf8", fontSize: 17, fontWeight: "800" },
});
