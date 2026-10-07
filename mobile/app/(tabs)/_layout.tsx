import { Tabs } from 'expo-router';
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';


export default function TabLayout() {
  const Colors = useThemeColors();
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: Colors.card,
            borderTopColor: Colors.border,
          },
          default: {
            backgroundColor: Colors.card,
            borderTopColor: Colors.border,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Laundries',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="business" color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="grid" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
