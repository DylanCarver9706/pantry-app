import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

interface ProductData {
  title: string;
  weight: string;
  image: string;
}

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const fetchProductData = async (upc: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`
      );
      const data = await response.json();

      if (data.code === "OK" && data.items && data.items.length > 0) {
        const item = data.items[0];
        setProductData({
          title: item.title || "No title available",
          weight: item.weight || "No weight available",
          image: item.images && item.images.length > 0 ? item.images[0] : "",
        });
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
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.scanAgainButton}
            onPress={resetScanner}
          >
            <ThemedText style={styles.buttonText}>
              Scan Another Barcode
            </ThemedText>
          </TouchableOpacity>
        </View>
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
  scanAgainButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "red",
  },
});
