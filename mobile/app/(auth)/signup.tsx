import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import api from '@/constants/api';

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async () => {
        if (!name || !email || !phone || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/auth/register', { name, email, phone, password });
            // After successful signup, redirect to login
            alert('Registration successful! Please login.');
            router.push('/(auth)/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={styles.background}
            />

            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Animated.View entering={FadeInUp.delay(200).duration(1000)} style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join GoWash for premium laundry</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(400).duration(1000)} style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#fff" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            placeholderTextColor="rgba(255,255,255,0.7)"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#fff" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="rgba(255,255,255,0.7)"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={20} color="#fff" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            placeholderTextColor="rgba(255,255,255,0.7)"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="rgba(255,255,255,0.7)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity style={styles.buttonPrimary} onPress={handleSignup}>
                        <Text style={styles.buttonTextPrimary}>Sign Up</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.footerLink}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
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
        padding: 30,
        paddingTop: 60,
    },
    header: {
        marginBottom: 40,
    },
    backButton: {
        marginBottom: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 10,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 15,
        marginBottom: 20,
        paddingHorizontal: 15,
        height: 60,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        height: '100%',
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
        marginBottom: 30,
        marginTop: 10,
    },
    buttonTextPrimary: {
        color: '#192f6a',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    footerText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    footerLink: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
