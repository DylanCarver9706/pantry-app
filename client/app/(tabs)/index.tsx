import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={styles.title}>
          Pantry App
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Your digital pantry management solution
        </ThemedText>

        <View style={styles.featureContainer}>
          <ThemedText type="subtitle" style={styles.featureTitle}>
            How to Use
          </ThemedText>

          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepNumber}>1</ThemedText>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Scan Products</ThemedText>
              <ThemedText style={styles.stepDescription}>
                Use the Scan tab to scan UPC barcodes with your camera. The app
                will automatically fetch product information including title,
                weight, and images.
              </ThemedText>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepNumber}>2</ThemedText>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>View Your Items</ThemedText>
              <ThemedText style={styles.stepDescription}>
                Check the Items tab to see all your scanned products. Items are
                automatically saved and organized by scan date.
              </ThemedText>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepNumber}>3</ThemedText>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>
                Set Expiration Dates
              </ThemedText>
              <ThemedText style={styles.stepDescription}>
                Add expiration dates to your items and get daily notifications
                when items are about to expire in 3 days.
              </ThemedText>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <ThemedText style={styles.stepNumber}>4</ThemedText>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>
                Manage Your Pantry
              </ThemedText>
              <ThemedText style={styles.stepDescription}>
                Keep track of what you have, when you bought it, and easily
                manage your pantry inventory with smart notifications.
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    alignItems: "center",
    paddingBottom: 100, // Extra padding for tab bar
    marginTop: 40, // Push content down from top
  },
  title: {
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 40,
    opacity: 0.8,
  },
  featureContainer: {
    width: "100%",
    marginBottom: 40,
  },
  featureTitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  stepContainer: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#007AFF",
    color: "white",
    textAlign: "center",
    lineHeight: 30,
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 15,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  buttonContainer: {
    width: "100%",
    gap: 15,
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  notificationContainer: {
    width: "100%",
    backgroundColor: "rgba(0,122,255,0.1)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(0,122,255,0.2)",
  },
  notificationTitle: {
    marginBottom: 10,
    textAlign: "center",
  },
  notificationDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 15,
    opacity: 0.8,
  },
  notificationButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 10,
  },
  notificationButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
  },
  notificationButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  rescheduleButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 10,
  },
  rescheduleButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});
