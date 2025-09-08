import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

interface ProductData {
  title: string;
  weight: string;
  image: string;
  upc: string;
  timestamp: number;
}

export default function ItemsScreen() {
  const [items, setItems] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  // Reload items when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadItems();
    }, [])
  );

  const loadItems = async () => {
    try {
      const storedItems = await AsyncStorage.getItem("scannedItems");
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        // Sort by timestamp (newest first)
        parsedItems.sort(
          (a: ProductData, b: ProductData) => b.timestamp - a.timestamp
        );
        setItems(parsedItems);
      }
    } catch (error) {
      console.error("Error loading items:", error);
      Alert.alert("Error", "Failed to load items from storage.");
    } finally {
      setLoading(false);
    }
  };

  const clearAllItems = () => {
    Alert.alert(
      "Clear All Items",
      "Are you sure you want to delete all scanned items?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("scannedItems");
              setItems([]);
            } catch (error) {
              console.error("Error clearing items:", error);
              Alert.alert("Error", "Failed to clear items.");
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const renderItem = ({ item }: { item: ProductData }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <ThemedText style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.itemUPC}>UPC: {item.upc}</ThemedText>
      </View>

      <View style={styles.itemContent}>
        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={styles.itemImage}
            contentFit="contain"
          />
        )}

        <View style={styles.itemInfo}>
          <ThemedText style={styles.infoLabel}>Weight:</ThemedText>
          <ThemedText style={styles.infoValue}>{item.weight}</ThemedText>

          <ThemedText style={styles.infoLabel}>Scanned:</ThemedText>
          <ThemedText style={styles.infoValue}>
            {formatDate(item.timestamp)}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading items...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </TouchableOpacity>

        <ThemedText type="title" style={styles.title}>
          Scanned Items ({items.length})
        </ThemedText>

        {items.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearAllItems}>
            <ThemedText style={styles.clearButtonText}>Clear All</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No items scanned yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Scan some barcodes to see them here
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.upc}-${item.timestamp}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  title: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },
  clearButton: {
    padding: 10,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#FF3B30",
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  itemHeader: {
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  itemUPC: {
    fontSize: 14,
    opacity: 0.7,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
});
