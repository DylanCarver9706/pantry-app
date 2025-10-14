import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  TextInput,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

interface ProductData {
  title: string;
  weight: string;
  image: string;
  upc: string;
  timestamp: number;
  expirationDate?: number;
  isManualEntry?: boolean;
  base64Image?: string;
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualWeight, setManualWeight] = useState("");
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  // Reset scanner state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Always reset to camera view when coming back to scan screen
      setScanned(false);
      setProductData(null);
      setLoading(false);
      setExpirationDate(null);
      setShowDatePicker(false);
      setShowManualEntry(false);
      setManualTitle("");
      setManualWeight("");
      setBase64Image(null);
      // Force camera remount by changing key
      setCameraKey((prev) => prev + 1);
    }, [])
  );

  const saveItemToStorage = async (item: ProductData) => {
    try {
      const existingItems = await AsyncStorage.getItem("scannedItems");
      const items = existingItems ? JSON.parse(existingItems) : [];
      items.push(item);
      await AsyncStorage.setItem("scannedItems", JSON.stringify(items));
    } catch (error) {
      console.error("Error saving item to storage:", error);
    }
  };

  const fetchProductData = async (upc: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`
      );
      const data = await response.json();

      if (data.code === "OK" && data.items && data.items.length > 0) {
        const item = data.items[0];
        // console.log(item);
        const productItem: ProductData = {
          title: item.title || "No title available",
          weight: item.weight || null,
          image: item.images && item.images.length > 0 ? item.images[0] : "",
          upc: upc,
          timestamp: Date.now(),
        };
        setProductData(productItem);
        await saveItemToStorage(productItem);
      } else {
        // Show manual entry option instead of alert
        setShowManualEntry(true);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to fetch product information. Please try again."
      );
      console.error("Error fetching product data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);
    fetchProductData(data);
  };

  const resetScanner = () => {
    setScanned(false);
    setProductData(null);
    setLoading(false);
    setExpirationDate(null);
    setShowDatePicker(false);
    setShowManualEntry(false);
    setManualTitle("");
    setManualWeight("");
    setBase64Image(null);
    // Force camera remount by changing key
    setCameraKey((prev) => prev + 1);
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setBase64Image(base64);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const saveManualItem = async () => {
    if (!manualTitle.trim()) {
      Alert.alert("Error", "Please enter a product title.");
      return;
    }

    const manualItem: ProductData = {
      title: manualTitle.trim(),
      weight: manualWeight.trim() || "Not specified",
      image: "",
      upc: "Manual Entry",
      timestamp: Date.now(),
      isManualEntry: true,
      base64Image: base64Image || undefined,
    };

    setProductData(manualItem);
    await saveItemToStorage(manualItem);
    setShowManualEntry(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      // Set time to 9 AM
      const dateWithTime = new Date(selectedDate);
      dateWithTime.setHours(9, 0, 0, 0);
      setExpirationDate(dateWithTime);

      // Update the product data with the new expiration date
      if (productData) {
        const updatedProductData = {
          ...productData,
          expirationDate: dateWithTime.getTime(),
        };
        setProductData(updatedProductData);
        // Update the item in storage
        updateItemInStorage(updatedProductData);
      }
    }
  };

  const updateItemInStorage = async (updatedItem: ProductData) => {
    try {
      const existingItems = await AsyncStorage.getItem("scannedItems");
      if (existingItems) {
        const items = JSON.parse(existingItems);
        const itemIndex = items.findIndex(
          (item: ProductData) =>
            item.upc === updatedItem.upc &&
            item.timestamp === updatedItem.timestamp
        );
        if (itemIndex !== -1) {
          items[itemIndex] = updatedItem;
          await AsyncStorage.setItem("scannedItems", JSON.stringify(items));
        }
      }
    } catch (error) {
      console.error("Error updating item in storage:", error);
    }
  };

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>
          Camera permission is required to scan barcodes
        </ThemedText>
        <TouchableOpacity
          style={styles.scanAgainButton}
          onPress={requestPermission}
        >
          <ThemedText style={styles.scanAgainButtonText}>
            Grant Permission
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText
        type="title"
        style={[styles.title, { paddingTop: insets.top }]}
      >
        Pantry Scanner
      </ThemedText>

      {!scanned ? (
        <View style={styles.scannerContainer}>
          <View style={styles.cameraWrapper}>
            <CameraView
              key={cameraKey}
              ref={cameraRef}
              style={styles.scanner}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: [
                  "qr",
                  "pdf417",
                  "upc_e",
                  "upc_a",
                  "ean13",
                  "ean8",
                ],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame}>
                <View style={styles.cornerTopLeft} />
                <View style={styles.cornerTopRight} />
                <View style={styles.cornerBottomLeft} />
                <View style={styles.cornerBottomRight} />
                <View style={styles.scanLine} />
              </View>
            </View>
          </View>
          <ThemedText style={styles.instructionText}>
            Position the barcode within the frame
          </ThemedText>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <ThemedText style={styles.loadingText}>
                Fetching product information...
              </ThemedText>
            </View>
          ) : showManualEntry ? (
            <View style={styles.manualEntryContainer}>
              <ThemedText type="subtitle" style={styles.manualEntryTitle}>
                Product Not Found
              </ThemedText>
              <ThemedText style={styles.manualEntrySubtitle}>
                Add this item manually
              </ThemedText>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>
                  Product Title *
                </ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={manualTitle}
                  onChangeText={setManualTitle}
                  placeholder="Enter product name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Weight</ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={manualWeight}
                  onChangeText={setManualWeight}
                  placeholder="Enter weight (optional)"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.photoContainer}>
                <ThemedText style={styles.inputLabel}>Product Photo</ThemedText>
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={takePhoto}
                >
                  <ThemedText style={styles.photoButtonText}>
                    {base64Image ? "Change Photo" : "Take Photo"}
                  </ThemedText>
                </TouchableOpacity>
                {base64Image && (
                  <Image
                    source={{ uri: base64Image }}
                    style={styles.previewImage}
                    contentFit="cover"
                  />
                )}
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveManualItem}
              >
                <ThemedText style={styles.saveButtonText}>Save Item</ThemedText>
              </TouchableOpacity>
            </View>
          ) : productData ? (
            <View style={styles.productContainer}>
              <ThemedText type="subtitle" style={styles.productTitle}>
                {productData.title}
              </ThemedText>

              {(productData.image || productData.base64Image) && (
                <Image
                  source={{ uri: productData.base64Image || productData.image }}
                  style={styles.productImage}
                  contentFit="contain"
                />
              )}

              <View style={styles.productInfo}>
                <View style={styles.expirationRow}>
                  <ThemedText style={styles.infoLabel}>
                    Expiration Date:
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <ThemedText style={styles.dateButtonText}>
                      {expirationDate
                        ? expirationDate.toLocaleDateString()
                        : "Select Date"}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={resetScanner}
            >
              <ThemedText style={styles.scanAgainButtonText}>
                Scan Another Barcode
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={expirationDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 20,
    marginTop: 40, // Push content down from top
  },
  scannerContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  cameraWrapper: {
    position: "relative",
    width: "100%",
    height: 300,
    marginBottom: 20,
  },
  scanner: {
    width: "100%",
    height: "100%",
  },
  scanOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 250,
    height: 120,
    position: "relative",
  },
  cornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#007AFF",
  },
  cornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#007AFF",
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#007AFF",
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#007AFF",
  },
  scanLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#007AFF",
    opacity: 0.8,
  },
  instructionText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 10,
  },
  resultContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  productContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  productTitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  productImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  productInfo: {
    width: "100%",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 10,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 0, // Remove bottom margin for better alignment
  },
  infoValue: {
    fontSize: 18,
    marginBottom: 0, // Remove bottom margin for better alignment
  },
  expirationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20, // Increased spacing between weight and expiration
    minHeight: 40, // Ensure consistent height for alignment
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 20,
    marginBottom: 40, // Specific margin from bottom
  },
  scanAgainButton: {
    backgroundColor: "rgba(0,122,255,0.1)",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    padding: 12,
    minWidth: 200,
  },
  scanAgainButtonText: {
    color: "#007AFF",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "red",
  },
  dateButton: {
    backgroundColor: "rgba(0,122,255,0.1)",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    marginBottom: 10,
  },
  dateButtonText: {
    color: "#007AFF",
    fontSize: 16,
    textAlign: "center",
  },
  manualEntryContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  manualEntryTitle: {
    marginBottom: 10,
    textAlign: "center",
    color: "#FF6B6B",
  },
  manualEntrySubtitle: {
    marginBottom: 20,
    textAlign: "center",
    opacity: 0.8,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  photoContainer: {
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
  },
  photoButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  photoButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
