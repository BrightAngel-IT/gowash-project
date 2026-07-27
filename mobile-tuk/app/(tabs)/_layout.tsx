
 import React from 'react';
import { Tabs } from 'expo-router';
import { View, useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Home, ClipboardList, History, User, LayoutGrid, Navigation } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
    const colorScheme = (useColorScheme() ?? 'dark') as 'light' | 'dark';
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme].tint,
                tabBarInactiveTintColor: Colors[colorScheme].icon,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors[colorScheme].card,
                    borderTopColor: Colors[colorScheme].border,
                    height: 65 + (insets.bottom > 0 ? insets.bottom : 15),
                    paddingBottom: 10 + (insets.bottom > 0 ? insets.bottom : 15),
                    paddingTop: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                }
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="active-trip"
                options={{
                    title: 'Active Trip',
                    tabBarIcon: ({ color }) => <Navigation size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    tabBarIcon: ({ color }) => <History size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
