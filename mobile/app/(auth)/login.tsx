import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Alert } from 'react-native';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import api, { saveToken, saveUser } from '@/constants/api';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
            scopes: ['profile', 'email'],
        });
    }, []);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Missing Fields', 'Please enter your email and password.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/login', {
                email: email.trim(),
                password: password.trim(),
                role: 'customer'
            });

            if (response.data.token) {
                await saveToken(response.data.token);
                await saveUser(response.data.user);
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Login failed. Please try again.';
            Alert.alert('Login Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            const userInfo = response.data?.user;
            
            if (userInfo) {
                const backendResponse = await api.post('/auth/google', {
                    email: userInfo.email,
                    name: userInfo.name || 'Google User',
                    googleId: userInfo.id,
                    role: 'customer'
                });

                if (backendResponse.data.token) {
                    await saveToken(backendResponse.data.token);
                    await saveUser(backendResponse.data.user);
                    router.replace('/(tabs)');
                }
            }
        } catch (error: any) {
            if (isErrorWithCode(error)) {
                switch (error.code) {
                  case statusCodes.SIGN_IN_CANCELLED:
                    // user cancelled the login flow
                    break;
                  case statusCodes.IN_PROGRESS:
                    // operation (eg. sign in) already in progress
                    break;
                  case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                    setError('Play services not available or outdated.');
                    break;
                  default:
                    setError(error.message || 'Google authentication failed.');
                }
            } else {
                setError('Google authentication failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            const backendResponse = await api.post('/auth/apple', {
                email: credential.email,
                name: credential.fullName?.givenName ? `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim() : 'Apple User',
                appleId: credential.user,
                role: 'customer'
            });

            if (backendResponse.data.token) {
                await saveToken(backendResponse.data.token);
                await saveUser(backendResponse.data.user);
                router.replace('/(tabs)');
            }
        } catch (e: any) {
            if (e.code === 'ERR_REQUEST_CANCELED') {
                // user cancelled Apple Sign-in
            } else {
                setError('Apple authentication failed.');
                Alert.alert('Login Failed', 'Apple authentication failed.');
            }
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

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.contentContainer}>
                    <Animated.View entering={FadeInUp.delay(200).duration(1000)} style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to continue</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(400).duration(1000)} style={styles.formContainer}>
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

                        <TouchableOpacity 
                            style={styles.forgotPassword}
                            onPress={() => router.push('/(auth)/forgot-password')}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.buttonPrimary} onPress={handleLogin}>
                            <Text style={styles.buttonTextPrimary}>Login</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.buttonGoogle} 
                            onPress={handleGoogleLogin} 
                            disabled={loading}
                        >
                            <Ionicons name="logo-google" size={20} color="#EA4335" style={{ marginRight: 10 }} />
                            <Text style={styles.buttonTextGoogle}>Continue with Google</Text>
                        </TouchableOpacity>

                        {Platform.OS === 'ios' && (
                            <AppleAuthentication.AppleAuthenticationButton
                                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                                cornerRadius={30}
                                style={styles.buttonApple}
                                onPress={handleAppleLogin}
                            />
                        )}

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                                <Text style={styles.footerLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
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
        justifyContent: 'center',
        paddingTop: 60,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        marginBottom: 50,
    },
    backButton: {
        marginBottom: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        // alignItems: 'center',
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotPasswordText: {
        color: '#fff',
        fontSize: 14,
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
    },
    buttonTextPrimary: {
        color: '#192f6a',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonGoogle: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    buttonTextGoogle: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonApple: {
        width: '100%',
        height: 56,
        marginBottom: 30,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
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
