import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
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
            <ThemedText style={styles.stepTitle}>Manage Your Pantry</ThemedText>
            <ThemedText style={styles.stepDescription}>
              Keep track of what you have, when you bought it, and easily manage
              your pantry inventory.
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/(tabs)/scan")}
        >
          <ThemedText style={styles.primaryButtonText}>
            Start Scanning
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/(tabs)/items")}
        >
          <ThemedText style={styles.secondaryButtonText}>View Items</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
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
});
