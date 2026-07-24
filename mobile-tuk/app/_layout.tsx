import { Stack, router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { registerForPushNotificationsAsync } from '../utils/pushNotifications';
import { driverApi } from '../constants/api';
import { Platform } from 'react-native';





function RootLayoutNav() {
    const colorScheme = useColorScheme();
    const { driver, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;
        if (!driver) {
            router.replace('/login');
        } else {
            router.replace('/(tabs)');
            
            // Register for push notifications when driver logs in
            registerForPushNotificationsAsync().then(token => {
                if (token && driver.id) {
                    driverApi.updatePushToken(driver.id, token)
                        .then(() => {
                            console.log("Token updated successfully");
                        })
                        .catch(err => {
                            console.error("Token update failed", err);
                            Alert.alert('Error', 'Failed to save push token to server');
                        });
                } else {
                    Alert.alert('Push Token Failed', 'Token is null or missing driver ID');
                }
            });
            
            // Handle FOREGROUND push notifications
            if (Platform.OS !== 'web') {
                const messaging = require('@react-native-firebase/messaging').default;
                const notifee = require('@notifee/react-native').default;
                const { AndroidImportance, AndroidCategory, AndroidVisibility } = require('@notifee/react-native');
                
                const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
                    console.log('Message handled in the FOREGROUND!', remoteMessage);
                    const { data } = remoteMessage;
                    
                    const channelId = await notifee.createChannel({
                        id: 'new_job_channel',
                        name: 'New Delivery Requests',
                        importance: AndroidImportance.HIGH,
                        sound: 'ringtone',
                        vibration: true,
                    });

                    await notifee.displayNotification({
                        title: data?.title || 'New Delivery Request!',
                        body: data?.body || 'You have a new job ready for pickup.',
                        data: data || {},
                        android: {
                            channelId,
                            importance: AndroidImportance.HIGH,
                            category: AndroidCategory.CALL,
                            visibility: AndroidVisibility.PUBLIC,
                            pressAction: { id: 'default', launchActivity: 'default' },
                            fullScreenAction: { id: 'default', launchActivity: 'default' },
                        },
                    });
                });
                
                return unsubscribe;
            }
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
            <Head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="Go Wash Driver" />
            </Head>
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
