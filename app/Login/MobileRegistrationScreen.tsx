// src/screens/MobileRegistrationScreen.tsx
import React, { useState, useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/utils/Colors";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { messaging, getToken } from "../../utils/firebaseConfig"; // correct relative path

const MobileRegistrationScreen: React.FC = () => {
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      console.log("Push notifications: must use a physical device");
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Notification permission not granted!");
      return;
    }

    try {
      const expoToken = (await Notifications.getDevicePushTokenAsync()).data;
      console.log("Expo Push Token:", expoToken);
    } catch (err) {
      console.log("Error getting Expo push token:", err);
    }

    try {
      const fcmToken = await getToken(messaging, {
        vapidKey:
          "BHwXzTi3L5ak4p08dX0QlpTXu18IUrVpDQIVszL0injYiwA0nxMBstC6fIGmu6ADlmjIgnWK_uwUqloNpj9X-jM",
      });
      console.log("FCM Token:", fcmToken);
    } catch (err) {
      console.log("Error getting FCM token:", err);
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  };

  const handleSkip = () => router.replace("/(tabs)");

  const handleSendOTP = async () => {
    if (!mobile) return Alert.alert("Error", "Please enter your mobile number");
    if (!email) return Alert.alert("Error", "Please enter your email address");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Alert.alert("Error", "Please enter a valid email address");
    }
    if (password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters long");
    }

    const cleanMobile = mobile.replace(/[^0-9]/g, "");
    if (cleanMobile.length !== 10) {
      return Alert.alert("Error", "Please enter a valid 10-digit mobile number");
    }

    setIsLoading(true);
    try {
      const response = await fetch("https://youlitestore.in/wp-json/mobile-app/v1/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ mobile: cleanMobile, email }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Invalid server response: ${text}`);
      }

      const data = await response.json();
      if (data.success) {
        Alert.alert("Success", "OTP sent to your mobile number");
        router.push({
          pathname: "/Login/VerifyOTPScreen",
          params: { mobile: cleanMobile, email, password },
        });
      } else {
        Alert.alert("Error", data.message || "Failed to send OTP");
      }
    } catch (error: any) {
      let msg = "Something went wrong";
      if (error.message.includes("Network request failed"))
        msg = "Network error. Please check your internet connection";
      else if (error.message.includes("405")) msg = "Server configuration error";
      else if (error.message) msg = error.message;
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMobileNumber = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setMobile(cleaned.slice(0, 10));
  };

  const canSubmit = mobile.length === 10 && email && password.length >= 6;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="phone-portrait-outline" size={80} color={Colors.PRIMARY} />
          </View>
          <Text style={styles.title}>Mobile Verification</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number and create account
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <Ionicons
              name="call-outline"
              size={20}
              color={Colors.PRIMARY}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              value={mobile}
              onChangeText={formatMobileNumber}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={Colors.PRIMARY}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={Colors.PRIMARY}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              autoComplete="password-new"
            />
            <TouchableOpacity
              style={styles.visibilityToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.helperText}>
            We will send you a 6-digit OTP to verify your number
          </Text>

          <TouchableOpacity
            style={[styles.button, (!canSubmit || isLoading) && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={!canSubmit || isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Sending..." : "Send OTP"}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.PRIMARY} />
            <Text style={styles.infoText}>
              Your information is safe and secure
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/Login/LoginRegisterPage")}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.WHITE },
  skipButton: { position: "absolute", top: 80, right: 30, zIndex: 10, padding: 10 },
  skipButtonText: { color: Colors.PRIMARY, fontSize: 16, fontWeight: "600" },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 70 : 50,
  },
  header: { alignItems: "center", marginBottom: 40 },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.PRIMARY}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "bold", color: Colors.PRIMARY, marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center", paddingHorizontal: 20 },
  formContainer: { width: "100%" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  countryCode: {
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    marginRight: 10,
  },
  countryCodeText: { fontSize: 16, color: Colors.BLACK, fontWeight: "600" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: "100%", color: Colors.BLACK, fontSize: 16 },
  visibilityToggle: { padding: 5 },
  helperText: { fontSize: 13, color: "#999", marginBottom: 20, textAlign: "center" },
  button: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.WHITE, fontSize: 16, fontWeight: "bold" },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  infoText: { fontSize: 13, color: "#666" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 30 },
  footerText: { color: "#666" },
  footerLink: { color: Colors.PRIMARY, fontWeight: "bold" },
});

export default MobileRegistrationScreen;
