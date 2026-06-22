import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { getToken } from '@/constants/api';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';

export default function Index() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        const token = await getToken();
        setIsLoggedIn(!!token);
    };

    if (isLoggedIn === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (isLoggedIn) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/(auth)/welcome" />;
}
