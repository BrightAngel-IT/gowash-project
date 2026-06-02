import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';

function RootLayoutNav() {
    const colorScheme = useColorScheme();
    const { driver, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;
        if (!driver) {
            router.replace('/login');
        } else {
            router.replace('/(tabs)');
        }
    }, [driver, isLoading]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
                <ActivityIndicator size="large" color="#FFB300" />
            </View>
        );
    }

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colorScheme === 'dark' ? '#121212' : '#FFFFFF' }
            }}>
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="register" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}
