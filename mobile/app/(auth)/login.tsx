import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Modal, Pressable } from 'react-native';
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
    const [showGooglePicker, setShowGooglePicker] = useState(false);

    const handleGoogleSignIn = async (userEmail: string, userName: string) => {
        setShowGooglePicker(false);
        setLoading(true);
        setError('');
        try {
            const backendResponse = await api.post('/auth/google', {
                email: userEmail,
                name: userName,
                googleId: `google-sim-${userEmail}`,
                role: 'customer'
            });

            if (backendResponse.data.token) {
                await saveToken(backendResponse.data.token);
                await saveUser(backendResponse.data.user);
                router.replace('/(tabs)');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Google authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            const user = response.data.user;

            if (response.data.token) {
                await saveToken(response.data.token);
                await saveUser(user);

                if (user.role === 'customer') {
                    router.replace('/(tabs)');
                } else if (user.role === 'agent') {
                    router.replace('/professional');
                } else {
                    setError('Access Denied: Admins must use the web portal.');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        setShowGooglePicker(true);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Modal
                transparent
                visible={showGooglePicker}
                animationType="fade"
                onRequestClose={() => setShowGooglePicker(false)}
            >
                <Pressable 
                    style={styles.modalOverlay} 
                    onPress={() => setShowGooglePicker(false)}
                >
                    <View style={styles.pickerContainer}>
                        <View style={styles.pickerHeader}>
                             <View style={styles.googleIconCircle}>
                                <Text style={styles.googleG}>G</Text>
                             </View>
                            <Text style={styles.pickerTitle}>Choose an account</Text>
                            <Text style={styles.pickerSubtitle}>to continue to GoWash</Text>
                        </View>
                        
                        <View style={styles.accountList}>
                            <TouchableOpacity 
                                style={styles.accountItem}
                                onPress={() => handleGoogleSignIn('lakshanumayanha6789@gmail.com', 'Lakshan Umayanha')}
                            >
                                <View style={[styles.avatarCircle, { backgroundColor: '#FFB300' }]}>
                                    <Text style={styles.avatarText}>L</Text>
                                </View>
                                <View style={styles.accountInfo}>
                                    <Text style={styles.accountName}>Lakshan Umayanha</Text>
                                    <Text style={styles.accountEmail}>lakshanumayanha6789@gmail.com</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.accountItem}
                                onPress={() => handleGoogleSignIn('customer.demo@gmail.com', 'Demo Customer')}
                            >
                                <View style={[styles.avatarCircle, { backgroundColor: '#4285F4' }]}>
                                    <Text style={styles.avatarText}>D</Text>
                                </View>
                                <View style={styles.accountInfo}>
                                    <Text style={styles.accountName}>Demo Customer</Text>
                                    <Text style={styles.accountEmail}>customer.demo@gmail.com</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.addAccountBtn}>
                            <Ionicons name="person-add-outline" size={18} color="#5F6368" />
                            <Text style={styles.addAccountText}>Use another account</Text>
                        </TouchableOpacity>

                        <View style={styles.pickerFooter}>
                            <Text style={styles.footerInfo}>
                                To continue, Google will share your name, email address, profile picture and language preference with GoWash.
                            </Text>
                        </View>
                    </View>
                </Pressable>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    pickerContainer: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        borderRadius: 20,
        padding: 24,
        elevation: 10,
    },
    pickerHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    googleIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    googleG: {
        fontSize: 24,
        fontWeight: '900',
        color: '#4285F4',
    },
    pickerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#202124',
        textAlign: 'center',
    },
    pickerSubtitle: {
        fontSize: 14,
        color: '#5F6368',
        marginTop: 4,
        textAlign: 'center',
    },
    accountList: {
        marginVertical: 16,
    },
    accountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f4',
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    accountInfo: {
        flex: 1,
    },
    accountName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3C4043',
    },
    accountEmail: {
        fontSize: 12,
        color: '#70757A',
    },
    addAccountBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    addAccountText: {
        fontSize: 14,
        color: '#3C4043',
        fontWeight: '500',
    },
    pickerFooter: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f3f4',
        paddingTop: 16,
    },
    footerInfo: {
        fontSize: 11,
        color: '#5F6368',
        lineHeight: 16,
    }
});
