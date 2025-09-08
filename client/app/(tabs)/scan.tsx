import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

interface ProductData {
  title: string;
  weight: string;
  image: string;
  upc: string;
  timestamp: number;
  expirationDate?: number;
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Reset scanner state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Always reset to camera view when coming back to scan screen
      setScanned(false);
      setProductData(null);
      setLoading(false);
      setExpirationDate(null);
      setShowDatePicker(false);
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
          weight: item.weight || "No weight available",
          image: item.images && item.images.length > 0 ? item.images[0] : "",
          upc: upc,
          timestamp: Date.now(),
        };
        setProductData(productItem);
        await saveItemToStorage(productItem);
      } else {
        Alert.alert(
          "Product Not Found",
          "No product information found for this barcode."
        );
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
    // Force camera remount by changing key
    setCameraKey((prev) => prev + 1);
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
          <ThemedText style={styles.buttonText}>Grant Permission</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Pantry Scanner
      </ThemedText>

      {!scanned ? (
        <View style={styles.scannerContainer}>
          <CameraView
            key={cameraKey}
            ref={cameraRef}
            style={styles.scanner}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "pdf417", "upc_e", "upc_a", "ean13", "ean8"],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <ThemedText style={styles.instructionText}>
            Point your camera at a UPC barcode to scan
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
          ) : productData ? (
            <View style={styles.productContainer}>
              <ThemedText type="subtitle" style={styles.productTitle}>
                Product Found!
              </ThemedText>

              {productData.image && (
                <Image
                  source={{ uri: productData.image }}
                  style={styles.productImage}
                  contentFit="contain"
                />
              )}

              <View style={styles.productInfo}>
                <ThemedText style={styles.infoLabel}>Title:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {productData.title}
                </ThemedText>

                <ThemedText style={styles.infoLabel}>Weight:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {productData.weight}
                </ThemedText>

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
          ) : null}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={resetScanner}
            >
              <ThemedText style={styles.buttonText}>
                Scan Another Barcode
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.showItemsButton}
              onPress={() => router.push("/(tabs)/items")}
            >
              <ThemedText style={styles.buttonText}>Show Items</ThemedText>
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
    padding: 20,
    alignItems: "center",
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
  },
  scannerContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  scanner: {
    width: "100%",
    height: 300,
    marginBottom: 20,
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
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 14,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  scanAgainButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    flex: 0.45,
  },
  showItemsButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    flex: 0.45,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
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
});
