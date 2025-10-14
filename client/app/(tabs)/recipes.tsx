import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

export default function RecipesScreen() {
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<string>("");
  const [onlyUseListedIngredients, setOnlyUseListedIngredients] =
    useState(true);
  const [prioritizeExpiringItems, setPrioritizeExpiringItems] = useState(true);
  const insets = useSafeAreaInsets();

  const getItemsList = async (): Promise<{
    itemsList: string;
    expiringItems: string;
  }> => {
    try {
      const storedItems = await AsyncStorage.getItem("scannedItems");
      if (storedItems) {
        const items: ProductData[] = JSON.parse(storedItems);

        // Sort items by expiration date if prioritizing expiring items
        const sortedItems = prioritizeExpiringItems
          ? items.sort((a, b) => {
              if (a.expirationDate && b.expirationDate) {
                return a.expirationDate - b.expirationDate;
              }
              if (a.expirationDate && !b.expirationDate) return -1;
              if (!a.expirationDate && b.expirationDate) return 1;
              return 0;
            })
          : items;

        const itemsList = sortedItems
          .map((item) => {
            if (item.expirationDate) {
              const expirationDate = new Date(
                item.expirationDate
              ).toLocaleDateString();
              return `${item.title} (expires: ${expirationDate})`;
            }
            return item.title;
          })
          .join(", ");

        const expiringItems = sortedItems
          .filter((item) => item.expirationDate)
          .map((item) => {
            const expirationDate = new Date(
              item.expirationDate!
            ).toLocaleDateString();
            return `${item.title} (expires: ${expirationDate})`;
          })
          .join(", ");

        return { itemsList, expiringItems };
      }
      return { itemsList: "", expiringItems: "" };
    } catch (error) {
      console.error("Error loading items:", error);
      return { itemsList: "", expiringItems: "" };
    }
  };

  const generateRecipe = async () => {
    setLoading(true);
    setRecipe("");

    try {
      const { itemsList, expiringItems } = await getItemsList();

      if (!itemsList) {
        Alert.alert(
          "No Items",
          "Please scan some items first before generating a recipe."
        );
        setLoading(false);
        return;
      }

      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        Alert.alert(
          "Configuration Error",
          "OpenAI API key not found. Please check your environment variables."
        );
        setLoading(false);
        return;
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful cooking assistant that creates delicious recipes using available ingredients. Provide clear, step-by-step instructions and include cooking times and serving sizes when possible.",
              },
              {
                role: "user",
                content: `Give me a recipe using these ingredients: ${itemsList}. ${
                  onlyUseListedIngredients
                    ? "ONLY use the ingredients listed above. Do not suggest any additional ingredients that are not in the list."
                    : "You may suggest additional ingredients if needed for a better recipe."
                } ${
                  prioritizeExpiringItems && expiringItems
                    ? `Please prioritize using these expiring items: ${expiringItems}.`
                    : ""
                } Please provide a complete recipe with ingredients list, instructions, and any helpful cooking tips. Be concise and to the point. Do not use ingredients in a recipe that do not make sense for the recipe.`,
              },
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const generatedRecipe = data.choices[0]?.message?.content;

      if (generatedRecipe) {
        setRecipe(generatedRecipe);
      } else {
        Alert.alert("Error", "No recipe was generated. Please try again.");
      }
    } catch (error) {
      console.error("Error generating recipe:", error);
      Alert.alert(
        "Error",
        "Failed to generate recipe. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText
        type="title"
        style={[styles.title, { paddingTop: insets.top }]}
      >
        Recipe Generator
      </ThemedText>

      <View style={styles.content}>
        <ThemedText style={styles.description}>
          Generate delicious recipes using the items in your pantry and the
          power of AI
        </ThemedText>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateRecipe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText style={styles.generateButtonText}>
              Generate Recipe
            </ThemedText>
          )}
        </TouchableOpacity>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setPrioritizeExpiringItems(!prioritizeExpiringItems)}
          >
            <View
              style={[
                styles.checkbox,
                prioritizeExpiringItems && styles.checkboxChecked,
              ]}
            >
              {prioritizeExpiringItems && (
                <ThemedText style={styles.checkmark}>X</ThemedText>
              )}
            </View>
            <ThemedText style={styles.checkboxLabel}>
              Prioritize expiring items
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() =>
              setOnlyUseListedIngredients(!onlyUseListedIngredients)
            }
          >
            <View
              style={[
                styles.checkbox,
                onlyUseListedIngredients && styles.checkboxChecked,
              ]}
            >
              {onlyUseListedIngredients && (
                <ThemedText style={styles.checkmark}>X</ThemedText>
              )}
            </View>
            <ThemedText style={styles.checkboxLabel}>
              Only use ingredients from list
            </ThemedText>
          </TouchableOpacity>
        </View>

        {recipe && (
          <ScrollView
            style={styles.recipeContainer}
            showsVerticalScrollIndicator={false}
          >
            <ThemedText style={styles.recipeText}>{recipe}</ThemedText>
          </ScrollView>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 20,
    marginTop: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    opacity: 0.8,
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 30,
    alignItems: "center",
    marginLeft: 50,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 4,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
  },
  checkmark: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    flex: 1,
  },
  generateButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 30,
    minWidth: 200,
    alignItems: "center",
  },
  generateButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  recipeContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#007AFF",
    width: "100%",
  },
  recipeText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
