import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Alert,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  isManualEntry?: boolean;
  base64Image?: string;
}

export default function ItemsScreen() {
  const [items, setItems] = useState<ProductData[]>([]);
  const [filteredItems, setFilteredItems] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const insets = useSafeAreaInsets();

  const filterItems = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.weight.toLowerCase().includes(searchLower) ||
        item.upc.toLowerCase().includes(searchLower)
      );
    });

    setFilteredItems(filtered);
  }, [searchQuery, items]);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, items, filterItems]);

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
        // Sort by expiration date first, then by add date
        parsedItems.sort((a: ProductData, b: ProductData) => {
          // If both have expiration dates, sort by expiration date (earliest first)
          if (a.expirationDate && b.expirationDate) {
            return a.expirationDate - b.expirationDate;
          }
          // If only a has expiration date, it comes first
          if (a.expirationDate && !b.expirationDate) {
            return -1;
          }
          // If only b has expiration date, it comes first
          if (!a.expirationDate && b.expirationDate) {
            return 1;
          }
          // If neither has expiration date, sort by add date (oldest first)
          return a.timestamp - b.timestamp;
        });
        // console.log(JSON.stringify(parsedItems, null, 2));
        setItems(parsedItems);
        setFilteredItems(parsedItems);
      }
    } catch (error) {
      console.error("Error loading items:", error);
      Alert.alert("Error", "Failed to load items from storage.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const deleteItem = async (itemToDelete: ProductData) => {
    try {
      const updatedItems = items.filter(
        (item) =>
          !(
            item.upc === itemToDelete.upc &&
            item.timestamp === itemToDelete.timestamp
          )
      );

      // Sort the updated items by expiration date first, then by add date
      updatedItems.sort((a: ProductData, b: ProductData) => {
        // If both have expiration dates, sort by expiration date (earliest first)
        if (a.expirationDate && b.expirationDate) {
          return a.expirationDate - b.expirationDate;
        }
        // If only a has expiration date, it comes first
        if (a.expirationDate && !b.expirationDate) {
          return -1;
        }
        // If only b has expiration date, it comes first
        if (!a.expirationDate && b.expirationDate) {
          return 1;
        }
        // If neither has expiration date, sort by add date (oldest first)
        return a.timestamp - b.timestamp;
      });

      await AsyncStorage.setItem("scannedItems", JSON.stringify(updatedItems));
      setItems(updatedItems);
      setFilteredItems(updatedItems);
    } catch (error) {
      console.error("Error deleting item:", error);
      Alert.alert("Error", "Failed to delete item.");
    }
  };

  const confirmDelete = (item: ProductData) => {
    Alert.alert("Delete Item", `Are you sure you want to delete this?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteItem(item),
      },
    ]);
  };

  const updateItemExpiration = async (
    item: ProductData,
    expirationDate: Date
  ) => {
    try {
      const updatedItems = items.map((i) => {
        if (i.upc === item.upc && i.timestamp === item.timestamp) {
          return {
            ...i,
            expirationDate: expirationDate.getTime(),
          };
        }
        return i;
      });

      // Sort the updated items by expiration date first, then by add date
      updatedItems.sort((a: ProductData, b: ProductData) => {
        // If both have expiration dates, sort by expiration date (earliest first)
        if (a.expirationDate && b.expirationDate) {
          return a.expirationDate - b.expirationDate;
        }
        // If only a has expiration date, it comes first
        if (a.expirationDate && !b.expirationDate) {
          return -1;
        }
        // If only b has expiration date, it comes first
        if (!a.expirationDate && b.expirationDate) {
          return 1;
        }
        // If neither has expiration date, sort by add date (oldest first)
        return a.timestamp - b.timestamp;
      });

      await AsyncStorage.setItem("scannedItems", JSON.stringify(updatedItems));
      setItems(updatedItems);
      setFilteredItems(updatedItems);
    } catch (error) {
      console.error("Error updating item expiration:", error);
      Alert.alert("Error", "Failed to update expiration date.");
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");

    if (selectedDate && selectedItem) {
      // Set time to 9 AM
      const dateWithTime = new Date(selectedDate);
      dateWithTime.setHours(9, 0, 0, 0);
      updateItemExpiration(selectedItem, dateWithTime);
    }

    setSelectedItem(null);
  };

  const showDatePickerForItem = (item: ProductData) => {
    setSelectedItem(item);
    setSelectedDate(new Date());
    setShowDatePicker(true);
  };

  const renderItem = ({ item }: { item: ProductData }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <ThemedText style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </ThemedText>
      </View>

      <View style={styles.itemContent}>
        {(item.image || item.base64Image) && (
          <Image
            source={{ uri: item.base64Image || item.image }}
            style={styles.itemImage}
            contentFit="contain"
          />
        )}

        <View style={styles.itemInfo}>
          {item.weight && item.weight !== "No weight available" && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Weight:</ThemedText>
              <ThemedText style={styles.infoValue}>{item.weight}</ThemedText>
            </View>
          )}

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Added:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {formatDate(item.timestamp).split(" ")[0]}
            </ThemedText>
          </View>

          <View style={styles.expirationRow}>
            <ThemedText style={styles.expirationLabel}>Expires:</ThemedText>
            {item.expirationDate ? (
              <ThemedText style={styles.expirationValue}>
                {formatDate(item.expirationDate).split(" ")[0]}
              </ThemedText>
            ) : (
              <TouchableOpacity
                style={styles.addDateButton}
                onPress={() => showDatePickerForItem(item)}
              >
                <ThemedText style={styles.addDateButtonText}>
                  Add Date
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDelete(item)}
      >
        <ThemedText style={styles.deleteButtonText}>🗑</ThemedText>
      </TouchableOpacity>
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
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <ThemedText type="title" style={styles.title}>
          Scanned Items ({filteredItems.length})
        </ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery("")}
            >
              <ThemedText style={styles.clearButtonText}>✕</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No items scanned yet</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Scan some barcodes to see them here
          </ThemedText>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No items found</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Try adjusting your search terms
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.upc}-${item.timestamp}`}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
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
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
    marginTop: 40, // Push content down from top
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  title: {
    textAlign: "center",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    padding: 12,
    paddingRight: 40, // Make room for the clear button
    fontSize: 16,
    backgroundColor: "white",
    flex: 1,
  },
  clearButton: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#999",
    fontWeight: "bold",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#007AFF",
    position: "relative",
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
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  infoValue: {
    fontSize: 14,
  },
  expirationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  expirationLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  expirationValue: {
    fontSize: 16,
  },
  addDateButton: {
    backgroundColor: "rgba(0,122,255,0.1)",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  addDateButtonText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
    color: "#999",
    fontWeight: "bold",
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
