import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={styles.background}
            />

            <View style={styles.contentContainer}>
                <Animated.View entering={FadeInUp.delay(200).duration(1000)} style={styles.headerContainer}>
                    <Text style={styles.title}>GoWash</Text>
                    <Text style={styles.subtitle}>Premium Laundry & Dry Cleaning</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(1000)} style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={styles.buttonPrimary}
                        onPress={() => router.push('/(auth)/signup')}
                    >
                        <Text style={styles.buttonTextPrimary}>Get Started</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.buttonSecondary}
                        onPress={() => router.push('/(auth)/login')}
                    >
                        <Text style={styles.buttonTextSecondary}>I already have an account</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: height,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 30,
        paddingTop: 100,
        paddingBottom: 50,
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    title: {
        fontSize: 54,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#e0e0e0',
        marginTop: 10,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    bottomContainer: {
        gap: 20,
    },
    buttonPrimary: {
        backgroundColor: '#fff',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonTextPrimary: {
        color: '#192f6a',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonSecondary: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    buttonTextSecondary: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
