import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

export function LoginScreen() {
  const { sendOtp, login } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const showOtpSection = phone.trim().length === 10;

  function handlePhoneChange(value: string) {
    setPhone(value.replace(/\D/g, "").slice(0, 10));
  }

  function handleOtpChange(value: string) {
    setOtp(value.replace(/\D/g, "").slice(0, 6));
  }

  async function handleSendOtp() {
    if (phone.length !== 10) {
      Alert.alert("Invalid phone number", "Enter a valid 10 digit mobile number.");
      return;
    }
    try {
      setSendingOtp(true);
      const generatedOtp = await sendOtp(phone);
      setSentOtp(generatedOtp);
      Alert.alert("OTP sent", `Demo OTP: ${generatedOtp}`);
    } catch (error) {
      Alert.alert("Unable to send OTP", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleLogin() {
    if (phone.length !== 10) {
      Alert.alert("Invalid phone number", "Enter a valid 10 digit mobile number.");
      return;
    }
    try {
      setLoggingIn(true);
      await login(phone, otp, role);
    } catch (error) {
      Alert.alert("Login failed", error instanceof Error ? error.message : "Check your OTP.");
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.container} testID="login-screen">
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Service Booking</Text>
            <Text style={styles.title}>Book trusted help in minutes.</Text>
            <Text style={styles.subtitle}>
              Sign in with OTP and jump into a calm, task-focused flow for customers and workers.
            </Text>
          </View>

          <SectionCard>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="Enter phone number"
              keyboardType="number-pad"
              maxLength={10}
              style={styles.input}
              testID="login-phone-input"
            />

            <Text style={styles.label}>Choose Role</Text>
            <View style={styles.roleRow}>
              {(["customer", "worker"] as Role[]).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setRole(item)}
                  style={[styles.rolePill, role === item && styles.rolePillActive]}
                  testID={`role-${item}`}
                >
                  <Text style={[styles.roleText, role === item && styles.roleTextActive]}>
                    {item === "customer" ? "Customer" : "Worker"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {showOtpSection ? (
              <>
                <PrimaryButton
                  title={sendingOtp ? "Sending OTP..." : "Send OTP"}
                  onPress={handleSendOtp}
                  loading={sendingOtp}
                  disabled={phone.trim().length !== 10}
                  testID="send-otp-button"
                />

                <Text style={styles.label}>OTP</Text>
                <TextInput
                  value={otp}
                  onChangeText={handleOtpChange}
                  placeholder="Enter OTP"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.input}
                  testID="login-otp-input"
                />

                <PrimaryButton
                  title={loggingIn ? "Logging in..." : "Continue"}
                  onPress={handleLogin}
                  loading={loggingIn}
                  disabled={otp.trim().length < 4}
                  testID="continue-button"
                />

                {sentOtp ? (
                  <Text style={styles.hint} testID="otp-hint">
                    Use demo OTP: {sentOtp}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.hint}>Enter a 10 digit mobile number to continue.</Text>
            )}
          </SectionCard>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f1ea",
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 24,
    justifyContent: "center",
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    color: "#ca6b2c",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: "#231f1c",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#61564d",
  },
  label: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#4e433a",
  },
  input: {
    backgroundColor: "#f7f1e7",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eadfce",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#231f1c",
    marginBottom: 4,
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  rolePill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dfd3c1",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f7f1e7",
  },
  rolePillActive: {
    backgroundColor: "#2f6c62",
    borderColor: "#2f6c62",
  },
  roleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4e433a",
  },
  roleTextActive: {
    color: "#fffdf8",
  },
  hint: {
    marginTop: 14,
    textAlign: "center",
    color: "#7d6f63",
  },
});
