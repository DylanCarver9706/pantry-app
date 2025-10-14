import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors[colorScheme ?? "light"].background,
      }}
    >
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a darker background on iOS with blur effect
              position: "absolute",
              backgroundColor: Colors[colorScheme ?? "light"].tabBarBackground,
            },
            android: {
              backgroundColor: Colors[colorScheme ?? "light"].tabBarBackground,
              borderTopWidth: 0,
              elevation: 0,
            },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: "Scan",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="camerao" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="items"
          options={{
            title: "Items",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="menu" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: "Recipes",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="wand.and.stars" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="gear" color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
