import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  rescheduleNotification,
  // sendTestNotification,
} from "@/services/NotificationsService";

export default function SettingsScreen() {
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadNotificationTime();
  }, []);

  const loadNotificationTime = async () => {
    try {
      const savedTime = await AsyncStorage.getItem("notificationTime");
      if (savedTime) {
        const time = new Date(JSON.parse(savedTime));
        setNotificationTime(time);
      } else {
        // Default to 9:00 AM
        const defaultTime = new Date();
        defaultTime.setHours(9, 0, 0, 0);
        setNotificationTime(defaultTime);
      }
    } catch (error) {
      console.error("Error loading notification time:", error);
    }
  };

  const saveNotificationTime = async (newTime: Date) => {
    try {
      await AsyncStorage.setItem("notificationTime", JSON.stringify(newTime));
      setNotificationTime(newTime);

      // Reschedule notifications with new time
      await rescheduleNotification(newTime);

      Alert.alert(
        "Settings Saved",
        `Notifications will now be sent at ${newTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      );
    } catch (error) {
      console.error("Error saving notification time:", error);
      Alert.alert("Error", "Failed to save notification time");
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");

    if (selectedTime) {
      // Create a new date with today's date but the selected time
      const newTime = new Date();
      newTime.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        0,
        0
      );
      saveNotificationTime(newTime);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const resetToDefault = () => {
    const defaultTime = new Date();
    defaultTime.setHours(9, 0, 0, 0); // 9:00 AM default
    saveNotificationTime(defaultTime);
  };

  // const testNotification = async () => {
  //   try {
  //     await sendTestNotification();
  //     Alert.alert(
  //       "Test Notification",
  //       "Test notification sent! Check your notification panel."
  //     );
  //   } catch (error) {
  //     console.error("Error sending test notification:", error);
  //     Alert.alert("Error", "Failed to send test notification");
  //   }
  // };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Settings
      </ThemedText>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Notification Settings
        </ThemedText>

        <ThemedText style={styles.description}>
          Choose when you want to receive daily notifications about expiring
          items
        </ThemedText>

        <View style={styles.timeContainer}>
          <ThemedText style={styles.timeLabel}>Notification Time:</ThemedText>

          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <ThemedText style={styles.timeButtonText}>
              {formatTime(notificationTime)}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={resetToDefault}>
          <ThemedText style={styles.resetButtonText}>
            Reset to Default (9:00 AM)
          </ThemedText>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.testButton} onPress={testNotification}>
          <ThemedText style={styles.testButtonText}>
            Send Test Notification
          </ThemedText>
        </TouchableOpacity> */}
      </View>

      <View style={styles.infoSection}>
        <ThemedText type="subtitle" style={styles.infoTitle}>
          How It Works
        </ThemedText>

        <ThemedText style={styles.infoText}>
          • You&apos;ll receive a daily notification at your chosen time
        </ThemedText>
        <ThemedText style={styles.infoText}>
          • The app checks for items expiring in the next 3 days
        </ThemedText>
        <ThemedText style={styles.infoText}>
          • Only items with expiration dates will trigger notifications
        </ThemedText>
        <ThemedText style={styles.infoText}>
          • Notifications are automatically rescheduled when you change the time
        </ThemedText>
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={notificationTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleTimeChange}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 30,
    textAlign: "center",
  },
  section: {
    backgroundColor: "rgba(0,122,255,0.1)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(0,122,255,0.2)",
  },
  sectionTitle: {
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.8,
    lineHeight: 20,
  },
  timeContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  timeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
  },
  timeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  resetButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  testButton: {
    backgroundColor: "#34C759",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
  },
  testButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  infoSection: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  infoTitle: {
    marginBottom: 15,
    textAlign: "center",
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
    opacity: 0.8,
  },
});
